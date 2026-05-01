import React, { createContext, useContext, useState, ReactNode } from 'react';

type PremiumContextType = {
  isPremiumUser: boolean;
  setIsPremiumUser: (value: boolean) => void;
};

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  return (
    <PremiumContext.Provider value={{ isPremiumUser, setIsPremiumUser }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};