
import { useState, useEffect } from 'react';
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
  onSelectTemplate?: (templateId: string) => void;
  selectedLead?: any;
  onEmailSent?: () => void;
}

export function EmailTemplates({ onSelectTemplate, selectedLead, onEmailSent }: EmailTemplatesProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (templateId: string) => {
    if (!selectedLead?.id) {
      toast({
        title: "No Lead Selected",
        description: "Please select a lead to send email to.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(templateId);
    try {
      const response = await fetch(`/api/leads/${selectedLead.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.mailtoLink) {
          // Open mailto link
          window.location.href = result.mailtoLink;
          
          toast({
            title: "Email Ready",
            description: "Your email client should open with the pre-filled template.",
          });
        } else {
          toast({
            title: "Email Sent",
            description: "Email was sent successfully via our email service.",
          });
        }

        onEmailSent?.();
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const copyToClipboard = (template: EmailTemplate) => {
    const address = selectedLead?.property?.address || '[Property Address]';
    const ownerName = selectedLead?.contact?.name || 'Property Owner';

    const subject = template.subject
      .replace('{address}', address)
      .replace('{ownerName}', ownerName);

    const body = template.body
      .replace(/{address}/g, address)
      .replace(/{ownerName}/g, ownerName);

    const fullEmail = `Subject: ${subject}\n\n${body}`;

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

  if (loading) {
    return <div className="p-4 text-center">Loading email templates...</div>;
  }

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
                  {template.body.substring(0, 150)}...
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => sendEmail(template.id)}
                  disabled={!selectedLead || sendingEmail === template.id}
                  className="flex-1"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  {sendingEmail === template.id ? 'Sending...' : 'Send Email'}
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
