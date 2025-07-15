import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Calendar, DollarSign, User, ExternalLink } from 'lucide-react';

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
            <Badge className={getStatusColor(property.status)}>
              {property.status.replace('_', ' ')}
            </Badge>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}