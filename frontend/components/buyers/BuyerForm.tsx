'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BUYER_CATEGORIES, CURRENCIES, ORIGIN_PORTS } from '@/constants';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormField,
  Input,
  Select,
  Textarea,
} from '@/components/ui';

const buyerSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  region: z.string().optional(),
  currency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']),
  buyerCategory: z.enum([
    'DISTRIBUTOR', 'RETAILER', 'HOSPITALITY', 'IMPORTER',
    'WHOLESALER', 'MARKETPLACE', 'OEM_BUYER'
  ]),
  portOfDest: z.string().optional(),
  productInterests: z.string().optional(), // comma-separated
  notes: z.string().optional(),
});

export type BuyerFormValues = z.infer<typeof buyerSchema>;

interface BuyerFormProps {
  defaultValues?: Partial<BuyerFormValues>;
  onSubmit: (data: BuyerFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function BuyerForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Save Buyer' }: BuyerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuyerFormValues>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      currency: 'USD',
      buyerCategory: 'IMPORTER',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section: Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Company Name" htmlFor="company-name" required error={errors.companyName?.message}>
            <Input id="company-name" {...register('companyName')} invalid={!!errors.companyName} placeholder="Acme Imports Pty Ltd" />
          </FormField>
          <FormField label="Contact Name" htmlFor="contact-name" required error={errors.name?.message}>
            <Input id="contact-name" {...register('name')} invalid={!!errors.name} placeholder="John Smith" />
          </FormField>
          <FormField label="Email Address" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" {...register('email')} invalid={!!errors.email} placeholder="john@acme.com.au" />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" {...register('phone')} placeholder="+61 400 000 000" />
          </FormField>
          <FormField label="Address" htmlFor="address" className="md:col-span-2">
            <Input id="address" {...register('address')} placeholder="123 Collins St, Melbourne VIC 3000" />
          </FormField>
        </CardContent>
      </Card>

      {/* Section: Trade Details */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Country" htmlFor="country" required error={errors.country?.message}>
            <Input id="country" {...register('country')} invalid={!!errors.country} placeholder="Australia" />
          </FormField>
          <FormField label="Region / State" htmlFor="region">
            <Input id="region" {...register('region')} placeholder="Victoria" />
          </FormField>
          <FormField label="Buyer Type" htmlFor="buyer-category" required>
            <Select id="buyer-category" {...register('buyerCategory')}>
              {BUYER_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Preferred Currency" htmlFor="currency" required>
            <Select id="currency" {...register('currency')}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormField>
          <FormField label="Port of Destination" htmlFor="port-dest">
            <Input id="port-dest" {...register('portOfDest')} placeholder="Port of Melbourne" list="ports-list" />
            <datalist id="ports-list">
              {ORIGIN_PORTS.map((p) => <option key={p} value={p} />)}
            </datalist>
          </FormField>
          <FormField label="Product Interests (comma-separated)" htmlFor="product-interests">
            <Input id="product-interests" {...register('productInterests')} placeholder="Towels, Bed Linen, Handicrafts" />
          </FormField>
        </CardContent>
      </Card>

      {/* Section: Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            {...register('notes')}
            rows={3}
            placeholder="Any additional notes about this buyer..."
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button id="submit-buyer-btn" type="submit" loading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
