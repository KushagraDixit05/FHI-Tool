'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Truck, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import api from '@/lib/api';
import { PageHeader, DataTable, EmptyState, Button, Badge } from '@/components/ui';
import type { Supplier, PaginatedResponse } from '@/types';
import type { Column, DataTableAction } from '@/components/ui';

export default function SuppliersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Supplier> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch] = useDebounce(search, 300);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Supplier>>('/suppliers', {
        params: { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
      });
      setData(res.data);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Supplier',
      accessor: (s) => (
        <div>
          <div className="font-medium text-slate-900">{s.name}</div>
          {s.contactPerson && <div className="text-xs text-slate-500">{s.contactPerson}</div>}
        </div>
      ),
    },
    {
      key: 'region',
      header: 'Region',
      accessor: (s) => <span className="text-slate-700">{s.region || '—'}</span>,
    },
    {
      key: 'moq',
      header: 'MOQ',
      accessor: (s) => <span className="font-mono text-sm">{s.moq ?? '—'}</span>,
    },
    {
      key: 'leadTime',
      header: 'Lead Time',
      accessor: (s) => s.leadTimeDays ? <span>{s.leadTimeDays} days</span> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'export',
      header: 'Export Ready',
      accessor: (s) => (
        <Badge variant={s.exportCapable ? 'success' : 'neutral'}>
          {s.exportCapable ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'certifications',
      header: 'Certifications',
      accessor: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.certifications.slice(0, 2).map((c) => (
            <span key={c} className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{c}</span>
          ))}
          {s.certifications.length > 2 && (
            <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">+{s.certifications.length - 2}</span>
          )}
        </div>
      ),
    },
  ];

  const actions: DataTableAction<Supplier>[] = [
    {
      label: 'Edit',
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: (s) => router.push(`/suppliers/${s.id}/edit`),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage your supplier network and manufacturing partners"
        action={
          <Button id="create-supplier-btn" onClick={() => router.push('/suppliers/new')}>
            <Plus />
            Add Supplier
          </Button>
        }
      />
      <DataTable<Supplier>
        data={data?.data ?? []}
        columns={columns}
        actions={actions}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, region, contact..."
        loading={loading}
        keyExtractor={(s) => s.id}
        emptyState={
          <EmptyState
            icon={<Truck className="w-6 h-6" />}
            title="No suppliers yet"
            description="Add your manufacturing partners to link them with products."
            action={
              <Button onClick={() => router.push('/suppliers/new')}>
                <Plus />
                Add Supplier
              </Button>
            }
          />
        }
      />
    </div>
  );
}
