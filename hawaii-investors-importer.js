
const { storage } = require('./server/storage');
const fs = require('fs');
const path = require('path');

// Function to parse CSV data and filter Hawaii investors
function parseCSVForHawaiiInvestors(csvFilePath) {
  try {
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log('CSV Headers found:', headers);
    
    const investors = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const investor = {};
        
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(/\s+/g, '');
          investor[key] = values[index] || '';
        });
        
        return investor;
      })
      .filter(investor => {
        // Filter for Hawaii investors
        const state = investor.mailingaddressstate || investor.state || investor.mailingstate || '';
        return state.toUpperCase() === 'HI' || state.toLowerCase() === 'hawaii';
      })
      .map(investor => {
        // Parse budget if it exists
        const budgetString = investor.budget || investor.investmentbudget || '';
        let minBudget = 0;
        let maxBudget = 0;
        
        if (budgetString) {
          const budgetMatch = budgetString.match(/\$?(\d+(?:\.\d+)?)[kKmM]?.*?(\$?(\d+(?:\.\d+)?)[kKmM]?)?/);
          if (budgetMatch) {
            const parseAmount = (str) => {
              if (!str) return 0;
              const num = parseFloat(str.replace(/[$,]/g, ''));
              if (str.toLowerCase().includes('k')) return num * 1000;
              if (str.toLowerCase().includes('m')) return num * 1000000;
              return num;
            };
            
            minBudget = parseAmount(budgetMatch[1]);
            maxBudget = budgetMatch[3] ? parseAmount(budgetMatch[3]) : minBudget;
          }
        }
        
        return {
          name: investor.name || investor.fullname || investor.investorname || '',
          email: investor.email || investor.emailaddress || '',
          phone: investor.phone || investor.phonenumber || investor.contactnumber || '',
          company: investor.company || investor.companyname || '',
          minBudget,
          maxBudget,
          preferredIslands: ['Oahu'], // Default to Oahu for Hawaii investors
          strategies: investor.strategy ? [investor.strategy] : ['Buy & Hold'],
          propertyTypes: ['Single Family'],
          priority: 'medium',
          status: 'active',
          notes: `Hawaii investor. ${investor.notes || investor.recentpurchase || ''}`
        };
      });
    
    return investors;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

async function importHawaiiInvestors(csvFilePath) {
  console.log('Starting Hawaii investor import from CSV...');
  
  const hawaiiInvestors = parseCSVForHawaiiInvestors(csvFilePath);
  
  console.log(`Found ${hawaiiInvestors.length} Hawaii investors in CSV`);
  
  const results = {
    imported: 0,
    duplicates: 0,
    errors: 0,
    details: []
  };

  const userId = "42094346"; // Your user ID

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
          results.details.push({
            name: investor.name,
            status: 'duplicate',
            reason: 'Email or name already exists'
          });
          continue;
        }

        // Create investor
        const newInvestor = await storage.createInvestor({
          userId,
          ...investor
        });

        console.log(`Imported: ${investor.name}`);
        results.imported++;
        results.details.push({
          name: investor.name,
          status: 'imported',
          id: newInvestor.id
        });

      } catch (error) {
        console.error(`Error importing investor ${investor.name}:`, error);
        results.errors++;
        results.details.push({
          name: investor.name,
          status: 'error',
          reason: error.message
        });
      }
    }

    console.log('Import complete:', results);
    return results;
  } catch (error) {
    console.error('Import failed:', error);
    return { error: error.message };
  }
}

// Usage examples:
// 1. If you have a CSV file in the project directory:
// importHawaiiInvestors('./path/to/your/investors.csv');

// 2. If you want to import from attached_assets folder:
// importHawaiiInvestors('./attached_assets/hawaii_buyers_with_recent_purchase_1752697814808.csv');

// Uncomment the line below and update the path to run the import:
// importHawaiiInvestors('./attached_assets/hawaii_buyers_with_recent_purchase_1752697814808.csv');

module.exports = { importHawaiiInvestors, parseCSVForHawaiiInvestors };
