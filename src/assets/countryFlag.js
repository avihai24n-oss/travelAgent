// Country name (English, as it appears in airportsjs / iata.js) → ISO 3166-1 alpha-2 code.
// Used to render a flag emoji next to the city in the destination picker.
// Add new entries here as new destinations come up — missing entries return "" (no flag).
const COUNTRY_TO_ISO = {
  Israel: "IL",
  France: "FR",
  "United States": "US",
  USA: "US",
  usa: "US",
  "United Kingdom": "GB",
  UK: "GB",
  Spain: "ES",
  Italy: "IT",
  Germany: "DE",
  Greece: "GR",
  Turkey: "TR",
  Russia: "RU",
  China: "CN",
  Japan: "JP",
  Thailand: "TH",
  India: "IN",
  Egypt: "EG",
  Morocco: "MA",
  Tunisia: "TN",
  "South Africa": "ZA",
  Brazil: "BR",
  Argentina: "AR",
  Mexico: "MX",
  Canada: "CA",
  Australia: "AU",
  "New Zealand": "NZ",
  Switzerland: "CH",
  Netherlands: "NL",
  Belgium: "BE",
  Austria: "AT",
  Portugal: "PT",
  Poland: "PL",
  "Czech Republic": "CZ",
  Czechia: "CZ",
  Hungary: "HU",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Finland: "FI",
  Ireland: "IE",
  Luxembourg: "LU",
  "Hong Kong": "HK",
  Singapore: "SG",
  "United Arab Emirates": "AE",
  UAE: "AE",
  "Saudi Arabia": "SA",
  Jordan: "JO",
  Cyprus: "CY",
  Malta: "MT",
  Croatia: "HR",
  Slovenia: "SI",
  Slovakia: "SK",
  Romania: "RO",
  Bulgaria: "BG",
  Ukraine: "UA",
  Georgia: "GE",
  Azerbaijan: "AZ",
  Armenia: "AM",
  Kazakhstan: "KZ",
  Uzbekistan: "UZ",
  Vietnam: "VN",
  Indonesia: "ID",
  Malaysia: "MY",
  Philippines: "PH",
  "South Korea": "KR",
  Korea: "KR",
  Taiwan: "TW",
  "Sri Lanka": "LK",
  Maldives: "MV",
  Mauritius: "MU",
  Seychelles: "SC",
  Kenya: "KE",
  Tanzania: "TZ",
  Nigeria: "NG",
  Ethiopia: "ET",
  Iceland: "IS",
  Estonia: "EE",
  Latvia: "LV",
  Lithuania: "LT",
  Belarus: "BY",
  Serbia: "RS",
  "Bosnia and Herzegovina": "BA",
  Albania: "AL",
  Montenegro: "ME",
  Macedonia: "MK",
  "North Macedonia": "MK",
  Chile: "CL",
  Peru: "PE",
  Colombia: "CO",
  Venezuela: "VE",
  Cuba: "CU",
  "Dominican Republic": "DO",
  "Costa Rica": "CR",
  Panama: "PA",
  "Papua New Guinea": "PG",
  Greenland: "GL",
  Iran: "IR",
  Iraq: "IQ",
  Lebanon: "LB",
  Syria: "SY",
  Qatar: "QA",
  Kuwait: "KW",
  Bahrain: "BH",
  Oman: "OM",
  Yemen: "YE",
  Bangladesh: "BD",
  Pakistan: "PK",
  Afghanistan: "AF",
  Nepal: "NP",
  Cambodia: "KH",
  Laos: "LA",
  Myanmar: "MM",
  "Burma": "MM"
};

export function isoCodeForCountry(countryName) {
  if (!countryName) return "";
  const trimmed = String(countryName).trim();
  if (COUNTRY_TO_ISO[trimmed]) return COUNTRY_TO_ISO[trimmed];
  // case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(COUNTRY_TO_ISO)) {
    if (key.toLowerCase() === lower) return COUNTRY_TO_ISO[key];
  }
  return "";
}

export function flagFromCountry(countryName) {
  const iso = isoCodeForCountry(countryName);
  if (!iso || iso.length !== 2) return "";
  // Convert two ASCII letters to regional indicator symbols (= flag emoji)
  return iso
    .toUpperCase()
    .split("")
    .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
