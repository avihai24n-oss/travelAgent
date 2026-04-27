// Placeholder registry: each key maps to human-readable labels per language.
// Labels are what the admin sees rendered inside chips.
export const FLIGHT_ITEM_KEYS = [
  "FLIGHT_DIRECTION",
  "FLIGHT_AIRLINE",
  "FLIGHT_NUMBER",
  "FLIGHT_ORIGIN_CITY",
  "FLIGHT_ORIGIN_CODE",
  "FLIGHT_DEST_CITY",
  "FLIGHT_DEST_CODE",
  "FLIGHT_DEPART_DAY",
  "FLIGHT_DEPART_DATE",
  "FLIGHT_DEPART_MONTH",
  "FLIGHT_DEPART_TIME",
  "FLIGHT_ARRIVE_DAY",
  "FLIGHT_ARRIVE_DATE",
  "FLIGHT_ARRIVE_MONTH",
  "FLIGHT_ARRIVE_TIME",
  "FLIGHT_CLASS"
];

export const PLACEHOLDERS = {
  CUSTOMER_NAME: { he: "שם לקוח", en: "Customer", fr: "Client" },
  ALL_NAMES: { he: "שמות נוספים", en: "Other travelers", fr: "Autres voyageurs" },
  DESTINATION: { he: "יעד", en: "Destination", fr: "Destination" },
  FLIGHT_DIRECTION: { he: "כיוון", en: "Direction", fr: "Sens" },
  FLIGHT_AIRLINE: { he: "חברה", en: "Airline", fr: "Compagnie" },
  FLIGHT_NUMBER: { he: "מס' טיסה", en: "Flight no.", fr: "N° vol" },
  FLIGHT_ORIGIN_CITY: { he: "עיר מוצא", en: "Origin", fr: "Origine" },
  FLIGHT_ORIGIN_CODE: { he: "קוד מוצא", en: "Origin code", fr: "Code origine" },
  FLIGHT_DEST_CITY: { he: "עיר יעד", en: "Destination", fr: "Destination" },
  FLIGHT_DEST_CODE: { he: "קוד יעד", en: "Dest. code", fr: "Code dest." },
  FLIGHT_DEPART_DAY: { he: "יום המראה", en: "Dep. day", fr: "Jour dép." },
  FLIGHT_DEPART_DATE: { he: "תאריך המראה", en: "Dep. date", fr: "Date dép." },
  FLIGHT_DEPART_MONTH: { he: "חודש המראה", en: "Dep. month", fr: "Mois dép." },
  FLIGHT_DEPART_TIME: { he: "שעת המראה", en: "Dep. time", fr: "Heure dép." },
  FLIGHT_ARRIVE_DAY: { he: "יום נחיתה", en: "Arr. day", fr: "Jour arr." },
  FLIGHT_ARRIVE_DATE: { he: "תאריך נחיתה", en: "Arr. date", fr: "Date arr." },
  FLIGHT_ARRIVE_MONTH: { he: "חודש נחיתה", en: "Arr. month", fr: "Mois arr." },
  FLIGHT_ARRIVE_TIME: { he: "שעת נחיתה", en: "Arr. time", fr: "Heure arr." },
  FLIGHT_CLASS: { he: "מחלקת טיסה", en: "Flight class", fr: "Classe vol" },
  FLIGHTS: { he: "פרטי טיסות (בלוק שלם)", en: "Flights (full block)", fr: "Vols (bloc entier)" },
  AIRLINE_NAME: { he: "חברת תעופה", en: "Airline", fr: "Compagnie" },
  AIRLINE_CODE: { he: "קוד חברה", en: "Airline code", fr: "Code compagnie" },
  CLASS: { he: "מחלקה", en: "Class", fr: "Classe" },
  PRICE: { he: "מחיר", en: "Price", fr: "Prix" },
  CURRENCY: { he: "מטבע", en: "Currency", fr: "Devise" },
  BAGGAGE: { he: "כבודה", en: "Baggage", fr: "Bagages" },
  CHANGE_FEE: { he: "דמי שינוי", en: "Change fee", fr: "Frais de changement" },
  CANCEL_FEE: { he: "דמי ביטול", en: "Cancel fee", fr: "Frais d'annulation" },
  NO_SHOW: { he: "אי-התייצבות", en: "No show", fr: "No show" },
  TICKET_ISSUANCE: { he: "מועד הנפקה", en: "Ticket issuance", fr: "Émission du billet" }
};

