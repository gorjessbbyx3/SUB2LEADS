
import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Phone, Mail, FileText, Calendar, MessageSquare, Download, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  status: string;
  priority: string;
  estimatedValue: number;
  liens: number;
  taxes: number;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  notes?: string;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: number;
  propertyId: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  enrichmentData?: any;
}

interface TimelineEvent {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  userId?: string;
}

export default function PropertyDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetchPropertyData();
  }, [id]);

  const fetchPropertyData = async () => {
    try {
      const [propRes, contactsRes] = await Promise.all([
        fetch(`/api/properties/${id}`),
        fetch(`/api/properties/${id}/contacts`)
      ]);

      if (propRes.ok) {
        const propData = await propRes.json();
        setProperty(propData);
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }

      // Mock timeline data - you can implement this endpoint
      setTimeline([
        {
          id: 1,
          type: 'created',
          description: 'Property added to system',
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching property data:', error);
      toast({
        title: "Error",
        description: "Failed to load property details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async () => {
    try {
      const response = await fetch('/api/ai/property-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property?.id })
      });

      if (response.ok) {
        const data = await response.json();
        setProperty(prev => prev ? { ...prev, aiSummary: data.summary } : null);
        toast({
          title: "Success",
          description: "AI summary generated successfully"
        });
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI summary",
        variant: "destructive"
      });
    }
  };

  const generateEmail = async () => {
    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property?.id,
          contactId: contacts[0]?.id,
          campaignType: emailTemplate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCustomMessage(data.email);
        toast({
          title: "Success",
          description: "Email generated successfully"
        });
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: "Failed to generate email",
        variant: "destructive"
      });
    }
  };

  const sendEmail = async () => {
    try {
      const response = await fetch(`/api/leads/${property?.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customMessage,
          templateId: emailTemplate
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email sent successfully"
        });
        setCustomMessage('');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      });
    }
  };

  const generatePDF = async () => {
    try {
      const response = await fetch(`/api/properties/${property?.id}/generate-binder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'current-user' })
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
        toast({
          title: "Success",
          description: "PDF generated successfully"
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!property) return <div>Property not found</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{property.address}</h1>
          <p className="text-muted-foreground">{property.city}, {property.state} {property.zipCode}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
          <Button onClick={generateAISummary} variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            AI Summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Property Type</Label>
                  <p className="font-medium">{property.propertyType}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                    {property.status}
                  </Badge>
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <p className="font-medium">${property.estimatedValue?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Outstanding Liens</Label>
                  <p className="font-medium text-red-600">${property.liens?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Property Taxes</Label>
                  <p className="font-medium">${property.taxes?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge variant={property.priority === 'high' ? 'destructive' : 'outline'}>
                    {property.priority}
                  </Badge>
                </div>
              </div>
              
              {property.aiSummary && (
                <div>
                  <Label>AI Summary</Label>
                  <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm">{property.aiSummary}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="outreach" className="w-full">
            <TabsList>
              <TabsTrigger value="outreach">Outreach</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="outreach" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Campaign</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template">Email Template</Label>
                    <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial_contact">Initial Contact</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="final_offer">Final Offer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Custom Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your custom message..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={6}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={generateEmail} variant="outline">
                      <Bot className="h-4 w-4 mr-2" />
                      Generate with AI
                    </Button>
                    <Button onClick={sendEmail} disabled={!customMessage}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeline.map((event) => (
                      <div key={event.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Add notes about this property..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={() => setNewNote('')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                  
                  {property.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm">{property.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Contacts Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Owner Name</Label>
                <p className="font-medium">{property.ownerName}</p>
              </div>
              
              {property.ownerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{property.ownerPhone}</span>
                </div>
              )}
              
              {property.ownerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{property.ownerEmail}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.role}</p>
                    {contact.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{contact.phone}</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No additional contacts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
