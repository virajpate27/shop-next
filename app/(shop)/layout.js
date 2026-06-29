// src/app/(shop)/layout.js
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ShopLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
