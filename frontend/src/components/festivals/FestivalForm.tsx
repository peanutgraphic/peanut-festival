import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { festivalsApi } from '@/api/endpoints';
import { useToast } from '@/components/common/Toast';
import { Modal, InputField, TextareaField, SelectField, FormRow, FormSection } from '@/components/common';
import type { Festival } from '@/types';

interface FestivalFormProps {
  isOpen: boolean;
  onClose: () => void;
  festival?: Festival | null;
}

interface FestivalFormData {
  name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: Festival['status'];
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function FestivalForm({ isOpen, onClose, festival }: FestivalFormProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isEditing = !!festival;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FestivalFormData>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      status: 'draft',
    },
  });

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

  // Reset form when festival changes
  useEffect(() => {
    if (festival) {
      reset({
        name: festival.name,
        slug: festival.slug,
        description: festival.description || '',
        start_date: festival.start_date || '',
        end_date: festival.end_date || '',
        location: festival.location || '',
        status: festival.status,
      });
    } else {
      reset({
        name: '',
        slug: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        status: 'draft',
      });
    }
  }, [festival, reset]);

  const createMutation = useMutation({
    mutationFn: festivalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      addToast('success', 'Festival created successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Festival> }) =>
      festivalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      addToast('success', 'Festival updated successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const onSubmit = (data: FestivalFormData) => {
    if (isEditing && festival) {
      updateMutation.mutate({ id: festival.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Festival' : 'New Festival'}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="festival-form"
            className="btn btn-primary"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : isEditing ? 'Update Festival' : 'Create Festival'}
          </button>
        </>
      }
    >
      <form id="festival-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Basic Information">
          <InputField
            label="Festival Name"
            required
            placeholder="e.g., Summer Comedy Fest 2025"
            error={errors.name?.message}
            {...register('name', { required: 'Festival name is required' })}
          />

          <InputField
            label="Slug"
            required
            placeholder="summer-comedy-fest-2025"
            hint="URL-friendly identifier. Auto-generated from name."
            error={errors.slug?.message}
            {...register('slug', {
              required: 'Slug is required',
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: 'Slug can only contain lowercase letters, numbers, and hyphens',
              },
            })}
          />

          <TextareaField
            label="Description"
            placeholder="Describe your festival..."
            rows={3}
            {...register('description')}
          />
        </FormSection>

        <FormSection title="Dates & Location">
          <FormRow>
            <InputField
              label="Start Date"
              type="date"
              error={errors.start_date?.message}
              {...register('start_date')}
            />
            <InputField
              label="End Date"
              type="date"
              error={errors.end_date?.message}
              {...register('end_date')}
            />
          </FormRow>

          <InputField
            label="Location"
            placeholder="e.g., Chicago, IL"
            {...register('location')}
          />
        </FormSection>

        <FormSection title="Status">
          <SelectField
            label="Festival Status"
            options={statusOptions}
            {...register('status')}
          />
        </FormSection>
      </form>
    </Modal>
  );
}
