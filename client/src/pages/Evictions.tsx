
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
  AlertTriangle, 
  Clock, 
  Gavel, 
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Download
} from "lucide-react";

export default function Evictions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("foreclosures");

  const { data: foreclosures = [] } = useQuery({
    queryKey: ["/api/foreclosures"],
    queryFn: () => fetch("/api/foreclosures").then(res => res.json()),
  });

  const { data: evictions = [] } = useQuery({
    queryKey: ["/api/evictions"],
    queryFn: () => fetch("/api/evictions").then(res => res.json()),
  });

  const { data: auctionStats } = useQuery({
    queryKey: ["/api/auctions/stats"],
    queryFn: () => fetch("/api/auctions/stats").then(res => res.json()),
  });

  const filteredForeclosures = foreclosures.filter((item: any) => {
    const matchesSearch = searchTerm === "" || 
      item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.defendantName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredEvictions = evictions.filter((item: any) => {
    const matchesSearch = searchTerm === "" || 
      item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      case 'active': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'dismissed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="Foreclosures & Evictions" 
          subtitle="Track foreclosure proceedings and eviction cases"
          action={{
            label: "Export Data",
            onClick: () => console.log("Export data")
          }}
        />
        
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Foreclosures</p>
                    <p className="text-2xl font-bold text-red-600">
                      {auctionStats?.activeForeclosures || 0}
                    </p>
                  </div>
                  <Gavel className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Auctions</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {auctionStats?.upcomingAuctions || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Eviction Cases</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {auctionStats?.evictionCases || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">High Priority</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {auctionStats?.highPriority || 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by address, defendant, or case number..."
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
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
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="foreclosures">Foreclosures</TabsTrigger>
              <TabsTrigger value="evictions">Evictions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="foreclosures" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Foreclosure Cases ({filteredForeclosures.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredForeclosures.map((foreclosure: any) => (
                      <div key={foreclosure.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{foreclosure.address}</h4>
                              <Badge className={getPriorityColor(foreclosure.priority)}>
                                {foreclosure.priority} Priority
                              </Badge>
                              <Badge className={getStatusColor(foreclosure.status)}>
                                {foreclosure.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Defendant</p>
                                <p className="font-medium">{foreclosure.defendantName || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Case Number</p>
                                <p className="font-medium">{foreclosure.caseNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Amount Owed</p>
                                <p className="font-medium">${(foreclosure.amountOwed || 0).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            {foreclosure.auctionDate && (
                              <div className="flex items-center mt-2 text-sm text-orange-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                Auction: {new Date(foreclosure.auctionDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              View Case
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredForeclosures.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No foreclosure cases found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="evictions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Eviction Cases ({filteredEvictions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredEvictions.map((eviction: any) => (
                      <div key={eviction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{eviction.address}</h4>
                              <Badge className={getPriorityColor(eviction.priority)}>
                                {eviction.priority} Priority
                              </Badge>
                              <Badge className={getStatusColor(eviction.status)}>
                                {eviction.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Tenant</p>
                                <p className="font-medium">{eviction.tenantName || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Case Number</p>
                                <p className="font-medium">{eviction.caseNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Rent Owed</p>
                                <p className="font-medium">${(eviction.rentOwed || 0).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            {eviction.hearingDate && (
                              <div className="flex items-center mt-2 text-sm text-blue-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                Hearing: {new Date(eviction.hearingDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              View Case
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredEvictions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No eviction cases found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
