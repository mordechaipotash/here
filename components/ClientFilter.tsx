import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '../src/lib/supabase';
import { EmailClientLabel } from './EmailClientLabel';

interface Client {
  id: string;
  client_name: string;
  display_color: string;
}

interface ClientFilterProps {
  onFilterChange: (selectedClients: string[]) => void;
}

export const ClientFilter: React.FC<ClientFilterProps> = ({ onFilterChange }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createSupabaseClient();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, client_name, display_color')
      .order('client_name');

    if (error) {
      console.error('Error loading clients:', error);
    } else {
      setClients(data || []);
    }
  };

  const toggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
    onFilterChange(Array.from(newSelected));
  };

  const clearFilters = () => {
    setSelectedClients(new Set());
    setSearchTerm('');
    onFilterChange([]);
  };

  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-md w-full"
        />
        {selectedClients.size > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filteredClients.map(client => (
          <EmailClientLabel
            key={client.id}
            clientName={client.client_name}
            color={selectedClients.has(client.id) ? client.display_color : '#E2E8F0'}
            onClick={() => toggleClient(client.id)}
          />
        ))}
      </div>
      
      {selectedClients.size > 0 && (
        <div className="text-sm text-gray-500">
          {selectedClients.size} client{selectedClients.size !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};
