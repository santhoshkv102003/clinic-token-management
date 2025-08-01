import React, { createContext, useContext, useState } from "react";

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
  nextNumber: () => void;
  resetQueue: () => void;
  bookToken: (token: Omit<Token, "tokenNumber">) => void;
};

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<Token[]>([]);

  const nextNumber = () => {
    // Only increment if there are patients in the queue
    const waitingTokens = tokens.filter(token => token.tokenNumber >= currentNumber);
    if (waitingTokens.length > 0) {
      setCurrentNumber((prev) => prev + 1);
    }
  };

  const resetQueue = () => {
    setCurrentNumber(1);
    setTokens([]);
  };

  const bookToken = (token: Omit<Token, "tokenNumber">) => {
    const newTokenNumber = tokens.length > 0 ? tokens[tokens.length - 1].tokenNumber + 1 : 1;
    setTokens([...tokens, { ...token, tokenNumber: newTokenNumber }]);
  };

  return (
    <QueueContext.Provider value={{ currentNumber, tokens, nextNumber, resetQueue, bookToken }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) throw new Error("useQueue must be used within a QueueProvider");
  return context;
}; 