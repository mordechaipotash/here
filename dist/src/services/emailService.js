import { supabase } from '@/lib/supabase';
export class EmailService {
    static async getEmails(filter) {
        let query = supabase
            .from('email_view')
            .select('*', { count: 'exact' });
        if (filter?.status) {
            query = query.eq('status', filter.status);
        }
        if (filter?.clientId) {
            query = query.eq('client_id', filter.clientId);
        }
        if (filter?.search) {
            query = query.or(`subject.ilike.%${filter.search}%,from_email.ilike.%${filter.search}%`);
        }
        if (filter?.startDate) {
            query = query.gte('date', filter.startDate.toISOString());
        }
        if (filter?.endDate) {
            query = query.lte('date', filter.endDate.toISOString());
        }
        const { data, error, count } = await query.order('date', { ascending: false });
        if (error) {
            console.error('Error fetching emails:', error);
            throw error;
        }
        return { data: data || [], count: count || 0 };
    }
    static async getEmailById(emailId) {
        const { data, error } = await supabase
            .from('email_view')
            .select('*')
            .eq('email_id', emailId)
            .single();
        if (error) {
            console.error('Error fetching email:', error);
            throw error;
        }
        return data;
    }
    static async updateEmailStatus(emailId, status) {
        const { error } = await supabase
            .from('emails')
            .update({ status })
            .eq('email_id', emailId);
        if (error) {
            console.error('Error updating email status:', error);
            throw error;
        }
    }
}
