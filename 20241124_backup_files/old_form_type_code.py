import os
import logging
from logging.handlers import RotatingFileHandler
import psycopg2
from psycopg2 import sql
from supabase import create_client, Client
import json
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import io
import requests
import time
from pydantic import BaseModel
from typing import List, Dict, Optional
from requests.exceptions import RequestException
from urllib3.exceptions import MaxRetryError
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

# Load environment variables
load_dotenv()

# Set up logging
log_file = 'form_extraction.log'
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add file handler
file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
JPG_BUCKET_NAME = "jpgs"
DB_URL = os.getenv('DB_URL')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Define the schema using Pydantic
class Metadata(BaseModel):
    sha256_hash: str
    upload_date: str

class IdentificationRules(BaseModel):
    keywords: List[str]
    sections: List[str]
    fields: List[str]

class FormExtraction(BaseModel):
    form_type: str
    document_name: str
    first_name: str
    last_name: str
    ssn: str
    dob: str
    signed: str
    date_signed: str
    metadata: Metadata
    identification_rules: IdentificationRules

def get_session_with_retries():
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    return session

def download_image(jpg_url, max_retries=3):
    session = get_session_with_retries()
    for attempt in range(max_retries):
        try:
            response = session.get(jpg_url)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1} failed: Error downloading image {jpg_url}: {str(e)}")
            if attempt == max_retries - 1:
                logger.error(f"Failed to download image after {max_retries} attempts: {jpg_url}")
                return None
            time.sleep(2 ** attempt)  # Exponential backoff
    return None

def check_and_create_columns():
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()

        # Check if the pytesseract_extracted column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='pdf_jpgs' AND column_name='pytesseract_extracted';
        """)
        result = cursor.fetchone()

        if not result:
            cursor.execute("""
                ALTER TABLE pdf_jpgs 
                ADD COLUMN pytesseract_extracted JSONB;
            """)
            logger.info("Added 'pytesseract_extracted' column to pdf_jpgs table.")

        # Check if the gpt4o_structured_data column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='pdf_jpgs' AND column_name='gpt4o_structured_data';
        """)
        result = cursor.fetchone()

        if not result:
            cursor.execute("""
                ALTER TABLE pdf_jpgs 
                ADD COLUMN gpt4o_structured_data JSONB;
            """)
            logger.info("Added 'gpt4o_structured_data' column to pdf_jpgs table.")

        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error checking/creating columns: {str(e)}")

def get_unprocessed_jpg_records():
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()

        query = sql.SQL("""
            SELECT id, jpg_url
            FROM pdf_jpgs
            WHERE pytesseract_extracted IS NULL OR gpt4o_structured_data IS NULL
        """)

        cursor.execute(query)
        jpg_records = cursor.fetchall()
        
        cursor.close()
        conn.close()

        logger.info(f"Retrieved {len(jpg_records)} JPG records to process.")
        for record in jpg_records[:10]:  # Print first 10 records
            logger.info(f"JPG ID: {record[0]}, JPG URL: {record[1]}")
        return jpg_records
    except Exception as e:
        logger.error(f"Error retrieving JPG records: {str(e)}")
        return []

def extract_text_from_image(image_content):
    try:
        image = Image.open(io.BytesIO(image_content))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        logger.error(f"Error extracting text from image: {str(e)}")
        return ""

