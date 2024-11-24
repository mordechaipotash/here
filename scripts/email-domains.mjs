#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { program } from 'commander';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

program
  .version('1.0.0')
  .description('Email Domain Management CLI');

program
  .command('get-domain <domain>')
  .description('Get domain mapping information')
  .action(async (domain) => {
    try {
      const { data, error } = await supabase
        .from('email_domains')
        .select('*, clients(*)')
        .eq('domain', domain)
        .single();

      if (error) throw error;
      console.log(data ? data : 'Domain not found');
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('get-client-domains <clientId>')
  .description('Get all domains for a client')
  .action(async (clientId) => {
    try {
      const { data, error } = await supabase
        .from('email_domains')
        .select('*')
        .eq('client_ref_id', clientId);

      if (error) throw error;
      console.log(data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('add-domain <domain> <clientId>')
  .description('Add a new domain mapping')
  .option('-p, --primary', 'Set as primary domain')
  .option('-n, --notes <notes>', 'Add notes to the domain mapping')
  .action(async (domain, clientId, options) => {
    try {
      const { data, error } = await supabase
        .from('email_domains')
        .insert([{
          domain,
          client_ref_id: clientId,
          is_primary: options.primary || false,
          notes: options.notes || null
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('Domain mapping added:', data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program.parse(process.argv);
