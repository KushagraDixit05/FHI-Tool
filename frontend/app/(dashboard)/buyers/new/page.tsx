'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { PageHeader, Button } from '@/components/ui';
import { BuyerForm, type BuyerFormValues } from '@/components/buyers/BuyerForm';
import api from '@/lib/api';

export default function NewBuyerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: BuyerFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        productInterests: data.productInterests
          ? data.productInterests.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const res = await api.post('/buyers', payload);
      toast.success('Buyer created successfully!');
      router.push(`/buyers/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create buyer';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add New Buyer"
        subtitle="Create a new buyer profile to start building quotes"
        action={
          <Button variant="ghost" onClick={() => router.push('/buyers')}>
            <ArrowLeft />
            Back to Buyers
          </Button>
        }
      />
      <BuyerForm onSubmit={handleSubmit} isLoading={loading} submitLabel="Create Buyer" />
    </div>
  );
}
