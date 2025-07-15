import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: {
    id: number;
    address: string;
    status: string;
    priority: string;
    estimatedValue?: number;
    daysUntilAuction?: number;
    amountOwed?: number;
    createdAt: string;
  };
  onClick?: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'foreclosure':
        return 'Foreclosure Notice';
      case 'tax_delinquent':
        return 'Tax Delinquent';
      case 'auction':
        return 'Auction';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div 
      className={cn(
        "flex items-start space-x-4 p-4 bg-gray-50 rounded-lg transition-all",
        onClick && "cursor-pointer hover:bg-gray-100"
      )}
      onClick={onClick}
    >
      {/* Property Image Placeholder */}
      <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-600">IMG</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{property.address}</h4>
        <p className="text-sm text-gray-500 mt-1">
          {getStatusDisplay(property.status)}
          {property.daysUntilAuction && (
            <> • Auction in {property.daysUntilAuction} days</>
          )}
          {property.amountOwed && (
            <> • ${property.amountOwed.toLocaleString()} owed</>
          )}
        </p>
        <div className="flex items-center space-x-3 mt-2">
          <Badge className={getPriorityColor(property.priority)}>
            {property.priority.charAt(0).toUpperCase() + property.priority.slice(1)} Priority
          </Badge>
          {property.estimatedValue && (
            <span className="text-sm text-gray-500">
              Est. ${property.estimatedValue.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-end space-y-2">
        <span className="text-xs text-gray-500">
          {getTimeAgo(property.createdAt)}
        </span>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
