'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import api from '@/lib/api';
import { PageHeader, DataTable, StatusBadge, EmptyState, Button, Card } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Quote, PaginatedResponse } from '@/types';
import type { Column } from '@/components/ui';
import { QUOTE_STATUSES } from '@/constants';

interface QuoteStats {
  activeQuotes: number;
  totalQuotes: number;
  wonThisMonth: number;
}

export default function QuotesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Quote> | null>(null);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch] = useDebounce(search, 300);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Quote>>('/quotes', {
        params: {
          page,
          limit: 20,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      setData(res.data);
    } catch {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    api.get<QuoteStats>('/quotes/stats')
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const columns: Column<Quote>[] = [
    {
      key: 'number',
      header: 'Quote #',
      accessor: (q) => (
        <span className="font-mono text-sm font-bold text-slate-800">{q.quoteNumber}</span>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer',
      accessor: (q) => (
        <div>
          <div className="font-medium text-slate-900">{q.buyer?.companyName ?? '—'}</div>
          <div className="text-xs text-slate-500">{q.buyer?.country}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (q) => <StatusBadge status={q.status} />,
    },
    {
      key: 'incoterm',
      header: 'Incoterm',
      accessor: (q) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {q.incoterm}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Total Value',
      accessor: (q) => {
        const total = (q.items ?? []).reduce((s, i) => s + Number(i.totalLineValue), 0);
        return total > 0 ? (
          <span className="font-semibold text-slate-800">{formatCurrency(total, q.currency)}</span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        );
      },
    },
    {
      key: 'created',
      header: 'Created',
      accessor: (q) => <span className="text-slate-500 text-sm">{formatDate(q.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle="Manage your export trade quotations"
        action={
          <Button id="create-quote-btn" onClick={() => router.push('/quotes/new')}>
            <Plus />
            New Quote
          </Button>
        }
      />

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Clock, label: 'Active Quotes', value: stats.activeQuotes, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: FileText, label: 'Total Quotes', value: stats.totalQuotes, color: 'text-slate-600', bg: 'bg-slate-50' },
            { icon: CheckCircle, label: 'Won This Month', value: stats.wonThisMonth, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <Card key={label} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !statusFilter ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {QUOTE_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <DataTable<Quote>
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by quote number or buyer..."
        loading={loading}
        keyExtractor={(q) => q.id}
        onRowClick={(q) => router.push(`/quotes/${q.id}`)}
        emptyState={
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No quotes yet"
            description="Create your first export quote to get started."
            action={
              <Button onClick={() => router.push('/quotes/new')}>
                <Plus />
                Create Quote
              </Button>
            }
          />
        }
      />
    </div>
  );
}
