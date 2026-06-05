import { create } from "zustand";
import { User, RoleName } from "../../../shared/types/database";

interface AuthState {
  user: Partial<User> | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: Partial<User>, token: string) => void;
  logout: () => void;
  hasRole: (roles: RoleName[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  
  login: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, accessToken: token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  
  hasRole: (roles) => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.role_id) return false;
    
    // In full implementation, we'll map role_id to role name.
    // For now we assume user.role_id holds the role name string for testing convenience
    const currentRole = currentUser.role_id as unknown as RoleName;
    return roles.includes(currentRole);
  }
}));
