"use client";

import { createContext, useState, useContext, ReactNode } from 'react';

// This is now the single, correct definition for a User, including userId.
export interface User {
  userId: number;
  name: string;
  role: 'Admin' | 'Manager' | 'Employee';
}

interface UserContextType {
  user: User;
  // The loginAs function is used by the main page to initialize the provider
  loginAs: (user: User) => void; 
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children, initialUser }: { children: ReactNode; initialUser: User; }) => {
  const [user, setUser] = useState<User>(initialUser);

  return (
    <UserContext.Provider value={{ user, loginAs: setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

