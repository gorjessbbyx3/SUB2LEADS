
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface LeadDetailsFormProps {
  lead: any;
  onSave: (updatedLead: any) => void;
  onCancel: () => void;
}

export default function LeadDetailsForm({ lead, onSave, onCancel }: LeadDetailsFormProps) {
  const [formData, setFormData] = useState({
    status: lead.status || 'to_contact',
    priority: lead.priority || 'medium',
    financingType: lead.financingType || '',
    ownershipType: lead.ownershipType || '',
    ownershipDetails: lead.ownershipDetails || '',
    contractingType: lead.contractingType || '',
    contractingDetails: lead.contractingDetails || '',
    notes: lead.notes || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...lead, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Edit Lead Details</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{lead.property?.address}</Badge>
            <Badge>{lead.contact?.name}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_contact">To Contact</SelectItem>
                    <SelectItem value="in_conversation">In Conversation</SelectItem>
                    <SelectItem value="appointment_set">Appointment Set</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="closed_won">Closed Won</SelectItem>
                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="financingType">Financing Type</Label>
                <Select value={formData.financingType} onValueChange={(value) => handleInputChange('financingType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select financing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="conventional">Conventional</SelectItem>
                    <SelectItem value="hard_money">Hard Money</SelectItem>
                    <SelectItem value="private_lender">Private Lender</SelectItem>
                    <SelectItem value="owner_finance">Owner Finance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ownershipType">Ownership Type</Label>
                <Select value={formData.ownershipType} onValueChange={(value) => handleInputChange('ownershipType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ownership type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contractingType">Contracting Type</Label>
                <Select value={formData.contractingType} onValueChange={(value) => handleInputChange('contractingType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contracting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="double_close">Double Close</SelectItem>
                    <SelectItem value="bird_dog">Bird Dog</SelectItem>
                    <SelectItem value="direct_purchase">Direct Purchase</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="ownershipDetails">Ownership Details</Label>
              <Textarea
                id="ownershipDetails"
                value={formData.ownershipDetails}
                onChange={(e) => handleInputChange('ownershipDetails', e.target.value)}
                placeholder="Additional ownership information..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="contractingDetails">Contracting Details</Label>
              <Textarea
                id="contractingDetails"
                value={formData.contractingDetails}
                onChange={(e) => handleInputChange('contractingDetails', e.target.value)}
                placeholder="Additional contracting information..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
