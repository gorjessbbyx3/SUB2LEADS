import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Mail, Phone, Eye, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';

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

const statusColumns = [
  { id: 'to_contact', title: 'To Contact', color: 'bg-blue-100' },
  { id: 'in_conversation', title: 'In Conversation', color: 'bg-yellow-100' },
  { id: 'appointment_set', title: 'Appointment Set', color: 'bg-green-100' },
  { id: 'follow_up', title: 'Follow Up', color: 'bg-purple-100' },
  { id: 'closed', title: 'Closed', color: 'bg-gray-100' },
];

export function DragDropLeadKanban() {
  const { toast } = useToast();
  
  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: number; updates: Partial<Lead> }) => {
      await apiRequest('PATCH', `/api/leads/${leadId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Lead Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateEmailMutation = useMutation({
    mutationFn: async ({ leadId, templateId }: { leadId: number; templateId: string }) => {
      const response = await apiRequest('POST', `/api/leads/${leadId}/generate-mailto`, {
        templateId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.mailtoLink) {
        window.location.href = data.mailtoLink;
        // Mark email as initiated
        toast({
          title: "Email Opened",
          description: "Your email client should open with a pre-filled message.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Email Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const leadId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    updateLeadMutation.mutate({
      leadId,
      updates: { status: newStatus },
    });
  };

  const getLeadsByStatus = (status: string): Lead[] => {
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

  const generateEmail = (leadId: number, templateType: string = 'general') => {
    generateEmailMutation.mutate({ leadId, templateId: templateType });
  };

  const makePhoneCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast({
        title: "No Phone Number",
        description: "No phone number available for this contact.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {statusColumns.map((column) => (
            <div key={column.id} className="space-y-4">
              <div className={`p-4 rounded-lg ${column.color}`}>
                <h3 className="font-semibold text-gray-800">{column.title}</h3>
                <p className="text-sm text-gray-600">
                  {getLeadsByStatus(column.id).length} leads
                </p>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] space-y-3 p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    {getLeadsByStatus(column.id).map((lead, index) => (
                      <Draggable
                        key={lead.id}
                        draggableId={lead.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab active:cursor-grabbing transition-transform ${
                              snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                            }`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  className={`${getPriorityColor(lead.priority)} text-white text-xs`}
                                >
                                  {lead.priority.toUpperCase()}
                                </Badge>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateEmail(lead.id, 'foreclosure');
                                    }}
                                    disabled={generateEmailMutation.isPending}
                                  >
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      makePhoneCall(lead.contact?.phone);
                                    }}
                                  >
                                    <Phone className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <CardTitle className="text-sm">
                                {lead.contact?.name || 'Unknown Contact'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-gray-600 mb-2">
                                {lead.property?.address}
                              </p>
                              
                              {lead.property?.estimatedValue && (
                                <div className="flex items-center text-xs text-green-600 mb-1">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  ${lead.property.estimatedValue.toLocaleString()}
                                </div>
                              )}
                              
                              {lead.property?.daysUntilAuction && (
                                <div className="flex items-center text-xs text-orange-600 mb-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {lead.property.daysUntilAuction} days to auction
                                </div>
                              )}
                              
                              {lead.lastContactDate && (
                                <p className="text-xs text-gray-500">
                                  Last contact: {new Date(lead.lastContactDate).toLocaleDateString()}
                                </p>
                              )}
                              
                              {lead.notes && (
                                <p className="text-xs text-gray-700 mt-2 line-clamp-2">
                                  {lead.notes}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}