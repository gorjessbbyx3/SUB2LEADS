
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Users, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OutreachCampaign {
  id: number;
  name: string;
  type: string;
  subject?: string;
  template: string;
  isActive: boolean;
  createdAt: string;
}

interface Lead {
  id: number;
  property: {
    address: string;
  };
  contact: {
    name: string;
    email?: string;
  };
  status: string;
  priority: string;
}

export default function Outreach() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/outreach/campaigns'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/outreach/campaigns');
      return res.json();
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/leads');
      return res.json();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ leadId, templateId, message }: { leadId: number; templateId: string; message: string }) => {
      const res = await apiRequest('POST', '/api/outreach/email', {
        leadId,
        templateId,
        customMessage: message,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setSelectedLeads([]);
      setCustomMessage("");
    },
  });

  const handleSendEmails = () => {
    selectedLeads.forEach(leadId => {
      sendEmailMutation.mutate({
        leadId,
        templateId: selectedTemplate,
        message: customMessage,
      });
    });
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Outreach Management</h1>
        <Button>
          <Mail className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter((c: OutreachCampaign) => c.isActive).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Leads</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedLeads.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="send">Send Emails</TabsTrigger>
          <TabsTrigger value="history">Outreach History</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.map((campaign: OutreachCampaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge variant={campaign.isActive ? "default" : "secondary"}>
                        {campaign.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </div>
                    {campaign.subject && (
                      <p className="text-sm text-muted-foreground mb-2">Subject: {campaign.subject}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.template.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Preview</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Template & Customize</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns
                      .filter((c: OutreachCampaign) => c.isActive)
                      .map((campaign: OutreachCampaign) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>

                <div>
                  <label className="text-sm font-medium">Custom Message (Optional)</label>
                  <Textarea
                    placeholder="Add a personal touch to your message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleSendEmails}
                  disabled={!selectedTemplate || selectedLeads.length === 0 || sendEmailMutation.isPending}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Leads ({selectedLeads.length} selected)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leads.map((lead: Lead) => (
                    <div 
                      key={lead.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLeads.includes(lead.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleLeadSelection(lead.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{lead.contact.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.property.address}</p>
                          {lead.contact.email && (
                            <p className="text-xs text-muted-foreground">{lead.contact.email}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {lead.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{lead.priority}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outreach History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Outreach history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
