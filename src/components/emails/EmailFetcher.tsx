'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '../ui/button';

export function EmailFetcher() {
  const [isFetching, setIsFetching] = useState(false);
  const supabase = createClientComponentClient();

  const fetchLatestEmail = async () => {
    try {
      setIsFetching(true);
      
      // Call the fetch_latest_email RPC function
      const { data, error } = await supabase
        .rpc('fetch_latest_email');

      if (error) throw error;

      if (data) {
        alert(`Successfully fetched and processed email: ${data.subject}`);
      } else {
        alert('No new emails to fetch');
      }
    } catch (error: any) {
      console.error('Error fetching latest email:', error);
      alert('Failed to fetch latest email: ' + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Button 
      onClick={fetchLatestEmail}
      disabled={isFetching}
      className="w-full"
    >
      {isFetching ? 'Fetching Email...' : 'Fetch Latest Email'}
    </Button>
  );
}
