// src/app/api/coupons/use/route.js
import { NextResponse } from 'next/server'
import { restUpdate, increment } from '@/lib/firebase/firestoreRest'

export async function POST(req) {
  try {
    const { couponId } = await req.json()

    if (!couponId) {
      return NextResponse.json({ error: 'Missing couponId' }, { status: 400 })
    }

    await restUpdate('coupons', couponId, {
      usedCount: increment(1),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to increment coupon usage:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}