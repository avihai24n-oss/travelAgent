// Sync layer between the local template store (localStorage) and Supabase.
//
// Why a thin client instead of @supabase/supabase-js?
// We only ever hit two tables (`templates`, `custom_categories`) with simple
// upsert/select calls — adding a 100KB SDK to the bundle just for that is wasteful.
// PostgREST (which Supabase exposes) is happy with plain fetch + a couple of
// headers, so this file stays small and dependency-free.
//
// Public surface:
//   isSyncConfigured()                      → bool
//   fetchAllTemplatesRemote()               → { "<cat>:<lang>": value, … }
//   upsertTemplateRemote(cat, lang, value)  → Promise<void>
//   deleteTemplateRemote(cat, lang)         → Promise<void>
//   fetchCustomCategoriesRemote()           → [{ key, label_he }, …]
//   upsertCustomCategoryRemote(cat)         → Promise<void>
//   deleteCustomCategoryRemote(key)         → Promise<void>
//
// All of these throw on network or 4xx/5xx errors so the caller can fall back
// to the local-only path. The caller (defaultTemplates.js) is responsible for
// reconciling with localStorage and surfacing failures to the UI.

// IMPORTANT: webpack's DefinePlugin only replaces `process.env.STATIC_NAME` —
// dynamic access like `process.env[varName]` is left as a runtime lookup that
// resolves to undefined in the browser. Reference the env vars by literal name.
function getUrl() {
  return process.env.VUE_APP_SUPABASE_URL || "";
}
function getKey() {
  return process.env.VUE_APP_SUPABASE_ANON_KEY || "";
}

export function isSyncConfigured() {
  return !!(getUrl() && getKey());
}

function headers(extra) {
  const k = getKey();
  return {
    apikey: k,
    Authorization: `Bearer ${k}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extra || {})
  };
}

async function rest(path, opts) {
  const url = `${getUrl()}/rest/v1/${path}`;
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`supabase ${res.status}: ${body.slice(0, 200)}`);
  }
  // Empty 204 (after DELETE/UPDATE without representation) → no body
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function fetchAllTemplatesRemote() {
  const rows = await rest(
    "templates?select=category,lang,value,updated_at",
    { method: "GET", headers: headers() }
  );
  const out = {};
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (typeof row.value !== "string") continue;
      out[`${row.category}:${row.lang}`] = {
        value: row.value,
        updatedAt: row.updated_at
      };
    }
  }
  return out;
}

export async function upsertTemplateRemote(category, lang, value) {
  // Postgres-style upsert via Prefer: resolution=merge-duplicates + on_conflict.
  await rest(
    "templates?on_conflict=category,lang",
    {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify([{ category, lang, value }])
    }
  );
}

export async function deleteTemplateRemote(category, lang) {
  const q = `category=eq.${encodeURIComponent(category)}&lang=eq.${encodeURIComponent(lang)}`;
  await rest(`templates?${q}`, {
    method: "DELETE",
    headers: headers({ Prefer: "return=minimal" })
  });
}

export async function fetchCustomCategoriesRemote() {
  const rows = await rest(
    "custom_categories?select=key,label_he,updated_at&order=updated_at.asc",
    { method: "GET", headers: headers() }
  );
  if (!Array.isArray(rows)) return [];
  return rows.map(r => ({
    key: r.key,
    label: { he: r.label_he, en: r.label_he, fr: r.label_he }
  }));
}

export async function upsertCustomCategoryRemote(cat) {
  if (!cat || !cat.key || !cat.label || !cat.label.he) return;
  await rest(
    "custom_categories?on_conflict=key",
    {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify([{ key: cat.key, label_he: cat.label.he }])
    }
  );
}

export async function deleteCustomCategoryRemote(key) {
  if (!key) return;
  await rest(
    `custom_categories?key=eq.${encodeURIComponent(key)}`,
    { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) }
  );
}
