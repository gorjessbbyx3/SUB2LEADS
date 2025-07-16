
export interface TMKData {
  tmkNumber: string;
  zone: string;
  section: string;
  plat: string;
  parcel: string;
  island: 'Oahu' | 'Maui' | 'Hawaii' | 'Kauai' | 'Molokai' | 'Lanai';
}

export class HawaiiPropertyService {
  
  // Parse TMK (Tax Map Key) number
  static parseTMK(tmkString: string): TMKData | null {
    // TMK format: (1) 2-3-004:005 or 1-2-3-004-005
    const tmkPattern = /(?:\((\d)\))?\s*(\d)-(\d)-(\d{3}):?(\d{3})/;
    const match = tmkString.match(tmkPattern);
    
    if (!match) return null;
    
    const [, zone, section, plat, parcel] = match;
    const islandMap: Record<string, TMKData['island']> = {
      '1': 'Oahu',
      '2': 'Maui',
      '3': 'Hawaii',
      '4': 'Kauai',
      '5': 'Molokai',
      '6': 'Lanai'
    };
    
    return {
      tmkNumber: tmkString,
      zone: zone || '1',
      section,
      plat,
      parcel,
      island: islandMap[zone || '1'] || 'Oahu'
    };
  }
  
  // Categorize property by island-specific features
  static categorizeProperty(address: string, tmk?: string): {
    island: string;
    region: string;
    propertyClass: string;
  } {
    const lowerAddress = address.toLowerCase();
    
    // Island detection
    let island = 'Oahu'; // Default
    if (lowerAddress.includes('maui') || lowerAddress.includes('lahaina') || lowerAddress.includes('kihei')) {
      island = 'Maui';
    } else if (lowerAddress.includes('big island') || lowerAddress.includes('hilo') || lowerAddress.includes('kona')) {
      island = 'Hawaii';
    } else if (lowerAddress.includes('kauai') || lowerAddress.includes('lihue')) {
      island = 'Kauai';
    }
    
    // Region detection for Oahu
    let region = 'Central';
    if (lowerAddress.includes('north shore') || lowerAddress.includes('haleiwa')) {
      region = 'North Shore';
    } else if (lowerAddress.includes('windward') || lowerAddress.includes('kailua') || lowerAddress.includes('kaneohe')) {
      region = 'Windward';
    } else if (lowerAddress.includes('leeward') || lowerAddress.includes('waianae') || lowerAddress.includes('kapolei')) {
      region = 'Leeward';
    } else if (lowerAddress.includes('honolulu') || lowerAddress.includes('waikiki')) {
      region = 'Urban Honolulu';
    }
    
    // Property classification
    let propertyClass = 'Residential';
    if (lowerAddress.includes('condo') || lowerAddress.includes('apartment')) {
      propertyClass = 'Condominium';
    } else if (lowerAddress.includes('commercial') || lowerAddress.includes('retail')) {
      propertyClass = 'Commercial';
    } else if (lowerAddress.includes('farm') || lowerAddress.includes('agricultural')) {
      propertyClass = 'Agricultural';
    }
    
    return { island, region, propertyClass };
  }
  
  // Get Hawaii legal notice parsing patterns
  static getHawaiiLegalNoticePatterns() {
    return {
      foreclosureKeywords: [
        'mortgagee\'s sale',
        'power of sale',
        'public auction',
        'foreclosure sale',
        'non-judicial foreclosure'
      ],
      auctionLocationPatterns: [
        /at the (?:front|main) (?:entrance|steps|door) of/i,
        /(?:first circuit court|circuit court of the first circuit)/i,
        /417 south king street/i,
        /honolulu, hawaii/i
      ],
      tmkPatterns: [
        /tmk:?\s*\(?\d\)?\s*\d-\d-\d{3}:?\d{3}/gi,
        /tax map key:?\s*\(?\d\)?\s*\d-\d-\d{3}:?\d{3}/gi
      ]
    };
  }
  
  // Validate Hawaii addresses
  static validateHawaiiAddress(address: string): boolean {
    const hawaiiZipCodes = /\b9(67|68)\d{2}\b/; // Hawaii zip codes start with 967xx or 968xx
    const hawaiiCities = [
      'honolulu', 'hilo', 'kailua-kona', 'kaneohe', 'waipahu', 'pearl city',
      'kailua', 'kihei', 'lahaina', 'lihue', 'aiea', 'mililani', 'ewa beach'
    ];
    
    const lowerAddress = address.toLowerCase();
    const hasHawaiiCity = hawaiiCities.some(city => lowerAddress.includes(city));
    const hasHawaiiZip = hawaiiZipCodes.test(address);
    const hasHawaiiState = /\bhi\b|\bhawaii\b/i.test(address);
    
    return hasHawaiiCity || hasHawaiiZip || hasHawaiiState;
  }
}
