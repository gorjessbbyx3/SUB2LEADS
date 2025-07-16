
import requests
from bs4 import BeautifulSoup
import re
import json
import sys
from datetime import datetime
import time

class EHawaiiMFDRScraper:
    def __init__(self):
        self.base_url = "https://mfdr.ehawaii.gov"
        self.notices_url = f"{self.base_url}/notices/index.html"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def scrape_mfdr_notices(self):
        """Scrape MFDR foreclosure notices"""
        notices = []

        try:
            print("Fetching MFDR notices page...", file=sys.stderr)
            response = self.session.get(self.notices_url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for notice tables or containers
            notices.extend(self._parse_notice_table(soup))
            
            # Also check for individual notice links
            notices.extend(self._parse_individual_notices(soup))

        except Exception as e:
            print(f"Error scraping MFDR notices: {e}", file=sys.stderr)

        return notices

    def _parse_notice_table(self, soup):
        """Parse notices from table format"""
        notices = []

        try:
            # Find the main notices table
            tables = soup.find_all('table')
            
            for table in tables:
                rows = table.find_all('tr')
                
                # Skip header row and process data rows
                for row in rows[1:]:
                    cells = row.find_all('td')
                    
                    if len(cells) >= 4:  # Expect owner, address, posting_date, view_link
                        notice = self._parse_mfdr_table_row(cells, row)
                        if notice:
                            notices.append(notice)
                            
                            # Follow view link to get additional details
                            detailed_notice = self._fetch_detailed_notice(notice)
                            if detailed_notice:
                                notices.append(detailed_notice)
                            
                            # Rate limiting
                            time.sleep(1)

        except Exception as e:
            print(f"Error parsing notice table: {e}", file=sys.stderr)

        return notices

    def _parse_mfdr_table_row(self, cells, row):
        """Parse MFDR table row with specific column structure"""
        try:
            if len(cells) < 4:
                return None
                
            # MFDR table structure: Owner | Address | Posting Date | View Link
            owner_name = cells[0].get_text(strip=True)
            property_address = cells[1].get_text(strip=True)
            posting_date = cells[2].get_text(strip=True)
            
            # Extract view link
            view_link = ""
            view_cell = cells[3]
            link_element = view_cell.find('a')
            if link_element and link_element.get('href'):
                href = link_element.get('href')
                view_link = self._resolve_url(href)

            # Only create notice if we have essential data
            if owner_name and property_address:
                return {
                    'owner_name': owner_name,
                    'borrower_name': owner_name,  # Same as owner for MFDR
                    'address': property_address,
                    'posting_date': posting_date,
                    'notice_date': posting_date,
                    'view_link': view_link,
                    'status': 'mfdr_notice',
                    'source': 'ehawaii_mfdr',
                    'source_url': self.notices_url,
                    'scraped_at': datetime.now().isoformat(),
                    'raw_data': f"Owner: {owner_name} | Address: {property_address} | Posted: {posting_date}"
                }

        except Exception as e:
            print(f"Error parsing MFDR table row: {e}", file=sys.stderr)

        return None

    def _fetch_detailed_notice(self, notice):
        """Fetch detailed notice information from view link"""
        if not notice.get('view_link'):
            return None
            
        try:
            print(f"Fetching details from: {notice['view_link']}", file=sys.stderr)
            response = self.session.get(notice['view_link'], timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract detailed information from the notice page
            text_content = soup.get_text()
            
            # Parse additional details
            details = self._extract_detailed_notice_info(text_content)
            
            if details:
                # Merge with original notice data
                detailed_notice = notice.copy()
                detailed_notice.update(details)
                detailed_notice['source_url'] = notice['view_link']
                detailed_notice['has_details'] = True
                
                return detailed_notice

        except Exception as e:
            print(f"Error fetching detailed notice {notice.get('view_link')}: {e}", file=sys.stderr)

        return None

    def _extract_detailed_notice_info(self, text):
        """Extract detailed information from full notice text"""
        info = {}

        try:
            # TMK (Tax Map Key) - Hawaiian property identifier
            tmk_patterns = [
                r'TMK[:\s]*([0-9-]+)',
                r'Tax Map Key[:\s]*([0-9-]+)',
                r'\(TMK\)\s*([0-9-]+)'
            ]
            
            for pattern in tmk_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    info['tmk'] = match.group(1).strip()
                    break

            # Auction/Sale Date
            auction_patterns = [
                r'(?:auction|sale)\s+(?:date|on):\s*(\w+\s+\d+,?\s+\d{4})',
                r'(?:date|on)\s+(\w+\s+\d+,?\s+\d{4}).*(?:auction|sale)',
                r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}).*(?:auction|sale)',
                r'(?:auction|sale).*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
            ]

            for pattern in auction_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    info['auction_date'] = match.group(1).strip()
                    break

            # Attorney/Trustee information
            attorney_patterns = [
                r'(?:attorney|counsel|trustee|law firm):\s*([^\n\r.;]+)',
                r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s+(?:Esq|Attorney|LLLC|LLC|P\.A\.|ALC))',
                r'(?:Trustee|Attorney):\s*([^\n\r.;]+)'
            ]

            for pattern in attorney_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    info['attorney_info'] = match.group(1).strip()
                    break

            # Case/File Number
            case_patterns = [
                r'(?:Case|File|Doc|Docket)\s*[#No.]*\s*([A-Z0-9-]+)',
                r'FC[:\s-]*([0-9-]+)',
                r'MFDR[:\s-]*([0-9-]+)'
            ]

            for pattern in case_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    info['case_number'] = match.group(1).strip()
                    break

            # Loan/Debt Amount
            amount_patterns = [
                r'\$[\d,]+\.?\d*',
                r'(?:amount|debt|balance|owed).*?\$?([\d,]+\.?\d*)',
                r'\$?([\d,]+\.?\d*).*(?:owed|debt|balance)'
            ]

            for pattern in amount_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    # Take the largest amount found
                    amounts = []
                    for match in matches:
                        amount_str = str(match).replace('$', '').replace(',', '')
                        try:
                            amount = float(amount_str)
                            if amount > 1000:  # Filter out small numbers that aren't loan amounts
                                amounts.append(amount)
                        except:
                            continue
                    
                    if amounts:
                        info['amount_owed'] = max(amounts)
                        break

            return info

        except Exception as e:
            print(f"Error extracting detailed notice info: {e}", file=sys.stderr)
            return {}

    def _parse_individual_notices(self, soup):
        """Parse individual notice links and fetch details"""
        notices = []

        try:
            # Look for links to individual notices
            notice_links = soup.find_all('a', href=True)
            
            for link in notice_links:
                href = link.get('href')
                
                # Filter for notice-related links
                if any(keyword in href.lower() for keyword in ['notice', 'mfdr', 'foreclosure']):
                    full_url = self._resolve_url(href)
                    notice = self._fetch_individual_notice(full_url)
                    
                    if notice:
                        notices.append(notice)
                    
                    # Rate limiting
                    time.sleep(1)

        except Exception as e:
            print(f"Error parsing individual notices: {e}", file=sys.stderr)

        return notices

    def _resolve_url(self, href):
        """Resolve relative URLs to absolute URLs"""
        if href.startswith('http'):
            return href
        elif href.startswith('/'):
            return f"{self.base_url}{href}"
        else:
            return f"{self.base_url}/notices/{href}"

    def _fetch_individual_notice(self, url):
        """Fetch and parse an individual notice page"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract notice details
            text_content = soup.get_text()
            
            # Parse property information from the notice text
            property_info = self._extract_notice_details(text_content)
            
            if property_info:
                property_info.update({
                    'source': 'ehawaii_mfdr',
                    'source_url': url,
                    'scraped_at': datetime.now().isoformat()
                })
                
                return property_info

        except Exception as e:
            print(f"Error fetching individual notice {url}: {e}", file=sys.stderr)

        return None

    def _extract_notice_details(self, text):
        """Extract property details from notice text"""
        info = {}

        try:
            # Case number
            case_match = re.search(r'(Case|MFDR|FC|CV)\s*[#:]?\s*([A-Z0-9-]+)', text, re.IGNORECASE)
            if case_match:
                info['case_number'] = case_match.group(2)

            # Property address
            address_patterns = [
                r'(?:Property|Subject Property|Real Property|Located at):\s*([^\n]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Circle|Cir|Boulevard|Blvd|Way|Place|Pl|Court|Ct)[^\n]*)',
                r'(\d+[^\n]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Circle|Cir|Boulevard|Blvd|Way|Place|Pl|Court|Ct)[^\n]*Hawaii[^\n]*\d{5})'
            ]

            for pattern in address_patterns:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    info['address'] = match.group(1).strip()
                    break

            # Borrower/Defendant name
            borrower_patterns = [
                r'(?:Borrower|Defendant|Mortgagor):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
                r'vs\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            ]

            for pattern in borrower_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    info['borrower_name'] = match.group(1).strip()
                    break

            # Notice date
            date_patterns = [
                r'(?:Notice Date|Filed|Date of Notice):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                r'(\w+\s+\d+,?\s+\d{4})'
            ]

            for pattern in date_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    info['notice_date'] = match.group(1).strip()
                    break

            # Loan amount
            amount_match = re.search(r'\$[\d,]+\.?\d*', text)
            if amount_match:
                amount_str = amount_match.group().replace('$', '').replace(',', '')
                try:
                    info['amount_owed'] = float(amount_str)
                except:
                    pass

            # Set status
            info['status'] = 'mfdr_notice'

            return info if info else None

        except Exception as e:
            print(f"Error extracting notice details: {e}", file=sys.stderr)
            return None

if __name__ == "__main__":
    try:
        scraper = EHawaiiMFDRScraper()
        notices = scraper.scrape_mfdr_notices()

        print(f"Debug: Found {len(notices)} MFDR notices", file=sys.stderr)

        # Only add mock data if absolutely no notices found and we want to test the pipeline
        if not notices:
            print("Debug: No real notices found from MFDR site", file=sys.stderr)
            # Uncomment below for testing with mock data
            # notices = [
            #     {
            #         'case_number': 'MFDR-2024-001',
            #         'address': '456 MFDR Lane, Honolulu, HI 96815',
            #         'borrower_name': 'David Kim',
            #         'notice_date': '2024-01-15',
            #         'amount_owed': 425000,
            #         'status': 'mfdr_notice',
            #         'source': 'ehawaii_mfdr',
            #         'source_url': 'https://mfdr.ehawaii.gov/notices/index.html',
            #         'scraped_at': datetime.now().isoformat()
            #     }
            # ]

        # Ensure we always output valid JSON
        if notices:
            print(json.dumps(notices, default=str))
        else:
            print("[]")

    except Exception as e:
        print(f"Debug: Error in main execution: {e}", file=sys.stderr)
        # Always output valid JSON, even on error
        print("[]")
    finally:
        sys.stdout.flush()
