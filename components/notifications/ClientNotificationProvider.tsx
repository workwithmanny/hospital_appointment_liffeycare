"use client";

import { useEffect, useState } from "react";
import { NotificationProvider } from "./NotificationProvider";
import { getSupabaseClient } from "@/lib/supabase/client";

type User = {
  id: string;
  role: string;
};

export function ClientNotificationProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        setUser({
          id: session.user.id,
          role: profile?.role || "patient",
        });
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser({
              id: session.user.id,
              role: profile?.role || "patient",
            });
          });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || !user) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider userId={user.id} userRole={user.role}>
      {children}
    </NotificationProvider>
  );
}
