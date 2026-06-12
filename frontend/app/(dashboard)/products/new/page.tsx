'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Button, Card, FormField, Input, Textarea } from '@/components/ui';
import type { ProductLine, ProductCategory, ProductType } from '@/types';

// ─── Step 1: Hierarchy Selection ─────────────────────────────────────────────

function StepHierarchy({
  lines,
  categories,
  types,
  selected,
  onSelect,
}: {
  lines: ProductLine[];
  categories: ProductCategory[];
  types: ProductType[];
  selected: { lineId: string; categoryId: string; typeId: string };
  onSelect: (field: 'lineId' | 'categoryId' | 'typeId', value: string) => void;
}) {
  const PILL_BASE = 'px-3 py-2 rounded-lg border text-sm font-medium transition-all';
  const PILL_ACTIVE = 'border-slate-800 bg-slate-800 text-white';
  const PILL_IDLE = 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Select Product Category</h2>
        <p className="text-sm text-slate-500">Choose the product line, category, and type for this product.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Product Line *
        </label>
        <div className="flex flex-wrap gap-2">
          {lines.map((line) => (
            <button key={line.id} onClick={() => { onSelect('lineId', line.id); onSelect('categoryId', ''); onSelect('typeId', ''); }}
              className={`${PILL_BASE} ${selected.lineId === line.id ? PILL_ACTIVE : PILL_IDLE}`}>
              {line.name}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Category *</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => { onSelect('categoryId', cat.id); onSelect('typeId', ''); }}
                className={`${PILL_BASE} ${selected.categoryId === cat.id ? PILL_ACTIVE : PILL_IDLE}`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {types.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Product Type *</label>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button key={type.id} onClick={() => onSelect('typeId', type.id)}
                className={`${PILL_BASE} ${selected.typeId === type.id ? PILL_ACTIVE : PILL_IDLE}`}>
                {type.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Product Details ──────────────────────────────────────────────────

interface ProductFormData {
  productCode: string;
  description: string;
  specifications: string;
  baseSupplierCost: string;
  moq: string;
  packagingType: string;
  unitsPerCarton: string;
  cartonWeightKg: string;
  leadTimeDays: string;
  hsCode: string;
  exportDutyRate: string;
  attributes: Record<string, string>;
}

function StepDetails({
  form,
  onChange,
}: {
  form: ProductFormData;
  onChange: (field: keyof ProductFormData, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Product Details</h2>
        <p className="text-sm text-slate-500">Enter the core product information and costing parameters.</p>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Product Code" htmlFor="product-code" required>
            <Input id="product-code" value={form.productCode} onChange={(e) => onChange('productCode', e.target.value)}
              placeholder="TXT-BL-001" />
          </FormField>
          <FormField label="HS Code" htmlFor="hs-code">
            <Input id="hs-code" value={form.hsCode} onChange={(e) => onChange('hsCode', e.target.value)}
              placeholder="6302.10.00" />
          </FormField>
          <FormField label="Description" htmlFor="description" required className="md:col-span-2">
            <Input id="description" value={form.description} onChange={(e) => onChange('description', e.target.value)}
              placeholder="100% Cotton Bedsheet, King Size, 300 TC" />
          </FormField>
          <FormField label="Specifications" htmlFor="specifications" className="md:col-span-2">
            <Textarea id="specifications" value={form.specifications} onChange={(e) => onChange('specifications', e.target.value)}
              rows={2} placeholder="Material: 100% Cotton, Thread Count: 300, Size: 270x270cm..." />
          </FormField>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 text-sm mb-4">Costing &amp; MOQ</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="Base Supplier Cost (₹)" htmlFor="supplier-cost">
            <Input id="supplier-cost" type="number" step="0.01" value={form.baseSupplierCost}
              onChange={(e) => onChange('baseSupplierCost', e.target.value)} placeholder="450.00" />
          </FormField>
          <FormField label="MOQ (units)" htmlFor="moq">
            <Input id="moq" type="number" value={form.moq} onChange={(e) => onChange('moq', e.target.value)} placeholder="500" />
          </FormField>
          <FormField label="Lead Time (days)" htmlFor="lead-time">
            <Input id="lead-time" type="number" value={form.leadTimeDays} onChange={(e) => onChange('leadTimeDays', e.target.value)} placeholder="45" />
          </FormField>
          <FormField label="Export Duty Rate %" htmlFor="export-duty">
            <Input id="export-duty" type="number" step="0.1" value={form.exportDutyRate}
              onChange={(e) => onChange('exportDutyRate', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Units Per Carton" htmlFor="units-per-carton">
            <Input id="units-per-carton" type="number" value={form.unitsPerCarton}
              onChange={(e) => onChange('unitsPerCarton', e.target.value)} placeholder="24" />
          </FormField>
          <FormField label="Carton Weight (kg)" htmlFor="carton-weight">
            <Input id="carton-weight" type="number" step="0.1" value={form.cartonWeightKg}
              onChange={(e) => onChange('cartonWeightKg', e.target.value)} placeholder="8.5" />
          </FormField>
        </div>
      </Card>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function StepProductReview({
  hierarchy,
  form,
  lines,
  categories,
  types,
}: {
  hierarchy: { lineId: string; categoryId: string; typeId: string };
  form: ProductFormData;
  lines: ProductLine[];
  categories: ProductCategory[];
  types: ProductType[];
}) {
  const line = lines.find((l) => l.id === hierarchy.lineId);
  const cat = categories.find((c) => c.id === hierarchy.categoryId);
  const type = types.find((t) => t.id === hierarchy.typeId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Review Product</h2>
        <p className="text-sm text-slate-500">Confirm the details before adding to your catalog.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{line?.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{cat?.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{type?.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Product Code</div>
            <div className="font-mono font-semibold text-slate-900">{form.productCode}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">HS Code</div>
            <div className="font-mono text-slate-800">{form.hsCode || '—'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-slate-500 mb-0.5">Description</div>
            <div className="font-medium text-slate-900">{form.description}</div>
          </div>
          {form.specifications && (
            <div className="col-span-2">
              <div className="text-xs text-slate-500 mb-0.5">Specifications</div>
              <div className="text-slate-700">{form.specifications}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t border-slate-100">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Base Cost</div>
            <div className="font-semibold text-slate-900">₹{form.baseSupplierCost || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">MOQ</div>
            <div className="font-semibold text-slate-900">{form.moq || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Lead Time</div>
            <div className="font-semibold text-slate-900">{form.leadTimeDays ? `${form.leadTimeDays} days` : '—'}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'Category' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Review' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [lines, setLines] = useState<ProductLine[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);

  const [hierarchy, setHierarchy] = useState({ lineId: '', categoryId: '', typeId: '' });
  const [form, setForm] = useState<ProductFormData>({
    productCode: '',
    description: '',
    specifications: '',
    baseSupplierCost: '',
    moq: '',
    packagingType: '',
    unitsPerCarton: '',
    cartonWeightKg: '',
    leadTimeDays: '',
    hsCode: '',
    exportDutyRate: '',
    attributes: {},
  });

  useEffect(() => {
    api.get<ProductLine[]>('/products/lines').then((r) => setLines(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hierarchy.lineId) { setCategories([]); setTypes([]); return; }
    api.get<ProductCategory[]>(`/products/lines/${hierarchy.lineId}/categories`)
      .then((r) => setCategories(r.data)).catch(() => {});
  }, [hierarchy.lineId]);

  useEffect(() => {
    if (!hierarchy.categoryId) { setTypes([]); return; }
    api.get<ProductType[]>(`/products/categories/${hierarchy.categoryId}/types`)
      .then((r) => setTypes(r.data)).catch(() => {});
  }, [hierarchy.categoryId]);

  const selectHierarchy = (field: 'lineId' | 'categoryId' | 'typeId', value: string) => {
    setHierarchy((prev) => ({ ...prev, [field]: value }));
  };

  const updateForm = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canAdvance = (): boolean => {
    if (step === 1) return !!hierarchy.lineId && !!hierarchy.categoryId && !!hierarchy.typeId;
    if (step === 2) return !!form.productCode.trim() && !!form.description.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/products', {
        productTypeId: hierarchy.typeId,
        productCode: form.productCode.trim(),
        description: form.description.trim(),
        specifications: form.specifications || undefined,
        baseSupplierCost: form.baseSupplierCost ? parseFloat(form.baseSupplierCost) : undefined,
        moq: form.moq ? parseInt(form.moq) : undefined,
        leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays) : undefined,
        hsCode: form.hsCode || undefined,
        exportDutyRate: form.exportDutyRate ? parseFloat(form.exportDutyRate) : undefined,
        unitsPerCarton: form.unitsPerCarton ? parseInt(form.unitsPerCarton) : undefined,
        cartonWeightKg: form.cartonWeightKg ? parseFloat(form.cartonWeightKg) : undefined,
      });
      toast.success('Product added to catalog!');
      router.push('/products');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create product';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/products')} className="-ml-3 mb-2 text-slate-500">
          <ArrowLeft /> Product Catalog
        </Button>
        <h1 className="text-xl font-bold text-slate-900">Add New Product</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, index) => {
          const done = step > s.number;
          const active = step === s.number;
          return (
            <div key={s.number} className="flex items-center">
              <button
                onClick={() => done && setStep(s.number)}
                disabled={!done}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-slate-900 text-white shadow-sm' : done ? 'text-emerald-600 cursor-pointer hover:bg-emerald-50' : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  active ? 'bg-white text-slate-900' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  {done ? <Check className="w-3 h-3" /> : s.number}
                </span>
                {s.label}
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-72">
        {step === 1 && (
          <StepHierarchy
            lines={lines}
            categories={categories}
            types={types}
            selected={hierarchy}
            onSelect={selectHierarchy}
          />
        )}
        {step === 2 && <StepDetails form={form} onChange={updateForm} />}
        {step === 3 && (
          <StepProductReview hierarchy={hierarchy} form={form} lines={lines} categories={categories} types={types} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={() => step === 1 ? router.push('/products') : setStep((s) => s - 1)}>
          {step === 1 ? 'Cancel' : '← Back'}
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
            Continue →
          </Button>
        ) : (
          <Button id="submit-product-btn" onClick={handleSubmit} loading={submitting}>
            Add Product →
          </Button>
        )}
      </div>
    </div>
  );
}
