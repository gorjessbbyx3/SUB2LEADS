import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/authUtils";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  MapPin, 
  Building, 
  Star,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  CheckCircle
} from "lucide-react";

interface Investor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  minBudget: number;
  maxBudget: number;
  preferredIslands: string[];
  strategies: string[];
  propertyTypes: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'vip';
  notes?: string;
  dealsCompleted: number;
  lastContact?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Investors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [islandFilter, setIslandFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    minBudget: '',
    maxBudget: '',
    preferredIslands: [] as string[],
    strategies: [] as string[],
    propertyTypes: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  const { data: investors = [], isLoading } = useQuery({
    queryKey: ['/api/investors'],
    queryFn: () => apiRequest('/api/investors'),
  });

  const { data: investorStats } = useQuery({
    queryKey: ['/api/investors/stats'],
    queryFn: () => apiRequest('/api/investors/stats'),
  });

  const createInvestorMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/investors', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investors/stats'] });
      setIsAddModalOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Investor added successfully',
      });
    },
  });

  const updateInvestorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/investors/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investors/stats'] });
      setEditingInvestor(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Investor updated successfully',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      minBudget: '',
      maxBudget: '',
      preferredIslands: [],
      strategies: [],
      propertyTypes: [],
      priority: 'medium',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      minBudget: parseInt(formData.minBudget) || 0,
      maxBudget: parseInt(formData.maxBudget) || 0,
      preferredIslands: formData.preferredIslands.length > 0 ? formData.preferredIslands : ['Oahu'],
      strategies: formData.strategies.length > 0 ? formData.strategies : ['Buy & Hold'],
      propertyTypes: formData.propertyTypes.length > 0 ? formData.propertyTypes : ['Single Family'],
    };

    if (editingInvestor) {
      updateInvestorMutation.mutate({ id: editingInvestor.id, data: submitData });
    } else {
      createInvestorMutation.mutate(submitData);
    }
  };

  const filteredInvestors = investors.filter((investor: Investor) => {
    const matchesSearch = searchTerm === "" || 
      investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIsland = islandFilter === "all" || 
      investor.preferredIslands.includes(islandFilter);
    
    const matchesStrategy = strategyFilter === "all" || 
      investor.strategies.includes(strategyFilter);
    
    const matchesPriority = priorityFilter === "all" || 
      investor.priority === priorityFilter;
    
    return matchesSearch && matchesIsland && matchesStrategy && matchesPriority;
  });

  const islands = ["Oahu", "Maui", "Big Island", "Kauai", "Molokai"];
  const strategies = ["Buy & Hold", "Fix & Flip", "BRRRR", "Wholesale", "Multifamily", "Luxury Rehab"];
  const propertyTypes = ["Single Family", "Duplex", "Triplex", "Condo", "Multifamily", "Commercial"];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip':
        return 'bg-purple-500 text-white';
      case 'active':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatBudget = (min: number, max: number) => {
    const formatNum = (num: number) => {
      if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
      return `$${num.toLocaleString()}`;
    };
    
    if (min === max) return formatNum(min);
    return `${formatNum(min)} - ${formatNum(max)}`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <Header
          title="Investor Network"
          subtitle="Manage your Hawaii property investor relationships"
          action={{
            label: "Add Investor",
            onClick: () => setIsAddModalOpen(true)
          }}
        />
        
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Investors</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {investorStats?.totalInvestors || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">VIP Investors</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {investorStats?.vipInvestors || 0}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Deals</p>
                    <p className="text-2xl font-bold text-green-600">
                      {investorStats?.activeDeals || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Budget</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {investorStats?.avgBudget ? formatBudget(investorStats.avgBudget, investorStats.avgBudget) : '$0'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search investors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Island</Label>
                  <Select value={islandFilter} onValueChange={setIslandFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Islands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Islands</SelectItem>
                      {islands.map(island => (
                        <SelectItem key={island} value={island}>{island}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Strategy</Label>
                  <Select value={strategyFilter} onValueChange={setStrategyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Strategies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Strategies</SelectItem>
                      {strategies.map(strategy => (
                        <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredInvestors.length > 0 ? (
              filteredInvestors.map((investor: Investor) => (
                <Card key={investor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{investor.name}</h3>
                        {investor.company && (
                          <p className="text-sm text-gray-500">{investor.company}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(investor.priority)}>
                          {investor.priority}
                        </Badge>
                        <Badge className={getStatusColor(investor.status)}>
                          {investor.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatBudget(investor.minBudget, investor.maxBudget)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{investor.preferredIslands.join(', ')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{investor.strategies.join(', ')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{investor.dealsCompleted} deals completed</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {investor.email && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      )}
                      {investor.phone && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingInvestor(investor);
                          setFormData({
                            name: investor.name,
                            email: investor.email || '',
                            phone: investor.phone || '',
                            company: investor.company || '',
                            minBudget: investor.minBudget.toString(),
                            maxBudget: investor.maxBudget.toString(),
                            preferredIslands: investor.preferredIslands,
                            strategies: investor.strategies,
                            propertyTypes: investor.propertyTypes,
                            priority: investor.priority,
                            notes: investor.notes || ''
                          });
                          setIsAddModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No investors found matching your filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Investor Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvestor ? 'Edit Investor' : 'Add New Investor'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="minBudget">Min Budget</Label>
                <Input
                  id="minBudget"
                  type="number"
                  value={formData.minBudget}
                  onChange={(e) => setFormData({...formData, minBudget: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="maxBudget">Max Budget</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData({...formData, maxBudget: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Preferred Islands</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {islands.map(island => (
                  <label key={island} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferredIslands.includes(island)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, preferredIslands: [...formData.preferredIslands, island]});
                        } else {
                          setFormData({...formData, preferredIslands: formData.preferredIslands.filter(i => i !== island)});
                        }
                      }}
                    />
                    <span className="text-sm">{island}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Investment Strategies</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {strategies.map(strategy => (
                  <label key={strategy} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.strategies.includes(strategy)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, strategies: [...formData.strategies, strategy]});
                        } else {
                          setFormData({...formData, strategies: formData.strategies.filter(s => s !== strategy)});
                        }
                      }}
                    />
                    <span className="text-sm">{strategy}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Property Types</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {propertyTypes.map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.propertyTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, propertyTypes: [...formData.propertyTypes, type]});
                        } else {
                          setFormData({...formData, propertyTypes: formData.propertyTypes.filter(t => t !== type)});
                        }
                      }}
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingInvestor(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingInvestor ? 'Update' : 'Create'} Investor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}