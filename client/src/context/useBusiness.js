import { createContext, useContext } from 'react';

export const BusinessContext = createContext(null);

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusinessContext must be used within a BusinessProvider');
  }
  return ctx;
}
