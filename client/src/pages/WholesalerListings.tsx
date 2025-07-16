
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AIchatbot } from "@/components/AIchatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink,
  MapPin,
  DollarSign,
  Home,
  Bed,
  Bath,
  Square
} from "lucide-react";

interface WholesaleProperty {
  id: string;
  address: string;
  city: string;
  island: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: string;
  listingDate: string;
  wholesalerName: string;
  wholesalerPhone: string;
  wholesalerEmail: string;
  description: string;
  images: string[];
  source: 'hawaii_home_listings' | 'big_isle';
  sourceUrl: string;
  contractPrice?: number;
  estimatedARV?: number;
  repairsNeeded?: string;
}

export default function WholesalerListings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [islandFilter, setIslandFilter] = useState("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/wholesaler-listings"],
    queryFn: () => fetch("/api/wholesaler-listings").then(res => res.json()),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/wholesaler-listings/stats"],
  });

  const filteredAndSortedListings = (listings || [])
    .filter((listing: WholesaleProperty) => {
      const matchesSearch = searchTerm === "" || 
        listing.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.wholesalerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesIsland = islandFilter === "all" || listing.island === islandFilter;
      
      const matchesPrice = priceRangeFilter === "all" || 
        (priceRangeFilter === "under_100k" && listing.price < 100000) ||
        (priceRangeFilter === "100k_300k" && listing.price >= 100000 && listing.price < 300000) ||
        (priceRangeFilter === "300k_500k" && listing.price >= 300000 && listing.price < 500000) ||
        (priceRangeFilter === "over_500k" && listing.price >= 500000);

      const matchesSource = sourceFilter === "all" || listing.source === sourceFilter;

      return matchesSearch && matchesIsland && matchesPrice && matchesSource;
    })
    .sort((a: WholesaleProperty, b: WholesaleProperty) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime();
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "sqft_high":
          return b.sqft - a.sqft;
        default:
          return 0;
      }
    });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="Wholesaler Listings" 
          subtitle="Browse active wholesale deals from Hawaii brokers and wholesalers"
          action={{
            label: "Refresh Listings",
            onClick: () => refetch()
          }}
        />

        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Listings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Price</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${stats?.averagePrice?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Oahu Listings</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats?.oahuCount || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Big Island</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats?.bigIslandCount || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Listings</TabsTrigger>
              <TabsTrigger value="hawaii_home_listings">Hawaii Home Listings</TabsTrigger>
              <TabsTrigger value="big_isle">Big Isle</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Wholesale Listings</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => refetch()}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      <Button 
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/wholesaler-listings/import', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert(`Imported ${result.imported.properties} properties and created ${result.imported.leads} wholesaler leads`);
                              refetch();
                            }
                          } catch (error) {
                            console.error('Error importing listings:', error);
                            alert('Failed to import listings');
                          }
                        }}
                      >
                        Import to CRM
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://www.hawaiihomelistings.com/search/results/?island=Oahu&region=all&neighborhood=all&beds_min=all&baths_min=all&list_price_min=50000&list_price_max=all&type=res&type=con&sort_latest=true', '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Hawaii Home Listings
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://bigisle.com/our-listings', '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Big Isle Listings
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
                        placeholder="Search by address, city, or wholesaler..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={islandFilter} onValueChange={setIslandFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Island" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Islands</SelectItem>
                        <SelectItem value="Oahu">Oahu</SelectItem>
                        <SelectItem value="Big Island">Big Island</SelectItem>
                        <SelectItem value="Maui">Maui</SelectItem>
                        <SelectItem value="Kauai">Kauai</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Price Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="under_100k">Under $100K</SelectItem>
                        <SelectItem value="100k_300k">$100K - $300K</SelectItem>
                        <SelectItem value="300k_500k">$300K - $500K</SelectItem>
                        <SelectItem value="over_500k">Over $500K</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="hawaii_home_listings">Hawaii Home Listings</SelectItem>
                        <SelectItem value="big_isle">Big Isle</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                        <SelectItem value="sqft_high">Largest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Results Summary */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                      Showing {filteredAndSortedListings.length} of {listings.length} listings
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {filteredAndSortedListings.filter((l: WholesaleProperty) => l.source === 'hawaii_home_listings').length} Hawaii Home
                      </Badge>
                      <Badge variant="outline">
                        {filteredAndSortedListings.filter((l: WholesaleProperty) => l.source === 'big_isle').length} Big Isle
                      </Badge>
                    </div>
                  </div>

                  {/* Listings Grid */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-24 h-24 bg-gray-300 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredAndSortedListings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredAndSortedListings.map((listing: WholesaleProperty) => (
                        <Card key={listing.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* Property Image */}
                              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                {listing.images && listing.images.length > 0 ? (
                                  <img 
                                    src={listing.images[0]} 
                                    alt={listing.address}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Home className="h-8 w-8 text-gray-400" />
                                )}
                              </div>

                              {/* Property Details */}
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-gray-900">
                                    {listing.address}
                                  </h3>
                                  <div className="flex gap-1">
                                    <Badge variant={listing.source === "hawaii_home_listings" ? "default" : "secondary"}>
                                      {listing.source === "hawaii_home_listings" ? "Hawaii Home" : "Big Isle"}
                                    </Badge>
                                    <Badge variant="outline">
                                      {listing.island}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    ${listing.price.toLocaleString()}
                                  </div>
                                  <div className="flex items-center">
                                    <Bed className="h-4 w-4 mr-1" />
                                    {listing.beds} beds
                                  </div>
                                  <div className="flex items-center">
                                    <Bath className="h-4 w-4 mr-1" />
                                    {listing.baths} baths
                                  </div>
                                  <div className="flex items-center">
                                    <Square className="h-4 w-4 mr-1" />
                                    {listing.sqft.toLocaleString()} sqft
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-500">
                                    <p className="font-medium">{listing.wholesalerName}</p>
                                    <p>{listing.wholesalerPhone}</p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => window.open(listing.sourceUrl, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View Listing
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => {
                                        // Navigate to lead management for this wholesaler
                                        window.location.href = `/leads?search=${encodeURIComponent(listing.wholesalerName)}`;
                                      }}
                                    >
                                      View Lead
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm || islandFilter !== "all" || priceRangeFilter !== "all"
                          ? "Try adjusting your search filters"
                          : "No wholesale listings available at the moment"
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hawaii_home_listings">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="bg-blue-50 rounded-lg p-8">
                      <Home className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Hawaii Home Listings</h3>
                      <p className="text-gray-600 mb-4">
                        Browse distressed and wholesale properties across all Hawaiian islands
                      </p>
                      <Button 
                        onClick={() => window.open('https://www.hawaiihomelistings.com/search/results/?island=Oahu&region=all&neighborhood=all&beds_min=all&baths_min=all&list_price_min=50000&list_price_max=all&type=res&type=con&sort_latest=true', '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Hawaii Home Listings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="big_isle">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="bg-orange-50 rounded-lg p-8">
                      <MapPin className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Big Isle Listings</h3>
                      <p className="text-gray-600 mb-4">
                        Exclusive wholesale deals and investment opportunities on the Big Island
                      </p>
                      <Button 
                        onClick={() => window.open('https://bigisle.com/our-listings', '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Big Isle Listings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AIchatbot />
    </div>
  );
}
