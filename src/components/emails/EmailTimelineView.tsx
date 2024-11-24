'use client';

import { Email } from '@/types/email';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

interface GroupedEmails {
  [key: string]: {
    title: string;
    emails: Email[];
  };
}

export function EmailTimelineView({ emails }: { emails: Email[] }) {
  // Group emails by time periods
  const groupedEmails = emails.reduce((acc: GroupedEmails, email) => {
    const date = new Date(email.date);
    let key: string;
    let title: string;

    if (isToday(date)) {
      key = 'today';
      title = 'Today';
    } else if (isYesterday(date)) {
      key = 'yesterday';
      title = 'Yesterday';
    } else if (isThisWeek(date)) {
      key = 'this-week';
      title = 'This Week';
    } else if (isThisMonth(date)) {
      key = 'this-month';
      title = 'This Month';
    } else {
      key = 'older';
      title = 'Older';
    }

    if (!acc[key]) {
      acc[key] = { title, emails: [] };
    }
    acc[key].emails.push(email);
    return acc;
  }, {});

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-3xl mx-auto">
        {Object.entries(groupedEmails).map(([key, { title, emails }]) => (
          <div key={key} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Timeline items */}
              <div className="space-y-6">
                {emails.map((email) => (
                  <div key={email.email_id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-3 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white ${
                        email.status === 'processed'
                          ? 'bg-green-400'
                          : email.status === 'processing'
                          ? 'bg-blue-400'
                          : email.status === 'error'
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                      }`}
                    />

                    {/* Email card */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {email.subject}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {email.from_name || email.from_email}
                          </p>
                        </div>
                        <time className="text-xs text-gray-500">
                          {format(new Date(email.date), 'h:mm a')}
                        </time>
                      </div>

                      {/* Preview */}
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {email.snippet}
                      </p>

                      {/* Tags */}
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs capitalize
                            ${
                              email.status === 'processed'
                                ? 'bg-green-100 text-green-800'
                                : email.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : email.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {email.status}
                        </span>
                        {email.client_name && (
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: email.label_color || '#E2E8F0' }}
                          >
                            {email.client_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
