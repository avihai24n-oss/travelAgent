// Supabase Edge Function: translate-names
// Proxies passenger name transliteration requests to OpenAI without exposing the API key.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NameEntry {
  firstName: string;
  surname: string;
  title?: string;
}

interface RequestBody {
  names: NameEntry[];
  lang: "he" | "fr" | "en";
}

function buildPrompt(names: NameEntry[], lang: "he" | "fr"): string {
  const langName = lang === "he" ? "Hebrew" : "French";
  const script =
    lang === "he"
      ? "using Hebrew script (אבגדה...)"
      : "using French orthography with accents where appropriate";
  const list = names
    .map(
      (n, i) =>
        `${i + 1}. First name: ${n.firstName} | Surname: ${n.surname}`
    )
    .join("\n");
  return `Transliterate the following passenger names into ${langName} ${script}, preserving pronunciation as closely as possible. Common English first names should use their standard ${langName} equivalent when one exists (e.g. "John" -> standard ${langName} form). Return ONLY a JSON object with the shape {"names": ["FirstName Surname", ...]} — one entry per passenger, in ${langName}. No explanation, no extra text.

Passengers:
${list}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { names, lang } = body;

  if (!Array.isArray(names) || names.length === 0) {
    return new Response(JSON.stringify({ error: "no_names" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (names.length > 20) {
    return new Response(JSON.stringify({ error: "too_many_names" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (lang === "en") {
    const translated = names.map((n) => {
      const first =
        n.firstName.charAt(0) + n.firstName.slice(1).toLowerCase();
      const last = n.surname.charAt(0) + n.surname.slice(1).toLowerCase();
      return `${first} ${last}`;
    });
    return new Response(JSON.stringify({ names: translated }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (lang !== "he" && lang !== "fr") {
    return new Response(JSON.stringify({ error: "invalid_lang" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("OPENAI_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "missing_api_key" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const openaiBody = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a precise transliteration assistant. You output ONLY JSON.",
      },
      { role: "user", content: buildPrompt(names, lang) },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  };

  const openaiRes = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openaiBody),
    }
  );

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    return new Response(
      JSON.stringify({
        error: "openai_error",
        status: openaiRes.status,
        detail: errText.slice(0, 300),
      }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  const data = await openaiRes.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) {
    return new Response(JSON.stringify({ error: "empty_response" }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "invalid_openai_json" }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : (parsed as { names?: unknown }).names;
  if (!Array.isArray(arr)) {
    return new Response(JSON.stringify({ error: "invalid_shape" }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ names: arr.map((s) => String(s).trim()) }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});
