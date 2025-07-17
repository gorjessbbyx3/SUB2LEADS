
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold mb-4">System Status</h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm">Database Connection</span>
    </div>
    
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <span className="text-sm">AI Service (Mock Mode)</span>
    </div>
    
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <span className="text-sm">Email Service (Dev Mode)</span>
    </div>
    
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm">Property Management</span>
    </div>
    
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm">Lead Pipeline</span>
    </div>
    
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm">Investor Matching</span>
    </div>
  </div>
  
  <div className="mt-4 text-xs text-gray-500">
    <p>🟢 Fully Functional | 🟡 Limited/Mock Mode | 🔴 Not Available</p>
  </div>
</div>
