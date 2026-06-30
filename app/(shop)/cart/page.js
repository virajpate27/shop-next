// src/app/(shop)/cart/page.js
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/utils/formatters'
import { getOptimizedUrl } from '@/lib/cloudinary'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore((s) => s.getTotal())

  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 49
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
        <ShoppingBag className="w-20 h-20 text-gray-200 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-400 mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Start shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Shopping cart <span className="text-gray-400 font-normal">({items.length})</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-600 font-medium"
        >
          Clear cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4"
            >
              <Link href={`/products/${item.productId}`} className="relative w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                {item.image && (
                  <Image
                    src={getOptimizedUrl(item.image, { width: 200, height: 200 })}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 line-clamp-1 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-400">{formatPrice(item.price)} each</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-5">Order summary</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-gray-900">
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                  Add {formatPrice(499 - subtotal)} more for free shipping
                </p>
              )}
            </div>

            <div className="flex justify-between items-baseline py-4 border-t border-gray-100 mb-5">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors mb-3"
            >
              Proceed to checkout
            </Link>
            <Link
              href="/products"
              className="block text-center text-sm text-gray-500 hover:text-gray-700"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}