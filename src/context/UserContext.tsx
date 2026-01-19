import React, { createContext, useContext, useState } from 'react';
import { User } from '@/types';
import { users } from '@/data/mockData';

interface UserContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, allUsers: users }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
