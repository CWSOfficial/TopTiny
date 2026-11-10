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

async function collectUserObjects(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  folder: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(folder, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data.length) break;
    for (const entry of data) {
      const path = folder + "/" + entry.name;
      if (entry.id) paths.push(path);
      else paths.push(...(await collectUserObjects(admin, bucket, path)));
    }
    if (data.length < 1000) break;
    offset += data.length;
  }
  return paths;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Sign in again to delete your account." }, 401);
  }
  const token = authorization.slice("Bearer ".length);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default;
  const secretKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default;
  if (!supabaseUrl || !publishableKey || !secretKey) {
    return json({ error: "Account deletion is not configured on the backend yet." }, 503);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: "Bearer " + token } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);
  if (userError || !user) return json({ error: "Your session is invalid. Sign in again." }, 401);

  const payload = await request.json().catch(() => null);
  if (payload?.confirmation !== "DELETE_MY_TOPTINI_ACCOUNT") {
    return json({ error: "Account deletion confirmation was missing." }, 400);
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    for (const bucket of ["profile-photos", "review-photos"]) {
      const paths = await collectUserObjects(admin, bucket, user.id);
      for (let start = 0; start < paths.length; start += 100) {
        const { error } = await admin.storage.from(bucket).remove(paths.slice(start, start + 100));
        if (error) throw error;
      }
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    return json({ ok: true });
  } catch (error) {
    console.error("delete-account failed", error);
    return json({ error: "We could not complete account deletion. Contact support before retrying." }, 500);
  }
});
