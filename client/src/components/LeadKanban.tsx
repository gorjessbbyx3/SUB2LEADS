import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Phone, Mail, Calendar, User } from "lucide-react";

interface Lead {
  id: number;
  propertyId: number;
  contactId: number;
  status: string;
  priority: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  appointmentDate?: string;
  notes?: string;
  property?: {
    address: string;
    estimatedValue?: number;
    daysUntilAuction?: number;
  };
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const columns = [
  { id: 'to_contact', title: 'To Contact', color: 'bg-gray-500' },
  { id: 'in_conversation', title: 'In Conversation', color: 'bg-yellow-500' },
  { id: 'appointment_set', title: 'Appointment Set', color: 'bg-purple-500' },
  { id: 'follow_up', title: 'Follow-up', color: 'bg-green-500' },
];

export function LeadKanban() {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const response = await fetch("/api/leads?limit=100");
      return response.json();
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/leads/${leadId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== newStatus) {
      updateLeadMutation.mutate({
        leadId: draggedLead.id,
        updates: { status: newStatus }
      });
    }
    setDraggedLead(null);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead: Lead) => lead.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeDisplay = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays > 0) return `${diffInDays} days ago`;
    return `In ${Math.abs(diffInDays)} days`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <Card key={column.id} className="h-96">
            <CardHeader>
              <CardTitle className="text-sm">{column.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnLeads = getLeadsByStatus(column.id);
        
        return (
          <Card key={column.id} className="h-fit min-h-96">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-900">
                  {column.title}
                </CardTitle>
                <Badge className={cn("text-white text-xs", column.color)}>
                  {columnLeads.length}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent 
              className="space-y-3 min-h-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {columnLeads.map((lead: Lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-sm text-gray-900">
                          {lead.contact?.name || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {lead.property?.address || 'Address unknown'}
                      </p>
                    </div>
                    <Badge className={cn("text-white text-xs", getPriorityColor(lead.priority))}>
                      {lead.priority}
                    </Badge>
                  </div>
                  
                  {lead.property?.estimatedValue && (
                    <p className="text-xs text-gray-600 mb-2">
                      Est. ${lead.property.estimatedValue.toLocaleString()}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex space-x-2">
                      {lead.contact?.email && (
                        <Mail className="h-3 w-3" />
                      )}
                      {lead.contact?.phone && (
                        <Phone className="h-3 w-3" />
                      )}
                      {lead.appointmentDate && (
                        <Calendar className="h-3 w-3 text-purple-500" />
                      )}
                    </div>
                    <span>
                      {lead.appointmentDate 
                        ? getTimeDisplay(lead.appointmentDate)
                        : lead.lastContactDate 
                        ? getTimeDisplay(lead.lastContactDate)
                        : 'No contact'
                      }
                    </span>
                  </div>
                  
                  {lead.property?.daysUntilAuction && lead.property.daysUntilAuction <= 7 && (
                    <div className="mt-2 text-xs text-red-600 font-medium">
                      ⚠ Auction in {lead.property.daysUntilAuction} days
                    </div>
                  )}
                </div>
              ))}
              
              {columnLeads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No leads in this column</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
