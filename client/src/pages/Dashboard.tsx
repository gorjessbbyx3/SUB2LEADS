import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  Home, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  PieChart,
  BarChart3,
  Calendar,
  MapPin,
  Clock,
  Zap,
  Star,
  Briefcase,
  Mail,
  Phone,
  Eye,
  Filter,
  Search,
  Bell,
  Settings
} from "lucide-react";
import { Header } from "@/components/Header";
import { DashboardSkeleton } from "@/components/LoadingStates";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface DashboardStats {
  totalProperties: number;
  activeLeads: number;
  totalInvestors: number;
  matchScore: number;
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  deals: {
    pending: number;
    closed: number;
    pipeline: number;
  };
}

interface Property {
  id: string;
  address: string;
  price: number;
  status: string;
  daysOnMarket: number;
  estimatedROI: number;
  riskScore: number;
  matchCount: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties?limit=6");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  const { data: pipeline } = useQuery({
    queryKey: ["/api/leads/pipeline"],
    queryFn: async () => {
      const response = await fetch("/api/leads/pipeline");
      if (!response.ok) throw new Error("Failed to fetch pipeline");
      return response.json();
    },
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  const mockStats: DashboardStats = {
    totalProperties: stats?.totalProperties || 247,
    activeLeads: stats?.activeLeads || 89,
    totalInvestors: stats?.totalInvestors || 156,
    matchScore: stats?.matchScore || 94,
    revenue: stats?.revenue || {
      current: 125000,
      previous: 98000,
      change: 27.6
    },
    deals: stats?.deals || {
      pending: 12,
      closed: 8,
      pipeline: 34
    }
  };

