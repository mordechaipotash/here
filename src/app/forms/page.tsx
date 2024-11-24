'use client';

import { FormTypeList } from '../../components/forms/FormTypeList';
import { FormTypeExtractor } from '@/components/FormTypeExtractor';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function FormsPage() {
  const [stats, setStats] = useState({
    totalAttachments: 0,
    unprocessedAttachments: 0,
    processedAttachments: 0,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // Get total attachments
      const { count: total, error: totalError } = await supabase
        .from('attachments')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get processed attachments count
      const { count: processed, error: processedError } = await supabase
        .from('form_classifications')
        .select('*', { count: 'exact', head: true });

      if (processedError) throw processedError;

      setStats({
        totalAttachments: total || 0,
        processedAttachments: processed || 0,
        unprocessedAttachments: (total || 0) - (processed || 0),
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      alert('Failed to fetch attachment statistics: ' + error.message);
    }
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900">Form Processing</h2>
          <p className="mt-1 text-sm text-gray-600">
            {stats.unprocessedAttachments} attachments to process
          </p>

          <div className="mt-6 space-y-4">
            {/* Form Type Extractor */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Actions</h3>
              <FormTypeExtractor />
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">All Attachments</span>
                  <span className="text-sm font-medium">{stats.totalAttachments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processed</span>
                  <span className="text-sm font-medium">{stats.processedAttachments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unprocessed</span>
                  <span className="text-sm font-medium">{stats.unprocessedAttachments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4">
          <FormTypeList />
        </div>
      </div>
    </div>
  );
}
