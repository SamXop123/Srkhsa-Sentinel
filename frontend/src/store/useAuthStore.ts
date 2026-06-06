import { create } from "zustand";
import type { User, RoleName } from "../../../shared/types/database";

interface AuthState {
  user: (Partial<User> & { role?: RoleName }) | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: Partial<User> & { role?: RoleName }, token: string) => void;
  logout: () => void;
  hasRole: (roles: RoleName[]) => boolean;
}

const getInitialUser = (): (Partial<User> & { role?: RoleName }) | null => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  accessToken: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  login: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, accessToken: token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hasRole: (roles) => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.role) return false;
    return roles.includes(currentUser.role);
  },
}));
