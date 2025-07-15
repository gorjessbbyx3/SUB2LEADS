import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import LeadKanban from "@/components/LeadKanban"; 
import { PropertyModal } from "@/components/PropertyModal";
import { AIchatbot } from "@/components/AIchatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, MoreHorizontal } from "lucide-react";

export default function LeadManagement() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: pipeline } = useQuery({
    queryKey: ["/api/leads/pipeline"],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads?limit=100").then(res => res.json()),
  });

  const handlePropertyClick = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
    setIsPropertyModalOpen(true);
  };

  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = searchTerm === "" || 
      lead.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.property?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="Lead Management" 
          subtitle="Manage your property leads through the sales pipeline"
          action={{
            label: "New Lead",
            onClick: () => console.log("Create new lead")
          }}
        />
        
        <div className="p-6 space-y-6">
          {/* Pipeline Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">To Contact</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {pipeline?.toContact || 0}
                    </p>
                  </div>
                  <Badge variant="secondary">{pipeline?.toContact || 0}</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">In Conversation</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {pipeline?.inConversation || 0}
                    </p>
                  </div>
                  <Badge className="bg-yellow-500">{pipeline?.inConversation || 0}</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Appointment Set</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {pipeline?.appointmentSet || 0}
                    </p>
                  </div>
                  <Badge className="bg-purple-500">{pipeline?.appointmentSet || 0}</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Follow-up</p>
                    <p className="text-2xl font-bold text-green-600">
                      {pipeline?.followUp || 0}
                    </p>
                  </div>
                  <Badge className="bg-green-500">{pipeline?.followUp || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead Pipeline</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search leads by name or address..."
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
                    <SelectItem value="to_contact">To Contact</SelectItem>
                    <SelectItem value="in_conversation">In Conversation</SelectItem>
                    <SelectItem value="appointment_set">Appointment Set</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
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

              <Tabs defaultValue="kanban" className="w-full">
                <TabsList>
                  <TabsTrigger value="kanban">Kanban View</TabsTrigger>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="kanban" className="mt-6">
                  <LeadKanban />
                </TabsContent>
                
                <TabsContent value="table" className="mt-6">
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Property</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Priority</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Contact</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredLeads.map((lead: any) => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {lead.contact?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lead.contact?.email || 'No email'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handlePropertyClick(lead.propertyId)}
                                className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs block"
                              >
                                {lead.property?.address || 'Unknown address'}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">
                                {lead.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                className={
                                  lead.priority === 'high' ? 'bg-red-500' :
                                  lead.priority === 'medium' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }
                              >
                                {lead.priority}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {lead.lastContactDate 
                                ? new Date(lead.lastContactDate).toLocaleDateString()
                                : 'Never'
                              }
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
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
