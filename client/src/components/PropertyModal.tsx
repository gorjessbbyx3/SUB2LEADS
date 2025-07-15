import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar, 
  FileText,
  ExternalLink,
  Bot
} from "lucide-react";

interface PropertyModalProps {
  propertyId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyModal({ propertyId, isOpen, onClose }: PropertyModalProps) {
  const [activeTab, setActiveTab] = useState("details");

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ["/api/properties", propertyId],
    enabled: !!propertyId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/properties", propertyId, "contacts"],
    enabled: !!propertyId,
  });

  const { data: mapData } = useQuery({
    queryKey: ["/api/map/property", propertyId],
    enabled: !!propertyId,
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/property-summary', {
        propertyId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId] });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (contactId: number) => {
      // This would need a lead ID, but for demo purposes we'll show the intent
      const response = await apiRequest('POST', '/api/outreach/email', {
        leadId: 1, // Would be determined from property/contact
        templateId: null,
        customMessage: null
      });
      return response.json();
    },
  });

  if (!propertyId || !isOpen) return null;

  if (propertyLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!property) return null;

  const contact = contacts[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'foreclosure': return 'bg-red-500';
      case 'tax_delinquent': return 'bg-yellow-500';
      case 'auction': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Property Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Image and Map */}
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  {property.imageUrl ? (
                    <img 
                      src={property.imageUrl} 
                      alt="Property" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p>Property Image</p>
                    </div>
                  )}
                </div>
                
                {mapData?.mapImageUrl && (
                  <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                    <img 
                      src={mapData.mapImageUrl} 
                      alt="Property Map" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Property Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Property Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address:</span>
                      <span className="font-medium">{property.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">City:</span>
                      <span>{property.city}, {property.state} {property.zipCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Value:</span>
                      <span className="font-medium">
                        ${property.estimatedValue?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <Badge className={getStatusColor(property.status) + " text-white"}>
                        {property.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority:</span>
                      <Badge className={getPriorityColor(property.priority) + " text-white"}>
                        {property.priority.toUpperCase()}
                      </Badge>
                    </div>
                    {property.auctionDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Auction Date:</span>
                        <span className="text-red-600 font-medium">
                          {new Date(property.auctionDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {property.amountOwed && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount Owed:</span>
                        <span className="font-medium">
                          ${property.amountOwed.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            {contact ? (
              <Card>
                <CardHeader>
                  <CardTitle>Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{contact.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span>{contact.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span>{contact.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Contact Score:</span>
                      <span className="font-medium">{contact.contactScore || 0}% Complete</span>
                    </div>
                  </div>
                  
                  {contact.isLLC && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        🏢 This property is owned by a business entity (LLC/Corporation)
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    {contact.email && (
                      <Button 
                        onClick={() => sendEmailMutation.mutate(contact.id)}
                        disabled={sendEmailMutation.isPending}
                        className="flex-1"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </Button>
                    )}
                    {contact.phone && (
                      <Button variant="outline" className="flex-1">
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No contact information available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Contact enrichment may still be in progress
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI Property Analysis</CardTitle>
                  <Button 
                    onClick={() => generateSummaryMutation.mutate()}
                    disabled={generateSummaryMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    {generateSummaryMutation.isPending ? 'Generating...' : 'Regenerate'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {property.aiSummary ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {property.aiSummary}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No AI analysis available yet</p>
                    <Button 
                      onClick={() => generateSummaryMutation.mutate()}
                      disabled={generateSummaryMutation.isPending}
                    >
                      Generate Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {property.daysUntilAuction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Urgency Alert</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">
                        Auction in {property.daysUntilAuction} days
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-2">
                      This property requires immediate attention. Contact the owner as soon as possible.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate PDF Binder
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Create Email Template
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Follow-up
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Google Maps
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Property Type:</span>
                    <span>{property.propertyType || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bedrooms:</span>
                    <span>{property.bedrooms || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bathrooms:</span>
                    <span>{property.bathrooms || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Square Feet:</span>
                    <span>{property.squareFeet?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Year Built:</span>
                    <span>{property.yearBuilt || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
