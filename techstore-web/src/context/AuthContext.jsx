import { useCallback, useMemo, useState } from "react";
import { demoAccounts } from "../data/demoAccounts";
import { AuthContext } from "./authContext";

const LOCAL_SESSION_KEY = "techstore-auth-session";
const SESSION_SESSION_KEY = "techstore-auth-tab-session";

function publicAccount(account) {
  return {
    email: account.email,
    id: account.id,
    name: account.name,
    role: account.role,
  };
}

function readStoredSession() {
  const serializedSession =
    localStorage.getItem(LOCAL_SESSION_KEY) ||
    sessionStorage.getItem(SESSION_SESSION_KEY);

  if (!serializedSession) {
    return null;
  }

  try {
    const storedUser = JSON.parse(serializedSession);
    const matchingAccount = demoAccounts.find(
      (account) =>
        account.id === storedUser?.id &&
        account.email === storedUser?.email &&
        account.role === storedUser?.role,
    );

    return matchingAccount ? publicAccount(matchingAccount) : null;
  } catch {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    sessionStorage.removeItem(SESSION_SESSION_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredSession);

  const login = useCallback((identifier, password, rememberSession = true) => {
    const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
    const matchingAccount = demoAccounts.find(
      (account) =>
        [account.email, account.username].includes(normalizedIdentifier) &&
        account.password === password,
    );

    if (!matchingAccount) {
      return {
        error: "El correo, usuario o contraseña no coincide con una cuenta demo.",
        ok: false,
      };
    }

    const nextUser = publicAccount(matchingAccount);
    const serializedSession = JSON.stringify(nextUser);

    localStorage.removeItem(LOCAL_SESSION_KEY);
    sessionStorage.removeItem(SESSION_SESSION_KEY);

    if (rememberSession) {
      localStorage.setItem(LOCAL_SESSION_KEY, serializedSession);
    } else {
      sessionStorage.setItem(SESSION_SESSION_KEY, serializedSession);
    }

    setUser(nextUser);

    return { ok: true, user: nextUser };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    sessionStorage.removeItem(SESSION_SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAdmin: user?.role === "admin",
      isAuthenticated: Boolean(user),
      login,
      logout,
      user,
    }),
    [login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
