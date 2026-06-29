// src/app/(shop)/page.js
import Link from 'next/link';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react';

export const metadata = {
  title: 'ShopNext — Premium Shopping',
};

const features = [
  { icon: Truck, title: 'Free delivery', desc: 'On orders above ₹499' },
  { icon: Shield, title: 'Secure payments', desc: 'Razorpay & COD available' },
  { icon: RefreshCw, title: 'Easy returns', desc: '7-day return policy' },
  { icon: Headphones, title: '24/7 support', desc: 'Always here to help' },
];

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    emoji: '📱',
    color: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    emoji: '👗',
    color: 'bg-pink-50 hover:bg-pink-100',
  },
  {
    name: 'Home & Kitchen',
    slug: 'home',
    emoji: '🏠',
    color: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    name: 'Sports',
    slug: 'sports',
    emoji: '⚽',
    color: 'bg-green-50 hover:bg-green-100',
  },
  {
    name: 'Books',
    slug: 'books',
    emoji: '📚',
    color: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    emoji: '💄',
    color: 'bg-rose-50 hover:bg-rose-100',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-block bg-indigo-500 text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
              New arrivals every week
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
              Shop smarter,
              <br />
              live better
            </h1>
            <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
              Discover thousands of products with fast delivery across India.
              Pay via Razorpay or Cash on Delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Shop now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?featured=true"
                className="inline-flex items-center gap-2 border border-indigo-400 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                View deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl flex-shrink-0">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Shop by category</h2>
          <Link
            href="/products"
            className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className={`${cat.color} rounded-2xl p-5 text-center transition-colors cursor-pointer group`}
            >
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="bg-gray-900 rounded-3xl px-8 py-12 text-center">
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3">
            Pay your way — Razorpay or Cash on Delivery
          </h2>
          <p className="text-gray-400 mb-6">
            100% secure checkout. UPI, cards, net banking, wallets, or plain old
            cash at your door.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            Start shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
