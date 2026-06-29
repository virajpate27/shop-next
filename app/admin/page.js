// src/app/admin/page.js
'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { formatPrice, formatDate } from '@/utils/formatters';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [productSnap, orderSnap, userSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'users')),
        ]);

        const orders = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const revenue = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0);

        setStats({
          products: productSnap.size,
          orders: orderSnap.size,
          users: userSnap.size,
          revenue,
        });

        const recentQ = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnap = await getDocs(recentQ);
        setRecentOrders(
          recentSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const STAT_CARDS = [
    {
      label: 'Total products',
      value: stats.products,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total orders',
      value: stats.orders,
      icon: ShoppingBag,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Registered users',
      value: stats.users,
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Total revenue',
      value: formatPrice(stats.revenue),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
  ];

  const STATUS_COLORS = {
    pending: 'bg-yellow-50 text-yellow-700',
    processing: 'bg-blue-50 text-blue-700',
    shipped: 'bg-purple-50 text-purple-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div
              className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Recent orders</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                'Order ID',
                'Customer',
                'Total',
                'Payment',
                'Status',
                'Date',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {order.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {order.shippingAddress?.fullName || '—'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">
                  {formatPrice(order.total)}
                </td>
                <td className="px-4 py-3 text-xs capitalize text-gray-500">
                  {order.paymentMethod || '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      STATUS_COLORS[order.status] || ''
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {formatDate(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
