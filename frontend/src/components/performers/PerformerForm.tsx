import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { performersApi, festivalsApi } from '@/api/endpoints';
import { useToast } from '@/components/common/Toast';
import {
  Modal,
  InputField,
  TextareaField,
  SelectField,
  CheckboxField,
  FormRow,
  FormSection,
  StarRating,
} from '@/components/common';
import type { Performer, PerformerStatus } from '@/types';

interface PerformerFormProps {
  isOpen: boolean;
  onClose: () => void;
  performer?: Performer | null;
}

interface PerformerFormData {
  festival_id: number | '';
  name: string;
  email: string;
  phone: string;
  bio: string;
  photo_url: string;
  website: string;
  performance_type: string;
  technical_requirements: string;
  social_instagram: string;
  social_tiktok: string;
  social_youtube: string;
  social_twitter: string;
  compensation: number | '';
  travel_covered: boolean;
  lodging_covered: boolean;
  application_status: PerformerStatus;
  rating_internal: number | null;
  pros: string;
  cons: string;
  review_notes: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const performanceTypes = [
  { value: '', label: 'Select type...' },
  { value: 'standup', label: 'Stand-up Comedy' },
  { value: 'improv', label: 'Improv' },
  { value: 'sketch', label: 'Sketch Comedy' },
  { value: 'musical', label: 'Musical Comedy' },
  { value: 'variety', label: 'Variety Act' },
  { value: 'hosting', label: 'Hosting/MC' },
  { value: 'other', label: 'Other' },
];

export function PerformerForm({ isOpen, onClose, performer }: PerformerFormProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isEditing = !!performer;

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
  } = useForm<PerformerFormData>({
    defaultValues: {
      festival_id: '',
      name: '',
      email: '',
      phone: '',
      bio: '',
      photo_url: '',
      website: '',
      performance_type: '',
      technical_requirements: '',
      social_instagram: '',
      social_tiktok: '',
      social_youtube: '',
      social_twitter: '',
      compensation: '',
      travel_covered: false,
      lodging_covered: false,
      application_status: 'pending',
      rating_internal: null,
      pros: '',
      cons: '',
      review_notes: '',
    },
  });

  const rating = watch('rating_internal');

  useEffect(() => {
    if (performer) {
      reset({
        festival_id: performer.festival_id || '',
        name: performer.name,
        email: performer.email || '',
        phone: performer.phone || '',
        bio: performer.bio || '',
        photo_url: performer.photo_url || '',
        website: performer.website || '',
        performance_type: performer.performance_type || '',
        technical_requirements: performer.technical_requirements || '',
        social_instagram: performer.social_links?.instagram || '',
        social_tiktok: performer.social_links?.tiktok || '',
        social_youtube: performer.social_links?.youtube || '',
        social_twitter: performer.social_links?.twitter || '',
        compensation: performer.compensation || '',
        travel_covered: performer.travel_covered,
        lodging_covered: performer.lodging_covered,
        application_status: performer.application_status,
        rating_internal: performer.rating_internal,
        pros: performer.pros || '',
        cons: performer.cons || '',
        review_notes: performer.review_notes || '',
      });
    } else {
      reset({
        festival_id: '',
        name: '',
        email: '',
        phone: '',
        bio: '',
        photo_url: '',
        website: '',
        performance_type: '',
        technical_requirements: '',
        social_instagram: '',
        social_tiktok: '',
        social_youtube: '',
        social_twitter: '',
        compensation: '',
        travel_covered: false,
        lodging_covered: false,
        application_status: 'pending',
        rating_internal: null,
        pros: '',
        cons: '',
        review_notes: '',
      });
    }
  }, [performer, reset]);

