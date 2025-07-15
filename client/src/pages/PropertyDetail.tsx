
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  FileText,
  Download,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

export default function PropertyDetail() {
  const [match, params] = useRoute('/properties/:id');
  const propertyId = params?.id;

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => apiRequest(`/api/properties/${propertyId}`),
    enabled: !!propertyId
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts', propertyId],
    queryFn: () => apiRequest(`/api/properties/${propertyId}/contacts`),
    enabled: !!propertyId
  });

  const generatePDF = useMutation({
    mutationFn: () => apiRequest(`/api/properties/${propertyId}/generate-binder`, {
      method: 'POST',
      body: JSON.stringify({ userId: 'current-user' })
    }),
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    }
  });

  const generateSummary = useMutation({
    mutationFn: () => apiRequest('/api/ai/property-summary', {
      method: 'POST',
      body: JSON.stringify({ propertyId: parseInt(propertyId!) })
    })
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!property) return <div className="p-6">Property not found</div>;

  const contact = contacts?.[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.address}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={property.status === 'new' ? 'default' : 'secondary'}>
                {property.status}
              </Badge>
              <Badge variant={property.priority === 'high' ? 'destructive' : 'outline'}>
                {property.priority} priority
              </Badge>
              {property.taxStatus && (
                <Badge variant="outline">{property.taxStatus}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => generatePDF.mutate()}
              disabled={generatePDF.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {generatePDF.isPending ? 'Generating...' : 'Download Binder'}
            </Button>
            <Button
              variant="outline"
              onClick={() => generateSummary.mutate()}
              disabled={generateSummary.isPending}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {generateSummary.isPending ? 'Analyzing...' : 'AI Analysis'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="font-medium">{property.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Owner:</span>
                  <span className="font-medium">{property.ownerName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Source:</span>
                  <span className="font-medium">{property.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Discovered:</span>
                  <span className="font-medium">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Info */}
            {property.lienAmount && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Lien Amount:</span>
                    <span className="font-medium">${property.lienAmount.toLocaleString()}</span>
                  </div>
                  {property.auctionDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Auction Date:</span>
                      <span className="font-medium">
                        {new Date(property.auctionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Status Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Badge variant="outline">{property.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Priority:</span>
                  <Badge variant="outline">{property.priority}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(property.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {property.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{property.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          {contact ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Primary Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.name && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{contact.name}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="text-gray-500 text-center">No contact information available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Timeline feature coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                AI Investment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.aiSummary ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{property.aiSummary}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No AI analysis available</p>
                  <Button onClick={() => generateSummary.mutate()}>
                    Generate AI Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
