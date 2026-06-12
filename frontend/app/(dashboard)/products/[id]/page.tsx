'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Package, Tag, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Product>(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => { toast.error('Product not found'); router.push('/products'); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const lineHierarchy = [
    product.productType?.category?.productLine?.name,
    product.productType?.category?.name,
    product.productType?.name,
  ].filter(Boolean).join(' → ');

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/products')} className="-ml-3 mb-2 text-slate-500">
            <ArrowLeft /> Product Catalog
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono text-slate-900">{product.productCode}</h1>
            <Badge variant={product.isActive ? 'success' : 'danger'}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-slate-600 mt-1">{product.description}</p>
          {lineHierarchy && (
            <p className="text-xs text-slate-400 mt-0.5">{lineHierarchy}</p>
          )}
        </div>
        <Button id="edit-product-btn" onClick={() => router.push(`/products/${id}/edit`)}>
          <Pencil /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core Info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Product Details</h3>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'HS Code', value: product.hsCode || '—' },
              { label: 'Packaging Type', value: product.packagingType || '—' },
              { label: 'Units Per Carton', value: product.unitsPerCarton?.toString() || '—' },
              { label: 'Carton Weight', value: product.cartonWeightKg ? `${product.cartonWeightKg} kg` : '—' },
              { label: 'Lead Time', value: product.leadTimeDays ? `${product.leadTimeDays} days` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Costing */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Costing Parameters</h3>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Base Supplier Cost', value: product.baseSupplierCost ? formatCurrency(Number(product.baseSupplierCost)) : '—' },
              { label: 'MOQ', value: product.moq?.toLocaleString() || '—' },
              { label: 'Export Duty Rate', value: product.exportDutyRate ? `${product.exportDutyRate}%` : '0%' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Specifications */}
        {product.specifications && (
          <Card className="p-5 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Specifications</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{product.specifications}</p>
          </Card>
        )}

        {/* Category Attributes */}
        {product.categoryAttributes && Object.keys(product.categoryAttributes).length > 0 && (
          <Card className="p-5 md:col-span-2">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Category Attributes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(product.categoryAttributes as Record<string, string>).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs text-slate-500 mb-0.5 capitalize">{key.replace(/_/g, ' ')}</div>
                  <div className="text-sm font-medium text-slate-800">{value}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
