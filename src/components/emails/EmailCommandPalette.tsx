'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { useEmail } from '@/contexts/EmailContext';
import { EmailService } from '@/services/emailService';

const commands = [
  { id: 'view-inbox', name: 'Switch to Inbox View', view: 'inbox' as const },
  { id: 'view-kanban', name: 'Switch to Kanban View', view: 'kanban' as const },
  { id: 'view-timeline', name: 'Switch to Timeline View', view: 'timeline' as const },
  { id: 'view-analytics', name: 'Switch to Analytics View', view: 'analytics' as const },
  { id: 'process-selected', name: 'Process Selected Emails' },
  { id: 'mark-processed', name: 'Mark as Processed' },
  { id: 'group-by-client', name: 'Group by Client' },
  { id: 'group-by-date', name: 'Group by Date' },
  { id: 'clear-selection', name: 'Clear Selection' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailCommandPalette({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const { state, dispatch } = useEmail();
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const filteredCommands = query === ''
    ? commands
    : commands.filter((command) =>
        command.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.toLowerCase().replace(/\s+/g, ''))
      );

  const executeCommand = async (command: typeof commands[0]) => {
    switch (command.id) {
      case 'view-inbox':
      case 'view-kanban':
      case 'view-timeline':
      case 'view-analytics':
        dispatch({ type: 'SET_VIEW', view: command.view });
        break;
      case 'process-selected':
        // Add selected emails to processing queue
        state.selectedEmails.forEach(id => {
          dispatch({ type: 'ADD_TO_QUEUE', id });
        });
        break;
      case 'mark-processed':
        // Update status for selected emails
        state.selectedEmails.forEach(async (id) => {
          await EmailService.updateEmailStatus(id, 'processed');
        });
        break;
      case 'clear-selection':
        dispatch({ type: 'CLEAR_SELECTION' });
        break;
    }

    // Add to recent commands
    setRecentCommands(prev => [command.id, ...prev.slice(0, 4)]);
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Combobox
            as="div"
            className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all"
            onChange={(command: typeof commands[0]) => executeCommand(command)}
          >
            <div className="relative">
              <Combobox.Input
                className="h-12 w-full border-0 bg-transparent pl-4 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Type a command or search..."
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            {filteredCommands.length > 0 && (
              <Combobox.Options static className="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800">
                {filteredCommands.map((command) => (
                  <Combobox.Option
                    key={command.id}
                    value={command}
                    className={({ active }) =>
                      `cursor-default select-none px-4 py-2 ${
                        active ? 'bg-blue-600 text-white' : ''
                      }`
                    }
                  >
                    {command.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}

            {query !== '' && filteredCommands.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No commands found.</p>
            )}
          </Combobox>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
}
