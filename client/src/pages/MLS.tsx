
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  ExternalLink, 
  RefreshCw, 
  TrendingUp, 
  Home, 
  DollarSign,
  Calendar,
  MapPin,
  Eye
} from "lucide-react";

export default function MLS() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  const { data: mlsListings = [], refetch: refetchListings } = useQuery({
    queryKey: ["/api/mls/listings"],
    queryFn: () => fetch("/api/mls/listings").then(res => res.json()),
  });

  const { data: mlsStats } = useQuery({
    queryKey: ["/api/mls/stats"],
    queryFn: () => fetch("/api/mls/stats").then(res => res.json()),
  });

  const filteredListings = mlsListings.filter((listing: any) => {
    const matchesSearch = searchTerm === "" || 
      listing.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.mlsNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    
    const matchesPrice = priceRange === "all" || 
      (priceRange === "under_500k" && listing.price < 500000) ||
      (priceRange === "500k_to_1m" && listing.price >= 500000 && listing.price < 1000000) ||
      (priceRange === "over_1m" && listing.price >= 1000000);
    
    return matchesSearch && matchesStatus && matchesPrice;
  });

  const handleCheckMLS = async (address: string) => {
    window.open(`https://www.hicentral.com/forsale.php?search=1&searchbox=${encodeURIComponent(address)}`, '_blank');
  };

  const handleRefreshMLS = async () => {
    try {
      await fetch('/api/mls/refresh', { method: 'POST' });
      refetchListings();
    } catch (error) {
      console.error('Error refreshing MLS data:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="MLS Management" 
          subtitle="Monitor MLS listings and market activity"
          action={{
            label: "Refresh MLS",
            onClick: handleRefreshMLS
          }}
        />
        
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Listings</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {mlsStats?.activeListings || 0}
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Price</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${(mlsStats?.averagePrice || 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">New This Week</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {mlsStats?.newThisWeek || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Days on Market</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {mlsStats?.avgDaysOnMarket || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>MLS Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by address or MLS number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under_500k">Under $500K</SelectItem>
                    <SelectItem value="500k_to_1m">$500K - $1M</SelectItem>
                    <SelectItem value="over_1m">Over $1M</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleRefreshMLS} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Listings Table */}
          <Card>
            <CardHeader>
              <CardTitle>MLS Listings ({filteredListings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredListings.map((listing: any) => (
                  <div key={listing.id || listing.mlsNumber} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{listing.address}</h4>
                          <Badge 
                            className={
                              listing.status === 'active' ? 'bg-green-500' :
                              listing.status === 'pending' ? 'bg-yellow-500' :
                              listing.status === 'sold' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }
                          >
                            {listing.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            ${listing.price?.toLocaleString() || 'N/A'}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Home className="h-4 w-4 mr-2" />
                            {listing.bedrooms || 0} bed / {listing.bathrooms || 0} bath
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Listed: {listing.listDate ? new Date(listing.listDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        
                        {listing.mlsNumber && (
                          <p className="text-sm text-gray-500 mt-2">MLS #: {listing.mlsNumber}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleCheckMLS(listing.address)}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View MLS
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/properties?search=${encodeURIComponent(listing.address)}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredListings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No MLS listings found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
