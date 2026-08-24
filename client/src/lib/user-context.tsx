import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "student";
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authAPI.getMe();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, code: string) => {
    const { user } = await authAPI.verifyCode(email, code);
    setUser(user);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
