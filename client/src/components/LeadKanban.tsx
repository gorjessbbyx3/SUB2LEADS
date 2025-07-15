import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowRight, Phone, Mail, Eye } from 'lucide-react';

interface Lead {
  id: number;
  name: string;
  address: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  priority: 'low' | 'medium' | 'high';
  estimatedValue: number;
  lastContact?: string;
  phone?: string;
  email?: string;
}

export default function LeadKanban() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    // Fetch leads from API
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/properties');
      const properties = await response.json();

      const formattedLeads = properties.map((prop: any) => ({
        id: prop.id,
        name: prop.ownerName || 'Unknown Owner',
        address: prop.address,
        status: prop.leadStatus || 'new',
        priority: prop.priority,
        estimatedValue: prop.estimatedValue,
        lastContact: prop.lastContact,
        phone: prop.phone,
        email: prop.email
      }));

      setLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const moveLeadToNextStatus = async (leadId: number, currentStatus: string) => {
    const statusFlow = {
      'new': 'contacted',
      'contacted': 'qualified',
      'qualified': 'closed',
      'closed': 'closed'
    };

    const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];

    try {
      const response = await fetch(`/api/properties/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadStatus: nextStatus })
      });

      if (response.ok) {
        setLeads(leads.map(lead => 
          lead.id === leadId ? { ...lead, status: nextStatus as any } : lead
        ));
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const columns = [
    { title: 'New Leads', status: 'new', count: getLeadsByStatus('new').length },
    { title: 'Contacted', status: 'contacted', count: getLeadsByStatus('contacted').length },
    { title: 'Qualified', status: 'qualified', count: getLeadsByStatus('qualified').length },
    { title: 'Closed', status: 'closed', count: getLeadsByStatus('closed').length },
  ];

  return (
    <div className="p-6">
      <div className="flex gap-6 overflow-x-auto">
        {columns.map((column) => (
          <div key={column.status} className="flex-1 min-w-80">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{column.title}</span>
                  <Badge variant="secondary">{column.count}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getLeadsByStatus(column.status).map((lead) => (
                    <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{lead.address}</p>
                      <p className="text-sm font-medium mb-3">${lead.estimatedValue.toLocaleString()}</p>

                      {/* Contact Information */}
                      <div className="flex gap-2 mb-3">
                        {lead.phone && (
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            Call
                          </Button>
                        )}
                        {lead.email && (
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Email
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </div>

                      {/* Move to Next Status */}
                      {lead.status !== 'closed' && (
                        <Button 
                          size="sm" 
                          className="w-full flex items-center gap-1"
                          onClick={() => moveLeadToNextStatus(lead.id, lead.status)}
                        >
                          {lead.status === 'new' ? 'Mark as Contacted' : 
                           lead.status === 'contacted' ? 'Mark as Qualified' : 
                           'Mark as Closed'}
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}

                      {lead.lastContact && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last contact: {lead.lastContact}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}