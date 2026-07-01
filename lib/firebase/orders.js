// src/lib/firebase/orders.js
import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
  } from 'firebase/firestore'
  import { db } from './config'
  import { decrementStock } from './products'
  
  export async function createOrder(orderData) {
    const ref = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: orderData.paymentMethod === 'cod' ? 'confirmed' : 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  
    // Reduce stock for each ordered item
    await Promise.all(
      orderData.items.map((item) => decrementStock(item.productId, item.quantity))
    )
  
    return ref.id
  }
  
  export async function getOrderById(orderId) {
    const snap = await getDoc(doc(db, 'orders', orderId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  }
  
  export async function updateOrderPayment(orderId, paymentData) {
    await updateDoc(doc(db, 'orders', orderId), {
      ...paymentData,
      status: 'confirmed',
      updatedAt: serverTimestamp(),
    })
  }
  
  export async function updateOrderStatus(orderId, status) {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    })
  }