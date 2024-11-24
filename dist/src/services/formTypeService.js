import { supabase } from '@/lib/supabaseClient';
export const formTypeService = {
    async getAllFormTypes() {
        const { data, error } = await supabase
            .from('form_types')
            .select('*')
            .order('name');
        if (error)
            throw error;
        return data;
    },
    async createFormType(name, description, identificationRules) {
        const { data, error } = await supabase
            .from('form_types')
            .insert([
            { name, description, identification_rules: identificationRules }
        ])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateFormType(id, updates) {
        const { data, error } = await supabase
            .from('form_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async deleteFormType(id) {
        const { error } = await supabase
            .from('form_types')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    },
    async getFormClassification(attachmentId) {
        const { data, error } = await supabase
            .from('form_classifications')
            .select(`
        *,
        form_types (*)
      `)
            .eq('attachment_id', attachmentId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error; // PGRST116 is "not found"
        return data;
    },
    async classifyForm(attachmentId, formTypeId, confidenceScore, ocrText, extractedData) {
        const { data, error } = await supabase
            .from('form_classifications')
            .upsert({
            attachment_id: attachmentId,
            form_type_id: formTypeId,
            confidence_score: confidenceScore,
            ocr_text: ocrText,
            extracted_data: extractedData,
            manual_override: true,
            last_modified_by: (await supabase.auth.getUser()).data.user?.id
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async isUserAdmin() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user)
            return false;
        const { data, error } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return !!data;
    }
};
