import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const formClassificationService = {
    async getFormTypes() {
        const { data, error } = await supabase
            .from('form_types')
            .select('*');
        if (error)
            throw error;
        return data;
    },
    async classifyText(text) {
        try {
            // Get all form types
            const formTypes = await this.getFormTypes();
            // Initialize best match
            let bestMatch = null;
            let highestScore = 0;
            // Check each form type
            for (const formType of formTypes) {
                let score = 0;
                const keywords = formType.identification_rules?.keywords || [];
                // Calculate match score based on keywords
                for (const keyword of keywords) {
                    const regex = new RegExp(keyword, 'gi');
                    const matches = text.match(regex);
                    if (matches) {
                        score += matches.length;
                    }
                }
                // Check required fields if specified
                const requiredFields = formType.identification_rules?.required_fields || [];
                let requiredFieldsFound = 0;
                for (const field of requiredFields) {
                    // Simple check for field presence - can be made more sophisticated
                    if (text.toLowerCase().includes(field.toLowerCase())) {
                        requiredFieldsFound++;
                    }
                }
                // Calculate final score considering both keywords and required fields
                const keywordScore = keywords.length > 0 ? score / keywords.length : 0;
                const fieldScore = requiredFields.length > 0 ? requiredFieldsFound / requiredFields.length : 1;
                const finalScore = (keywordScore + fieldScore) / 2;
                // Update best match if this score is higher
                if (finalScore > highestScore && finalScore > 0.3) { // 0.3 is our confidence threshold
                    highestScore = finalScore;
                    bestMatch = {
                        formTypeId: formType.id,
                        confidenceScore: finalScore,
                        extractedData: {} // You can add data extraction logic here
                    };
                }
            }
            return bestMatch;
        }
        catch (error) {
            console.error('Error classifying text:', error);
            return null;
        }
    },
    async saveClassification(attachmentId, classification) {
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
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error saving classification:', error);
            throw error;
        }
    },
    async getClassification(attachmentId) {
        try {
            const { data, error } = await supabase
                .from('form_classifications')
                .select(`
          *,
          form_type:form_types(*)
        `)
                .eq('attachment_id', attachmentId)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error getting classification:', error);
            return null;
        }
    }
};
