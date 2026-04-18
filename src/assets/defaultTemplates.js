// Placeholder registry: each placeholder has a key (used internally) and a display label per language.
// Placeholders are rendered in the editor as non-deletable chips (only movable).
// At runtime, {{KEY}} tokens are replaced with computed values from MessageBuilder.

export const PLACEHOLDERS = [
  { key: "CUSTOMER_NAME", label: { he: "שם לקוח", en: "Customer Name", fr: "Nom du Client" } },
  { key: "ALL_NAMES", label: { he: "שמות כל הנוסעים", en: "All Travelers", fr: "Tous Voyageurs" } },
  { key: "DESTINATION", label: { he: "יעד", en: "Destination", fr: "Destination" } },
  { key: "FLIGHTS", label: { he: "פירוט טיסות", en: "Flight Details", fr: "Détails des Vols" } },
  { key: "AIRLINE_CODE", label: { he: "קוד חברה", en: "Airline Code", fr: "Code Compagnie" } },
  { key: "AIRLINE_NAME", label: { he: "שם חברת תעופה", en: "Airline Name", fr: "Nom Compagnie" } },
  { key: "CLASS", label: { he: "מחלקת שירות", en: "Class", fr: "Classe" } },
  { key: "PRICE", label: { he: "מחיר", en: "Price", fr: "Prix" } },
  { key: "CURRENCY", label: { he: "מטבע", en: "Currency", fr: "Devise" } },
  { key: "BAGGAGE", label: { he: "כבודה", en: "Baggage", fr: "Bagages" } },
  { key: "CHANGE_FEE", label: { he: "דמי שינוי", en: "Change Fee", fr: "Frais Modif." } },
  { key: "CANCEL_FEE", label: { he: "דמי ביטול", en: "Cancel Fee", fr: "Frais Annulation" } },
  { key: "NO_SHOW", label: { he: "אי התייצבות", en: "No Show", fr: "No Show" } },
  { key: "TICKET_ISSUANCE", label: { he: "מועד הנפקה", en: "Ticket Issuance", fr: "Émission Billet" } },
  { key: "GREETING", label: { he: "ברכת פתיחה", en: "Greeting", fr: "Salutation" } },
  { key: "FAREWELL", label: { he: "חתימה", en: "Farewell", fr: "Signature" } }
];

// Default templates per category + language.
// Use {{KEY}} for placeholders. Anything else is free text Dad can edit.

export const DEFAULT_TEMPLATES = {
  flight: {
    he: `*{{CUSTOMER_NAME}}*, {{GREETING}}

בהמשך לפנייתך, להלן הצעתי עבור נסיעתך *(👤{{ALL_NAMES}})* הקרובה ל{{DESTINATION}}.
נא *אשר* בבקשה במענה *מתוך גוף הודעת/הצעת וואטסאפ זו* את *הנפקת כרטיסך* בהתאם לתוכן ההצעה.

*מסלול הטיסות* 🌍
{{FLIGHTS}}

*חברת התעופה: ({{AIRLINE_CODE}}) ✈️*
*{{AIRLINE_NAME}}*

*מחלקת שירות 💺*
*{{CLASS}}*

*💲עלות הכרטיסים* 💳
👈 *{{PRICE}}{{CURRENCY}}*

🛑 *לתשומת לבך:*
* המחיר עלול להשתנות כל עוד לא הונפקו הכרטיסים❗

*🧳 כבודה*
{{BAGGAGE}}

⚠️ תנאי הכרטיס ⚠️
▪️ שינוי: {{CHANGE_FEE}}
▪️ ביטול: {{CANCEL_FEE}}
▪️ אי-התייצבות: {{NO_SHOW}}

*⏱️ מועד הנפקת הכרטיס* ⌛
👈 *{{TICKET_ISSUANCE}}*

{{FAREWELL}}`,

    en: `*{{CUSTOMER_NAME}}*, {{GREETING}}

Following your request, please find below my proposal for your upcoming trip *(👤{{ALL_NAMES}})* to {{DESTINATION}}.
Please *confirm* your ticket issuance in reply *to this WhatsApp proposal message* according to the details below.

*Itinerary* 🌍
{{FLIGHTS}}

*Airline: ({{AIRLINE_CODE}}) ✈️*
*{{AIRLINE_NAME}}*

*Class of Service 💺*
*{{CLASS}}*

*💲 Airfare* 💳
👈 *{{PRICE}}{{CURRENCY}}*

🛑 *Please note:*
* Price may change until tickets are issued❗

*🧳 Baggage*
{{BAGGAGE}}

⚠️ Ticket Conditions ⚠️
▪️ Change fee: {{CHANGE_FEE}}
▪️ Cancel fee: {{CANCEL_FEE}}
▪️ No-show: {{NO_SHOW}}

*⏱️ Ticket Issuance* ⌛
👈 *{{TICKET_ISSUANCE}}*

{{FAREWELL}}`,

    fr: `*{{CUSTOMER_NAME}}*, {{GREETING}}

Suite à votre demande, veuillez trouver ci-dessous ma proposition pour votre prochain voyage *(👤{{ALL_NAMES}})* vers {{DESTINATION}}.
Veuillez *confirmer* l'émission de votre billet en répondant *à ce message WhatsApp* selon les détails ci-dessous.

*Itinéraire* 🌍
{{FLIGHTS}}

*Compagnie aérienne : ({{AIRLINE_CODE}}) ✈️*
*{{AIRLINE_NAME}}*

*Classe de Service 💺*
*{{CLASS}}*

*💲 Tarif Aérien* 💳
👈 *{{PRICE}}{{CURRENCY}}*

🛑 *Veuillez noter :*
* Le prix peut changer tant que les billets ne sont pas émis❗

*🧳 Bagages*
{{BAGGAGE}}

⚠️ Conditions du Billet ⚠️
▪️ Frais de modification : {{CHANGE_FEE}}
▪️ Frais d'annulation : {{CANCEL_FEE}}
▪️ No-show : {{NO_SHOW}}

*⏱️ Émission du Billet* ⌛
👈 *{{TICKET_ISSUANCE}}*

{{FAREWELL}}`
  }
};

export const CATEGORIES = [
  { key: "flight", label: { he: "הצעת טיסה", en: "Flight Quote", fr: "Devis Vol" } }
];

export const LANGUAGES = [
  { key: "he", label: "עברית", dir: "rtl" },
  { key: "en", label: "English", dir: "ltr" },
  { key: "fr", label: "Français", dir: "ltr" }
];

// Storage helpers
const STORAGE_PREFIX = "customTemplate:";

export function loadTemplate(category, lang) {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${category}.${lang}`);
    if (saved) return saved;
  } catch (e) {}
  return DEFAULT_TEMPLATES[category] && DEFAULT_TEMPLATES[category][lang]
    ? DEFAULT_TEMPLATES[category][lang]
    : "";
}

export function saveTemplate(category, lang, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${category}.${lang}`, value);
    return true;
  } catch (e) {
    return false;
  }
}

export function resetTemplate(category, lang) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${category}.${lang}`);
  } catch (e) {}
}

export function hasCustomTemplate(category, lang) {
  try {
    return !!localStorage.getItem(`${STORAGE_PREFIX}${category}.${lang}`);
  } catch (e) {
    return false;
  }
}
