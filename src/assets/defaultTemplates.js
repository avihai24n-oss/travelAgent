// Atomic placeholder labels for the MAIN template. Each resolves to a single
// short value at preview time (not a multi-line block).
export const PLACEHOLDERS = {
  CUSTOMER_NAME: { he: "שם לקוח", en: "Customer", fr: "Client" },
  DESTINATION: { he: "יעד", en: "Destination", fr: "Destination" },
  CLASS: { he: "מחלקה", en: "Class", fr: "Classe" },
  CURRENCY: { he: "מטבע", en: "Currency", fr: "Devise" },
  CHANGE_FEE: { he: "דמי שינוי", en: "Change fee", fr: "Frais de changement" },
  CANCEL_FEE: { he: "דמי ביטול", en: "Cancel fee", fr: "Frais d'annulation" },
  NO_SHOW: { he: "אי-התייצבות", en: "No show", fr: "No show" },
  TICKET_ISSUANCE: { he: "מועד הנפקה", en: "Ticket issuance", fr: "Émission du billet" },
  // Block slots — each marks the insertion point for a repeated sub-template.
  FLIGHTS: { he: "בלוק טיסות", en: "Flights block", fr: "Bloc vols" },
  BAGGAGE: { he: "בלוק כבודה", en: "Baggage block", fr: "Bloc bagages" },
  PRICES: { he: "בלוק מחירים", en: "Prices block", fr: "Bloc prix" },
  ALL_NAMES: { he: "שמות נוספים", en: "Other travelers", fr: "Autres voyageurs" }
};

// Per-block atomic placeholders. These are the ones that get replaced with
// real Amadeus data when a single item (flight / baggage item / price row)
// renders. The admin edits each block's sub-template separately.
export const SUB_PLACEHOLDERS = {
  flight_line: {
    FL_AIRLINE_NAME: { he: "חברת תעופה", en: "Airline", fr: "Compagnie" },
    FL_AIRLINE_CODE: { he: "קוד חברה", en: "Airline code", fr: "Code compagnie" },
    FL_FLIGHT_NUM: { he: "מספר טיסה", en: "Flight #", fr: "N° vol" },
    FL_DEPART_CITY: { he: "עיר יציאה", en: "From city", fr: "Ville départ" },
    FL_DEPART_CODE: { he: "קוד יציאה", en: "From code", fr: "Code départ" },
    FL_DEST_CITY: { he: "עיר יעד", en: "To city", fr: "Ville arrivée" },
    FL_DEST_CODE: { he: "קוד יעד", en: "To code", fr: "Code arrivée" },
    FL_DEPART_DAY: { he: "יום יציאה", en: "Dep. day", fr: "Jour dép." },
    FL_DEPART_DATE: { he: "תאריך יציאה", en: "Dep. date", fr: "Date dép." },
    FL_DEPART_MONTH: { he: "חודש יציאה", en: "Dep. month", fr: "Mois dép." },
    FL_DEPART_TIME: { he: "שעת יציאה", en: "Dep. time", fr: "Heure dép." },
    FL_DEST_DAY: { he: "יום הגעה", en: "Arr. day", fr: "Jour arr." },
    FL_DEST_DATE: { he: "תאריך הגעה", en: "Arr. date", fr: "Date arr." },
    FL_DEST_MONTH: { he: "חודש הגעה", en: "Arr. month", fr: "Mois arr." },
    FL_DEST_TIME: { he: "שעת הגעה", en: "Arr. time", fr: "Heure arr." },
    FL_CLASS: { he: "מחלקה", en: "Class", fr: "Classe" }
  },
  baggage_line: {
    BG_ITEM: { he: "פריט כבודה", en: "Baggage item", fr: "Article bagage" }
  },
  price_line: {
    PR_VALUE: { he: "סכום", en: "Amount", fr: "Montant" },
    PR_CURRENCY: { he: "מטבע", en: "Currency", fr: "Devise" },
    PR_TRAVELER_TYPE: { he: "סוג נוסע", en: "Traveler type", fr: "Type voyageur" },
    PR_COUNT: { he: "כמות", en: "Count", fr: "Quantité" }
  }
};

export const SUB_BLOCKS = [
  {
    key: "flight_line",
    label: { he: "תבנית שורת טיסה", en: "Flight line template", fr: "Modèle ligne vol" }
  },
  {
    key: "baggage_line",
    label: { he: "תבנית פריט כבודה", en: "Baggage item template", fr: "Modèle article bagage" }
  },
  {
    key: "price_line",
    label: { he: "תבנית שורת מחיר", en: "Price line template", fr: "Modèle ligne prix" }
  }
];

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

*מסלול הטיסות* 🌍
{{FLIGHTS}}

*מחלקת שירות* 💺
*{{CLASS}}*

*💲עלות הכרטיסים*💳
{{PRICES}}

🛑 *לתשומת לבך:*
* המחיר עלול להשתנות כל עוד לא הונפק הכרטיס❗

🧳 *כבודה*
{{BAGGAGE}}

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

Following your request, here is my offer for your upcoming trip to *{{DESTINATION}}*
{{ALL_NAMES}}

*Itinerary* 🌍
{{FLIGHTS}}

*Class of Travel* 💺
*{{CLASS}}*

*Airfare* 💲
{{PRICES}}

*Attention:*
The price may change until the ticket is issued.

🧳 *Baggage*
{{BAGGAGE}}

