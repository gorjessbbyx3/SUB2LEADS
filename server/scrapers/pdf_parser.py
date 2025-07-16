import json
import sys
from datetime import datetime

def parse_judiciary_documents():
    """Mock PDF parser for Hawaii Judiciary foreclosure cases"""
    try:
        # Mock data for Hawaii Judiciary foreclosure cases
        properties = [
            {
                'address': '321 Court St, Honolulu, HI 96817',
                'defendant': 'Michael Thompson',
                'case_number': 'FC-2024-001234',
                'status': 'foreclosure',
                'source': 'hawaii_judiciary',
                'estimated_value': 675000,
                'amount_owed': 485000,
                'attorney_info': 'Hawaii Legal Group',
                'source_url': 'https://www.courts.state.hi.us/',
                'scraped_at': datetime.now().isoformat()
            },
            {
                'address': '789 Judicial Way, Kailua, HI 96734',
                'defendant': 'Sarah Wilson',
                'case_number': 'FC-2024-001235',
                'status': 'foreclosure',
                'source': 'hawaii_judiciary',
                'estimated_value': 890000,
                'amount_owed': 620000,
                'attorney_info': 'Pacific Law Firm',
                'source_url': 'https://www.courts.state.hi.us/',
                'scraped_at': datetime.now().isoformat()
            }
        ]

        return properties

    except Exception as e:
        return []

if __name__ == "__main__":
    try:
        properties = parse_judiciary_documents()

        # Ensure we always output valid JSON
        if properties:
            print(json.dumps(properties, default=str))
        else:
            print("[]")

    except Exception as e:
        # Always output valid JSON, even on error
        print("[]")
    finally:
        sys.stdout.flush()