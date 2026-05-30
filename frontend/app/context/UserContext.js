"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("rescribe_token");
    const storedUser = localStorage.getItem("rescribe_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData, accessToken) => {
    localStorage.setItem("rescribe_token", accessToken);
    localStorage.setItem("rescribe_user", JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("rescribe_token");
    localStorage.removeItem("rescribe_user");
    setToken(null);
    setUser(null);
  };

  const authHeaders = (extra = {}) => ({
    Authorization: `Bearer ${token}`,
    ...extra,
  });

  return (
    <UserContext.Provider value={{ user, token, login, logout, authHeaders }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
