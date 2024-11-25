import OpenAI from 'openai';

export class GeminiService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('Missing OPENROUTER_API_KEY environment variable');
    }

    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'WOTC Tax Credit App',
      }
    });
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code block syntax if present
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    return response.trim();
  }

  private capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
  }

  private formatAddress(address: string, city: string, state: string, zip: string): string {
    const formattedAddress = this.capitalizeWords(address);
    const formattedCity = this.capitalizeWords(city);
    return `${formattedAddress}, ${formattedCity}, ${state.toUpperCase()} ${zip}`;
  }

  private formatDate(date: string): string {
    // Try to parse and format the date consistently
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    }
    return date;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return phoneNumber;
  }

  private determineFormType(content: string, metadata: any): { type: string; confidence: number } {
    let score8850 = 0;
    let score9061 = 0;
    let scoreNYYF = 0;

    // 8850 Form indicators - must have official IRS elements
    const has8850Title = content.includes('Pre-Screening Notice') && content.includes('Work Opportunity Credit');
    const hasIRSRef = content.includes('Department of the Treasury') || content.includes('Internal Revenue Service');
    const hasPerjuryStatement = content.includes('Under penalties of perjury');
    
    if (has8850Title) score8850 += 4;
    if (hasIRSRef) score8850 += 3;
    if (hasPerjuryStatement) score8850 += 3;

    // Only count as 8850 if it has the required elements
    if (!has8850Title || !hasIRSRef) {
      score8850 = 0;
    }

    // 9061 Form indicators - focus on question format
    const hasNumberedQuestions = (content.match(/\d+\.\s+[A-Z]/g) || []).length >= 5;
    const hasCharacteristicsTitle = content.includes('Individual Characteristics Form') || content.includes('ETA Form 9061');
    const hasYesNoFormat = content.includes('Yes') && content.includes('No') && hasNumberedQuestions;
    
    if (hasCharacteristicsTitle) score9061 += 4;
    if (hasYesNoFormat) score9061 += 3;
    if (content.includes('Please Fill In to the Best of Your Ability')) score9061 += 2;

    // NYYF indicators - focus on NY-specific content
    const hasNYYFTitle = content.includes('New York Youth Jobs Program') || content.includes('NY Youth Works Program');
    const hasYouthCert = content.includes('Youth Certification');
    const hasDOLBranding = content.includes('WE ARE YOUR DOL');
    const hasNYRef = content.toLowerCase().includes('new york') || content.includes('NY DOL');
    
    if (hasNYYFTitle) scoreNYYF += 4;
    if (hasYouthCert) scoreNYYF += 3;
    if (hasDOLBranding) scoreNYYF += 2;
    if (hasNYRef) scoreNYYF += 1;

    // Location-based scoring
    if (metadata?.state === 'NY' || metadata?.stateCode === 'NY') {
      scoreNYYF += 1;
    }

    // Get highest score
    const scores = [
      { type: '8850', score: score8850 },
      { type: '9061', score: score9061 },
      { type: 'NYYF', score: scoreNYYF }
    ];
    
    const highestScore = scores.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    );

    // Calculate confidence (normalize to 0-1 range)
    const maxPossible = {
      '8850': 10,
      '9061': 9,
      'NYYF': 11
    };

    const confidence = Math.min(
      Math.max(highestScore.score / maxPossible[highestScore.type], 0.5),
      0.95
    );

    // Debug logging
    console.log('Form type detection:', {
      content: {
        has8850Title,
        hasIRSRef,
        hasPerjuryStatement,
        hasNumberedQuestions,
        hasCharacteristicsTitle,
        hasYesNoFormat,
        hasNYYFTitle,
        hasYouthCert,
        hasDOLBranding,
        hasNYRef
      },
      scores: {
        '8850': score8850,
        '9061': score9061,
        'NYYF': scoreNYYF
      },
      selected: {
        type: highestScore.type,
        confidence,
        score: highestScore.score,
        maxPossible: maxPossible[highestScore.type]
      }
    });

    return {
      type: highestScore.type,
      confidence
    };
  }

  private validateNYYF(metadata: any): {
    missingFields: string[];
    suggestions: string[];
  } {
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    const requiredFields = {
      firstName: 'First Name',
      lastName: 'Last Name',
      dateOfBirth: 'Date of Birth',
      ssn: 'Social Security Number',
      address: 'Home Address',
      city: 'City',
      state: 'State',
      zip: 'ZIP Code',
      phoneNumber: 'Phone Number',
      email: 'Email Address'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!metadata[field]) {
        missingFields.push(label);
        suggestions.push(`Please provide your ${label.toLowerCase()}`);
      }
    }

    // NY State verification
    if (metadata.state && metadata.state !== 'NY') {
      missingFields.push('State Eligibility');
      suggestions.push('Applicant must be a New York State resident for the New York Youth Jobs Program');
    }

    // Educational status verification
    if (!metadata.educationalStatus) {
      missingFields.push('Educational Status');
      suggestions.push('Please indicate your current educational status');
    }

    return { missingFields, suggestions };
  }

  async analyzeForm(formText: string = '', imageUrl?: string): Promise<{
    formType: string;
    confidence: number;
    metadata: Record<string, any>;
  }> {
    if (!formText && !imageUrl) {
      throw new Error('Either form text or image URL must be provided');
    }

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text',
            text: `You are a form analysis API that only responds with valid JSON. Analyze this form and determine its type based on specific criteria.

IMPORTANT: Your response must be a valid JSON object with this exact structure:
{
  "formType": "8850" | "9061" | "NYYF",
  "confidence": number between 0 and 1,
  "metadata": {
    // extracted information
  }
}

Form Type Identification Criteria:

1. Form 8850 (Work Opportunity Tax Credit Pre-Screening Notice):
   REQUIRED elements (must have ALL of these):
   - Title MUST include "Pre-Screening Notice and Certification Request for the Work Opportunity Credit"
   - Form number "8850" MUST be prominently displayed
   - MUST have "Job applicant information" section
   - MUST have "Under penalties of perjury" statement
   - MUST reference "Department of the Treasury" or "Internal Revenue Service"
   
   Optional elements (may have some of these):
   - Contains signature line and date field
   - May include OMB No. 1545-1500
   - Has employer section at bottom
   - Contains checkbox statements about TANF, SNAP, SSI, etc.

2. Form 9061 (Individual Characteristics Form):
   REQUIRED elements (must have ALL of these):
   - Contains numbered questions (typically 8-9)
   - Questions are about eligibility criteria
   - Each question has Yes/No checkboxes
   - Asks about SNAP benefits, TANF, unemployment, felony conviction
   
   Optional elements (may have some of these):
   - May say "WOTC Questionnaire" or similar at top
   - May include "Please Fill In to the Best of Your Ability!"
   - May ask about starting wage
   - May be titled "Individual Characteristics Form"
   - May reference "ETA Form 9061"

3. NYYF (New York Youth Form):
   REQUIRED elements (must have ALL of these):
   - Contains "New York Youth Jobs Program" or "Youth Certification"
   - References New York State
   - Has youth-specific questions or criteria
   
   Optional elements (may have some of these):
   - May have "WE ARE YOUR DOL" branding
   - Contains educational status questions
   - Has age verification section
   - Asks about special circumstances (homeless, foster care)

IMPORTANT RULES:
1. For Form 8850: ALL required elements must be present to classify as 8850
2. For Form 9061: If it has numbered questions about eligibility with Yes/No boxes, it's likely a 9061
3. When in doubt between 8850 and 9061:
   - If it mentions "Department of Treasury" or "IRS", it's an 8850
   - If it's a questionnaire with numbered questions, it's a 9061
   - 8850 is more formal/official looking, 9061 is more questionnaire-style

Analyze the following form content and determine which type it matches best:

${formText ? `Form text:\n${formText}` : ''}`
          }
        ]
      }
    ];

    if (imageUrl) {
      messages[0].content.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
    }

    try {
      console.log('Making OpenRouter API call for form analysis:', JSON.stringify(messages, null, 2));
      
      const completion = await this.openai.chat.completions.create({
        model: 'google/gemini-flash-1.5',
        messages,
      });

      console.log('OpenRouter API response for form analysis:', JSON.stringify(completion, null, 2));

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenRouter API');
      }

      console.log('Attempting to parse form analysis response:', response);

      try {
        const cleanedResponse = this.cleanJsonResponse(response);
        console.log('Cleaned response:', cleanedResponse);
        
        const metadata = JSON.parse(cleanedResponse);
        // Validate the response structure
        if (!metadata) {
          throw new Error('Invalid response structure');
        }
        
        // Extract form type and metadata
        const formTypeResult = this.determineFormType(response, metadata);
        
        return {
          formType: formTypeResult.type,
          confidence: formTypeResult.confidence,
          metadata: this.normalizeMetadata(metadata)
        };

      } catch (parseError) {
        console.error('Error parsing form analysis response:', parseError);
        console.error('Response that failed to parse:', response);
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      console.error('Error analyzing form:', error);
      throw new Error('Failed to analyze form: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async extractApplicantInfo(formText: string = '', imageUrl?: string): Promise<{
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    ssn?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
    phoneNumber?: string;
    metadata: Record<string, any>;
  }> {
    if (!formText && !imageUrl) {
      throw new Error('Either form text or image URL must be provided');
    }

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text',
            text: `You are a form analysis API that only responds with valid JSON. Extract applicant information from this form.

IMPORTANT: Your response must be a valid JSON object with this exact structure:
{
  "firstName": string | null,
  "lastName": string | null,
  "dateOfBirth": string | null,
  "ssn": "[REDACTED]" | null,
  "address": string | null,
  "city": string | null,
  "state": string | null,
  "zip": string | null,
  "county": string | null,
  "phoneNumber": string | null,
  "metadata": {
    // any additional information not covered above
  }
}

Look for:
- First Name and Last Name (separated)
- Date of Birth (in MM/DD/YYYY format if available)
- Social Security Number (if present, always return "[REDACTED]")
- Full street address
- City, State, ZIP
- County
- Phone Number (in consistent format)

${formText ? `Form text:\n${formText}` : ''}`
          }
        ]
      }
    ];

    if (imageUrl) {
      messages[0].content.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
    }

    try {
      console.log('Making OpenRouter API call for applicant info:', JSON.stringify(messages, null, 2));
      
      const completion = await this.openai.chat.completions.create({
        model: 'google/gemini-flash-1.5',
        messages,
      });

      console.log('OpenRouter API response for applicant info:', JSON.stringify(completion, null, 2));

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenRouter API');
      }

      console.log('Attempting to parse applicant info response:', response);

      try {
        const cleanedResponse = this.cleanJsonResponse(response);
        console.log('Cleaned response:', cleanedResponse);
        
        const parsed = JSON.parse(cleanedResponse);
        
        // Capitalize names
        if (parsed.firstName) {
          parsed.firstName = this.capitalizeWords(parsed.firstName);
        }
        if (parsed.lastName) {
          parsed.lastName = this.capitalizeWords(parsed.lastName);
        }
        
        // Format the address if all components are present
        if (parsed.address && parsed.city && parsed.state && parsed.zip) {
          parsed.address = this.formatAddress(parsed.address, parsed.city, parsed.state, parsed.zip);
          parsed.city = this.capitalizeWords(parsed.city);
          parsed.state = parsed.state.toUpperCase();
        }
        
        // Capitalize county
        if (parsed.county) {
          parsed.county = this.capitalizeWords(parsed.county);
        }
        
        // Format phone number consistently if present
        if (parsed.phoneNumber) {
          const digits = parsed.phoneNumber.replace(/\D/g, '');
          if (digits.length === 10) {
            parsed.phoneNumber = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
          }
        }

        // Format date of birth if present
        if (parsed.dateOfBirth && parsed.dateOfBirth !== null) {
          // Try to parse and format the date consistently
          const date = new Date(parsed.dateOfBirth);
          if (!isNaN(date.getTime())) {
            parsed.dateOfBirth = date.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            });
          }
        }

        return parsed;
      } catch (parseError) {
        console.error('Error parsing applicant info response:', parseError);
        console.error('Response that failed to parse:', response);
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      console.error('Error extracting applicant info with OpenRouter:', error);
      throw new Error('Failed to extract applicant info: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private normalizeMetadata(metadata: any): any {
    const normalized = { ...metadata };

    // Handle name fields from different form types
    if (metadata.applicantName) {
      normalized.firstName = this.capitalizeWords(metadata.applicantName.firstName);
      normalized.lastName = this.capitalizeWords(metadata.applicantName.lastName);
      delete normalized.applicantName;
    }

    // Normalize location fields
    if (normalized.city) {
      // Special case for USA
      normalized.city = normalized.city.toUpperCase() === 'USA' ? 'USA' : this.capitalizeWords(normalized.city);
    }
    if (normalized.stateCode) {
      normalized.state = normalized.stateCode.toUpperCase();
      delete normalized.stateCode;
    }
    if (normalized.state) {
      normalized.state = normalized.state.toUpperCase();
    }

    // Format phone numbers
    if (normalized.mainPhone) {
      normalized.phoneNumber = this.formatPhoneNumber(normalized.mainPhone);
      delete normalized.mainPhone;
    }

    // Format address
    if (normalized.homeAddress) {
      normalized.address = normalized.homeAddress;
      delete normalized.homeAddress;
    }

    // Normalize dates
    const dateFields = ['dateOfBirth', 'birthDate'];
    for (const field of dateFields) {
      if (normalized[field]) {
        const formattedDate = this.formatDate(normalized[field]);
        normalized.dateOfBirth = formattedDate;
        if (field !== 'dateOfBirth') {
          delete normalized[field];
        }
      }
    }

    return normalized;
  }

  async validateForm(formType: string, metadata: any): Promise<{
    isComplete: boolean;
    missingFields: string[];
    suggestions: string[];
  }> {
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    // Common validation for all forms
    const commonFields = {
      firstName: 'First Name',
      lastName: 'Last Name',
      dateOfBirth: 'Date of Birth',
      ssn: 'Social Security Number'
    };

    for (const [field, label] of Object.entries(commonFields)) {
      if (!metadata[field]) {
        missingFields.push(label);
        suggestions.push(`Please provide your ${label.toLowerCase()}`);
      }
    }

    // Form-specific validation
    switch (formType) {
      case 'NYYF':
        // Age verification for NYYF
        if (metadata.dateOfBirth) {
          const birthDate = new Date(metadata.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 16 || age > 24) {
            missingFields.push('Age Eligibility');
            suggestions.push('Applicant must be between 16 and 24 years old for the New York Youth Jobs Program');
          }
        }
        // NY State verification
        if (metadata.state && metadata.state !== 'NY') {
          missingFields.push('State Eligibility');
          suggestions.push('Applicant must be a New York State resident for the New York Youth Jobs Program');
        }
        break;

      case '8850':
        // 8850-specific validation
        if (!metadata.signature) {
          missingFields.push('Signature');
          suggestions.push('Please sign the form under penalties of perjury statement');
        }
        if (!metadata.date) {
          missingFields.push('Signature Date');
          suggestions.push('Please provide the date you signed the form');
        }
        break;

      case '9061':
        // 9061-specific validation
        if (!metadata.startingWage) {
          missingFields.push('Starting Wage');
          suggestions.push('Please provide the starting wage per hour');
        }
        break;
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      suggestions
    };
  }

  async validateForm(formText: string = '', imageUrl?: string): Promise<{
    isComplete: boolean;
    missingFields: string[];
    suggestions: string[];
  }> {
    if (!formText && !imageUrl) {
      throw new Error('Either form text or image URL must be provided');
    }

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text',
            text: `You are a form analysis API that only responds with valid JSON. Check if this form is complete.

IMPORTANT: Your response must be a valid JSON object with this exact structure:
{
  "isComplete": boolean,
  "missingFields": string[],
  "suggestions": string[]
}

Look for:
- Required fields that are empty or incomplete
- Fields that are filled incorrectly
- Missing signatures or dates
- Specific requirements for Form 8850:
  * Date of birth is required for applicants under 40
  * Signature and date are required
  * All address fields must be complete
  * Social Security Number must be present
  * Phone number is required

Provide specific, actionable suggestions for completing the form.

${formText ? `Form text:\n${formText}` : ''}`
          }
        ]
      }
    ];

    if (imageUrl) {
      messages[0].content.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
    }

    try {
      console.log('Making OpenRouter API call for form validation:', JSON.stringify(messages, null, 2));
      
      const completion = await this.openai.chat.completions.create({
        model: 'google/gemini-flash-1.5',
        messages,
      });

      console.log('OpenRouter API response for form validation:', JSON.stringify(completion, null, 2));

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenRouter API');
      }

      console.log('Attempting to parse form validation response:', response);

      try {
        const cleanedResponse = this.cleanJsonResponse(response);
        console.log('Cleaned response:', cleanedResponse);
        
        const parsed = JSON.parse(cleanedResponse);
        // Validate the response structure
        if (typeof parsed.isComplete !== 'boolean' || !Array.isArray(parsed.missingFields) || !Array.isArray(parsed.suggestions)) {
          throw new Error('Invalid response structure');
        }
        return parsed;
      } catch (parseError) {
        console.error('Error parsing form validation response:', parseError);
        console.error('Response that failed to parse:', response);
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      console.error('Error validating form with OpenRouter:', error);
      throw new Error('Failed to validate form: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