  const createMutation = useMutation({
    mutationFn: performersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performers'] });
      addToast('success', 'Performer created successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Performer> }) =>
      performersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performers'] });
      addToast('success', 'Performer updated successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const onSubmit = (data: PerformerFormData) => {
    const payload: Partial<Performer> = {
      festival_id: data.festival_id ? Number(data.festival_id) : null,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      bio: data.bio || null,
      photo_url: data.photo_url || null,
      website: data.website || null,
      performance_type: data.performance_type || null,
      technical_requirements: data.technical_requirements || null,
      social_links: {
        instagram: data.social_instagram || undefined,
        tiktok: data.social_tiktok || undefined,
        youtube: data.social_youtube || undefined,
        twitter: data.social_twitter || undefined,
      },
      compensation: data.compensation ? Number(data.compensation) : null,
      travel_covered: data.travel_covered,
      lodging_covered: data.lodging_covered,
      application_status: data.application_status,
      rating_internal: data.rating_internal,
      pros: data.pros || null,
      cons: data.cons || null,
      review_notes: data.review_notes || null,
    };

    if (isEditing && performer) {
      updateMutation.mutate({ id: performer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Performer' : 'New Performer'}
      size="xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isPending}>
            Cancel
          </button>
          <button type="submit" form="performer-form" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : isEditing ? 'Update Performer' : 'Create Performer'}
          </button>
        </>
      }
    >
      <form id="performer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Basic Information">
          <FormRow>
            <SelectField
              label="Festival"
              options={[
                { value: '', label: 'Select festival...' },
                ...festivals.map((f) => ({ value: String(f.id), label: f.name })),
              ]}
              {...register('festival_id')}
            />
            <SelectField
              label="Status"
              options={statusOptions}
              {...register('application_status')}
            />
          </FormRow>

          <InputField
            label="Name"
            required
            placeholder="Performer or act name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <FormRow>
            <InputField
              label="Email"
              type="email"
              placeholder="email@example.com"
              {...register('email')}
            />
            <InputField label="Phone" type="tel" placeholder="555-123-4567" {...register('phone')} />
          </FormRow>

          <FormRow>
            <InputField
              label="Photo URL"
              type="url"
              placeholder="https://..."
              {...register('photo_url')}
            />
            <InputField
              label="Website"
              type="url"
              placeholder="https://..."
              {...register('website')}
            />
          </FormRow>
        </FormSection>

        <FormSection title="Performance Details">
          <FormRow>
            <SelectField
              label="Performance Type"
              options={performanceTypes}
              {...register('performance_type')}
            />
            <InputField
              label="Compensation"
              type="number"
              placeholder="0"
              {...register('compensation')}
            />
          </FormRow>

          <TextareaField
            label="Bio"
            placeholder="Tell us about the performer..."
            rows={4}
            {...register('bio')}
          />

          <TextareaField
            label="Technical Requirements"
            placeholder="Mic preferences, lighting, props, etc."
            rows={3}
            {...register('technical_requirements')}
          />

          <FormRow>
            <CheckboxField label="Travel Covered" {...register('travel_covered')} />
            <CheckboxField label="Lodging Covered" {...register('lodging_covered')} />
          </FormRow>
        </FormSection>

        <FormSection title="Social Media">
          <FormRow>
            <InputField label="Instagram" placeholder="@username" {...register('social_instagram')} />
            <InputField label="TikTok" placeholder="@username" {...register('social_tiktok')} />
          </FormRow>
          <FormRow>
            <InputField
              label="YouTube"
              type="url"
              placeholder="https://youtube.com/..."
              {...register('social_youtube')}
            />
            <InputField label="Twitter/X" placeholder="@username" {...register('social_twitter')} />
          </FormRow>
        </FormSection>

        <FormSection title="Internal Notes">
          <StarRating
            label="Internal Rating"
            value={rating}
            onChange={(val) => setValue('rating_internal', val || null)}
          />

          <FormRow>
            <TextareaField label="Pros" placeholder="Strengths..." rows={2} {...register('pros')} />
            <TextareaField label="Cons" placeholder="Concerns..." rows={2} {...register('cons')} />
          </FormRow>

          <TextareaField
            label="Review Notes"
            placeholder="Internal notes about this performer..."
            rows={3}
            {...register('review_notes')}
          />
        </FormSection>
      </form>
    </Modal>
  );
}
