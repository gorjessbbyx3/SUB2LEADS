
const { storage } = require('./server/storage');

// Paste your investor data here in this format:
// This script will automatically filter for Hawaii investors (mailing address state = HI)
const investorData = [
  // Example format - replace with your actual data from the Google Sheets/CSV
  {
    name: "John Smith",
    email: "john@example.com",
    phone: "808-555-0123",
    company: "Smith Real Estate LLC",
    mailingAddressState: "HI",
    mailingAddress: "123 Main St, Honolulu, HI 96813",
    minBudget: 200000,
    maxBudget: 500000,
    preferredIslands: ["Oahu"],
    strategies: ["Buy & Hold"],
    propertyTypes: ["Single Family"],
    priority: "medium",
    status: "active",
    notes: "Interested in turnkey properties"
  }
  // Add more investors here...
];

// Function to filter only Hawaii investors
function filterHawaiiInvestors(investors) {
  return investors.filter(investor => {
    const state = investor.mailingAddressState || investor.state || '';
    return state.toUpperCase() === 'HI' || state.toLowerCase() === 'hawaii';
  });
}

async function importInvestors() {
  console.log('Starting Hawaii investor import...');
  
  // Filter for only Hawaii investors
  const hawaiiInvestors = filterHawaiiInvestors(investorData);
  
  console.log(`Found ${hawaiiInvestors.length} Hawaii investors out of ${investorData.length} total investors`);
  
  const results = {
    imported: 0,
    duplicates: 0,
    errors: 0,
    filteredOut: investorData.length - hawaiiInvestors.length
  };

  // Replace with your actual user ID from the database
  const userId = "42094346"; // This should match your user ID

  try {
    const existingInvestors = await storage.getInvestors(userId, { limit: 1000 });
    
    for (const investor of hawaiiInvestors) {
      try {
        // Check for duplicates
        const isDuplicate = existingInvestors.some(existing =>
          existing.email?.toLowerCase() === investor.email?.toLowerCase() ||
          existing.name.toLowerCase() === investor.name.toLowerCase()
        );

        if (isDuplicate) {
          console.log(`Duplicate found: ${investor.name}`);
          results.duplicates++;
          continue;
        }

        // Create investor
        await storage.createInvestor({
          userId,
          ...investor
        });

        console.log(`Imported: ${investor.name}`);
        results.imported++;
      } catch (error) {
        console.error(`Error importing ${investor.name}:`, error);
        results.errors++;
      }
    }

    console.log('Import complete:', results);
  } catch (error) {
    console.error('Import failed:', error);
  }

  process.exit(0);
}

importInvestors();
