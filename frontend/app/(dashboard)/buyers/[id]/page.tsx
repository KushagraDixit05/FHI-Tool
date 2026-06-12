'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Globe, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, Button, Card, Badge, Skeleton } from '@/components/ui';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Buyer, Quote, PaginatedResponse } from '@/types';
import type { Column } from '@/components/ui';

export default function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [quotes, setQuotes] = useState<PaginatedResponse<Quote> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [buyerRes, quotesRes] = await Promise.all([
          api.get<Buyer>(`/buyers/${id}`),
          api.get<PaginatedResponse<Quote>>(`/buyers/${id}/quotes`),
        ]);
        setBuyer(buyerRes.data);
        setQuotes(quotesRes.data);
      } catch {
        toast.error('Failed to load buyer');
        router.push('/buyers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const quoteColumns: Column<Quote>[] = [
    {
      key: 'number',
      header: 'Quote Number',
      accessor: (q) => (
        <span className="font-mono text-sm font-semibold text-slate-800">{q.quoteNumber}</span>
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
      accessor: (q) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{q.incoterm}</span>,
    },
    {
      key: 'value',
      header: 'Total Value',
      accessor: (q) => {
        const total = q.items?.reduce((sum, item) => sum + Number(item.totalLineValue), 0) ?? 0;
        return (
          <span className="font-semibold text-slate-800">{formatCurrency(total, q.currency)}</span>
        );
      },
    },
    {
      key: 'date',
      header: 'Created',
      accessor: (q) => <span className="text-slate-500 text-sm">{formatDate(q.createdAt)}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!buyer) return null;

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={buyer.companyName}
        subtitle={`${buyer.buyerCategory.replace(/_/g, ' ')} · ${buyer.country}`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push('/buyers')}>
              <ArrowLeft />
              Back
            </Button>
            <Button id="edit-buyer-btn" onClick={() => router.push(`/buyers/${id}/edit`)}>
              Edit Buyer
            </Button>
          </div>
        }
      />

      {/* Info Card */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Mail, label: 'Email', value: buyer.email },
            { icon: Phone, label: 'Phone', value: buyer.phone || '—' },
            { icon: Globe, label: 'Country', value: buyer.country },
            { icon: Building2, label: 'Currency', value: buyer.currency },
            { icon: MapPin, label: 'Region', value: buyer.region || '—' },
            { icon: FileText, label: 'Port of Dest', value: buyer.portOfDest || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
              <div className="text-sm font-medium text-slate-800">{value}</div>
            </div>
          ))}
        </div>
        {buyer.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{buyer.notes}</p>
          </div>
        )}
        {buyer.productInterests.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Product Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {buyer.productInterests.map((interest) => (
                <Badge key={interest} variant="primary">{interest}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Quote History */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3 text-base">
          Quote History ({quotes?.total ?? 0})
        </h2>
        <DataTable<Quote>
          data={quotes?.data ?? []}
          columns={quoteColumns}
          total={quotes?.total ?? 0}
          page={1}
          limit={10}
          keyExtractor={(q) => q.id}
          onRowClick={(q) => router.push(`/quotes/${q.id}`)}
        />
      </div>
    </div>
  );
}
