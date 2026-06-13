import type { Metadata } from 'next';
import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
import {
  TrendingUp,
  FileText,
  Users,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Globe,
  BarChart2,
  AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };

// ─── KPI Card ────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon: IconComponent;
  color: string;
}) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {delta !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>
                {isPositive ? '+' : ''}{delta} {deltaLabel}
              </span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────
function QuickAction({
  label,
  description,
  href,
  icon: Icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: IconComponent;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors flex-shrink-0">
        <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{label}</div>
        <div className="text-xs text-slate-400 truncate">{description}</div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 ml-auto flex-shrink-0 transition-colors" />
    </a>
  );
}

// ─── Recent Activity Item ─────────────────────────────────────────────
function ActivityItem({
  description,
  time,
  type,
}: {
  description: string;
  time: string;
  type: 'quote' | 'buyer' | 'alert';
}) {
  const iconMap = {
    quote: { icon: FileText, color: 'bg-blue-50 text-blue-600' },
    buyer: { icon: Users, color: 'bg-emerald-50 text-emerald-600' },
    alert: { icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
  };
  const { icon: Icon, color } = iconMap[type];

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">{description}</p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome banner */}
      <div
        className="rounded-xl p-6 text-white flex items-center justify-between shadow-md"
        style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2a5298 100%)' }}
      >
        <div>
          <h2 className="text-xl font-bold mb-1">Good morning! 👋</h2>
          <p className="text-white/70 text-sm">
            Here's your export pipeline overview for today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-white/50">
          <Globe className="w-10 h-10" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Quotes"
          value="—"
          delta={0}
          deltaLabel="vs last month"
          icon={FileText}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          title="Pipeline Value"
          value="—"
          delta={0}
          deltaLabel="% vs prev"
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          title="Avg Margin"
          value="—"
          icon={BarChart2}
          color="bg-purple-50 text-purple-600"
        />
        <KpiCard
          title="Won This Month"
          value="—"
          icon={CheckCircle}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction
                label="New Quote"
                description="Create an export quotation"
                href="/quotes/new"
                icon={FileText}
              />
              <QuickAction
                label="Add Buyer"
                description="Register a new buyer"
                href="/buyers/new"
                icon={Users}
              />
              <QuickAction
                label="Add Product"
                description="Add to product catalog"
                href="/products/new"
                icon={BarChart2}
              />
              <QuickAction
                label="Master Data"
                description="Freight rates & currency"
                href="/settings/master-data"
                icon={Globe}
              />
            </div>
          </div>

          {/* Pipeline status (placeholder for Phase 4 charts) */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 text-sm">Quote Pipeline</h3>
              <a href="/quotes" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </a>
            </div>
            <div className="flex items-center justify-center py-10 text-center">
              <div>
                <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Analytics will appear here once you create quotes</p>
                <a
                  href="/quotes/new"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Create first quote <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 text-sm">Recent Activity</h3>
              <Clock className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <ActivityItem
                description="Platform ready — start creating quotes"
                time="Just now"
                type="quote"
              />
              <ActivityItem
                description="Seed data loaded: freight rates, ports, currencies"
                time="Setup"
                type="buyer"
              />
              <ActivityItem
                description="6 product lines available: Textiles, Handicrafts, Spices…"
                time="Setup"
                type="alert"
              />
            </div>
          </div>

          {/* Follow-ups (Phase 4) */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Follow-ups Due</h3>
            <div className="flex items-center justify-center py-6 text-center">
              <div>
                <CheckCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No pending follow-ups</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