  const mockProperties: Property[] = properties || [
    {
      id: "1",
      address: "1234 Ala Moana Blvd, Honolulu, HI",
      price: 850000,
      status: "Under Contract",
      daysOnMarket: 14,
      estimatedROI: 18.5,
      riskScore: 7.2,
      matchCount: 8
    },
    {
      id: "2", 
      address: "5678 Kalanianaole Hwy, Kailua, HI",
      price: 1200000,
      status: "Active",
      daysOnMarket: 3,
      estimatedROI: 22.1,
      riskScore: 8.9,
      matchCount: 12
    },
    {
      id: "3",
      address: "9012 Kamehameha Hwy, Pearl City, HI",
      price: 675000,
      status: "Pre-Market",
      daysOnMarket: 0,
      estimatedROI: 15.7,
      riskScore: 6.8,
      matchCount: 5
    }
  ];

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen">
        <div className="flex-1 ml-64 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Executive Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Hawaii Real Estate Intelligence Platform</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Actions
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl border-0 transform hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold">${((mockStats.revenue.current || 0) / 1000).toFixed(0)}K</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm">+{mockStats.revenue.change || 0}% from last month</span>
                    </div>
                  </div>
                  <DollarSign className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white shadow-2xl border-0 transform hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Properties</p>
                    <p className="text-3xl font-bold">{mockStats.totalProperties}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm">+12 this week</span>
                    </div>
                  </div>
                  <Home className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-2xl border-0 transform hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Qualified Leads</p>
                    <p className="text-3xl font-bold">{mockStats.activeLeads}</p>
                    <div className="flex items-center mt-2">
                      <Activity className="w-4 h-4 mr-1" />
                      <span className="text-sm">23 need follow-up</span>
                    </div>
                  </div>
                  <Users className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-2xl border-0 transform hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Match Score</p>
                    <p className="text-3xl font-bold">{mockStats.matchScore}%</p>
                    <div className="flex items-center mt-2">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="text-sm">Excellent performance</span>
                    </div>
                  </div>
                  <Target className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-xl p-1">
              <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <PieChart className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4" />
                <span>Pipeline</span>
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Home className="w-4 h-4" />
                <span>Properties</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Zap className="w-4 h-4" />
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Deal Pipeline Visualization */}
                <div className="lg:col-span-2">
                  <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold flex items-center">
                        <Target className="w-5 h-5 mr-2 text-blue-600" />
                        Deal Pipeline Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {[
                          { stage: "New Leads", count: pipeline?.toContact || 24, color: "bg-slate-500", progress: 85, trend: "+12%" },
                          { stage: "Qualified", count: pipeline?.inConversation || 18, color: "bg-yellow-500", progress: 65, trend: "+8%" },
                          { stage: "Under Contract", count: pipeline?.appointmentSet || 12, color: "bg-blue-500", progress: 45, trend: "+15%" },
                          { stage: "Closed Deals", count: pipeline?.followUp || 8, color: "bg-green-500", progress: 25, trend: "+22%" }
                        ].map((item, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                <span className="font-semibold text-gray-900">{item.stage}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge variant="secondary" className="bg-white">
                                  {item.count} deals
                                </Badge>
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  {item.trend}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Progress</span>
                                <span>{item.progress}%</span>
                              </div>
                              <Progress value={item.progress} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-purple-600" />
                        Today's Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Emails Sent</span>
                        </div>
                        <span className="font-bold">47</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Calls Made</span>
                        </div>
                        <span className="font-bold">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">Property Views</span>
                        </div>
                        <span className="font-bold">156</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">New Matches</span>
                        </div>
                        <span className="font-bold">8</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Zap className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
                        <h3 className="text-lg font-bold mb-2">AI Recommendations</h3>
                        <p className="text-blue-100 text-sm mb-4">
                          3 high-value properties match your top investors' criteria
                        </p>
                        <Button className="bg-white text-blue-600 hover:bg-gray-100">
                          View Suggestions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Home className="w-5 h-5 mr-2 text-green-600" />
                      High-Performance Properties
                    </CardTitle>
                    <Button variant="outline" className="border-gray-300">
                      View All Properties <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {mockProperties.map((property) => (
                      <div key={property.id} className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{property.address}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={
                                  property.status === "Under Contract" ? "bg-blue-100 text-blue-700" :
                                  property.status === "Active" ? "bg-green-100 text-green-700" :
                                  "bg-purple-100 text-purple-700"
                                }
                              >
                                {property.status}
                              </Badge>
                              <span className="text-sm text-gray-500">{property.daysOnMarket} days</span>
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              ${(property.price / 1000).toFixed(0)}K
                            </div>
                            <div className="text-sm text-gray-500">Market Price</div>
                          </div>

                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {property.estimatedROI}%
                            </div>
                            <div className="text-sm text-gray-500">Est. ROI</div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Risk Score: {property.riskScore}/10</div>
                              <Progress value={property.riskScore * 10} className="h-2 w-20" />
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {property.matchCount} matches
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Pipeline Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">87%</div>
                        <div className="text-sm text-gray-500">Conversion Rate</div>
                      </div>
                      <Progress value={87} className="h-3" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Target: 80%</span>
                        <span>+7% above target</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Avg. Deal Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">21</div>
                        <div className="text-sm text-gray-500">Days</div>
                      </div>
                      <div className="flex items-center justify-center text-sm text-green-600">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        -3 days from last month
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Revenue Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">$187K</div>
                        <div className="text-sm text-gray-500">This Month</div>
                      </div>
                      <div className="flex items-center justify-center text-sm text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +23% vs. last month
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-2xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-indigo-600" />
                      AI Market Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <h4 className="font-semibold text-indigo-900 mb-2">Trending Neighborhoods</h4>
                      <p className="text-sm text-gray-700">Kailua and Pearl City showing 18% price appreciation this quarter.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">Investor Preference Shift</h4>
                      <p className="text-sm text-gray-700">Multi-family properties gaining 34% more interest from mainland investors.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Market Opportunity</h4>
                      <p className="text-sm text-gray-700">12 distressed properties in Oahu match your top investor criteria.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-2xl border-0 bg-gradient-to-br from-orange-50 to-red-50">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-orange-600" />
                      Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                      <div>
                        <div className="font-medium text-gray-900">Follow up with 8 qualified leads</div>
                        <div className="text-sm text-gray-500">Due today</div>
                      </div>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        Review
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                      <div>
                        <div className="font-medium text-gray-900">Update property valuations</div>
                        <div className="text-sm text-gray-500">5 properties pending</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Update
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                      <div>
                        <div className="font-medium text-gray-900">Generate investor reports</div>
                        <div className="text-sm text-gray-500">Monthly reports due</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}