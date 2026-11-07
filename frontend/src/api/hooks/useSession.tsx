import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../supabase";
import type { Profile } from "../types";
import { keys } from "./keys";

export const PROFILE_COLUMNS =
  "id, org_id, full_name, role, branch_id, region_id, email, needs_password_change, deactivated_at, created_at";

interface SessionState {
  /** "loading" until Supabase has restored any saved session. */
  status: "loading" | "signed_out" | "signed_in";
  session: Session | null;
  profile: Profile | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign out here, or on every device you're signed in on. */
  signOut: (everywhere?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

/** Sign-in errors in words people understand. */
function friendly(message: string): string {
  if (message === "Invalid login credentials") return "That email and password don't match an account.";
  if (/banned/i.test(message)) return "Head office has removed your access to Pramaan. Ask them if you need it back.";
  return message;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const profile = useQuery({
    queryKey: keys.profile(userId ?? "none"),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", userId!).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Your account has no Pramaan profile, or your access was removed. Ask head office.");
      return data as Profile;
    },
  });

  const value: SessionState = {
    status: session === undefined || (session && profile.isPending) ? "loading" : session ? "signed_in" : "signed_out",
    session: session ?? null,
    profile: profile.data ?? null,
    profileError: profile.error?.message ?? null,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw new Error(friendly(error.message));
    },
    signOut: async (everywhere = false) => {
      await supabase.auth.signOut({ scope: everywhere ? "global" : "local" });
      queryClient.clear();
    },
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

/** The signed-in user's profile. Only use below a signed-in route guard. */
export function useProfile(): Profile {
  const { profile } = useSession();
  if (!profile) throw new Error("useProfile needs a signed-in user");
  return profile;
}
