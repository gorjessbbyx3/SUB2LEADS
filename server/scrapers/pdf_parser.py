
import PyPDF2
import re
import json
from datetime import datetime
import requests
from io import BytesIO

class HawaiiJudiciaryPDFParser:
    def __init__(self):
        self.judiciary_url = "https://www.courts.state.hi.us/legal_references/foreclosure_listings"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def download_and_parse_foreclosure_pdfs(self):
        """Download and parse foreclosure PDFs from Hawaii Judiciary"""
        all_cases = []
        
        try:
            # Get the page with PDF links
            response = self.session.get(self.judiciary_url)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find PDF links
            pdf_links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                if '.pdf' in href.lower() and ('foreclosure' in href.lower() or 'mortgage' in href.lower()):
                    if not href.startswith('http'):
                        href = f"https://www.courts.state.hi.us{href}"
                    pdf_links.append(href)
            
            print(f"Found {len(pdf_links)} PDF links")
            
            # Parse each PDF
            for pdf_url in pdf_links[:3]:  # Limit to first 3 for testing
                try:
                    cases = self.parse_pdf_from_url(pdf_url)
                    all_cases.extend(cases)
                except Exception as e:
                    print(f"Error parsing PDF {pdf_url}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error downloading PDFs: {e}")
            
        return all_cases

    def parse_pdf_from_url(self, pdf_url):
        """Download and parse a PDF from URL"""
        try:
            response = self.session.get(pdf_url)
            response.raise_for_status()
            
            pdf_file = BytesIO(response.content)
            return self.extract_cases_from_pdf(pdf_file)
            
        except Exception as e:
            print(f"Error downloading PDF from {pdf_url}: {e}")
            return []

    def parse_pdf_from_file(self, pdf_path):
        """Parse a local PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                return self.extract_cases_from_pdf(file)
        except Exception as e:
            print(f"Error parsing PDF file {pdf_path}: {e}")
            return []

    def extract_cases_from_pdf(self, pdf_file):
        """Extract foreclosure cases from PDF content"""
        cases = []
        
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            full_text = ""
            
            # Extract text from all pages
            for page in pdf_reader.pages:
                full_text += page.extract_text() + "\n"
            
            # Parse cases from the text
            cases = self._parse_foreclosure_cases(full_text)
            
        except Exception as e:
            print(f"Error extracting from PDF: {e}")
            
        return cases

    def _parse_foreclosure_cases(self, text):
        """Parse individual foreclosure cases from PDF text"""
        cases = []
        
        try:
            # Split text into potential case blocks
            # Common patterns: case numbers, vs., plaintiff/defendant
            case_blocks = re.split(r'(?=Case No\.|\d{4}-\d+-\d+|Civil No\.)', text, flags=re.IGNORECASE)
            
            for block in case_blocks:
                if len(block.strip()) < 50:  # Skip very short blocks
                    continue
                    
                case_info = self._extract_case_information(block)
                if case_info:
                    cases.append(case_info)
                    
        except Exception as e:
            print(f"Error parsing foreclosure cases: {e}")
            
        return cases

    def _extract_case_information(self, case_text):
        """Extract information from a single case block"""
        try:
            case_info = {
                'status': 'foreclosure',
                'source': 'hawaii_judiciary',
                'source_url': self.judiciary_url,
                'scraped_at': datetime.now().isoformat(),
                'raw_text': case_text[:500]  # First 500 chars for reference
            }
            
            # Extract case number
            case_num_patterns = [
                r'Case No\.?\s*([A-Z]*\d{4}-\d+-\d+)',
                r'Civil No\.?\s*([A-Z]*\d{4}-\d+-\d+)',
                r'(\d{4}-\d+-\d+)'
            ]
            
            for pattern in case_num_patterns:
                match = re.search(pattern, case_text, re.IGNORECASE)
                if match:
                    case_info['case_number'] = match.group(1).strip()
                    break
            
            # Extract plaintiff (usually the lender)
            plaintiff_patterns = [
                r'([A-Z][a-z\s]+(?:Bank|Mortgage|Financial|Credit Union|Association))[,\s]+.*?vs\.?',
                r'^([^,\n]+),?\s+Plaintiff',
            ]
            
            for pattern in plaintiff_patterns:
                match = re.search(pattern, case_text, re.IGNORECASE | re.MULTILINE)
                if match:
                    case_info['plaintiff'] = match.group(1).strip()
                    break
            
            # Extract defendant (property owner)
            defendant_patterns = [
                r'vs\.?\s+([A-Z][a-z\s]+(?:[A-Z][a-z]*)*)',
                r'Defendant[s]?:?\s+([A-Z][a-z\s]+)',
            ]
            
            for pattern in defendant_patterns:
                match = re.search(pattern, case_text, re.IGNORECASE)
                if match:
                    case_info['defendant'] = match.group(1).strip()
                    case_info['owner_name'] = match.group(1).strip()
                    break
            
            # Extract property address
            address_patterns = [
                r'(?:property located at|situated at|known as)\s*([^\n\r,]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Circle|Cir|Boulevard|Blvd|Way|Place|Pl|Court|Ct)[^\n\r,]*)',
                r'(\d+[^\n\r,]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Circle|Cir|Boulevard|Blvd|Way|Place|Pl|Court|Ct)[^\n\r,]*)',
            ]
            
            for pattern in address_patterns:
                match = re.search(pattern, case_text, re.IGNORECASE)
                if match:
                    case_info['address'] = match.group(1).strip()
                    break
            
            # Extract sale/auction date
            date_patterns = [
                r'(?:sale date|auction date|date of sale):\s*([A-Za-z]+\s+\d+,?\s+\d{4})',
                r'(\w+\s+\d+,?\s+\d{4})\s+at\s+\d+:\d+',
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, case_text, re.IGNORECASE)
                if match:
                    case_info['auction_date'] = match.group(1).strip()
                    break
            
            # Extract attorney information
            attorney_patterns = [
                r'(?:attorney for plaintiff|counsel):\s*([^\n\r]+)',
                r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s+(?:Esq|Attorney|LLLC|LLC))',
            ]
            
            for pattern in attorney_patterns:
                match = re.search(pattern, case_text, re.IGNORECASE)
                if match:
                    case_info['attorney_info'] = match.group(1).strip()
                    break
            
            # Only return if we found at least case number or address
            if case_info.get('case_number') or case_info.get('address'):
                return case_info
                
        except Exception as e:
            print(f"Error extracting case information: {e}")
            
        return None

if __name__ == "__main__":
    parser = HawaiiJudiciaryPDFParser()
    
    print("Downloading and parsing Hawaii Judiciary foreclosure PDFs...")
    cases = parser.download_and_parse_foreclosure_pdfs()
    
    print(f"Found {len(cases)} foreclosure cases")
    
    for case in cases[:3]:
        print(json.dumps(case, indent=2))
        print("-" * 50)
