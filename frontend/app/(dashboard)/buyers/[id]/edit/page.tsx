'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { PageHeader, Button, SkeletonCard } from '@/components/ui';
import { BuyerForm, type BuyerFormValues } from '@/components/buyers/BuyerForm';
import api from '@/lib/api';
import type { Buyer } from '@/types';

export default function EditBuyerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get<Buyer>(`/buyers/${id}`)
      .then((res) => setBuyer(res.data))
      .catch(() => { toast.error('Buyer not found'); router.push('/buyers'); })
      .finally(() => setFetching(false));
  }, [id, router]);

  const handleSubmit = async (data: BuyerFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        productInterests: data.productInterests
          ? data.productInterests.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await api.put(`/buyers/${id}`, payload);
      toast.success('Buyer updated successfully!');
      router.push(`/buyers/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update buyer';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-3xl space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!buyer) return null;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Edit Buyer"
        subtitle={buyer.companyName}
        action={
          <Button variant="ghost" onClick={() => router.push(`/buyers/${id}`)}>
            <ArrowLeft />
            Cancel
          </Button>
        }
      />
      <BuyerForm
        defaultValues={{
          name: buyer.name,
          companyName: buyer.companyName,
          email: buyer.email,
          phone: buyer.phone ?? undefined,
          address: buyer.address ?? undefined,
          country: buyer.country,
          region: buyer.region ?? undefined,
          currency: buyer.currency as never,
          buyerCategory: buyer.buyerCategory as never,
          portOfDest: buyer.portOfDest ?? undefined,
          notes: buyer.notes ?? undefined,
          productInterests: buyer.productInterests?.join(', '),
        }}
        onSubmit={handleSubmit}
        isLoading={loading}
        submitLabel="Save Changes"
      />
    </div>
  );
}
