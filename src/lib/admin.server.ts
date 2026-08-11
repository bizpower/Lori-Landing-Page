import { getCookie } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertAdmin(): Promise<string> {
  const userId = getCookie("lori_admin_uid");
  if (!userId) throw new Error("Non autorizzato");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Accesso negato");
  return userId;
}
