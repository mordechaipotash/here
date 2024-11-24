'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Email } from '@/types/email';

type EmailView = 'inbox' | 'kanban' | 'timeline' | 'analytics';

interface EmailState {
  view: EmailView;
  selectedEmails: Set<string>;
  processingQueue: string[];
  emailGroups: Map<string, Email[]>;
  activeFilters: {
    status?: string[];
    clients?: string[];
    dateRange?: [Date | null, Date | null];
    priority?: 'high' | 'medium' | 'low';
  };
}

type EmailAction =
  | { type: 'SET_VIEW'; view: EmailView }
  | { type: 'SELECT_EMAIL'; id: string }
  | { type: 'DESELECT_EMAIL'; id: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'ADD_TO_QUEUE'; id: string }
  | { type: 'REMOVE_FROM_QUEUE'; id: string }
  | { type: 'GROUP_EMAILS'; groupKey: string; emails: Email[] }
  | { type: 'SET_FILTERS'; filters: Partial<EmailState['activeFilters']> };

const initialState: EmailState = {
  view: 'inbox',
  selectedEmails: new Set(),
  processingQueue: [],
  emailGroups: new Map(),
  activeFilters: {},
};

function emailReducer(state: EmailState, action: EmailAction): EmailState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SELECT_EMAIL':
      return {
        ...state,
        selectedEmails: new Set([...state.selectedEmails, action.id]),
      };
    case 'DESELECT_EMAIL':
      const newSelection = new Set(state.selectedEmails);
      newSelection.delete(action.id);
      return { ...state, selectedEmails: newSelection };
    case 'CLEAR_SELECTION':
      return { ...state, selectedEmails: new Set() };
    case 'ADD_TO_QUEUE':
      return {
        ...state,
        processingQueue: [...state.processingQueue, action.id],
      };
    case 'REMOVE_FROM_QUEUE':
      return {
        ...state,
        processingQueue: state.processingQueue.filter(id => id !== action.id),
      };
    case 'GROUP_EMAILS':
      return {
        ...state,
        emailGroups: new Map(state.emailGroups).set(action.groupKey, action.emails),
      };
    case 'SET_FILTERS':
      return {
        ...state,
        activeFilters: { ...state.activeFilters, ...action.filters },
      };
    default:
      return state;
  }
}

const EmailContext = createContext<{
  state: EmailState;
  dispatch: React.Dispatch<EmailAction>;
} | null>(null);

export function EmailProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(emailReducer, initialState);

  return (
    <EmailContext.Provider value={{ state, dispatch }}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}
