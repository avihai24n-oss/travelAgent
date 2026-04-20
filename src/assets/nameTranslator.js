const NAME_LINE_RE = /(?:\d+\.)?\s*([A-Z][A-Z'\-]+)\/([A-Z][A-Z '\-]*?)\s+(MR|MRS|MS|MSTR|MISS|DR|CHD|CHLD|INF|INFT)(?=\s|$)/gim;

export function parseAmadeusNames(raw) {
  if (!raw || typeof raw !== "string") return [];
  const names = [];
  const seen = new Set();
  let match;
  NAME_LINE_RE.lastIndex = 0;
  while ((match = NAME_LINE_RE.exec(raw)) !== null) {
    const surname = match[2].trim();
    const firstName = match[3].trim();
    const title = match[4].toUpperCase();
    const key = `${surname}|${firstName}|${title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    names.push({ surname, firstName, title });
  }
  return names;
}

function titleToType(title) {
  const t = (title || "").toUpperCase();
  if (t === "CHD" || t === "CHLD") return "child";
  if (t === "INF" || t === "INFT") return "infant";
  return "adult";
}

export async function pingTranslationApi() {
  const supabaseUrl = process.env.VUE_APP_SUPABASE_URL;
  const supabaseKey = process.env.VUE_APP_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { ok: false, reason: "missing_proxy_config" };
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/translate-names`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ ping: true })
    });
    if (!res.ok) return { ok: false, reason: `status_${res.status}` };
    const data = await res.json();
    return {
      ok: data.ok === true,
      openaiConfigured: data.openaiConfigured === true
    };
  } catch (err) {
    return { ok: false, reason: "network_error" };
  }
}

export async function translateNamesViaProxy(names, targetLang) {
  if (!names || !names.length) return [];

  const supabaseUrl = process.env.VUE_APP_SUPABASE_URL;
  const supabaseKey = process.env.VUE_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("missing_proxy_config");
  }

  const payload = {
    names: names.map(n => ({
      firstName: n.firstName,
      surname: n.surname,
      title: n.title
    })),
    lang: targetLang
  };

  const res = await fetch(`${supabaseUrl}/functions/v1/translate-names`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`proxy_error: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!Array.isArray(data.names)) throw new Error("invalid_shape");
  return data.names.map(s => String(s).trim());
}

export function buildTravelersFromNames(parsedNames, translatedStrings) {
  return parsedNames.map((n, i) => ({
    name: translatedStrings[i] || `${n.firstName} ${n.surname}`,
    type: titleToType(n.title)
  }));
}