export const CATEGORIES = [
  { key: "flight", label: { he: "הצעת טיסה", en: "Flight Quote", fr: "Devis de vol" } }
];

export const LANGUAGES = [
  { key: "he", dir: "rtl", label: { he: "עברית", en: "Hebrew", fr: "Hébreu" } },
  { key: "en", dir: "ltr", label: { he: "אנגלית", en: "English", fr: "Anglais" } },
  { key: "fr", dir: "ltr", label: { he: "צרפתית", en: "French", fr: "Français" } }
];

export const DEFAULT_TEMPLATES = {
  flight: {
    he: `*{{CUSTOMER_NAME}}*, שלום!
⏰ *נא אישורך להנפקת כרטיסך❗*
👈{{TICKET_ISSUANCE}}

בהמשך לפנייתך, להלן הצעתי עבור נסיעתך *(👤{{CUSTOMER_NAME}})* הקרובה ל*{{DESTINATION}}*
{{ALL_NAMES}}

*מסלול הטיסות 🌍*
*טיסה/ות הלוך🛫*
טיסת {{FLIGHT_AIRLINE}} - *{{FLIGHT_NUMBER}}*
{{FLIGHT_ORIGIN_CITY}} ⬅️ {{FLIGHT_DEST_CITY}} ({{FLIGHT_DEST_CODE}})
מחלקת תיירים/עסקים/פרמיום
ממריא {{FLIGHT_DEPART_DAY}} {{FLIGHT_DEPART_DATE}} {{FLIGHT_DEPART_MONTH}} {{FLIGHT_DEPART_TIME}}
נוחת    {{FLIGHT_ARRIVE_DAY}} {{FLIGHT_ARRIVE_DATE}} {{FLIGHT_ARRIVE_MONTH}} {{FLIGHT_ARRIVE_TIME}}
💺 (מושב - *XX*)

*טיסה/ות חזור 🛬*
טיסת {{FLIGHT_AIRLINE}} - *{{FLIGHT_NUMBER}}*
{{FLIGHT_ORIGIN_CITY}} ({{FLIGHT_ORIGIN_CODE}}) ⬅️ {{FLIGHT_DEST_CITY}}
מחלקת תיירים/עסקים/פרמיום
ממריא {{FLIGHT_DEPART_DAY}} {{FLIGHT_DEPART_DATE}} {{FLIGHT_DEPART_MONTH}} {{FLIGHT_DEPART_TIME}}
נוחת    {{FLIGHT_ARRIVE_DAY}} {{FLIGHT_ARRIVE_DATE}} {{FLIGHT_ARRIVE_MONTH}} {{FLIGHT_ARRIVE_TIME}}
💺(מושב - *XX*)

*חברת התעופה:* ({{AIRLINE_CODE}}) ✈️
*{{AIRLINE_NAME}}*

*מחלקת שירות* 💺
*{{CLASS}}*

*💲עלות הכרטיסים*💳
{{PRICE}}

🛑 *לתשומת לבך:*
* המחיר עלול להשתנות כל עוד לא הונפק הכרטיס❗

🧳 *כבודה*
✅ מזוודה אחת 23 ק"ג
✅ כבודת יד

*💺הושבה מראש*
✅ מושב סטנדרטי

⚠️ תנאי הכרטיס ⚠️
▪️ שינוי: {{CHANGE_FEE}}
▪️ ביטול: {{CANCEL_FEE}}{{CURRENCY}}
▪️ אי-התייצבות: {{NO_SHOW}}

*⏱️מועד הנפקת הכרטיס*⌛
⏰*{{TICKET_ISSUANCE}}*‼️

תודה רבה,
גד אלנקווה
בברכה,
    🏢 American Express Global Business Travel
📞 נייד: 054-5727055    ✉️ gad@gbtil.co.il`,
    en: `*{{CUSTOMER_NAME}}*, Shalom!
⏰ *Your tickets issuance approval❗*
👉 *{{TICKET_ISSUANCE}}*

In reply to your request, you'll find below my *Updated proposal* for your *(👤{{CUSTOMER_NAME}})* upcoming trip to *{{DESTINATION}}*
{{ALL_NAMES}}

Please, kindly *reply (from within this WhatsApp message)* with your *tickets issuance approval* accordingly with the content of this proposal.

*Itinerary 🌍*
*Outbound flight🛫*
{{FLIGHT_AIRLINE}} - *{{FLIGHT_NUMBER}}*
{{FLIGHT_ORIGIN_CITY}} ➡️ {{FLIGHT_DEST_CITY}} ({{FLIGHT_DEST_CODE}})
Economy/Premium/Business Class
Dpt. {{FLIGHT_DEPART_DAY}}. {{FLIGHT_DEPART_DATE}} {{FLIGHT_DEPART_MONTH}} {{FLIGHT_DEPART_TIME}}
Arr.  {{FLIGHT_ARRIVE_DAY}}. {{FLIGHT_ARRIVE_DATE}} {{FLIGHT_ARRIVE_MONTH}} {{FLIGHT_ARRIVE_TIME}}
💺 (Seat *XX*)

*Inbound flight 🛬*
{{FLIGHT_AIRLINE}} - *{{FLIGHT_NUMBER}}*
{{FLIGHT_ORIGIN_CITY}} ({{FLIGHT_ORIGIN_CODE}}) ➡️ {{FLIGHT_DEST_CITY}}
Economy/Premium/Business Class
Dpt. {{FLIGHT_DEPART_DAY}}. {{FLIGHT_DEPART_DATE}} {{FLIGHT_DEPART_MONTH}} {{FLIGHT_DEPART_TIME}}
Arr.  {{FLIGHT_ARRIVE_DAY}}. {{FLIGHT_ARRIVE_DATE}} {{FLIGHT_ARRIVE_MONTH}} {{FLIGHT_ARRIVE_TIME}}
💺 (Seat *XX*)

*Airline:* ({{AIRLINE_CODE}}) ✈️
*{{AIRLINE_NAME}}*

*Compartment* 💺
*{{CLASS}}*

🎫 *AIRFARE* 💲
{{PRICE}}

*Attention:* ❗
▪️ Above airfare may change unless tickets are issued ❗

🧳 *Baggage Allowance* 🧳
✅ 1 checked bag 23 kg
✅ Carry-on

💺 *Preselected Seats* 💺
✅ Included

⚠️ *Tickets Restrictions* ⚠️
▪️ Change: {{CHANGE_FEE}}
▪️ Cancel: {{CANCEL_FEE}}{{CURRENCY}}
▪️ No-show: {{NO_SHOW}}

*⏱️ Ticket issuance date* ⌛
⏰ *{{TICKET_ISSUANCE}}* ‼️

Thanks for replying (from within this WhatsApp message) with your tickets issuance confirmation.

Thanks,
Gad Elnekave
Sincerely Yours
🏢 American Express Global Business Travel
📞 Mob. 972-54-5727055
✉️ gad@gbtil.co.il`,
    fr: `*{{CUSTOMER_NAME}}*, Shalom!
⏰ *Validation d'émission de ton billet❗*
👉 *{{TICKET_ISSUANCE}}*

Pour faire suite à ta demande, tu trouveras ci-dessous ma *proposition actualisée* pour ton *(👤{{CUSTOMER_NAME}})* prochain voyage à *{{DESTINATION}}*
{{ALL_NAMES}}

Merci de *répondre (depuis ce message WhatsApp)* avec ta *validation d'émission de ton billet* conformément au contenu de cette proposition.

*Itinéraire 🌍*
*Vol aller 🛫*
{{FLIGHT_AIRLINE}} - *{{FLIGHT_NUMBER}}*
{{FLIGHT_ORIGIN_CITY}} ➡️ {{FLIGHT_DEST_CITY}} ({{FLIGHT_DEST_CODE}})
Economy/Premium/Business Class
Dpt. {{FLIGHT_DEPART_DAY}} {{FLIGHT_DEPART_DATE}} {{FLIGHT_DEPART_MONTH}} {{FLIGHT_DEPART_TIME}}
Arr.  {{FLIGHT_ARRIVE_DAY}} {{FLIGHT_ARRIVE_DATE}} {{FLIGHT_ARRIVE_MONTH}} {{FLIGHT_ARRIVE_TIME}}
💺 (Siege *XX*)

*Vol retour 🛬*
{{FLIGHT_AIRLINE}} - *{{FLIGHT_NUMBER}}*
{{FLIGHT_ORIGIN_CITY}} ({{FLIGHT_ORIGIN_CODE}}) ➡️ {{FLIGHT_DEST_CITY}} ({{FLIGHT_DEST_CODE}})
Economy/Premium/Business Class
Dpt. {{FLIGHT_DEPART_DAY}} {{FLIGHT_DEPART_DATE}} {{FLIGHT_DEPART_MONTH}} {{FLIGHT_DEPART_TIME}}
Arr.  {{FLIGHT_ARRIVE_DAY}} {{FLIGHT_ARRIVE_DATE}} {{FLIGHT_ARRIVE_MONTH}} {{FLIGHT_ARRIVE_TIME}}
💺 (Siege *XX*)

*Compagnie:* ({{AIRLINE_CODE}}) ✈️
*{{AIRLINE_NAME}}*

*Compartiment* 💺
*{{CLASS}}*

🎫 *PRIX* 💲
{{PRICE}}

*Attention:* ❗
▪️ Le tarif ci-dessus peut changer tant que le billet n'est pas émis ❗

🧳 *Franchise bagages* 🧳
✅ 1 bagage en soute 23 kg
✅ Bagage cabine

💺 *Présélection sièges* 💺
✅ Incluse

⚠️ *Restrictions tarifaires* ⚠️
▪️ Modification: {{CHANGE_FEE}}
▪️ Annulation: {{CANCEL_FEE}}{{CURRENCY}}
▪️ No-show: {{NO_SHOW}}

*⏱️ Date d'émission du billet* ⌛
⏰ *{{TICKET_ISSUANCE}}* ‼️

Merci de répondre (depuis ce message WhatsApp) avec ta confirmation d'émission.

Merci,
Gad Elnekave
Cordialement
🏢 American Express Global Business Travel
📞 Mob. 972-54-5727055
✉️ gad@gbtil.co.il`
  }
};

