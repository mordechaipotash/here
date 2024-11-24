import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Loader2, Mail } from 'lucide-react';

interface FetchEmailsButtonProps {
  onFetchComplete?: (results: any) => void;
}

export const FetchEmailsButton: React.FC<FetchEmailsButtonProps> = ({
  onFetchComplete
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fetchEmails = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/emails/fetch', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      setResults(data);
      onFetchComplete?.(data);

      // Show toast notification
      const message = `Processed ${data.processed} new emails (${data.errors} errors)`;
      // You can add a toast notification library here

    } catch (error) {
      console.error('Error fetching emails:', error);
      // Show error toast
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={fetchEmails}
        disabled={isFetching}
        className="flex items-center gap-2"
      >
        {isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isFetching ? 'Fetching...' : 'Fetch New Emails'}
      </Button>
      
      {results && !isFetching && (
        <span className="text-sm text-gray-500">
          Processed {results.processed} new emails 
          {results.errors > 0 && ` (${results.errors} errors)`}
        </span>
      )}
    </div>
  );
};
