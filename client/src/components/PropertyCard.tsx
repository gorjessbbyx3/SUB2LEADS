import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Calendar, DollarSign, User, ExternalLink, FileText } from 'lucide-react';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  estimatedValue: number;
  status: string;
  priority: 'low' | 'medium' | 'high';
  amountOwed?: number;
  daysUntilAuction?: number;
  auctionDate?: string;
  ownerName?: string;
  sourceUrl?: string;
  underContractStatus?: 'yes' | 'no' | 'unsure';
  contractUploadUrl?: string;
  mlsStatus?: string;
}

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

export default function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'foreclosure': return 'bg-red-100 text-red-800';
      case 'tax_delinquent': return 'bg-orange-100 text-orange-800';
      case 'auction': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate OpenStreetMap static image URL
  const getMapImageUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
  };

  const handleGeneratePDF = async (propertyId: number) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includePhotos: true,
          includeMap: true,
          includeComps: true,
          includeMatches: true,
          companyName: 'Sub2Leads Hawaii',
          contactInfo: 'leads@sub2leads.com\n(808) 555-0123\nwww.sub2leads.com'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `property-${propertyId}-presentation.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{property.address}</CardTitle>
          <Badge className={getPriorityColor(property.priority)}>
            {property.priority}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {property.city}, {property.state} {property.zipCode}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Map Preview */}
          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=-158.3,21.2,-157.6,21.8&layer=mapnik&marker=${21.5},${-158.0}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              title="Property Location"
              className="rounded-lg"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <Badge className={getStatusColor(property.status)}>
                {property.status.replace('_', ' ')}
              </Badge>
              {/* Contract Status Badge */}
              {property.underContractStatus === 'yes' && (
                <Badge className="bg-blue-500 text-white">🔒 Under Contract</Badge>
              )}
              {property.underContractStatus === 'no' && (
                <Badge className="bg-green-600 text-white">🟢 Available</Badge>
              )}
              {property.underContractStatus === 'unsure' && (
                <Badge className="bg-gray-400 text-white">❓ Unknown</Badge>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-1" />
                ${property.estimatedValue.toLocaleString()}
              </div>
              {property.amountOwed && (
                <div className="text-sm text-red-600">
                  Owed: ${property.amountOwed.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {property.ownerName && (
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 mr-1" />
              {property.ownerName}
            </div>
          )}

          {property.auctionDate && (
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              Auction: {property.auctionDate}
              {property.daysUntilAuction && (
                <span className="ml-1 text-red-600">
                  ({property.daysUntilAuction} days)
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={() => onViewDetails(property)}
            >
              View Details
            </Button>
            {property.sourceUrl && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(property.sourceUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
             <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGeneratePDF(property.id);
                }}
              >
                <FileText className="w-4 h-4" />
              </Button>
          </div>
          
          {/* MLS Status Check Button */}
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => window.open(`https://www.hicentral.com/forsale.php?search=1&searchbox=${encodeURIComponent(property.address)}`, '_blank')}
            >
              🔎 Check HiCentral MLS
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}