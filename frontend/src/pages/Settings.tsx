import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, eventbriteApi, festivalsApi, mailchimpApi } from '@/api/endpoints';
import { useToast } from '@/components/common/Toast';
import { Save, RefreshCw, Check, Users, Heart, Ticket, Layers } from 'lucide-react';
import type { Settings as SettingsType } from '@/types';

export function Settings() {
  const [formData, setFormData] = useState<Partial<SettingsType>>({});
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals'],
    queryFn: festivalsApi.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast('success', 'Settings saved successfully');
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const testEventbriteMutation = useMutation({
    mutationFn: eventbriteApi.test,
    onSuccess: (data) => {
      if (data.success) {
        addToast('success', 'Eventbrite connection successful');
      } else {
        addToast('error', data.error || 'Connection failed');
      }
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const syncEventbriteMutation = useMutation({
    mutationFn: () => eventbriteApi.sync(formData.active_festival_id || undefined),
    onSuccess: (data) => {
      addToast('success', `Synced ${data.synced} of ${data.total} events`);
      if (data.errors.length > 0) {
        addToast('warning', `${data.errors.length} errors occurred during sync`);
      }
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  // Mailchimp mutations
  const testMailchimpMutation = useMutation({
    mutationFn: mailchimpApi.test,
    onSuccess: (data) => {
      if (data.success) {
        addToast('success', data.message || 'Mailchimp connection successful');
      } else {
        addToast('error', data.error || 'Connection failed');
      }
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });

  const { data: mailchimpLists = [] } = useQuery({
    queryKey: ['mailchimp-lists'],
    queryFn: async () => {
      const result = await mailchimpApi.getLists();
      return result.success ? result.data || [] : [];
    },
    enabled: !!formData.mailchimp_api_key,
  });

  const syncPerformersMutation = useMutation({
    mutationFn: () => mailchimpApi.syncPerformers(formData.active_festival_id || undefined),
    onSuccess: (data) => {
      if (data.success) {
        addToast('success', data.message || 'Performers synced');
      } else {
        addToast('error', data.error || 'Sync failed');
      }
    },
    onError: (error: Error) => addToast('error', error.message),
  });

  const syncVolunteersMutation = useMutation({
    mutationFn: () => mailchimpApi.syncVolunteers(formData.active_festival_id || undefined),
    onSuccess: (data) => {
      if (data.success) {
        addToast('success', data.message || 'Volunteers synced');
      } else {
        addToast('error', data.error || 'Sync failed');
      }
    },
    onError: (error: Error) => addToast('error', error.message),
  });

  const syncAttendeesMutation = useMutation({
    mutationFn: () => mailchimpApi.syncAttendees(formData.active_festival_id || undefined),
    onSuccess: (data) => {
      if (data.success) {
        addToast('success', data.message || 'Attendees synced');
      } else {
        addToast('error', data.error || 'Sync failed');
      }
    },
    onError: (error: Error) => addToast('error', error.message),
  });

  const syncAllMailchimpMutation = useMutation({
    mutationFn: () => mailchimpApi.syncAll(formData.active_festival_id || undefined),
    onSuccess: (data) => {
      if (data.success) {
        addToast('success', `Synced ${data.total_synced} contacts to Mailchimp`);
      } else {
        addToast('error', `Sync completed with ${data.errors.length} errors`);
      }
    },
    onError: (error: Error) => addToast('error', error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof SettingsType, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Festival
              </label>
              <select
                className="input max-w-md"
                value={formData.active_festival_id || ''}
                onChange={(e) =>
                  handleChange(
                    'active_festival_id',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Select a festival...</option>
                {festivals.map((festival) => (
                  <option key={festival.id} value={festival.id}>
                    {festival.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The active festival will be used as the default for all operations
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Email
              </label>
              <input
                type="email"
                className="input max-w-md"
                value={formData.notification_email || ''}
                onChange={(e) => handleChange('notification_email', e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          </div>
        </div>

        {/* Eventbrite Integration */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Eventbrite Integration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                className="input max-w-md"
                value={formData.eventbrite_token || ''}
                onChange={(e) => handleChange('eventbrite_token', e.target.value)}
                placeholder="Enter your Eventbrite private token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization ID
              </label>
              <input
                type="text"
                className="input max-w-md"
                value={formData.eventbrite_org_id || ''}
                onChange={(e) => handleChange('eventbrite_org_id', e.target.value)}
                placeholder="Your Eventbrite organization ID"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => testEventbriteMutation.mutate()}
                disabled={testEventbriteMutation.isPending}
              >
                {testEventbriteMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Test Connection
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => syncEventbriteMutation.mutate()}
                disabled={syncEventbriteMutation.isPending}
              >
                {syncEventbriteMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync Events
              </button>
            </div>
          </div>
        </div>

        {/* Mailchimp Integration */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Mailchimp Integration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                className="input max-w-md"
                value={formData.mailchimp_api_key || ''}
                onChange={(e) => handleChange('mailchimp_api_key', e.target.value)}
                placeholder="Enter your Mailchimp API key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in Mailchimp under Account → Extras → API keys
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audience/List
              </label>
              {mailchimpLists.length > 0 ? (
                <select
                  className="input max-w-md"
                  value={formData.mailchimp_list_id || ''}
                  onChange={(e) => handleChange('mailchimp_list_id', e.target.value)}
                >
                  <option value="">Select an audience...</option>
                  {mailchimpLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.member_count} members)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input max-w-md"
                  value={formData.mailchimp_list_id || ''}
                  onChange={(e) => handleChange('mailchimp_list_id', e.target.value)}
                  placeholder="Your Mailchimp audience/list ID"
                />
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => testMailchimpMutation.mutate()}
                disabled={testMailchimpMutation.isPending}
              >
                {testMailchimpMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Test Connection
              </button>
            </div>

            {formData.mailchimp_list_id && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Sync Contacts to Mailchimp</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => syncPerformersMutation.mutate()}
                    disabled={syncPerformersMutation.isPending}
                  >
                    {syncPerformersMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    Performers
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => syncVolunteersMutation.mutate()}
                    disabled={syncVolunteersMutation.isPending}
                  >
                    {syncVolunteersMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                    Volunteers
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => syncAttendeesMutation.mutate()}
                    disabled={syncAttendeesMutation.isPending}
                  >
                    {syncAttendeesMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ticket className="w-4 h-4" />
                    )}
                    Attendees
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => syncAllMailchimpMutation.mutate()}
                    disabled={syncAllMailchimpMutation.isPending}
                  >
                    {syncAllMailchimpMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                    Sync All
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Contacts will be tagged with their type (Performer, Volunteer, Attendee) and festival year
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Voting Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Voting Weights</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure the point values for each vote position in the voting system
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1st Place Weight
              </label>
              <input
                type="number"
                className="input"
                value={formData.voting_weight_first || 3}
                onChange={(e) =>
                  handleChange('voting_weight_first', Number(e.target.value))
                }
                min={1}
                max={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2nd Place Weight
              </label>
              <input
                type="number"
                className="input"
                value={formData.voting_weight_second || 2}
                onChange={(e) =>
                  handleChange('voting_weight_second', Number(e.target.value))
                }
                min={1}
                max={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3rd Place Weight
              </label>
              <input
                type="number"
                className="input"
                value={formData.voting_weight_third || 1}
                onChange={(e) =>
                  handleChange('voting_weight_third', Number(e.target.value))
                }
                min={1}
                max={10}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
