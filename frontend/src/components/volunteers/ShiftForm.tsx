import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { volunteersApi, festivalsApi } from '@/api/endpoints';
import { useToast } from '@/components/common/Toast';
import {
  Modal,
  InputField,
  TextareaField,
  SelectField,
  FormRow,
  FormSection,
} from '@/components/common';
import type { VolunteerShift } from '@/types';

interface ShiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: VolunteerShift | null;
}

interface ShiftFormData {
  festival_id: number | '';
  task_name: string;
  description: string;
  location: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  slots_total: number | '';
  status: VolunteerShift['status'];
}

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'filled', label: 'Filled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ShiftForm({ isOpen, onClose, shift }: ShiftFormProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isEditing = !!shift;

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals'],
    queryFn: festivalsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShiftFormData>({
    defaultValues: {
      festival_id: '',
      task_name: '',
      description: '',
      location: '',
      shift_date: '',
      start_time: '',
      end_time: '',
      slots_total: '',
      status: 'open',
    },
  });

  useEffect(() => {
    if (shift) {
      reset({
        festival_id: shift.festival_id || '',
        task_name: shift.task_name,
        description: shift.description || '',
        location: shift.location || '',
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        slots_total: shift.slots_total,
        status: shift.status,
      });
    } else {
      reset({
        festival_id: '',
        task_name: '',
        description: '',
        location: '',
        shift_date: '',
        start_time: '',
        end_time: '',
        slots_total: '',
        status: 'open',
      });
    }
  }, [shift, reset]);

  const createMutation = useMutation({
    mutationFn: volunteersApi.createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts'] });
      addToast('success', 'Shift created successfully');
      onClose();
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const onSubmit = (data: ShiftFormData) => {
    const payload: Partial<VolunteerShift> = {
      festival_id: data.festival_id ? Number(data.festival_id) : 0,
      task_name: data.task_name,
      description: data.description || null,
      location: data.location || null,
      shift_date: data.shift_date,
      start_time: data.start_time,
      end_time: data.end_time,
      slots_total: data.slots_total ? Number(data.slots_total) : 1,
      status: data.status,
    };

    // Note: Only create is implemented in the API currently
    createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Shift' : 'New Shift'}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isPending}>
            Cancel
          </button>
          <button type="submit" form="shift-form" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : isEditing ? 'Update Shift' : 'Create Shift'}
          </button>
        </>
      }
    >
      <form id="shift-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Shift Details">
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
            label="Task Name"
            required
            placeholder="e.g., Box Office, Stage Setup"
            error={errors.task_name?.message}
            {...register('task_name', { required: 'Task name is required' })}
          />

          <TextareaField
            label="Description"
            placeholder="Describe what volunteers will do..."
            rows={3}
            {...register('description')}
          />

          <InputField
            label="Location"
            placeholder="e.g., Main Entrance, Stage A"
            {...register('location')}
          />
        </FormSection>

        <FormSection title="Schedule">
          <FormRow cols={3}>
            <InputField
              label="Date"
              type="date"
              required
              error={errors.shift_date?.message}
              {...register('shift_date', { required: 'Date is required' })}
            />
            <InputField
              label="Start Time"
              type="time"
              required
              error={errors.start_time?.message}
              {...register('start_time', { required: 'Start time is required' })}
            />
            <InputField
              label="End Time"
              type="time"
              required
              error={errors.end_time?.message}
              {...register('end_time', { required: 'End time is required' })}
            />
          </FormRow>
        </FormSection>

        <FormSection title="Capacity">
          <InputField
            label="Total Slots"
            type="number"
            min="1"
            required
            placeholder="5"
            hint="How many volunteers are needed for this shift"
            error={errors.slots_total?.message}
            {...register('slots_total', { required: 'Number of slots is required', min: 1 })}
          />
        </FormSection>
      </form>
    </Modal>
  );
}
