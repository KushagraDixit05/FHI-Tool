import type { Metadata } from 'next';
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Product Catalog</h2>
          <p className="text-sm text-slate-500 mt-0.5">Textiles, Handicrafts, Spices, and more</p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'var(--fhi-navy)' }}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
          <Package className="w-7 h-7 text-slate-300" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">No products yet</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-xs">
          Add products to your catalog. Supports Textiles, Handicrafts, Spices, Carpets, Stationery, and Cotton Bags.
        </p>
        <Link
          href="/products/new"
          className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: 'var(--fhi-navy)' }}
        >
          Add first product
        </Link>
      </div>
    </div>
  );
}