const storageKey = (category, lang) => `customTemplate:${category}:${lang}`;
const historyKey = (category, lang) => `customTemplateHistory:${category}:${lang}`;
const HISTORY_LIMIT = 20;

// Registry of admin-defined offer categories (e.g. hotels, cruises, custom bundles).
// Built-ins (CATEGORIES) are immutable; this storage holds only user-added ones.
// Each record reserves a `schema` field for the future DOS auto-mapping infrastructure;
// today it stays null, and MessageBuilder ignores custom categories entirely.
const CATEGORIES_KEY = "customCategories";
const CATEGORY_VERSION = 1;

function readCustomCategories() {
  try {
    const raw = window.localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeCustomCategories(arr) {
  try {
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    return false;
  }
}

export function isBuiltInCategory(key) {
  return CATEGORIES.some(c => c.key === key);
}

export function getCustomCategories() {
  return readCustomCategories();
}

export function getAllCategories() {
  return [
    ...CATEGORIES.map(c => ({ ...c, builtIn: true })),
    ...readCustomCategories().map(c => ({ ...c, builtIn: false }))
  ];
}

function normalizeLabel(label) {
  const he = (label && typeof label.he === "string" && label.he.trim()) || "";
  if (!he) return null;
  const en = (label && typeof label.en === "string" && label.en.trim()) || he;
  const fr = (label && typeof label.fr === "string" && label.fr.trim()) || he;
  return { he, en, fr };
}

export function addCategory(label) {
  const normalized = normalizeLabel(label);
  if (!normalized) throw new Error("missing_he_label");
  const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record = {
    key,
    label: normalized,
    schema: null,
    version: CATEGORY_VERSION
  };
  const list = readCustomCategories();
  list.push(record);
  writeCustomCategories(list);
  return record;
}

export function renameCategory(key, label) {
  if (isBuiltInCategory(key)) throw new Error("builtin_immutable");
  const normalized = normalizeLabel(label);
  if (!normalized) throw new Error("missing_he_label");
  const list = readCustomCategories();
  const idx = list.findIndex(c => c.key === key);
  if (idx === -1) throw new Error("not_found");
  list[idx] = { ...list[idx], label: normalized };
  writeCustomCategories(list);
  return list[idx];
}

export function deleteCategory(key) {
  if (isBuiltInCategory(key)) throw new Error("builtin_immutable");
  const list = readCustomCategories();
  const next = list.filter(c => c.key !== key);
  writeCustomCategories(next);
  try {
    for (const lang of LANGUAGES.map(l => l.key)) {
      window.localStorage.removeItem(storageKey(key, lang));
      window.localStorage.removeItem(historyKey(key, lang));
    }
  } catch (e) {
    // ignore
  }
  return true;
}

export function loadTemplate(category, lang) {
  try {
    const saved = window.localStorage.getItem(storageKey(category, lang));
    if (saved !== null) return saved;
  } catch (e) {
    // localStorage unavailable — fall back to default
  }
  // Custom categories have no built-in defaults — return empty so the editor opens blank.
  return (DEFAULT_TEMPLATES[category] && DEFAULT_TEMPLATES[category][lang]) || "";
}

export function hasDefaultTemplate(category) {
  return Object.prototype.hasOwnProperty.call(DEFAULT_TEMPLATES, category);
}

export function saveTemplate(category, lang, value) {
  try {
    const prev = window.localStorage.getItem(storageKey(category, lang));
    if (prev !== null && prev !== value) {
      pushHistory(category, lang, prev);
    }
    window.localStorage.setItem(storageKey(category, lang), value);
    return true;
  } catch (e) {
    return false;
  }
}

export function resetTemplate(category, lang) {
  try {
    const prev = window.localStorage.getItem(storageKey(category, lang));
    if (prev !== null) pushHistory(category, lang, prev);
    window.localStorage.removeItem(storageKey(category, lang));
    return true;
  } catch (e) {
    return false;
  }
}

export function hasCustomTemplate(category, lang) {
  try {
    return window.localStorage.getItem(storageKey(category, lang)) !== null;
  } catch (e) {
    return false;
  }
}

function pushHistory(category, lang, value) {
  try {
    const raw = window.localStorage.getItem(historyKey(category, lang));
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({ at: Date.now(), value });
    const trimmed = arr.slice(0, HISTORY_LIMIT);
    window.localStorage.setItem(historyKey(category, lang), JSON.stringify(trimmed));
  } catch (e) {
    // ignore
  }
}

export function loadHistory(category, lang) {
  try {
    const raw = window.localStorage.getItem(historyKey(category, lang));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function exportAllTemplates() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    templates: {},
    customCategories: readCustomCategories()
  };
  try {
    const langKeys = LANGUAGES.map(l => l.key);
    const builtInCats = Object.keys(DEFAULT_TEMPLATES);
    const customCatKeys = payload.customCategories.map(c => c.key);
    const allCats = [...builtInCats, ...customCatKeys];
    for (const cat of allCats) {
      for (const lang of langKeys) {
        const saved = window.localStorage.getItem(storageKey(cat, lang));
        if (saved !== null) {
          payload.templates[`${cat}:${lang}`] = saved;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return payload;
}

export function importAllTemplates(payload) {
  if (!payload || typeof payload !== "object" || !payload.templates) {
    throw new Error("invalid_backup");
  }
  // Restore custom categories first so their template entries land on a known target.
  if (Array.isArray(payload.customCategories)) {
    const sanitized = payload.customCategories
      .filter(c => c && typeof c.key === "string" && !isBuiltInCategory(c.key))
      .map(c => ({
        key: c.key,
        label: normalizeLabel(c.label) || { he: c.key, en: c.key, fr: c.key },
        schema: c.schema || null,
        version: c.version || CATEGORY_VERSION
      }));
    const existing = readCustomCategories();
    const merged = [...existing];
    for (const rec of sanitized) {
      const idx = merged.findIndex(m => m.key === rec.key);
      if (idx === -1) merged.push(rec);
      else merged[idx] = rec;
    }
    writeCustomCategories(merged);
  }
  const entries = Object.entries(payload.templates);
  let count = 0;
  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;
    const [cat, lang] = key.split(":");
    if (!cat || !lang) continue;
    try {
      const prev = window.localStorage.getItem(storageKey(cat, lang));
      if (prev !== null && prev !== value) pushHistory(cat, lang, prev);
      window.localStorage.setItem(storageKey(cat, lang), value);
      count++;
    } catch (e) {
      // skip
    }
  }
  return count;
}
