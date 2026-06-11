import type { Metadata } from 'next';
import { Users, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Buyers' };

export default function BuyersPage() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Buyers</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your buyer relationships and contacts</p>
        </div>
        <Link
          href="/buyers/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'var(--fhi-navy)' }}
        >
          <Plus className="w-4 h-4" />
          Add Buyer
        </Link>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-slate-300" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">No buyers yet</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-xs">
          Add your first buyer to start building quotations for them.
        </p>
        <Link
          href="/buyers/new"
          className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: 'var(--fhi-navy)' }}
        >
          Add your first buyer
        </Link>
      </div>
    </div>
  );
}
