import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ClassificationResult {
  formTypeId: string;
  confidenceScore: number;
  extractedData?: any;
}

export const formClassificationService = {
  async getFormTypes() {
    const { data, error } = await supabase
      .from('form_types')
      .select('*');

    if (error) throw error;
    return data;
  },

  async classifyText(text: string, filename?: string, pageNumber?: number): Promise<ClassificationResult | null> {
    try {
      const formTypes = await this.getFormTypes();
      let bestMatch: ClassificationResult | null = null;
      let highestScore = 0;

      // Normalize text for comparison
      const normalizedText = text.toLowerCase();
      
      for (const formType of formTypes) {
        let score = 0;
        const rules = formType.identification_rules;
        
        if (!rules) continue;

        // 1. Keyword matching (40% weight)
        const keywords = rules.keywords || [];
        const keywordMatches = keywords.reduce((count, keyword) => {
          const regex = new RegExp(keyword.toLowerCase(), 'gi');
          const matches = normalizedText.match(regex);
          return count + (matches ? matches.length : 0);
        }, 0);
        score += keywordMatches > 0 ? (Math.min(keywordMatches / keywords.length, 1) * 0.4) : 0;

        // 2. Required fields check (30% weight)
        const requiredFields = rules.required_fields || [];
        const fieldMatches = requiredFields.filter(field => 
          normalizedText.includes(field.toLowerCase())
        ).length;
        score += requiredFields.length > 0 ? ((fieldMatches / requiredFields.length) * 0.3) : 0;

        // 3. Page position heuristics (15% weight)
        if (pageNumber !== undefined) {
          // Most forms start on page 1
          if (pageNumber === 1) {
            score += 0.15;
          }
        }

        // 4. Filename matching (15% weight)
        if (filename) {
          const normalizedFilename = filename.toLowerCase();
          const filenameKeywords = rules.filename_patterns || [];
          const filenameMatch = filenameKeywords.some(pattern => 
            normalizedFilename.includes(pattern.toLowerCase())
          );
          if (filenameMatch) {
            score += 0.15;
          }
        }

        // Add debugging information
        console.debug(`Form type ${formType.name} scoring:`, {
          keywordScore: keywordMatches > 0 ? (Math.min(keywordMatches / keywords.length, 1) * 0.4) : 0,
          fieldScore: requiredFields.length > 0 ? ((fieldMatches / requiredFields.length) * 0.3) : 0,
          pageScore: pageNumber === 1 ? 0.15 : 0,
          filenameScore: filename && rules.filename_patterns?.some(p => filename.toLowerCase().includes(p.toLowerCase())) ? 0.15 : 0,
          totalScore: score
        });

        if (score > highestScore && score >= 0.4) { // Increased confidence threshold
          highestScore = score;
          bestMatch = {
            formTypeId: formType.id,
            confidenceScore: score,
            extractedData: {
              matchedKeywords: keywords.filter(k => normalizedText.includes(k.toLowerCase())),
              matchedFields: requiredFields.filter(f => normalizedText.includes(f.toLowerCase())),
              pageNumber,
              filename
            }
          };
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Error classifying text:', error);
      return null;
    }
  },

  async saveClassification(
    attachmentId: string,
    classification: ClassificationResult
  ) {
    try {
      const { data, error } = await supabase
        .from('form_classifications')
        .insert({
          attachment_id: attachmentId,
          form_type_id: classification.formTypeId,
          confidence_score: classification.confidenceScore,
          extracted_data: classification.extractedData,
          manual_override: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving classification:', error);
      throw error;
    }
  },

  async getClassification(attachmentId: string) {
    try {
      const { data, error } = await supabase
        .from('form_classifications')
        .select(`
          *,
          form_type:form_types(*)
        `)
        .eq('attachment_id', attachmentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting classification:', error);
      return null;
    }
  }
};
