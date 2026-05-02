"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User { id: string; name: string; email: string; role: string; }
interface AuthCtx { user: User | null; loading: boolean; logout: () => void; refresh: () => void; }

const Ctx = createContext<AuthCtx>({ user: null, loading: true, logout: () => {}, refresh: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    try {
      const r = await fetch("/api/auth/me");
      if (r.ok) { const d = await r.json(); setUser(d.user); }
      else setUser(null);
    } catch { setUser(null); }
    finally { setLoading(false); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  useEffect(() => { refresh(); }, []);
  return <Ctx.Provider value={{ user, loading, logout, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
