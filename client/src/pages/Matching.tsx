
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Target, 
  Users, 
  Home, 
  TrendingUp, 
  Mail, 
  Search,
  Filter,
  Star,
  Calendar,
  DollarSign,
  MapPin
} from "lucide-react";

interface MatchResult {
  leadId: number;
  investorId: number;
  property: {
    id: number;
    address: string;
    estimatedValue?: number;
    daysUntilAuction?: number;
    priority: string;
    propertyType?: string;
    status: string;
  };
  investor: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    strategies?: string[];
    preferredIslands?: string[];
    minBudget?: number;
    maxBudget?: number;
  };
  matchScore: number;
  matchReasons: string[];
}

interface MatchingStats {
  totalMatches: number;
  matchesByInvestor: Record<string, number>;
  matchesByProperty: Record<string, number>;
  averageMatchScore: number;
}

export default function Matching() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [selectedInvestor, setSelectedInvestor] = useState("all");

  const { data: matches = [] } = useQuery<MatchResult[]>({
    queryKey: ["/api/matching/all"],
    queryFn: () => fetch("/api/matching/all").then(res => res.json()),
  });

  const { data: stats } = useQuery<MatchingStats>({
    queryKey: ["/api/matching/stats"],
    queryFn: () => fetch("/api/matching/stats").then(res => res.json()),
  });

  const { data: investors = [] } = useQuery({
    queryKey: ["/api/investors"],
    queryFn: () => fetch("/api/investors").then(res => res.json()),
  });

  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchTerm === "" || 
      match.property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.investor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesScore = parseInt(minScore) === 0 || match.matchScore >= parseInt(minScore);
    
    const matchesInvestor = selectedInvestor === "all" || 
      match.investor.id === parseInt(selectedInvestor);
    
    return matchesSearch && matchesScore && matchesInvestor;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleNotifyInvestor = async (match: MatchResult) => {
    try {
      const response = await fetch('/api/email/notify-investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: match.investor.id,
          propertyId: match.property.id,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons
        })
      });
      
      if (response.ok) {
        alert('Investor notified successfully!');
      }
    } catch (error) {
      console.error('Error notifying investor:', error);
      alert('Failed to notify investor');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="Lead-Buyer Matching" 
          subtitle="Match foreclosure leads with investor preferences"
        />
        
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Matches</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalMatches || 0}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Investors</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Object.keys(stats?.matchesByInvestor || {}).length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Properties Matched</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Object.keys(stats?.matchesByProperty || {}).length}
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Match Score</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {Math.round(stats?.averageMatchScore || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Match Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by property address or investor name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={minScore} onValueChange={setMinScore}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Min Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Scores</SelectItem>
                    <SelectItem value="40">40+ Score</SelectItem>
                    <SelectItem value="60">60+ Score</SelectItem>
                    <SelectItem value="80">80+ Score</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Investor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Investors</SelectItem>
                    {investors.map((investor: any) => (
                      <SelectItem key={investor.id} value={investor.id.toString()}>
                        {investor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Matches Table */}
          <Card>
            <CardHeader>
              <CardTitle>Property-Investor Matches ({filteredMatches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMatches.map((match, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={`${getScoreColor(match.matchScore)} text-white`}>
                            {match.matchScore}% Match
                          </Badge>
                          <Star className="h-4 w-4 text-yellow-500" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Property Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Property</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {match.property.address}
                              </div>
                              {match.property.estimatedValue && (
                                <div className="flex items-center text-green-600">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  ${match.property.estimatedValue.toLocaleString()}
                                </div>
                              )}
                              {match.property.daysUntilAuction && (
                                <div className="flex items-center text-orange-600">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {match.property.daysUntilAuction} days to auction
                                </div>
                              )}
                              <Badge variant="outline" className="mt-1">
                                {match.property.propertyType || 'Unknown Type'}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Investor Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Investor</h4>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium">{match.investor.name}</p>
                              {match.investor.company && (
                                <p className="text-gray-600">{match.investor.company}</p>
                              )}
                              {match.investor.email && (
                                <p className="text-gray-600">{match.investor.email}</p>
                              )}
                              {match.investor.minBudget && match.investor.maxBudget && (
                                <p className="text-gray-600">
                                  Budget: ${match.investor.minBudget.toLocaleString()} - ${match.investor.maxBudget.toLocaleString()}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {match.investor.strategies?.map((strategy, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {strategy}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Match Reasons */}
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Match Reasons:</h5>
                          <div className="flex flex-wrap gap-1">
                            {match.matchReasons.map((reason, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleNotifyInvestor(match)}
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Notify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/properties/${match.property.id}`, '_blank')}
                        >
                          View Property
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredMatches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No matches found with current filters
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
