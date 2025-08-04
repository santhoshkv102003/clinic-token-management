import React, { createContext, useContext, useState, useEffect } from "react";

type Token = {
  tokenNumber: number;
  name?: string;
  phone?: string;
  age?: number;
  department?: string;
  bookedAt: string;
};

type QueueContextType = {
  currentNumber: number;
  tokens: Token[];
  nextNumber: () => Promise<void>;
  resetQueue: () => Promise<void>;
  bookToken: (token: Omit<Token, "tokenNumber">) => Promise<void>;
  loading: boolean;
  error: string | null;
};

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial queue data
  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/queue`);
      if (!response.ok) throw new Error('Failed to fetch queue');
      const data = await response.json();
      setCurrentNumber(data.currentNumber);
      setTokens(data.tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  const nextNumber = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/next-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to advance queue');
      const data = await response.json();
      setCurrentNumber(data.currentNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance queue');
    } finally {
      setLoading(false);
    }
  };

  const resetQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/reset-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to reset queue');
      setCurrentNumber(1);
      setTokens([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset queue');
    } finally {
      setLoading(false);
    }
  };

  const bookToken = async (token: Omit<Token, "tokenNumber">) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/book-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(token),
      });
      if (!response.ok) throw new Error('Failed to book token');
      const newToken = await response.json();
      setTokens(prev => [...prev, newToken]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <QueueContext.Provider value={{ 
      currentNumber, 
      tokens, 
      nextNumber, 
      resetQueue, 
      bookToken,
      loading,
      error
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) throw new Error("useQueue must be used within a QueueProvider");
  return context;
}; 