⚠️ Fare Restrictions ⚠️
▪️ Change: {{CHANGE_FEE}}
▪️ Cancel: {{CANCEL_FEE}}{{CURRENCY}}
▪️ No show: {{NO_SHOW}}

*Ticket issuance:* {{TICKET_ISSUANCE}}

Thanks,
Gad`,
    fr: `*{{CUSTOMER_NAME}}*, Shalom!

Suite à votre demande, voici l'offre pour votre prochain voyage à *{{DESTINATION}}*
{{ALL_NAMES}}

*Itinéraire* 🌍
{{FLIGHTS}}

*Classe de voyage* 💺
*{{CLASS}}*

*Tarif* 💲
{{PRICES}}

*Attention:*
Le prix peut changer tant que le billet n'est pas émis.

🧳 *Bagages*
{{BAGGAGE}}

⚠️ Conditions tarifaires ⚠️
▪️ Changement: {{CHANGE_FEE}}
▪️ Annulation: {{CANCEL_FEE}}{{CURRENCY}}
▪️ No show: {{NO_SHOW}}

*Émission du billet:* {{TICKET_ISSUANCE}}

Toda,
Gad`
  }
};

export const DEFAULT_SUB_TEMPLATES = {
  flight_line: {
    he: `{{FL_AIRLINE_NAME}} – *{{FL_FLIGHT_NUM}}*
{{FL_DEPART_CITY}} ({{FL_DEPART_CODE}}) ⬅️ {{FL_DEST_CITY}} ({{FL_DEST_CODE}})
יציאה: {{FL_DEPART_DAY}} {{FL_DEPART_DATE}} {{FL_DEPART_MONTH}} {{FL_DEPART_TIME}}
הגעה: {{FL_DEST_DAY}} {{FL_DEST_DATE}} {{FL_DEST_MONTH}} {{FL_DEST_TIME}}`,
    en: `{{FL_AIRLINE_NAME}} - *{{FL_FLIGHT_NUM}}*
{{FL_DEPART_CITY}} ({{FL_DEPART_CODE}}) ➡️ {{FL_DEST_CITY}} ({{FL_DEST_CODE}})
Dep: {{FL_DEPART_DAY}} {{FL_DEPART_DATE}} {{FL_DEPART_MONTH}} {{FL_DEPART_TIME}}
Arr: {{FL_DEST_DAY}} {{FL_DEST_DATE}} {{FL_DEST_MONTH}} {{FL_DEST_TIME}}`,
    fr: `{{FL_AIRLINE_NAME}} - *{{FL_FLIGHT_NUM}}*
{{FL_DEPART_CITY}} ({{FL_DEPART_CODE}}) ➡️ {{FL_DEST_CITY}} ({{FL_DEST_CODE}})
Dép: {{FL_DEPART_DAY}} {{FL_DEPART_DATE}} {{FL_DEPART_MONTH}} {{FL_DEPART_TIME}}
Arr: {{FL_DEST_DAY}} {{FL_DEST_DATE}} {{FL_DEST_MONTH}} {{FL_DEST_TIME}}`
  },
  baggage_line: {
    he: `✅ {{BG_ITEM}}`,
    en: `✅ {{BG_ITEM}}`,
    fr: `✅ {{BG_ITEM}}`
  },
  price_line: {
    he: `👈 *{{PR_VALUE}}{{PR_CURRENCY}} {{PR_TRAVELER_TYPE}}{{PR_COUNT}}*`,
    en: `  {{PR_COUNT}} {{PR_TRAVELER_TYPE}} * {{PR_VALUE}}{{PR_CURRENCY}}`,
    fr: `  {{PR_COUNT}} {{PR_TRAVELER_TYPE}} * {{PR_VALUE}}{{PR_CURRENCY}}`
  }
};

const storageKey = (category, lang) => `customTemplate:${category}:${lang}`;
const subStorageKey = (blockKey, lang) => `customSubTemplate:${blockKey}:${lang}`;

export function loadTemplate(category, lang) {
  try {
    const saved = window.localStorage.getItem(storageKey(category, lang));
    if (saved !== null) return saved;
  } catch (e) {
    // localStorage unavailable — fall back to default
  }
  return (DEFAULT_TEMPLATES[category] && DEFAULT_TEMPLATES[category][lang]) || "";
}

export function saveTemplate(category, lang, value) {
  try {
    window.localStorage.setItem(storageKey(category, lang), value);
    return true;
  } catch (e) {
    return false;
  }
}

export function resetTemplate(category, lang) {
  try {
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

export function loadSubTemplate(blockKey, lang) {
  try {
    const saved = window.localStorage.getItem(subStorageKey(blockKey, lang));
    if (saved !== null) return saved;
  } catch (e) {
    // fall through to default
  }
  return (
    (DEFAULT_SUB_TEMPLATES[blockKey] && DEFAULT_SUB_TEMPLATES[blockKey][lang]) || ""
  );
}

export function saveSubTemplate(blockKey, lang, value) {
  try {
    window.localStorage.setItem(subStorageKey(blockKey, lang), value);
    return true;
  } catch (e) {
    return false;
  }
}

export function resetSubTemplate(blockKey, lang) {
  try {
    window.localStorage.removeItem(subStorageKey(blockKey, lang));
    return true;
  } catch (e) {
    return false;
  }
}

export function hasCustomSubTemplate(blockKey, lang) {
  try {
    return window.localStorage.getItem(subStorageKey(blockKey, lang)) !== null;
  } catch (e) {
    return false;
  }
}
