'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

interface Client {
  client_id: string;
  client_name: string;
  company_name: string;
  company_contact_name: string;
  account_status: string;
  wotc_poa_valid: string;
  filled_unfilled: string;
  email_domains?: { domain: string; status: string }[];
}

interface EmailStats {
  client_id: string;
  total_emails: number;
  pending_emails: number;
  processed_emails: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [emailStats, setEmailStats] = useState<Record<string, EmailStats>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load clients with their email domains
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          email_domains (
            domain,
            status
          )
        `)
        .order('client_name');

      if (clientsError) throw clientsError;

      // Load email statistics
      const { data: statsData, error: statsError } = await supabase
        .from('emails')
        .select('client_id, processing_status')
        .not('client_id', 'is', null);

      if (statsError) throw statsError;

      // Process email stats
      const stats: Record<string, EmailStats> = {};
      statsData.forEach(email => {
        if (!stats[email.client_id]) {
          stats[email.client_id] = {
            client_id: email.client_id,
            total_emails: 0,
            pending_emails: 0,
            processed_emails: 0
          };
        }
        stats[email.client_id].total_emails++;
        if (email.processing_status === 'pending') {
          stats[email.client_id].pending_emails++;
        } else {
          stats[email.client_id].processed_emails++;
        }
      });

      setClients(clientsData || []);
      setEmailStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map(client => (
          <div
            key={client.client_id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {client.client_name}
              </h2>
              <span className={`px-2 py-1 rounded text-sm ${
                client.account_status === 'Active' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {client.account_status}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">{client.company_name}</p>
              <p className="text-sm text-gray-500">{client.company_contact_name}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Email Domains</h3>
              <div className="space-y-1">
                {client.email_domains?.map(domain => (
                  <div
                    key={domain.domain}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600">{domain.domain}</span>
                    <span className={`px-2 py-1 rounded ${
                      domain.status === 'filled'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {domain.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {emailStats[client.client_id] && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Email Processing</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {emailStats[client.client_id].total_emails}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {emailStats[client.client_id].pending_emails}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {emailStats[client.client_id].processed_emails}
                    </div>
                    <div className="text-xs text-gray-500">Processed</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
