// src/lib/firebase/firestoreRest.js

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

/**
 * Get a Firestore access token using the service account credentials.
 * Uses JWT + Google OAuth2 — works in WebContainers over plain HTTPS.
 */
async function getAccessToken() {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''

  // Clean up the private key — handle escaped newlines
  const privateKey = privateKeyRaw
    .replace(/\\n/g, '\n')
    .replace(/^"|"$/g, '')
    .trim()

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  }

  // Build JWT manually using Web Crypto API (works in WebContainers)
  const header = { alg: 'RS256', typ: 'JWT' }
  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // Import the RSA private key via Web Crypto
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')

  const binaryKey = Buffer.from(keyData, 'base64')

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput)
  )

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Failed to get access token: ${err}`)
  }

  const { access_token } = await tokenRes.json()
  return access_token
}

/**
 * Convert Firestore REST document format to plain JS object
 */
function fromFirestore(doc) {
  if (!doc?.fields) return null
  const result = {}
  for (const [key, val] of Object.entries(doc.fields)) {
    result[key] = parseValue(val)
  }
  // Add the document ID
  if (doc.name) {
    result.id = doc.name.split('/').pop()
  }
  return result
}

function parseValue(val) {
  if (val.stringValue !== undefined)  return val.stringValue
  if (val.integerValue !== undefined) return Number(val.integerValue)
  if (val.doubleValue !== undefined)  return Number(val.doubleValue)
  if (val.booleanValue !== undefined) return val.booleanValue
  if (val.nullValue !== undefined)    return null
  if (val.timestampValue !== undefined) return new Date(val.timestampValue)
  if (val.arrayValue)  return (val.arrayValue.values || []).map(parseValue)
  if (val.mapValue)    return fromFirestore(val.mapValue)
  return null
}

/**
 * Convert plain JS value to Firestore REST format
 */
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === 'string')  return { stringValue: val }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (val instanceof Date)      return { timestampValue: val.toISOString() }
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val }
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } }
  }
  if (typeof val === 'object') {
    const fields = {}
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(val) }
}

/**
 * Query a Firestore collection using the REST API
 */
export async function restQuery({ collection, where: filters = [], limit = 10 }) {
  const token = await getAccessToken()

  const structuredQuery = {
    from: [{ collectionId: collection }],
    limit,
  }

  if (filters.length > 0) {
    structuredQuery.where = filters.length === 1
      ? buildFilter(filters[0])
      : {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(buildFilter),
          },
        }
  }

  const res = await fetch(`${BASE_URL}:runQuery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ structuredQuery }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firestore query failed: ${err}`)
  }

  const results = await res.json()
  return results
    .filter((r) => r.document)
    .map((r) => fromFirestore(r.document))
}

function buildFilter([field, op, value]) {
  const opMap = {
    '==': 'EQUAL',
    '!=': 'NOT_EQUAL',
    '<':  'LESS_THAN',
    '<=': 'LESS_THAN_OR_EQUAL',
    '>':  'GREATER_THAN',
    '>=': 'GREATER_THAN_OR_EQUAL',
  }
  return {
    fieldFilter: {
      field: { fieldPath: field },
      op: opMap[op] || 'EQUAL',
      value: toFirestoreValue(value),
    },
  }
}

/**
 * Update specific fields in a Firestore document
 */
export async function restUpdate(collection, docId, fields) {
  const token = await getAccessToken()

  const firestoreFields = {}
  const updateMask = []

  for (const [key, val] of Object.entries(fields)) {
    // Handle FieldValue.increment specially
    if (val?.__increment !== undefined) {
      // Use Firestore transform for increments
      continue
    }
    firestoreFields[key] = toFirestoreValue(val)
    updateMask.push(key)
  }

  // Check for increment transforms
  const transforms = []
  for (const [key, val] of Object.entries(fields)) {
    if (val?.__increment !== undefined) {
      transforms.push({
        fieldPath: key,
        increment: toFirestoreValue(val.__increment),
      })
    }
  }

  // If we have transforms (increments), use the commit API
  if (transforms.length > 0) {
    const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`
    const writes = []

    if (updateMask.length > 0) {
      writes.push({
        update: {
          name: docPath,
          fields: firestoreFields,
        },
        updateMask: { fieldPaths: updateMask },
      })
    }

    writes.push({
      transform: {
        document: docPath,
        fieldTransforms: transforms,
      },
    })

    const commitRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ writes }),
      }
    )
    if (!commitRes.ok) throw new Error('Firestore commit failed')
    return
  }

  // Simple update without transforms
  const docPath = `${BASE_URL}/${collection}/${docId}`
  const maskQuery = updateMask.map((f) => `updateMask.fieldPaths=${f}`).join('&')

  const res = await fetch(`${docPath}?${maskQuery}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields: firestoreFields }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firestore update failed: ${err}`)
  }
}

// Helper for increment operations
export const increment = (n) => ({ __increment: n })