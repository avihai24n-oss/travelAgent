// Placeholder registry: each key maps to human-readable labels per language.
// Labels are what the admin sees rendered inside chips.
export const PLACEHOLDERS = {
  CUSTOMER_NAME: { he: "שם לקוח", en: "Customer", fr: "Client" },
  ALL_NAMES: { he: "שמות נוספים", en: "Other travelers", fr: "Autres voyageurs" },
  DESTINATION: { he: "יעד", en: "Destination", fr: "Destination" },
  FLIGHTS: { he: "פרטי טיסות", en: "Flights", fr: "Vols" },
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

*מסלול הטיסות* 🌍
{{FLIGHTS}}

*חברת התעופה:* ({{AIRLINE_CODE}}) ✈️
*{{AIRLINE_NAME}}*

*מחלקת שירות* 💺
*{{CLASS}}*

*💲עלות הכרטיסים*💳
{{PRICE}}

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

*Airline:* ({{AIRLINE_CODE}}) ✈️
*{{AIRLINE_NAME}}*

*Class of Travel* 💺
*{{CLASS}}*

*Airfare* 💲
{{PRICE}}

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

*Compagnie aérienne:* ({{AIRLINE_CODE}}) ✈️
*{{AIRLINE_NAME}}*

*Classe de voyage* 💺
*{{CLASS}}*

*Tarif* 💲
{{PRICE}}

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

const storageKey = (category, lang) => `customTemplate:${category}:${lang}`;

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
