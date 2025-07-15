import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyModal } from "@/components/PropertyModal";
import { AIchatbot } from "@/components/AIchatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  MapPin,
  TrendingUp,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { Link } from "wouter";

export default function Properties() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: properties = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => fetch("/api/properties?limit=100").then(res => res.json()),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/properties/stats"],
  });

  const runScrapingMutation = useMutation({
    mutationFn: async (source: string) => {
      const response = await apiRequest('POST', '/api/scraping/run', { source });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/stats"] });
    },
  });

  const handlePropertyClick = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
    setIsPropertyModalOpen(true);
  };

  const filteredAndSortedProperties = properties
    .filter((property: any) => {
      const matchesSearch = searchTerm === "" || 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || property.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "value_high":
          return (b.estimatedValue || 0) - (a.estimatedValue || 0);
        case "value_low":
          return (a.estimatedValue || 0) - (b.estimatedValue || 0);
        case "auction_soon":
          return (a.daysUntilAuction || 999) - (b.daysUntilAuction || 999);
        default:
          return 0;
      }
    });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="Properties" 
          subtitle="Manage distressed properties and investment opportunities"
          action={{
            label: "Run Scraper",
            onClick: () => runScrapingMutation.mutate('star_advertiser')
          }}
        />

        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">High Priority</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats?.highPriority || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Auctions Soon</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats?.auctionsSoon || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">New Today</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.newToday || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Property Listings</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runScrapingMutation.mutate('star_advertiser')}
                    disabled={runScrapingMutation.isPending}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${runScrapingMutation.isPending ? 'animate-spin' : ''}`} />
                    {runScrapingMutation.isPending ? 'Scraping...' : 'Refresh Data'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search properties by address or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="foreclosure">Foreclosure</SelectItem>
                    <SelectItem value="tax_delinquent">Tax Delinquent</SelectItem>
                    <SelectItem value="auction">Auction</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="value_high">Value: High to Low</SelectItem>
                    <SelectItem value="value_low">Value: Low to High</SelectItem>
                    <SelectItem value="auction_soon">Auction Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Showing {filteredAndSortedProperties.length} of {properties.length} properties
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {filteredAndSortedProperties.filter((p: any) => p.priority === 'high').length} High Priority
                  </Badge>
                  <Badge variant="outline">
                    {filteredAndSortedProperties.filter((p: any) => p.status === 'foreclosure').length} Foreclosures
                  </Badge>
                </div>
              </div>

              {/* Property Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedProperties.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAndSortedProperties.map((property: any) => (
                    <Card key={property.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <Link href={`/properties/${property.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                              {property.address}
                            </h3>
                            <div className="flex gap-1">
                              <Badge variant={property.status === "new" ? "default" : "secondary"}>
                                {property.status}
                              </Badge>
                              <Badge variant={property.priority === "high" ? "destructive" : "outline"}>
                                {property.priority}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {property.propertyType} • {property.source}
                            </div>

                            {property.lienAmount && (
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                ${property.lienAmount.toLocaleString()}
                              </div>
                            )}

                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(property.createdAt).toLocaleDateString()}
                            </div>

                            {property.ownerName && (
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500">Owner: {property.ownerName}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                      ? "Try adjusting your search filters"
                      : "Start by running the scraper to find distressed properties"
                    }
                  </p>
                  {(!searchTerm && statusFilter === "all" && priorityFilter === "all") && (
                    <Button onClick={() => runScrapingMutation.mutate('star_advertiser')}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Run Scraper Now
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <PropertyModal
        propertyId={selectedPropertyId}
        isOpen={isPropertyModalOpen}
        onClose={() => {
          setIsPropertyModalOpen(false);
          setSelectedPropertyId(null);
        }}
      />

      <AIchatbot />
    </div>
  );
}