import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { showsApi, festivalsApi, venuesApi } from '@/api/endpoints';
import { useToast } from '@/components/common/Toast';
import {
  Modal,
  InputField,
  TextareaField,
  SelectField,
  CheckboxField,
  FormRow,
  FormSection,
} from '@/components/common';
import type { Show } from '@/types';

interface ShowFormProps {
  isOpen: boolean;
  onClose: () => void;
  show?: Show | null;
}

interface ShowFormData {
  festival_id: number | '';
  title: string;
  slug: string;
  description: string;
  venue_id: number | '';
  show_date: string;
  start_time: string;
  end_time: string;
  capacity: number | '';
  ticket_price: number | '';
  status: Show['status'];
  featured: boolean;
  kid_friendly: boolean;
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'on_sale', label: 'On Sale' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ShowForm({ isOpen, onClose, show }: ShowFormProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isEditing = !!show;

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals'],
    queryFn: festivalsApi.getAll,
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venuesApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShowFormData>({
    defaultValues: {
      festival_id: '',
      title: '',
      slug: '',
      description: '',
      venue_id: '',
      show_date: '',
      start_time: '',
      end_time: '',
      capacity: '',
      ticket_price: '',
      status: 'draft',
      featured: false,
      kid_friendly: false,
    },
  });

  // Auto-generate slug from title
  const title = watch('title');
  useEffect(() => {
    if (!isEditing && title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', slug);
    }
  }, [title, isEditing, setValue]);

  useEffect(() => {
    if (show) {
      reset({
        festival_id: show.festival_id || '',
        title: show.title,
        slug: show.slug,
        description: show.description || '',
        venue_id: show.venue_id || '',
        show_date: show.show_date,
        start_time: show.start_time || '',
        end_time: show.end_time || '',
        capacity: show.capacity || '',
        ticket_price: show.ticket_price || '',
        status: show.status,
        featured: show.featured,
        kid_friendly: show.kid_friendly,
      });
    } else {
      reset({
        festival_id: '',
        title: '',
        slug: '',
        description: '',
        venue_id: '',
        show_date: '',
        start_time: '',
        end_time: '',
        capacity: '',
        ticket_price: '',
        status: 'draft',
        featured: false,
        kid_friendly: false,
      });
    }
  }, [show, reset]);

  const createMutation = useMutation({
    mutationFn: showsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      addToast('success', 'Show created successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Show> }) =>
      showsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      addToast('success', 'Show updated successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const onSubmit = (data: ShowFormData) => {
    const payload: Partial<Show> = {
      festival_id: data.festival_id ? Number(data.festival_id) : 0,
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      venue_id: data.venue_id ? Number(data.venue_id) : null,
      show_date: data.show_date,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      capacity: data.capacity ? Number(data.capacity) : null,
      ticket_price: data.ticket_price ? Number(data.ticket_price) : null,
      status: data.status,
      featured: data.featured,
      kid_friendly: data.kid_friendly,
    };

    if (isEditing && show) {
      updateMutation.mutate({ id: show.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Show' : 'New Show'}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isPending}>
            Cancel
          </button>
          <button type="submit" form="show-form" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : isEditing ? 'Update Show' : 'Create Show'}
          </button>
        </>
      }
    >
      <form id="show-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Basic Information">
          <FormRow>
            <SelectField
              label="Festival"
              required
              options={[
                { value: '', label: 'Select festival...' },
                ...festivals.map((f) => ({ value: String(f.id), label: f.name })),
              ]}
              error={errors.festival_id?.message}
              {...register('festival_id', { required: 'Festival is required' })}
            />
            <SelectField label="Status" options={statusOptions} {...register('status')} />
          </FormRow>

          <InputField
            label="Show Title"
            required
            placeholder="e.g., Opening Night Showcase"
            error={errors.title?.message}
            {...register('title', { required: 'Title is required' })}
          />

          <InputField
            label="Slug"
            required
            placeholder="opening-night-showcase"
            hint="URL-friendly identifier"
            error={errors.slug?.message}
            {...register('slug', { required: 'Slug is required' })}
          />

          <TextareaField
            label="Description"
            placeholder="Describe the show..."
            rows={3}
            {...register('description')}
          />
        </FormSection>

        <FormSection title="Schedule & Venue">
          <SelectField
            label="Venue"
            options={[
              { value: '', label: 'Select venue...' },
              ...venues.map((v) => ({ value: String(v.id), label: v.name })),
            ]}
            {...register('venue_id')}
          />

          <FormRow cols={3}>
            <InputField
              label="Date"
              type="date"
              required
              error={errors.show_date?.message}
              {...register('show_date', { required: 'Date is required' })}
            />
            <InputField label="Start Time" type="time" {...register('start_time')} />
            <InputField label="End Time" type="time" {...register('end_time')} />
          </FormRow>
        </FormSection>

        <FormSection title="Tickets">
          <FormRow>
            <InputField
              label="Capacity"
              type="number"
              placeholder="100"
              {...register('capacity')}
            />
            <InputField
              label="Ticket Price"
              type="number"
              step="0.01"
              placeholder="25.00"
              {...register('ticket_price')}
            />
          </FormRow>
        </FormSection>

        <FormSection title="Options">
          <div className="flex flex-wrap gap-6">
            <CheckboxField
              label="Featured Show"
              description="Highlight this show in listings"
              {...register('featured')}
            />
            <CheckboxField
              label="Kid Friendly"
              description="Suitable for all ages"
              {...register('kid_friendly')}
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
