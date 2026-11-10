import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requiredSecret(name: string, jsonName: string) {
  const direct = Deno.env.get(name);
  if (direct) return direct;
  try {
    return JSON.parse(Deno.env.get(jsonName) ?? "{}").default as string | undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in as an administrator." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = requiredSecret("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
  const secretKey = requiredSecret("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");
  if (!supabaseUrl || !publishableKey || !secretKey) return json({ error: "Admin user management is not configured on this project." }, 503);

  const token = authorization.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Your session is invalid. Sign in again." }, 401);

  const { data: ownProfile, error: profileError } = await userClient
    .from("profiles")
    .select("is_admin")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError) return json({ error: "Admin access could not be checked." }, 500);
  if (ownProfile?.is_admin !== true) return json({ error: "Only TopTini administrators can manage users." }, 403);

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const payload = await request.json().catch(() => null);

  if (payload?.action === "update_profile") {
    const userId = String(payload.userId || "");
    const username = String(payload.username || "").trim();
    const preferredCity = String(payload.preferredCity || "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return json({ error: "Choose a valid user account." }, 400);
    if (username.length < 2 || username.length > 30) return json({ error: "Username must be 2–30 characters." }, 400);

    const { data: city, error: cityError } = await admin
      .from("cities")
      .select("name")
      .eq("name", preferredCity)
      .eq("is_active", true)
      .maybeSingle();
    if (cityError) return json({ error: "The city list could not be checked." }, 500);
    if (!city) return json({ error: "Choose an active TopTini city." }, 400);

    const { data: profile, error: updateError } = await admin
      .from("profiles")
      .update({ username, preferred_city: preferredCity })
      .eq("id", userId)
      .select("id,username,preferred_city,avatar_path,is_admin,created_at")
      .maybeSingle();
    if (updateError) return json({ error: "The user profile could not be updated." }, 500);
    if (!profile) return json({ error: "This account does not have a TopTini profile yet." }, 404);
    return json({ profile });
  }

  if (payload?.action !== "list") return json({ error: "Choose a supported user-management action." }, 400);
  const page = Math.max(1, Math.floor(Number(payload.page) || 1));
  const perPage = Math.min(100, Math.max(10, Math.floor(Number(payload.perPage) || 50)));
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page, perPage });
  if (usersError) return json({ error: "User accounts could not be loaded." }, 500);

  const authUsers = usersData.users || [];
  const userIds = authUsers.map(user => user.id);
  const { data: profiles, error: profilesError } = userIds.length
    ? await admin.from("profiles").select("id,username,preferred_city,avatar_path,is_admin,created_at").in("id", userIds)
    : { data: [], error: null };
  if (profilesError) return json({ error: "User profiles could not be loaded." }, 500);

  const profileById = new Map((profiles || []).map(profile => [profile.id, profile]));
  const users = authUsers.map(user => {
    const profile = profileById.get(user.id) || null;
    return {
      id: user.id,
      email: user.email || "",
      username: profile?.username || user.user_metadata?.username || user.email?.split("@")[0] || "TopTini member",
      preferredCity: profile?.preferred_city || user.user_metadata?.preferred_city || "",
      avatarPath: profile?.avatar_path || null,
      isAdmin: profile?.is_admin === true,
      hasProfile: Boolean(profile),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
    };
  });
  return json({
    users,
    page,
    perPage,
    total: typeof usersData.total === "number" ? usersData.total : null,
    hasMore: usersData.nextPage !== null && usersData.nextPage !== undefined,
  });
});
