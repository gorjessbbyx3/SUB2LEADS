
const { storage } = require('./server/storage');

// Paste your investor data here in this format:
const investorData = [
  // Example format - replace with your actual data
  {
    name: "John Smith",
    email: "john@example.com",
    phone: "808-555-0123",
    company: "Smith Real Estate LLC",
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

async function importInvestors() {
  console.log('Starting investor import...');
  
  const results = {
    imported: 0,
    duplicates: 0,
    errors: 0
  };

  // Replace with your actual user ID from the database
  const userId = "42094346"; // This should match your user ID

  try {
    const existingInvestors = await storage.getInvestors(userId, { limit: 1000 });
    
    for (const investor of investorData) {
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
