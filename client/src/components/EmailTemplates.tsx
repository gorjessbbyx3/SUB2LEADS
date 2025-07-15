import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Mail, Copy, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  type: 'foreclosure' | 'tax_lien' | 'general' | 'follow_up';
}

interface EmailTemplatesProps {
  onSelectTemplate: (templateId: string) => void;
  selectedLead?: any;
}

export function EmailTemplates({ onSelectTemplate, selectedLead }: EmailTemplatesProps) {
  const { toast } = useToast();
  
  const templates: EmailTemplate[] = [
    {
      id: 'foreclosure',
      name: 'Foreclosure Outreach',
      description: 'For properties facing foreclosure',
      type: 'foreclosure',
      subject: 'Options for Your Property at {address}',
      body: `Hi {ownerName},

I noticed your property at {address} may be facing foreclosure. I work with homeowners to explore all available options before any final decisions are made.

Would you be open to a brief conversation about potential solutions? I may be able to help you understand your choices.

Best regards,
[Your Name]
[Your Phone Number]`
    },
    {
      id: 'tax_lien',
      name: 'Tax Lien Notice',
      description: 'For tax delinquent properties',
      type: 'tax_lien',
      subject: 'Tax Lien Notice - {address}',
      body: `Hi {ownerName},

I wanted to reach out regarding the tax situation on your property at {address}. There may be options available to help resolve this matter.

I'd be happy to discuss potential solutions if you're interested.

Thank you,
[Your Name]
[Your Phone Number]`
    },
    {
      id: 'general',
      name: 'General Inquiry',
      description: 'General property inquiry',
      type: 'general',
      subject: 'Regarding Your Property at {address}',
      body: `Hi {ownerName},

I hope this message finds you well. I wanted to reach out about your property at {address} to see if there are any ways I might be able to help with your current situation.

Would you be open to a brief conversation?

Best regards,
[Your Name]
[Your Phone Number]`
    },
    {
      id: 'follow_up',
      name: 'Follow Up',
      description: 'Follow up with previous contacts',
      type: 'follow_up',
      subject: 'Following Up - {address}',
      body: `Hi {ownerName},

I wanted to follow up on our previous conversation about your property at {address}. 

If you have any questions or would like to discuss your options further, please don't hesitate to reach out.

Best regards,
[Your Name]
[Your Phone Number]`
    }
  ];

  const generateMailtoLink = (template: EmailTemplate) => {
    if (!selectedLead?.contact?.email) {
      toast({
        title: "No Email Address",
        description: "This contact doesn't have an email address.",
        variant: "destructive",
      });
      return;
    }

    const address = selectedLead.property?.address || '[Property Address]';
    const ownerName = selectedLead.contact?.name || 'Property Owner';

    const subject = template.subject
      .replace('{address}', address)
      .replace('{ownerName}', ownerName);

    const body = template.body
      .replace(/{address}/g, address)
      .replace(/{ownerName}/g, ownerName);

    const mailto = `mailto:${selectedLead.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailto;
    
    toast({
      title: "Email Opened",
      description: "Your email client should open with the pre-filled template.",
    });
  };

  const copyToClipboard = (template: EmailTemplate) => {
    const address = selectedLead?.property?.address || '[Property Address]';
    const ownerName = selectedLead?.contact?.name || 'Property Owner';

    const fullEmail = `Subject: ${template.subject.replace('{address}', address).replace('{ownerName}', ownerName)}

${template.body.replace(/{address}/g, address).replace(/{ownerName}/g, ownerName)}`;

    navigator.clipboard.writeText(fullEmail);
    
    toast({
      title: "Copied to Clipboard",
      description: "Email template has been copied to your clipboard.",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'foreclosure': return 'bg-red-100 text-red-800';
      case 'tax_lien': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Email Templates</h3>
        {selectedLead && (
          <div className="text-sm text-gray-600">
            For: {selectedLead.contact?.name || 'Unknown'} - {selectedLead.property?.address}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{template.name}</CardTitle>
                <Badge className={getTypeColor(template.type)}>
                  {template.type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{template.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Subject:</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {template.subject}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-3">
                  {template.body}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => generateMailtoLink(template)}
                  disabled={!selectedLead?.contact?.email}
                  className="flex-1"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Send Email
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(template)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}