'use client';

import { useState } from 'react';
import { useEmail } from '@/contexts/EmailContext';
import { Email } from '@/types/email';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { EmailService } from '@/services/emailService';

const columns = [
  { id: 'new', title: 'New', color: 'bg-blue-50' },
  { id: 'processing', title: 'Processing', color: 'bg-yellow-50' },
  { id: 'processed', title: 'Processed', color: 'bg-green-50' },
  { id: 'error', title: 'Error', color: 'bg-red-50' },
];

interface EmailsByStatus {
  [key: string]: Email[];
}

export function EmailKanbanView({ emails }: { emails: Email[] }) {
  const { dispatch } = useEmail();
  const [emailsByStatus, setEmailsByStatus] = useState<EmailsByStatus>(() => {
    const grouped = emails.reduce((acc, email) => {
      const status = email.status || 'new';
      if (!acc[status]) acc[status] = [];
      acc[status].push(email);
      return acc;
    }, {} as EmailsByStatus);

    // Ensure all columns exist
    columns.forEach(({ id }) => {
      if (!grouped[id]) grouped[id] = [];
    });

    return grouped;
  });

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = emailsByStatus[source.droppableId];
    const destColumn = emailsByStatus[destination.droppableId];
    const email = sourceColumn[source.index];

    // Remove from source column
    sourceColumn.splice(source.index, 1);

    // Add to destination column
    destColumn.splice(destination.index, 0, email);

    // Update state
    setEmailsByStatus({
      ...emailsByStatus,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    });

    // Update email status in database
    try {
      await EmailService.updateEmailStatus(email.email_id, destination.droppableId as Email['status']);
    } catch (error) {
      console.error('Failed to update email status:', error);
      // Revert the UI change on error
      setEmailsByStatus({
        ...emailsByStatus,
        [source.droppableId]: [...sourceColumn, email],
        [destination.droppableId]: destColumn.filter(e => e.email_id !== email.email_id),
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="h-full p-4 flex gap-4 overflow-x-auto">
        {columns.map(({ id, title, color }) => (
          <div key={id} className="flex-1 min-w-[300px]">
            <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
            <Droppable droppableId={id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-2 rounded-lg min-h-[200px] ${color} ${
                    snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  {emailsByStatus[id]?.map((email, index) => (
                    <Draggable
                      key={email.email_id}
                      draggableId={email.email_id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 mb-2 rounded-md bg-white shadow-sm ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {email.subject}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {email.from_name || email.from_email}
                          </div>
                          {email.client_name && (
                            <div
                              className="mt-2 px-2 py-1 text-xs rounded inline-block"
                              style={{ backgroundColor: email.label_color || '#E2E8F0' }}
                            >
                              {email.client_name}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
