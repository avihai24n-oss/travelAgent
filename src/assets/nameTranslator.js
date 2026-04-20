const NAME_LINE_RE = /(\d+)\.([A-Z]+)\/([A-Z][A-Z ]*?)\s+(MR|MRS|MS|MSTR|MISS|CHD|INF)(?=\s|$)/gi;

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
  switch (title) {
    case "CHD":
      return "child";
    case "INF":
      return "infant";
    default:
      return "adult";
  }
}

function buildPrompt(names, targetLang) {
  const langName = targetLang === "he" ? "Hebrew" : "French";
  const script = targetLang === "he"
    ? "using Hebrew script (אבגדה...)"
    : "using French orthography with accents where appropriate";
  const list = names
    .map((n, i) => `${i + 1}. First name: ${n.firstName} | Surname: ${n.surname}`)
    .join("\n");
  return `Transliterate the following passenger names into ${langName} ${script}, preserving pronunciation as closely as possible. Common English first names should use their standard ${langName} equivalent when one exists (e.g. "John" -> standard ${langName} form). Return ONLY a JSON array of strings — one string per passenger, formatted as "FirstName Surname" in ${langName}. No explanation, no extra text.

Passengers:
${list}`;
}

export async function translateNamesWithOpenAI(names, targetLang, apiKey) {
  if (!names || !names.length) return [];
  if (targetLang === "en") {
    return names.map(n => {
      const first = n.firstName.charAt(0) + n.firstName.slice(1).toLowerCase();
      const last = n.surname.charAt(0) + n.surname.slice(1).toLowerCase();
      return `${first} ${last}`;
    });
  }
  if (!apiKey) {
    throw new Error("missing_api_key");
  }

  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a precise transliteration assistant. You output ONLY a JSON array of strings."
      },
      { role: "user", content: buildPrompt(names, targetLang) }
    ],
    temperature: 0,
    response_format: { type: "json_object" }
  };

  body.messages[1].content +=
    '\n\nWrap the array in a JSON object like: {"names": ["...", "..."]}';

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`openai_error: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!raw) throw new Error("empty_response");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("invalid_json");
  }

  const arr = Array.isArray(parsed) ? parsed : parsed.names;
  if (!Array.isArray(arr)) throw new Error("invalid_shape");
  return arr.map(s => String(s).trim());
}

export function buildTravelersFromNames(parsedNames, translatedStrings) {
  return parsedNames.map((n, i) => ({
    name: translatedStrings[i] || `${n.firstName} ${n.surname}`,
    type: titleToType(n.title)
  }));
}
