import { createSupabaseServer } from "@/lib/supabase-server";
import { getInitials } from "@/lib/initials";
import { UserChipClient } from "@/components/user-chip-client";

export async function UserChip() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const supa = await createSupabaseServer();
    const {
      data: { user },
    } = await supa.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supa
      .from("profiles")
      .select("nombre, role")
      .eq("id", user.id)
      .single();

    const displayName =
      profile?.nombre?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Tú";

    return (
      <UserChipClient
        initials={getInitials(profile?.nombre, user.email)}
        displayName={displayName}
        email={user.email ?? ""}
        role={(profile?.role as "medico" | "admin" | null) ?? null}
      />
    );
  } catch {
    return null;
  }
}
