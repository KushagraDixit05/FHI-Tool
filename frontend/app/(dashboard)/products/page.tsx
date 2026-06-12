'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import api from '@/lib/api';
import { PageHeader, DataTable, EmptyState, Button, Badge } from '@/components/ui';
import type { Product, ProductLine, PaginatedResponse } from '@/types';
import type { Column } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch] = useDebounce(search, 300);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Product>>('/products', {
        params: {
          page,
          limit: 20,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(selectedLine ? { lineId: selectedLine } : {}),
        },
      });
      setData(res.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedLine]);

  useEffect(() => {
    api.get<ProductLine[]>('/products/lines').then((r) => setProductLines(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedLine]);

  const columns: Column<Product>[] = [
    {
      key: 'code',
      header: 'Product Code',
      accessor: (p) => (
        <span className="font-mono text-sm font-semibold text-slate-800">{p.productCode}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      accessor: (p) => (
        <div>
          <div className="font-medium text-slate-900 max-w-xs truncate">{p.description}</div>
          <div className="text-xs text-slate-500">
            {p.productType?.category?.productLine?.name} →{' '}
            {p.productType?.category?.name} → {p.productType?.name}
          </div>
        </div>
      ),
    },
    {
      key: 'moq',
      header: 'MOQ',
      accessor: (p) => <span className="font-mono text-sm">{p.moq ?? '—'}</span>,
    },
    {
      key: 'cost',
      header: 'Base Cost',
      accessor: (p) =>
        p.baseSupplierCost ? (
          <span className="font-semibold text-slate-800">{formatCurrency(Number(p.baseSupplierCost))}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (p) => (
        <Badge variant={p.isActive ? 'success' : 'danger'}>
          {p.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Product Catalog"
        subtitle="Manage your exportable product range"
        action={
          <Button id="create-product-btn" onClick={() => router.push('/products/new')}>
            <Plus />
            Add Product
          </Button>
        }
      />

      {/* Line filter pills */}
      {productLines.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setSelectedLine('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedLine ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Lines
          </button>
          {productLines.map((line) => (
            <button
              key={line.id}
              onClick={() => setSelectedLine(selectedLine === line.id ? '' : line.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedLine === line.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {line.name}
            </button>
          ))}
        </div>
      )}

      <DataTable<Product>
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code or description..."
        loading={loading}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => router.push(`/products/${p.id}`)}
        emptyState={
          <EmptyState
            icon={<Package className="w-6 h-6" />}
            title="No products yet"
            description="Add products to your catalog to include them in quotes."
            action={
              <Button onClick={() => router.push('/products/new')}>
                <Plus />
                Add Product
              </Button>
            }
          />
        }
      />
    </div>
  );
}
