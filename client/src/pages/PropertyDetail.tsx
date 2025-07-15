
import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  FileText,
  Download,
  Bot,
  Send,
  MessageSquare
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

export default function PropertyDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState('foreclosure');
  const [customMessage, setCustomMessage] = useState('');

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => apiRequest(`/api/properties/${id}`),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['property-contacts', id],
    queryFn: () => apiRequest(`/api/properties/${id}/contacts`),
    enabled: !!id,
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => apiRequest('/api/email-templates'),
  });

  const generateSummaryMutation = useMutation({
    mutationFn: () => apiRequest('/api/ai/property-summary', {
      method: 'POST',
      body: { propertyId: parseInt(id!) },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast({ title: 'AI summary generated successfully!' });
    },
  });

  const generatePdfMutation = useMutation({
    mutationFn: () => apiRequest(`/api/properties/${id}/generate-binder`, {
      method: 'POST',
      body: { userId: 'current-user' },
    }),
    onSuccess: (data) => {
      toast({ title: 'Property binder generated!', description: 'Download will start automatically' });
      // In a real app, you'd handle the download here
      console.log('PDF generated:', data.url);
    },
  });

  const generateMailtoMutation = useMutation({
    mutationFn: () => apiRequest(`/api/leads/${id}/generate-mailto`, {
      method: 'POST',
      body: { 
        templateId: selectedTemplate,
        customMessage: customMessage || undefined
      },
    }),
    onSuccess: (data) => {
      if (data.mailtoLink) {
        window.location.href = data.mailtoLink;
        toast({ title: 'Email app opened!', description: 'Your email client should open with the pre-filled message' });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <div className="p-6">
            <div className="text-lg">Loading property details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <div className="p-6">
            <div className="text-lg text-red-600">Property not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <div className="p-6 space-y-6">
          {/* Property Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.address}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                  {property.status}
                </Badge>
                <Badge variant={property.priority === 'high' ? 'destructive' : 'outline'}>
                  {property.priority} priority
                </Badge>
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Added {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending}
              >
                <Bot className="h-4 w-4 mr-2" />
                {generateSummaryMutation.isPending ? 'Generating...' : 'AI Summary'}
              </Button>
              <Button
                onClick={() => generatePdfMutation.mutate()}
                disabled={generatePdfMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {generatePdfMutation.isPending ? 'Generating...' : 'Download Binder'}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Property Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{property.address}</p>
                    </div>
                    {property.propertyType && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Property Type</label>
                        <p className="text-gray-900 capitalize">{property.propertyType}</p>
                      </div>
                    )}
                    {property.estimatedValue && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estimated Value</label>
                        <p className="text-gray-900 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {property.estimatedValue.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.lienAmount && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Lien Amount</label>
                        <p className="text-gray-900 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {property.lienAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {property.aiSummary ? (
                      <p className="text-gray-700 leading-relaxed">{property.aiSummary}</p>
                    ) : (
                      <div className="text-center py-8">
                        <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No AI summary generated yet</p>
                        <Button
                          variant="outline"
                          onClick={() => generateSummaryMutation.mutate()}
                          disabled={generateSummaryMutation.isPending}
                        >
                          Generate AI Summary
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              {/* Email Template Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Email Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Template
                      </label>
                      <select 
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="foreclosure">Foreclosure Notice</option>
                        <option value="tax_lien">Tax Lien</option>
                        <option value="auction">Auction Notice</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Add any custom message here..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {contacts.length > 0 ? (
                <div className="grid gap-4">
                  {contacts.map((contact: any) => (
                    <Card key={contact.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {contact.name}
                            </h3>
                            {contact.email && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {contact.email}
                              </p>
                            )}
                            {contact.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {contact.phone}
                              </p>
                            )}
                            {contact.role && (
                              <Badge variant="outline">{contact.role}</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {contact.email && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => generateMailtoMutation.mutate()}
                                disabled={generateMailtoMutation.isPending}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                {generateMailtoMutation.isPending ? 'Generating...' : 'Email'}
                              </Button>
                            )}
                            {contact.phone && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `tel:${contact.phone}`}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No contacts found for this property</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No timeline events yet</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
