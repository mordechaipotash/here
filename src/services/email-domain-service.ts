import { SupabaseClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseServer } from '../lib/supabase';

// Load environment variables
// dotenv.config({ path: '.env.local' });

interface EmailDomain {
  id: string;
  domain: string;
  client_ref_id: string;
  is_primary: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface EmailDomainMapping {
  from_email: string;
  domain: string;
  client_name: string;
  client_id: string;
  company_name: string;
}

export class EmailDomainService {
  private supabase: SupabaseClient;
  private clientIdMap: Map<string, string>;

  constructor() {
    this.supabase = getSupabaseServer();
    this.clientIdMap = new Map();
  }

  private extractDomain(email: string): string | null {
    if (!email) return null;
    try {
      const domain = email.trim().split('@')[1]?.toLowerCase();
      return domain || null;
    } catch (error) {
      console.error(`Error extracting domain from ${email}:`, error);
      return null;
    }
  }

  async getOrCreateClientId(numericId: string): Promise<string> {
    if (this.clientIdMap.has(numericId)) {
      return this.clientIdMap.get(numericId)!;
    }

    const { data: existingClients } = await this.supabase
      .from('clients')
      .select('id')
      .eq('numeric_id', numericId)
      .limit(1);

    if (existingClients && existingClients.length > 0) {
      const uuid = existingClients[0].id;
      this.clientIdMap.set(numericId, uuid);
      return uuid;
    }

    const uuid = uuidv4();
    this.clientIdMap.set(numericId, uuid);
    return uuid;
  }

  async findClientByName(clientName: string): Promise<string | null> {
    if (!clientName) return null;
    
    const normalizedName = clientName.toLowerCase().trim();
    
    const { data, error } = await this.supabase
      .from('clients')
      .select('id')
      .ilike('client_name', `%${normalizedName}%`)
      .limit(1);
      
    if (error) {
      console.error('Error finding client:', error);
      return null;
    }
    
    return data?.[0]?.id || null;
  }

  async addDomainMapping(domain: string, clientId: string, isPrimary: boolean = false, notes: string = ''): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('email_domains')
        .insert([{
          domain,
          client_ref_id: clientId,
          is_primary: isPrimary,
          notes
        }]);
        
      if (error) {
        if (error.code === '23505') {
          console.log(`Domain ${domain} already exists, skipping`);
        } else {
          console.error(`Error adding domain ${domain}:`, error);
        }
        return false;
      }
      
      console.log(`Added domain ${domain} for client ${clientId}`);
      return true;
    } catch (error) {
      console.error(`Error adding domain ${domain}:`, error);
      return false;
    }
  }

  async getDomainMapping(domain: string): Promise<EmailDomain | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_domains')
        .select('*')
        .eq('domain', domain.toLowerCase())
        .single();
        
      if (error) {
        console.error(`Error getting domain ${domain}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`Error getting domain ${domain}:`, error);
      return null;
    }
  }

  async getClientDomains(clientId: string): Promise<EmailDomain[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_domains')
        .select('*')
        .eq('client_ref_id', clientId);
        
      if (error) {
        console.error(`Error getting domains for client ${clientId}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error getting domains for client ${clientId}:`, error);
      return [];
    }
  }

  async updateDomainMapping(id: string, updates: Partial<EmailDomain>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('email_domains')
        .update(updates)
        .eq('id', id);
        
      if (error) {
        console.error(`Error updating domain mapping ${id}:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating domain mapping ${id}:`, error);
      return false;
    }
  }

  async deleteDomainMapping(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('email_domains')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting domain mapping ${id}:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting domain mapping ${id}:`, error);
      return false;
    }
  }

  async importFromCSV(filePath: string): Promise<void> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const records: EmailDomainMapping[] = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    // Group records by client_id to collect all company names
    const clientData = new Map<string, { 
      clientName: string, 
      companyNames: Set<string>
    }>();

    for (const record of records) {
      if (!record.domain || !record.client_id) continue;

      if (!clientData.has(record.client_id)) {
        clientData.set(record.client_id, {
          clientName: record.client_name,
          companyNames: new Set()
        });
      }
      if (record.company_name) {
        clientData.get(record.client_id)!.companyNames.add(record.company_name);
      }

      const uuid = await this.getOrCreateClientId(record.client_id);
      await this.addDomainMapping(
        record.domain.toLowerCase(),
        uuid,
        false,
        Array.from(clientData.get(record.client_id)!.companyNames).join(', ')
      );
    }
  }
}

// Export a singleton instance
export const emailDomainService = new EmailDomainService();
