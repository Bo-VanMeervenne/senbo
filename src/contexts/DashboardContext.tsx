import React, { createContext, useContext, useState, useEffect } from 'react';

interface DashboardContextType {
  hideRevenue: boolean;
  setHideRevenue: (hide: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideRevenue, setHideRevenue] = useState(() => {
    const stored = localStorage.getItem('hide-revenue');
    return stored === 'true';
  });
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('dashboard-theme');
    return (stored as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('hide-revenue', String(hideRevenue));
  }, [hideRevenue]);

  useEffect(() => {
    localStorage.setItem('dashboard-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <DashboardContext.Provider value={{ hideRevenue, setHideRevenue, theme, setTheme }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
