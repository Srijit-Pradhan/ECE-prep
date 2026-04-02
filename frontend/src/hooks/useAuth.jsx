import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import { getCurrentUser, logoutUser } from "../services/authService";
import {
  clearAuthData,
  getToken,
  getUser,
  saveAuthData,
  saveUserOnly,
} from "../utils/tokenStorage";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const syncUser = async () => {
      const token = getToken();
      if (!token) {
        return;
      }

      try {
        const data = await getCurrentUser();
        if (data?.user) {
          setUser(data.user);
          saveUserOnly(data.user);
        }
      } catch {
        // If token is invalid or expired, clear old auth data.
        clearAuthData();
        setUser(null);
      }
    };

    syncUser();
  }, []);

  const login = (token, userData) => {
    saveAuthData(token, userData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if API fails, clear local session so user is logged out.
    }

    clearAuthData();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

