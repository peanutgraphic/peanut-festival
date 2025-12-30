import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { venuesApi, festivalsApi } from '@/api/endpoints';
import { useToast } from '@/components/common/Toast';
import {
  Modal,
  InputField,
  TextareaField,
  SelectField,
  FormRow,
  FormSection,
  StarRating,
} from '@/components/common';
import type { Venue } from '@/types';

interface VenueFormProps {
  isOpen: boolean;
  onClose: () => void;
  venue?: Venue | null;
}

interface VenueFormData {
  festival_id: number | '';
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  capacity: number | '';
  venue_type: Venue['venue_type'];
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  rental_cost: number | '';
  revenue_share: number | '';
  tech_specs: string;
  pros: string;
  cons: string;
  rating_internal: number | null;
  status: Venue['status'];
}

const venueTypes = [
  { value: 'theater', label: 'Theater' },
  { value: 'bar', label: 'Bar/Club' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

export function VenueForm({ isOpen, onClose, venue }: VenueFormProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isEditing = !!venue;

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals'],
    queryFn: festivalsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VenueFormData>({
    defaultValues: {
      festival_id: '',
      name: '',
      slug: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      capacity: '',
      venue_type: 'theater',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      rental_cost: '',
      revenue_share: '',
      tech_specs: '',
      pros: '',
      cons: '',
      rating_internal: null,
      status: 'active',
    },
  });

  const rating = watch('rating_internal');

  // Auto-generate slug from name
  const name = watch('name');
  useEffect(() => {
    if (!isEditing && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', slug);
    }
  }, [name, isEditing, setValue]);

  useEffect(() => {
    if (venue) {
      reset({
        festival_id: venue.festival_id || '',
        name: venue.name,
        slug: venue.slug,
        address: venue.address || '',
        city: venue.city || '',
        state: venue.state || '',
        zip: venue.zip || '',
        capacity: venue.capacity || '',
        venue_type: venue.venue_type,
        contact_name: venue.contact_name || '',
        contact_email: venue.contact_email || '',
        contact_phone: venue.contact_phone || '',
        rental_cost: venue.rental_cost || '',
        revenue_share: venue.revenue_share || '',
        tech_specs: venue.tech_specs || '',
        pros: venue.pros || '',
        cons: venue.cons || '',
        rating_internal: venue.rating_internal,
        status: venue.status,
      });
    } else {
      reset({
        festival_id: '',
        name: '',
        slug: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        capacity: '',
        venue_type: 'theater',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        rental_cost: '',
        revenue_share: '',
        tech_specs: '',
        pros: '',
        cons: '',
        rating_internal: null,
        status: 'active',
      });
    }
  }, [venue, reset]);

  const createMutation = useMutation({
    mutationFn: venuesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      addToast('success', 'Venue created successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Venue> }) =>
      venuesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      addToast('success', 'Venue updated successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const onSubmit = (data: VenueFormData) => {
    const payload: Partial<Venue> = {
      festival_id: data.festival_id ? Number(data.festival_id) : null,
      name: data.name,
      slug: data.slug,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      capacity: data.capacity ? Number(data.capacity) : null,
      venue_type: data.venue_type,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      rental_cost: data.rental_cost ? Number(data.rental_cost) : null,
      revenue_share: data.revenue_share ? Number(data.revenue_share) : null,
      tech_specs: data.tech_specs || null,
      pros: data.pros || null,
      cons: data.cons || null,
      rating_internal: data.rating_internal,
      status: data.status,
    };

    if (isEditing && venue) {
      updateMutation.mutate({ id: venue.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Venue' : 'New Venue'}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isPending}>
            Cancel
          </button>
          <button type="submit" form="venue-form" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : isEditing ? 'Update Venue' : 'Create Venue'}
          </button>
        </>
      }
    >
      <form id="venue-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Basic Information">
          <FormRow>
            <SelectField
              label="Festival"
              options={[
                { value: '', label: 'All Festivals' },
                ...festivals.map((f) => ({ value: String(f.id), label: f.name })),
              ]}
              {...register('festival_id')}
            />
            <SelectField label="Status" options={statusOptions} {...register('status')} />
          </FormRow>

          <FormRow>
            <InputField
              label="Venue Name"
              required
              placeholder="e.g., Main Stage Theater"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />
            <InputField
              label="Slug"
              required
              placeholder="main-stage-theater"
              error={errors.slug?.message}
              {...register('slug', { required: 'Slug is required' })}
            />
          </FormRow>

          <FormRow>
            <SelectField label="Venue Type" options={venueTypes} {...register('venue_type')} />
            <InputField
              label="Capacity"
              type="number"
              placeholder="200"
              {...register('capacity')}
            />
          </FormRow>
        </FormSection>

        <FormSection title="Location">
          <InputField label="Address" placeholder="123 Main St" {...register('address')} />

          <FormRow cols={3}>
            <InputField label="City" placeholder="Chicago" {...register('city')} />
            <InputField label="State" placeholder="IL" {...register('state')} />
            <InputField label="ZIP" placeholder="60601" {...register('zip')} />
          </FormRow>
        </FormSection>

        <FormSection title="Contact">
          <FormRow cols={3}>
            <InputField label="Contact Name" placeholder="John Doe" {...register('contact_name')} />
            <InputField
              label="Email"
              type="email"
              placeholder="venue@example.com"
              {...register('contact_email')}
            />
            <InputField label="Phone" type="tel" placeholder="555-123-4567" {...register('contact_phone')} />
          </FormRow>
        </FormSection>

        <FormSection title="Financials">
          <FormRow>
            <InputField
              label="Rental Cost"
              type="number"
              step="0.01"
              placeholder="500.00"
              {...register('rental_cost')}
            />
            <InputField
              label="Revenue Share %"
              type="number"
              step="0.1"
              placeholder="20"
              {...register('revenue_share')}
            />
          </FormRow>
        </FormSection>

        <FormSection title="Details">
          <TextareaField
            label="Tech Specs"
            placeholder="Sound system, lighting, stage dimensions, etc."
            rows={3}
            {...register('tech_specs')}
          />

          <StarRating
            label="Internal Rating"
            value={rating}
            onChange={(val) => setValue('rating_internal', val || null)}
          />

          <FormRow>
            <TextareaField label="Pros" placeholder="Strengths..." rows={2} {...register('pros')} />
            <TextareaField label="Cons" placeholder="Weaknesses..." rows={2} {...register('cons')} />
          </FormRow>
        </FormSection>
      </form>
    </Modal>
  );
}
