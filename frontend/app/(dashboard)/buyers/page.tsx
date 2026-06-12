'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Globe, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { PageHeader, DataTable, EmptyState, Button, Badge } from '@/components/ui';
import { useDebounce } from 'use-debounce';
import type { Buyer, PaginatedResponse } from '@/types';
import type { Column, DataTableAction } from '@/components/ui';

export default function BuyersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Buyer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch] = useDebounce(search, 300);

  const fetchBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Buyer>>('/buyers', {
        params: { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
      });
      setData(res.data);
    } catch {
      toast.error('Failed to load buyers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchBuyers(); }, [fetchBuyers]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleDelete = async (buyer: Buyer) => {
    if (!confirm(`Deactivate ${buyer.companyName}?`)) return;
    try {
      await api.delete(`/buyers/${buyer.id}`);
      toast.success('Buyer deactivated');
      fetchBuyers();
    } catch {
      toast.error('Failed to deactivate buyer');
    }
  };

  const columns: Column<Buyer>[] = [
    {
      key: 'company',
      header: 'Company',
      accessor: (b) => (
        <div>
          <div className="font-medium text-slate-900">{b.companyName}</div>
          <div className="text-xs text-slate-500">{b.name}</div>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      accessor: (b) => (
        <span className="flex items-center gap-1.5 text-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          {b.country}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Type',
      accessor: (b) => (
        <Badge variant="primary">{b.buyerCategory.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      accessor: (b) => <span className="font-mono text-sm">{b.currency}</span>,
    },
    {
      key: 'quotes',
      header: 'Quotes',
      accessor: (b) => (
        <span className="font-semibold text-slate-800">{b._count?.quotes ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (b) => (
        <Badge variant={b.isActive ? 'success' : 'danger'}>
          {b.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const actions: DataTableAction<Buyer>[] = [
    {
      label: 'Edit',
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: (b) => router.push(`/buyers/${b.id}/edit`),
    },
    {
      label: 'Deactivate',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: 'danger',
      onClick: handleDelete,
      hidden: (b) => !b.isActive,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Buyers"
        subtitle="Manage your buyer relationships and contacts"
        action={
          <Button id="create-buyer-btn" onClick={() => router.push('/buyers/new')}>
            <Plus />
            Add Buyer
          </Button>
        }
      />

      <DataTable<Buyer>
        data={data?.data ?? []}
        columns={columns}
        actions={actions}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by company, name, country..."
        loading={loading}
        keyExtractor={(b) => b.id}
        onRowClick={(b) => router.push(`/buyers/${b.id}`)}
        emptyState={
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No buyers yet"
            description="Add your first buyer to start creating quotes."
            action={
              <Button onClick={() => router.push('/buyers/new')}>
                <Plus />
                Add Buyer
              </Button>
            }
          />
        }
      />
    </div>
  );
}
