import type { Metadata } from 'next';
import { Settings, Globe, Anchor, RefreshCw } from 'lucide-react';

export const metadata: Metadata = { title: 'Master Data' };

function MasterDataSection({
  title,
  description,
  icon: Icon,
  count,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  count?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: 'var(--fhi-navy)' }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            {count && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          <button className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
            Manage →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Master Data & Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure freight rates, port charges, and currency exchange rates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MasterDataSection
          title="Freight Templates"
          description="Sea freight rates by origin/destination. Used to auto-populate quote logistics costs."
          icon={Anchor}
          count="4 routes"
        />
        <MasterDataSection
          title="Port Charge Templates"
          description="CHA charges, port fees, handling and document charges per origin port."
          icon={Globe}
          count="2 ports"
        />
        <MasterDataSection
          title="Currency Exchange Rates"
          description="INR conversion rates for AUD, NZD, JPY, USD, EUR. Can be set manually or linked to live rates."
          icon={RefreshCw}
          count="5 rates"
        />
        <MasterDataSection
          title="Product Lines"
          description="Textiles, Handicrafts, Carpets, Stationery, Spices, Cotton Bags and their hierarchies."
          icon={Settings}
          count="6 lines"
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Tip:</strong> Freight templates and port charge templates are used to auto-populate the logistics section when creating a new quote for a buyer.
      </div>
    </div>
  );
}
