import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Mail, Settings, Send, Users } from 'lucide-react';
import { apiRequest } from '@/lib/authUtils';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export default function Outreach() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEnabled, setIsEnabled] = useState(true);

  const { data: settings = {} } = useQuery({
    queryKey: ['outreach-settings'],
    queryFn: () => apiRequest('GET', '/api/outreach/settings'),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/outreach/settings', data),
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Outreach settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['outreach-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.enabled = isEnabled;
    updateSettingsMutation.mutate(data);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-y-auto">
        <Header
          title="Outreach Settings"
          subtitle="Configure automated email campaigns and outreach settings"
        />

        <div className="p-6 space-y-6">
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      name="fromEmail"
                      type="email"
                      defaultValue={settings.fromEmail || ''}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      name="fromName"
                      defaultValue={settings.fromName || ''}
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Default Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    defaultValue={settings.subject || ''}
                    placeholder="Investment Opportunity - {address}"
                  />
                </div>

                <div>
                  <Label htmlFor="template">Email Template</Label>
                  <Textarea
                    id="template"
                    name="template"
                    rows={8}
                    defaultValue={settings.template || ''}
                    placeholder="Hi {ownerName},&#10;&#10;I hope this message finds you well. I noticed your property at {address} and wanted to reach out regarding a potential investment opportunity..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                  />
                  <Label htmlFor="enabled">Enable automatic outreach</Label>
                </div>

                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  <Settings className="h-4 w-4 mr-2" />
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Emails Sent</p>
                    <p className="text-2xl font-bold text-gray-900">247</p>
                  </div>
                  <Send className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Responses</p>
                    <p className="text-2xl font-bold text-green-600">23</p>
                  </div>
                  <Mail className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Response Rate</p>
                    <p className="text-2xl font-bold text-blue-600">9.3%</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}