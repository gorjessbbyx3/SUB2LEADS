
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Upload, FileText, MapPin, User, Calendar, DollarSign } from 'lucide-react';

interface LeadSubmissionFormProps {
  onSubmit: (formData: any) => void;
  isSubmitting?: boolean;
}

export default function LeadSubmissionForm({ onSubmit, isSubmitting = false }: LeadSubmissionFormProps) {
  const [dealType, setDealType] = useState<'wholesaler' | 'birddog' | null>(null);
  const [formData, setFormData] = useState({
    // Common fields
    propertyAddress: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    
    // Wholesaler fields
    contractHolderName: '',
    contractHolderPhone: '',
    contractHolderEmail: '',
    askingPrice: '',
    contractPrice: '',
    estimatedARV: '',
    repairsNeeded: '',
    contractExpiration: '',
    exitStrategy: '',
    occupancyStatus: '',
    showingInstructions: '',
    
    // Bird Dog fields
    distressType: '',
    leadSource: '',
    notes: '',
    timeFound: '',
    
    // Contract status
    underContractStatus: 'no',
    contractUpload: null as File | null,
    
    // Photos
    photos: [] as File[]
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, dealType });
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (files) {
      if (field === 'contractUpload') {
        handleInputChange(field, files[0]);
      } else if (field === 'photos') {
        handleInputChange(field, Array.from(files));
      }
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Deal Intake Workflow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Choose Deal Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Choose Deal Type</h3>
            <p className="text-gray-600">Is this deal already under contract?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                variant={dealType === 'wholesaler' ? 'default' : 'outline'}
                onClick={() => setDealType('wholesaler')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Badge className="bg-blue-500 text-white">✅ Yes</Badge>
                <span className="font-medium">Wholesaler Flow</span>
                <span className="text-sm text-gray-500">Property is under contract</span>
              </Button>
              
              <Button
                type="button"
                variant={dealType === 'birddog' ? 'default' : 'outline'}
                onClick={() => setDealType('birddog')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Badge className="bg-green-500 text-white">❌ No</Badge>
                <span className="font-medium">Bird Dog Lead Flow</span>
                <span className="text-sm text-gray-500">Fresh lead, not under contract</span>
              </Button>
            </div>
          </div>

          {dealType && (
            <>
              {/* Common Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Property Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertyAddress">Property Address *</Label>
                    <Input
                      id="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                      required
                      placeholder="123 Main St, Honolulu, HI 96801"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerPhone">Owner Phone</Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                      placeholder="(808) 555-0123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerEmail">Owner Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                      placeholder="owner@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Wholesaler Fields */}
              {dealType === 'wholesaler' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">💼 Wholesaler Deal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contractHolderName">Contract Holder Name *</Label>
                      <Input
                        id="contractHolderName"
                        value={formData.contractHolderName}
                        onChange={(e) => handleInputChange('contractHolderName', e.target.value)}
                        required
                        placeholder="Wholesaler Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractHolderPhone">Contract Holder Phone</Label>
                      <Input
                        id="contractHolderPhone"
                        value={formData.contractHolderPhone}
                        onChange={(e) => handleInputChange('contractHolderPhone', e.target.value)}
                        placeholder="(808) 555-0123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="askingPrice">Asking Price (Assignment Fee Included?)</Label>
                      <Input
                        id="askingPrice"
                        value={formData.askingPrice}
                        onChange={(e) => handleInputChange('askingPrice', e.target.value)}
                        placeholder="$150,000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractPrice">Contract Price (Optional)</Label>
                      <Input
                        id="contractPrice"
                        value={formData.contractPrice}
                        onChange={(e) => handleInputChange('contractPrice', e.target.value)}
                        placeholder="$125,000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedARV">Estimated ARV</Label>
                      <Input
                        id="estimatedARV"
                        value={formData.estimatedARV}
                        onChange={(e) => handleInputChange('estimatedARV', e.target.value)}
                        placeholder="$200,000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractExpiration">Contract Expiration Date</Label>
                      <Input
                        id="contractExpiration"
                        type="date"
                        value={formData.contractExpiration}
                        onChange={(e) => handleInputChange('contractExpiration', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="exitStrategy">Exit Strategy</Label>
                      <Select value={formData.exitStrategy} onValueChange={(value) => handleInputChange('exitStrategy', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flip">Flip</SelectItem>
                          <SelectItem value="rental">Rental</SelectItem>
                          <SelectItem value="wholetail">Wholetail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="occupancyStatus">Occupancy Status</Label>
                      <Select value={formData.occupancyStatus} onValueChange={(value) => handleInputChange('occupancyStatus', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select occupancy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vacant">Vacant</SelectItem>
                          <SelectItem value="owner_occupied">Owner Occupied</SelectItem>
                          <SelectItem value="tenant_occupied">Tenant Occupied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="repairsNeeded">Repairs Needed</Label>
                    <Textarea
                      id="repairsNeeded"
                      value={formData.repairsNeeded}
                      onChange={(e) => handleInputChange('repairsNeeded', e.target.value)}
                      placeholder="List major repairs needed..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="showingInstructions">Showing Instructions</Label>
                    <Textarea
                      id="showingInstructions"
                      value={formData.showingInstructions}
                      onChange={(e) => handleInputChange('showingInstructions', e.target.value)}
                      placeholder="How to schedule showings..."
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Bird Dog Fields */}
              {dealType === 'birddog' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">🕵️ Bird Dog Lead Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="distressType">Type of Distress</Label>
                      <Select value={formData.distressType} onValueChange={(value) => handleInputChange('distressType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select distress type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vacant">Vacant</SelectItem>
                          <SelectItem value="code_violation">Code Violation</SelectItem>
                          <SelectItem value="foreclosure">Foreclosure</SelectItem>
                          <SelectItem value="probate">Probate</SelectItem>
                          <SelectItem value="divorce">Divorce</SelectItem>
                          <SelectItem value="deferred_maintenance">Deferred Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="leadSource">How Lead Was Found</Label>
                      <Select value={formData.leadSource} onValueChange={(value) => handleInputChange('leadSource', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driving_for_dollars">Driving for Dollars</SelectItem>
                          <SelectItem value="tax_list">Tax List</SelectItem>
                          <SelectItem value="foreclosure_list">Foreclosure List</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="online_research">Online Research</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFound">Time & Date Found</Label>
                      <Input
                        id="timeFound"
                        type="datetime-local"
                        value={formData.timeFound}
                        onChange={(e) => handleInputChange('timeFound', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes from Bird Dog</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="e.g., 'spoke to owner', 'looks abandoned', etc."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Contract Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contract Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="underContractStatus">Under Contract Status</Label>
                    <Select value={formData.underContractStatus} onValueChange={(value) => handleInputChange('underContractStatus', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes – I have the contract</SelectItem>
                        <SelectItem value="unsure">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contractUpload">Upload Contract (Optional)</Label>
                    <Input
                      id="contractUpload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('contractUpload', e.target.files)}
                    />
                    {formData.contractUpload && (
                      <p className="text-sm text-green-600 mt-1">
                        📎 {formData.contractUpload.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Photos</h3>
                <div>
                  <Label htmlFor="photos">Upload Photos</Label>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload('photos', e.target.files)}
                  />
                  {formData.photos.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      📷 {formData.photos.length} photo(s) selected
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="px-8">
                  {isSubmitting ? 'Submitting...' : 'Submit Lead'}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