def process_with_gpt4o(extracted_text):
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "openai/gpt-4o-mini-2024-07-18",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert in extracting structured data from documents. "
                        "Identify the form type based on specific rules and extract the required information accordingly. "
                        "Respond only with the form type, without any additional characters."
                    )
                },
                {
                    "role": "user",
                    "content": f"Here is the unstructured data from the document: {extracted_text}"
                }
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "form_extraction",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "form_type": {
                                "type": "string",
                                "description": (
                                    "Type of the form identified by specific rules. "
                                    "Examples: '8850 Form', '8 Question Form', 'NYYF_1', 'NYYF_2', 'POU_1', 'POU_2', 'Identity Document', 'Blank Form', 'Other/Undefined'. "
                                    "Identify using keywords, sections, and fields as follows: "
                                    "- 8850 Form: Identify using the following criteria: "
                                    "1. Contains the title 'Pre-Screening Notice and Certification Request for the Work Opportunity Credit' "
                                    "2. Has the form number '8850' prominently displayed "
                                    "3. Includes sections such as 'Job Applicant Information' with fields for name, social security number, address, and date of birth "
                                    "4. Contains a series of checkboxes or statements related to eligibility conditions, including: "
                                    "   a. Receiving assistance from Temporary Assistance for Needy Families (TANF) "
                                    "   b. Veteran status and receipt of Supplemental Nutrition Assistance Program (SNAP) benefits "
                                    "   c. Referral by a rehabilitation agency, employment network, or Department of Veterans Affairs "
                                    "   d. Age-related criteria (18 but not 40 or older) and SNAP benefits receipt "
                                    "   e. Felony conviction or release from prison "
                                    "   f. Receipt of supplemental security income (SSI) benefits "
                                    "   g. Veteran unemployment status "
                                    "   h. Service-connected disability compensation "
                                    "   i. TANF payment history "
                                    "   j. Extended period of unemployment and receipt of unemployment compensation "
                                    "5. Includes a signature line for the job applicant "
                                    "6. Often contains references to the Internal Revenue Service (IRS) or Department of the Treasury "
                                    "7. May include instructions or references to separate instructions "
                                    "8. Typically has a date field for the applicant to fill in "
                                    "9. May mention 'OMB No. 1545-1500' or similar Office of Management and Budget number "
                                    "The presence of multiple criteria strongly indicates an 8850 Form, but not all criteria need to be present."
                                    "- 8 Question Form: Identify using the following criteria: "
                                    "1. Contains approximately 8 numbered questions or sections. "
                                    "2. Typically starts with personal information fields like name, SSN, and date of birth. "
                                    "3. Often includes the phrase 'Please Fill In to the Best of Your Ability!' at the top. "
                                    "4. Questions generally cover topics such as: "
                                    "   a. Previous employment with the current employer "
                                    "   b. Receipt of SNAP (Food Stamps) benefits "
                                    "   c. Receipt of TANF or Welfare assistance "
                                    "   d. Receipt of Supplemental Security Income (SSI) benefits "
                                    "   e. Unemployment status and benefits "
                                    "   f. Referral by employment networks or rehabilitation agencies "
                                    "   g. Felony convictions "
                                    "   h. Veteran status "
                                    "5. Most questions have 'Yes' and 'No' checkboxes or options. "
                                    "6. Often includes a signature line and date at the bottom. "
                                    "7. May be in English or Spanish. "
                                    "8. May include a statement about sharing information with government agencies. "
                                    "The presence of multiple criteria strongly indicates an 8 Question Form, but not all criteria need to be present. "
                                    "- NYYF_1: Keywords include 'New York Youth Jobs Program', 'Youth Certification', 'WE ARE YOUR DOL'; sections such as 'Youth Certification', 'Applicant Information'; "
                                    "fields like last name, first name, birth date, social security number, home address, city, state, zip, and educational status."
                                    "- NYYF_2: Keywords include 'Youth Certification Qualifications', 'New York Youth Jobs Program'; sections such as 'Qualifications', 'Agreement'; "
                                    "fields like age, unemployment status, educational background, benefits received (e.g., TANF, SNAP), and personal circumstances (e.g., homeless, foster care, veteran)."
                                    "- POU_1: Keywords include 'Participant Statement of Understanding', 'subsidized employment', 'paid on-the-job training'; sections such as 'Participant Information', "
                                    "'Statement of Understanding'; fields like participant's name, social security number, address, city, state, zip, and details regarding employment and program participation."
                                    "- POU_2: Keywords include 'CA and SNAP benefits', 'supplemental grant', 'Fair Hearing aid-to-continue', 'Business Link'; sections such as 'Income Reporting', "
                                    "'Employment Conditions', 'Termination and Reduction of Benefits'; fields like income reporting requirements, conditions for supplemental grants, "
                                    "notification requirements for program termination, and guidelines for maintaining CA and SNAP benefits."
                                    "- Identity Document: Identify using the following criteria: "
                                    "1. Contains personal identification information such as name, date of birth, or Social Security Number. "
                                    "2. May include official headers or footers from government agencies or institutions (e.g., 'NEW YORK STATE', 'SOCIAL SECURITY'). "
                                    "3. Often includes document-specific identifiers like 'DRIVER LICENSE', 'IDENTIFICATION CARD', or 'SOCIAL SECURITY CARD'. "
                                    "4. May contain security features or statements like 'NOT FOR FEDERAL IDENTIFICATION'. "
                                    "5. Often includes a unique identification number, such as a driver's license number or Social Security Number. "
                                    "6. May have fields for physical characteristics like height, eye color, or sex. "
                                    "7. Often includes an issue date, expiration date, or both. "
                                    "8. May contain a photograph or space for a photograph. "
                                    "9. May include a barcode or machine-readable zone with alphanumeric strings. "
                                    "10. Could contain statements about the document's validity or restrictions (e.g., 'VALID FOR WORK WITH DHS AUTHORIZATION'). "
                                    "11. May include the phrase 'COPIED FROM ORIGINAL' indicating it's a copy of an official document. "
                                    "12. Could contain instructions or information about the document's use or the issuing agency. "
                                    "- Blank Form: Identify if the extracted text is empty or contains only minimal information that doesn't correspond to any specific form type. "
                                    "This could indicate a blank or mostly blank document."
                                    "- Other/Undefined: Use this classification if the document contains significant text or information, but doesn't match any of the specific form types listed above. "
                                    "This serves as a catch-all category for documents that don't fit into the other defined categories."
                                    "Presence of multiple criteria strongly indicates a specific form type, but not all criteria need to be present. "
                                    "If the document doesn't clearly fit any specific category, classify it as 'Other/Undefined'."
                                )
                            }
                        },
                        "required": ["form_type"],
                        "additionalProperties": False
                    }
                }
            },
            "strict": True
        }

        response = requests.post(OPENROUTER_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        form_type = result['choices'][0]['message']['content'].strip()

        # Remove any remaining JSON formatting
        form_type = form_type.replace('"', '').replace('{', '').replace('}', '')
        if 'form_type:' in form_type:
            form_type = form_type.split('form_type:')[-1].strip()

        return form_type
    except Exception as e:
        logger.error(f"Error processing with GPT-4: {str(e)}")
        return None

def update_jpg_record(jpg_id, pytesseract_extracted, gpt4o_structured_data):
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()

        update_query = """
        UPDATE pdf_jpgs
        SET pytesseract_extracted = %s, gpt4o_structured_data = %s
        WHERE id = %s;
        """
        cursor.execute(update_query, (json.dumps(pytesseract_extracted), json.dumps(gpt4o_structured_data), jpg_id))
        conn.commit()
        logger.info(f"JPG record updated successfully: {jpg_id}")

        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error updating JPG record: {str(e)}")

def process_jpgs():
    jpg_records = get_unprocessed_jpg_records()
    total_records = len(jpg_records)
    processed_records = 0

    for jpg_id, jpg_url in jpg_records:
        logger.info(f"Processing JPG: {jpg_url}")
        image_content = download_image(jpg_url)
        if image_content:
            pytesseract_extracted = extract_text_from_image(image_content)
            gpt4o_structured_data = process_with_gpt4o(pytesseract_extracted)
            update_jpg_record(jpg_id, pytesseract_extracted, gpt4o_structured_data)
            processed_records += 1
            logger.info(f"Processed {processed_records}/{total_records} JPGs")
        else:
            logger.warning(f"Skipping JPG due to download failure: {jpg_url}")

    logger.info("JPG processing completed")
    logger.info(f"Total JPGs processed: {processed_records}/{total_records}")

def test_supabase_connection():
    try:
        response = supabase.storage.from_(JPG_BUCKET_NAME).list()
        logger.info(f"Successfully connected to Supabase. Files in bucket: {len(response)}")
        for item in response[:10]:  # Print first 10 items
            logger.info(f"File: {item['name']}, Size: {item['metadata']['size']}, Last Modified: {item['metadata']['lastModified']}")
    except Exception as e:
        logger.error(f"Error connecting to Supabase: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting form extraction process...")
    test_supabase_connection()
    check_and_create_columns()
    try:
        process_jpgs()
    except KeyboardInterrupt:
        logger.info("Script interrupted by user. Exiting gracefully.")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {str(e)}")
    finally:
        logger.info("Script execution completed.")