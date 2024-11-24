#!/usr/bin/env ts-node
import { emailDomainService } from '../src/services/email-domain-service.js';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('Email Domain Management CLI');

program
  .command('import <file>')
  .description('Import email domains from a CSV file')
  .action(async (file: string) => {
    try {
      await emailDomainService.importFromCSV(file);
      console.log('Import completed successfully');
    } catch (error) {
      console.error('Import failed:', error);
      process.exit(1);
    }
  });

program
  .command('get-domain <domain>')
  .description('Get domain mapping information')
  .action(async (domain: string) => {
    const mapping = await emailDomainService.getDomainMapping(domain);
    console.log(mapping || 'Domain not found');
  });

program
  .command('get-client-domains <clientId>')
  .description('Get all domains for a client')
  .action(async (clientId: string) => {
    const domains = await emailDomainService.getClientDomains(clientId);
    console.log(domains);
  });

program
  .command('add-domain <domain> <clientId>')
  .description('Add a new domain mapping')
  .option('-p, --primary', 'Set as primary domain')
  .option('-n, --notes <notes>', 'Add notes to the domain mapping')
  .action(async (domain: string, clientId: string, options: { primary?: boolean, notes?: string }) => {
    const success = await emailDomainService.addDomainMapping(
      domain,
      clientId,
      options.primary || false,
      options.notes || ''
    );
    if (success) {
      console.log('Domain mapping added successfully');
    } else {
      console.error('Failed to add domain mapping');
      process.exit(1);
    }
  });

program
  .command('update-domain <id>')
  .description('Update a domain mapping')
  .option('-p, --primary <boolean>', 'Set primary status')
  .option('-n, --notes <notes>', 'Update notes')
  .action(async (id: string, options: { primary?: string, notes?: string }) => {
    const updates: any = {};
    if (options.primary !== undefined) {
      updates.is_primary = options.primary === 'true';
    }
    if (options.notes !== undefined) {
      updates.notes = options.notes;
    }
    
    const success = await emailDomainService.updateDomainMapping(id, updates);
    if (success) {
      console.log('Domain mapping updated successfully');
    } else {
      console.error('Failed to update domain mapping');
      process.exit(1);
    }
  });

program
  .command('delete-domain <id>')
  .description('Delete a domain mapping')
  .action(async (id: string) => {
    const success = await emailDomainService.deleteDomainMapping(id);
    if (success) {
      console.log('Domain mapping deleted successfully');
    } else {
      console.error('Failed to delete domain mapping');
      process.exit(1);
    }
  });

program.parse(process.argv);
