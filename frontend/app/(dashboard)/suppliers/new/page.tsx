'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormField,
  Input,
  Textarea,
  Label,
} from '@/components/ui';
import api from '@/lib/api';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  gstNumber: z.string().optional(),
  iecNumber: z.string().optional(),
  exportCapable: z.boolean(),
  moq: z.string().optional(),
  leadTimeDays: z.string().optional(),
  certifications: z.string().optional(), // comma-separated
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { exportCapable: true },
  });

  const onSubmit = async (data: SupplierFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        moq: data.moq ? parseInt(data.moq, 10) : undefined,
        leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays, 10) : undefined,
        certifications: data.certifications
          ? data.certifications.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await api.post('/suppliers', payload);
      toast.success('Supplier created!');
      router.push('/suppliers');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create supplier';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add New Supplier"
        subtitle="Add a manufacturing partner or supplier"
        action={
          <Button variant="ghost" onClick={() => router.push('/suppliers')}>
            <ArrowLeft /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Supplier Name" htmlFor="name" required error={errors.name?.message}>
              <Input id="name" {...register('name')} invalid={!!errors.name} placeholder="Raj Textiles Pvt Ltd" />
            </FormField>
            <FormField label="Contact Person" htmlFor="contactPerson">
              <Input id="contactPerson" {...register('contactPerson')} placeholder="Ramesh Kumar" />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" type="email" {...register('email')} placeholder="supplier@example.com" />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input id="phone" {...register('phone')} placeholder="+91 99999 00000" />
            </FormField>
            <FormField label="Region / City" htmlFor="region">
              <Input id="region" {...register('region')} placeholder="Panipat, Haryana" />
            </FormField>
            <FormField label="Address" htmlFor="address">
              <Input id="address" {...register('address')} placeholder="Industrial Area, Phase 2..." />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trade Compliance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="GST Number" htmlFor="gstNumber">
              <Input id="gstNumber" {...register('gstNumber')} placeholder="07AAAAA0000A1Z5" />
            </FormField>
            <FormField label="IEC Number" htmlFor="iecNumber">
              <Input id="iecNumber" {...register('iecNumber')} placeholder="AAAAA0000A" />
            </FormField>
            <FormField label="MOQ (units)" htmlFor="moq">
              <Input id="moq" type="number" {...register('moq')} placeholder="500" />
            </FormField>
            <FormField label="Lead Time (days)" htmlFor="leadTimeDays">
              <Input id="leadTimeDays" type="number" {...register('leadTimeDays')} placeholder="45" />
            </FormField>
            <FormField label="Certifications (comma-separated)" htmlFor="certifications" className="md:col-span-2">
              <Input id="certifications" {...register('certifications')} placeholder="OEKO-TEX, ISO 9001, GRS..." />
            </FormField>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="export-capable" {...register('exportCapable')} className="w-4 h-4 rounded accent-[var(--fhi-navy)]" />
              <Label htmlFor="export-capable">Export Capable</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea {...register('notes')} rows={3} placeholder="Additional notes..." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/suppliers')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Supplier
          </Button>
        </div>
      </form>
    </div>
  );
}
