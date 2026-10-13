import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * The current Supabase session, kept in sync with sign-in, sign-out and token refresh.
 *
 * @remarks
 * `undefined` while the client reads the stored session, `null` when there is none.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
