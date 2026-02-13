import Link from "next/link";
import { ChefHat, Monitor, ShoppingBag, LayoutDashboard, ClipboardList } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <ChefHat className="w-20 h-20 text-brand-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">305 Throop Grill</h1>
          <p className="text-xl text-gray-600">Restaurant Management System</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link href="/menu" className="card hover:shadow-lg transition-shadow group">
            <ShoppingBag className="w-12 h-12 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2">Order Online</h2>
            <p className="text-gray-600">Browse our menu and place your pickup order</p>
          </Link>

          <Link href="/kiosk" className="card hover:shadow-lg transition-shadow group">
            <Monitor className="w-12 h-12 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2">In-Store Kiosk</h2>
            <p className="text-gray-600">Self-service ordering for in-store customers</p>
          </Link>

          <Link href="/status" className="card hover:shadow-lg transition-shadow group">
            <ClipboardList className="w-12 h-12 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2">Order Status</h2>
            <p className="text-gray-600">Check the status of your order</p>
          </Link>

          <Link href="/pos" className="card hover:shadow-lg transition-shadow group border-2 border-brand-200">
            <LayoutDashboard className="w-12 h-12 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2">Staff POS</h2>
            <p className="text-gray-600">Point of Sale terminal for staff</p>
            <span className="badge badge-preparing mt-2">Staff Only</span>
          </Link>

          <Link href="/kitchen" className="card hover:shadow-lg transition-shadow group border-2 border-brand-200">
            <ChefHat className="w-12 h-12 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2">Kitchen Display</h2>
            <p className="text-gray-600">View and manage incoming orders</p>
            <span className="badge badge-preparing mt-2">Staff Only</span>
          </Link>

          <Link href="/admin" className="card hover:shadow-lg transition-shadow group border-2 border-brand-200">
            <LayoutDashboard className="w-12 h-12 text-brand-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2">Admin Dashboard</h2>
            <p className="text-gray-600">Manage menu, inventory, and analytics</p>
            <span className="badge badge-preparing mt-2">Admin Only</span>
          </Link>
        </div>

        <div className="text-center mt-12 text-gray-500">
          <p>Pickup Only - Pay at Counter</p>
        </div>
      </div>
    </main>
  );
}
