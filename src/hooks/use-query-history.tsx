'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface QueryHistoryItem {
  id: string;
  naturalQuery: string;
  sqlQuery: string;
  timestamp: Date;
  status: 'Éxito' | 'Fallido';
}

interface QueryHistoryContextType {
  queryHistory: QueryHistoryItem[];
  addQueryToHistory: (query: Omit<QueryHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

const QueryHistoryContext = createContext<QueryHistoryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'queryHistory';
const MAX_HISTORY_ITEMS = 10;

export const QueryHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const items = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return items ? JSON.parse(items).map((item: any) => ({...item, timestamp: new Date(item.timestamp)})) : [];
    } catch (error) {
      console.error("Error reading query history from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queryHistory));
    } catch (error) {
      console.error("Error saving query history to localStorage", error);
    }
  }, [queryHistory]);

  const addQueryToHistory = (query: Omit<QueryHistoryItem, 'id' | 'timestamp'>) => {
    const newQuery: QueryHistoryItem = {
      ...query,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setQueryHistory(prev => [newQuery, ...prev].slice(0, MAX_HISTORY_ITEMS));
  };
  
  const clearHistory = () => {
    setQueryHistory([]);
  };

  return (
    <QueryHistoryContext.Provider value={{ queryHistory, addQueryToHistory, clearHistory }}>
      {children}
    </QueryHistoryContext.Provider>
  );
};

export const useQueryHistory = () => {
  const context = useContext(QueryHistoryContext);
  if (context === undefined) {
    throw new Error('useQueryHistory must be used within a QueryHistoryProvider');
  }
  return context;
};
