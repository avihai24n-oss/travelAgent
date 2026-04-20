<template>
  <q-page class="admin-page" dir="rtl">
    <q-header class="admin-header">
      <q-toolbar class="admin-toolbar">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          color="white"
          class="icon-btn"
          @click="goHome"
          aria-label="חזרה"
        />
        <div class="admin-brand">
          <div class="admin-brand-mark">
            <span>⚙</span>
          </div>
          <div class="admin-brand-text">
            <div class="admin-brand-title">ניהול תבניות</div>
            <div class="admin-brand-subtitle">Templates Editor</div>
          </div>
        </div>
        <q-btn
          v-if="authed"
          flat
          round
          dense
          icon="logout"
          color="white"
          class="icon-btn"
          @click="logout"
          aria-label="יציאה"
        />
      </q-toolbar>
    </q-header>

    <!-- Password gate -->
    <div v-if="!authed" class="gate-wrapper">
      <div class="gate-card">
        <div class="gate-icon">&#128274;</div>
        <div class="gate-title">גישה מוגבלת</div>
        <div class="gate-subtitle">הזן סיסמה כדי לערוך תבניות</div>
        <q-input
          v-model="passwordInput"
          type="password"
          outlined
          dense
          label="סיסמה"
          class="gate-input"
          @keyup.enter="submitPassword"
          :error="passwordError"
          :error-message="passwordError ? 'סיסמה שגויה' : ''"
        />
        <q-btn
          color="primary"
          label="כניסה"
          unelevated
          no-caps
          class="gate-btn"
          @click="submitPassword"
        />
      </div>
    </div>

    <!-- Admin panel -->
    <div v-else class="admin-body">
      <!-- Category pill tabs -->
      <div class="pill-tabs-wrap">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          type="button"
          class="pill-tab-admin"
          :class="{ active: activeCategory === cat.key }"
          @click="activeCategory = cat.key"
        >
          {{ cat.label.he }}
        </button>
      </div>

      <!-- Language pill tabs -->
      <div class="pill-tabs-wrap pill-tabs-sub">
        <button
          v-for="lng in LANGUAGES"
          :key="lng.key"
          type="button"
          class="pill-tab-admin pill-tab-sub"
          :class="{ active: activeLang === lng.key }"
          @click="activeLang = lng.key"
        >
          {{ lng.label.he }}
        </button>
      </div>

      <!-- Status banner -->
      <div class="status-banner" :class="isCustom ? 'banner-custom' : 'banner-default'">
        <span class="banner-icon">{{ isCustom ? '✏️' : '📄' }}</span>
        <span class="banner-text">
          {{ isCustom ? 'תבנית מותאמת אישית (שמורה)' : 'תבנית ברירת מחדל' }}
        </span>
        <span v-if="unsaved" class="banner-dirty">• לא נשמר</span>
      </div>

      <!-- Editor -->
      <div class="editor-card">
        <TemplateEditor
          ref="editor"
          :key="editorKey"
          :value="draftValue"
          :lang="activeLang"
          :dir="currentDir"
          :placeholders="PLACEHOLDERS"
          toolbar-label="הוסף שדה:"
          @input="onEditorInput"
        />
      </div>

      <!-- Primary action buttons -->
      <div class="action-row">
        <q-btn
          color="primary"
          label="שמור"
          icon="save"
          unelevated
          no-caps
          size="md"
          class="primary-btn"
          :disable="!unsaved"
          @click="onSave"
        />
        <q-btn
          color="secondary"
          label="תצוגה מקדימה"
          icon="visibility"
          outline
          no-caps
          size="md"
          @click="onPreview"
        />
      </div>

      <!-- Preview -->
      <div v-if="previewText" class="preview-wrap">
        <div class="preview-label">תצוגה מקדימה (עם ערכי דוגמה):</div>
        <WhatsAppPhonePreview
          :text="previewText"
          :dir="currentDir"
          contact-name="Gad Elnekave"
        />
      </div>

      <!-- Backup section -->
      <q-expansion-item
        class="section-card backup-section"
        header-class="backup-section-header"
        icon="cloud_download"
        label="גיבוי ושחזור תבניות"
      >
        <div class="backup-body">
          <p class="backup-info">
            התבניות נשמרות בדפדפן הזה בלבד. מומלץ להוריד גיבוי מדי פעם
            ולשמור אותו במקום בטוח (מייל, Drive וכו׳).
          </p>
          <div class="backup-actions">
            <q-btn
              color="primary"
              label="הורד גיבוי"
              icon="download"
              outline
              no-caps
              @click="onDownloadBackup"
            />
            <q-btn
              color="primary"
              label="העלה גיבוי"
              icon="upload"
              outline
              no-caps
              @click="$refs.fileInput.click()"
            />
            <input
              ref="fileInput"
              type="file"
              accept="application/json,.json"
              class="hidden-file-input"
              @change="onUploadBackup"
            />
          </div>

          <div v-if="history.length" class="history-block">
            <div class="history-title">גרסאות קודמות — {{ currentLangLabel }}</div>
            <div class="history-list">
              <div
                v-for="(entry, idx) in history"
                :key="entry.at + ':' + idx"
                class="history-row"
              >
                <div class="history-meta">
                  <span class="history-when">{{ formatTime(entry.at) }}</span>
                  <span class="history-preview">{{ snippet(entry.value) }}</span>
                </div>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="sm"
                  color="primary"
                  label="שחזר גרסה זו"
                  icon="history"
                  @click="restoreHistoryEntry(entry)"
                />
              </div>
            </div>
          </div>
        </div>
      </q-expansion-item>

      <!-- Danger zone -->
      <div class="danger-zone">
        <div class="danger-header">
          <span class="danger-icon" aria-hidden="true">⚠</span>
          <span>אזור מסוכן</span>
        </div>
        <div class="danger-body">
          <div class="danger-label">שחזור תבנית לברירת מחדל</div>
          <div class="danger-desc">
            פעולה זו תמחק את התבנית המותאמת אישית עבור <b>{{ currentLangLabel }}</b>
            ותחזיר את ברירת המחדל. להפעלה, הקלד/י את המילה
            <span class="danger-word">שחזר</span> בתיבה למטה.
          </div>
          <div class="danger-row">
            <q-input
              v-model="resetConfirmText"
              outlined
              dense
              dir="rtl"
              label="הקלד ״שחזר״ כדי לאשר"
              class="danger-input"
            />
            <q-btn
              color="negative"
              label="שחזר ברירת מחדל"
              icon="delete_forever"
              unelevated
              no-caps
              :disable="resetConfirmText.trim() !== 'שחזר'"
              @click="onReset"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import TemplateEditor from "src/components/TemplateEditor.vue";
import WhatsAppPhonePreview from "src/components/WhatsAppPhonePreview.vue";
import {
  PLACEHOLDERS,
  CATEGORIES,
  LANGUAGES,
  DEFAULT_TEMPLATES,
  FLIGHT_ITEM_KEYS,
  loadTemplate,
  saveTemplate,
  resetTemplate,
  hasCustomTemplate,
  loadHistory,
  exportAllTemplates,
  importAllTemplates
} from "src/assets/defaultTemplates.js";

const ADMIN_PASSWORD = "gad2026";
const AUTH_KEY = "adminAuthenticated";

// Sample values used in the admin Preview button only — not in production messages.
const PREVIEW_SAMPLES = {
  he: {
    CUSTOMER_NAME: "ישראל ישראלי",
    ALL_NAMES: "יחד עם דני ורחל",
    GREETING: "שלום!",
    DESTINATION: "מדריד",
    FLIGHTS:
      "*טיסות הלוך 🛫*\nEL AL – *LY395*\nתל אביב ⬅️ מדריד (MAD)\nממריא: יום ה' 17 אפר'  05:00\nנוחת: יום ה' 17 אפר'  09:20",
    AIRLINE_NAME: "EL AL",
    AIRLINE_CODE: "LY",
    CLASS: "מחלקת תיירים",
    PRICE: "👈 *$500 מבוגר x2*",
    CURRENCY: "$",
    BAGGAGE: "✅ מזוודה אחת 23 ק\"ג\n✅ כבודת יד",
    CHANGE_FEE: "100$",
    CANCEL_FEE: "250",
    NO_SHOW: "טוטאלוס",
    TICKET_ISSUANCE: "כרטוס מיידי",
    FAREWELL: "תודה רבה,\nגד אלנקווה"
  },
  en: {
    CUSTOMER_NAME: "Israel Israeli",
    ALL_NAMES: "with Danny & Rachel",
    GREETING: "Shalom!",
    DESTINATION: "Madrid",
    FLIGHTS:
      "*Outbound flight 🛫*\nEL AL - *LY395*\nTel Aviv ➡️ Madrid (MAD)\nEconomy\ndpt. Thu 17 Apr  05:00\narr. Thu 17 Apr  09:20",
    AIRLINE_NAME: "EL AL",
    AIRLINE_CODE: "LY",
    CLASS: "Economy",
    PRICE: "  2 adult * $500",
    CURRENCY: "$",
    BAGGAGE: "✅ 1 checked bag 23 kg\n✅ Carry-on",
    CHANGE_FEE: "$100",
    CANCEL_FEE: "250",
    NO_SHOW: "Total loss",
    TICKET_ISSUANCE: "Immediate",
    FAREWELL: "Best regards,\nGad Elnekave"
  },
  fr: {
    CUSTOMER_NAME: "Israel Israeli",
    ALL_NAMES: "accompagné de Danny & Rachel",
    GREETING: "Shalom!",
    DESTINATION: "Madrid",
    FLIGHTS:
      "*Vol aller 🛫*\nEL AL - *LY395*\nTel Aviv ➡️ Madrid (MAD)\nÉconomie\ndép. jeu 17 avr  05:00\narr. jeu 17 avr  09:20",
    AIRLINE_NAME: "EL AL",
    AIRLINE_CODE: "LY",
    CLASS: "Économie",
    PRICE: "  2 adulte * $500",
    CURRENCY: "$",
    BAGGAGE: "✅ 1 bagage en soute 23 kg\n✅ Bagage cabine",
    CHANGE_FEE: "$100",
    CANCEL_FEE: "250",
    NO_SHOW: "Totalement perdu",
    TICKET_ISSUANCE: "Immédiat",
    FAREWELL: "Cordialement,\nGad Elnekave"
  }
};

// Sample per-flight data for the Preview button — round-trip TLV ↔ MAD, 2 flights.
const PREVIEW_FLIGHTS = {
  he: [
    {
      FLIGHT_DIRECTION: "טיסות הלוך 🛫",
      FLIGHT_AIRLINE: "EL AL",
      FLIGHT_NUMBER: "LY395",
      FLIGHT_ORIGIN_CITY: "תל אביב",
      FLIGHT_ORIGIN_CODE: "TLV",
      FLIGHT_DEST_CITY: "מדריד",
      FLIGHT_DEST_CODE: "MAD",
      FLIGHT_DEPART_DAY: "יום ה'",
      FLIGHT_DEPART_DATE: "17",
      FLIGHT_DEPART_MONTH: "אפר'",
      FLIGHT_DEPART_TIME: "05:00",
      FLIGHT_ARRIVE_DAY: "יום ה'",
      FLIGHT_ARRIVE_DATE: "17",
      FLIGHT_ARRIVE_MONTH: "אפר'",
      FLIGHT_ARRIVE_TIME: "09:20",
      FLIGHT_CLASS: "מחלקת תיירים"
    },
    {
      FLIGHT_DIRECTION: "טיסה/ות חזור 🛬",
      FLIGHT_AIRLINE: "EL AL",
      FLIGHT_NUMBER: "LY396",
      FLIGHT_ORIGIN_CITY: "מדריד",
      FLIGHT_ORIGIN_CODE: "MAD",
      FLIGHT_DEST_CITY: "תל אביב",
      FLIGHT_DEST_CODE: "TLV",
      FLIGHT_DEPART_DAY: "יום א'",
      FLIGHT_DEPART_DATE: "20",
      FLIGHT_DEPART_MONTH: "אפר'",
      FLIGHT_DEPART_TIME: "11:00",
      FLIGHT_ARRIVE_DAY: "יום א'",
      FLIGHT_ARRIVE_DATE: "20",
      FLIGHT_ARRIVE_MONTH: "אפר'",
      FLIGHT_ARRIVE_TIME: "16:40",
      FLIGHT_CLASS: "מחלקת תיירים"
    }
  ],
  en: [
    {
      FLIGHT_DIRECTION: "Outbound flights 🛫",
      FLIGHT_AIRLINE: "EL AL",
      FLIGHT_NUMBER: "LY395",
      FLIGHT_ORIGIN_CITY: "Tel Aviv",
      FLIGHT_ORIGIN_CODE: "TLV",
      FLIGHT_DEST_CITY: "Madrid",
      FLIGHT_DEST_CODE: "MAD",
      FLIGHT_DEPART_DAY: "Thu",
      FLIGHT_DEPART_DATE: "17",
      FLIGHT_DEPART_MONTH: "APR",
      FLIGHT_DEPART_TIME: "05:00",
      FLIGHT_ARRIVE_DAY: "Thu",
      FLIGHT_ARRIVE_DATE: "17",
      FLIGHT_ARRIVE_MONTH: "APR",
      FLIGHT_ARRIVE_TIME: "09:20",
      FLIGHT_CLASS: "Economy"
    },
    {
      FLIGHT_DIRECTION: "Inbound flights 🛬",
      FLIGHT_AIRLINE: "EL AL",
      FLIGHT_NUMBER: "LY396",
      FLIGHT_ORIGIN_CITY: "Madrid",
      FLIGHT_ORIGIN_CODE: "MAD",
      FLIGHT_DEST_CITY: "Tel Aviv",
      FLIGHT_DEST_CODE: "TLV",
      FLIGHT_DEPART_DAY: "Sun",
      FLIGHT_DEPART_DATE: "20",
      FLIGHT_DEPART_MONTH: "APR",
      FLIGHT_DEPART_TIME: "11:00",
      FLIGHT_ARRIVE_DAY: "Sun",
      FLIGHT_ARRIVE_DATE: "20",
      FLIGHT_ARRIVE_MONTH: "APR",
      FLIGHT_ARRIVE_TIME: "16:40",
      FLIGHT_CLASS: "Economy"
    }
  ],
  fr: [
    {
      FLIGHT_DIRECTION: "Vol aller 🛫",
      FLIGHT_AIRLINE: "EL AL",
      FLIGHT_NUMBER: "LY395",
      FLIGHT_ORIGIN_CITY: "Tel Aviv",
      FLIGHT_ORIGIN_CODE: "TLV",
      FLIGHT_DEST_CITY: "Madrid",
      FLIGHT_DEST_CODE: "MAD",
      FLIGHT_DEPART_DAY: "jeu",
      FLIGHT_DEPART_DATE: "17",
      FLIGHT_DEPART_MONTH: "avr",
      FLIGHT_DEPART_TIME: "05:00",
      FLIGHT_ARRIVE_DAY: "jeu",
      FLIGHT_ARRIVE_DATE: "17",
      FLIGHT_ARRIVE_MONTH: "avr",
      FLIGHT_ARRIVE_TIME: "09:20",
      FLIGHT_CLASS: "Économie"
    },
    {
      FLIGHT_DIRECTION: "Vol retour 🛬",
      FLIGHT_AIRLINE: "EL AL",
      FLIGHT_NUMBER: "LY396",
      FLIGHT_ORIGIN_CITY: "Madrid",
      FLIGHT_ORIGIN_CODE: "MAD",
      FLIGHT_DEST_CITY: "Tel Aviv",
      FLIGHT_DEST_CODE: "TLV",
      FLIGHT_DEPART_DAY: "dim",
      FLIGHT_DEPART_DATE: "20",
      FLIGHT_DEPART_MONTH: "avr",
      FLIGHT_DEPART_TIME: "11:00",
      FLIGHT_ARRIVE_DAY: "dim",
      FLIGHT_ARRIVE_DATE: "20",
      FLIGHT_ARRIVE_MONTH: "avr",
      FLIGHT_ARRIVE_TIME: "16:40",
      FLIGHT_CLASS: "Économie"
    }
  ]
};

export default {
  name: "AdminPage",
  components: { TemplateEditor, WhatsAppPhonePreview },
  data() {
    return {
      authed: false,
      passwordInput: "",
      passwordError: false,
      PLACEHOLDERS,
      CATEGORIES,
      LANGUAGES,
      activeCategory: CATEGORIES[0].key,
      activeLang: "he",
      draftValue: "",
      savedValue: "",
      previewText: "",
      isCustom: false,
      resetConfirmText: "",
      history: []
    };
  },
  computed: {
    currentDir() {
      const found = LANGUAGES.find(l => l.key === this.activeLang);
      return found ? found.dir : "ltr";
    },
    currentLangLabel() {
      const found = LANGUAGES.find(l => l.key === this.activeLang);
      return found ? found.label.he : this.activeLang;
    },
    unsaved() {
      return this.draftValue !== this.savedValue;
    },
    editorKey() {
      return `${this.activeCategory}:${this.activeLang}`;
    }
  },
  watch: {
    activeCategory() {
      this.loadCurrent();
    },
    activeLang() {
      this.loadCurrent();
    }
  },
  created() {
    try {
      if (window.sessionStorage.getItem(AUTH_KEY) === "true") {
        this.authed = true;
      }
    } catch (e) { /* noop */ }
    if (this.authed) this.loadCurrent();
  },
  methods: {
    submitPassword() {
      if (this.passwordInput === ADMIN_PASSWORD) {
        try {
          window.sessionStorage.setItem(AUTH_KEY, "true");
        } catch (e) { /* noop */ }
        this.authed = true;
        this.passwordError = false;
        this.passwordInput = "";
        this.loadCurrent();
      } else {
        this.passwordError = true;
      }
    },
    logout() {
      try {
        window.sessionStorage.removeItem(AUTH_KEY);
      } catch (e) { /* noop */ }
      this.authed = false;
      this.draftValue = "";
      this.savedValue = "";
      this.previewText = "";
    },
    goHome() {
      this.$router.push("/");
    },
    loadCurrent() {
      const cat = this.activeCategory;
      const lang = this.activeLang;
      const loaded = loadTemplate(cat, lang);
      this.savedValue = loaded;
      this.draftValue = loaded;
      this.isCustom = hasCustomTemplate(cat, lang);
      this.previewText = "";
      this.resetConfirmText = "";
      this.history = loadHistory(cat, lang);
    },
    onEditorInput(newVal) {
      this.draftValue = newVal;
    },
    onSave() {
      saveTemplate(this.activeCategory, this.activeLang, this.draftValue);
      this.savedValue = this.draftValue;
      this.isCustom = true;
      this.history = loadHistory(this.activeCategory, this.activeLang);
      this.$q.notify({
        type: "positive",
        message: "התבנית נשמרה",
        position: "top",
        timeout: 1500
      });
    },
    onReset() {
      if (this.resetConfirmText.trim() !== "שחזר") return;
      resetTemplate(this.activeCategory, this.activeLang);
      const def = (DEFAULT_TEMPLATES[this.activeCategory] || {})[this.activeLang] || "";
      this.savedValue = def;
      this.draftValue = def;
      this.isCustom = false;
      this.resetConfirmText = "";
      this.history = loadHistory(this.activeCategory, this.activeLang);
      this.$q.notify({
        type: "info",
        message: "הוחזרה ברירת המחדל",
        position: "top",
        timeout: 1500
      });
    },
    restoreHistoryEntry(entry) {
      this.draftValue = entry.value;
      this.$q.notify({
        type: "info",
        message: "גרסה קודמת נטענה לעורך. לחץ ״שמור״ כדי לאמץ אותה.",
        position: "top",
        timeout: 3000
      });
    },
    formatTime(ts) {
      try {
        const d = new Date(ts);
        const pad = n => String(n).padStart(2, "0");
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch (e) {
        return "";
      }
    },
    snippet(value) {
      const txt = (value || "").replace(/\s+/g, " ").trim();
      return txt.length > 60 ? txt.slice(0, 60) + "…" : txt;
    },
    onDownloadBackup() {
      const payload = exportAllTemplates();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `templates-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
      this.$q.notify({
        type: "positive",
        message: "הגיבוי הורד",
        position: "top",
        timeout: 1500
      });
    },
    onUploadBackup(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || ""));
          const count = importAllTemplates(data);
          this.loadCurrent();
          this.$q.notify({
            type: "positive",
            message: `נטענו ${count} תבניות מהגיבוי`,
            position: "top",
            timeout: 2000
          });
        } catch (err) {
          this.$q.notify({
            type: "negative",
            message: "קובץ גיבוי לא תקין",
            position: "top",
            timeout: 2500
          });
        }
      };
      reader.readAsText(file);
    },
    onPreview() {
      const sample = PREVIEW_SAMPLES[this.activeLang] || PREVIEW_SAMPLES.en;
      const flights = PREVIEW_FLIGHTS[this.activeLang] || PREVIEW_FLIGHTS.en;
      const expanded = this.expandFlightBlockPreview(this.draftValue || "", flights);
      const rendered = expanded.replace(
        /\{\{([A-Z_]+)\}\}/g,
        (m, key) => (sample[key] !== undefined ? sample[key] : m)
      );
      this.previewText = rendered;
    },
    expandFlightBlockPreview(tpl, flights) {
      const hasPerFlightKey = FLIGHT_ITEM_KEYS.some(k =>
        tpl.includes(`{{${k}}}`)
      );
      if (!hasPerFlightKey) return tpl;

      const lines = tpl.split("\n");
      const flightKeyRe = new RegExp(
        `\\{\\{(${FLIGHT_ITEM_KEYS.join("|")})\\}\\}`
      );

      const blocks = [];
      let curStart = -1;
      for (let i = 0; i < lines.length; i++) {
        if (flightKeyRe.test(lines[i])) {
          if (curStart === -1) curStart = i;
        } else if (curStart !== -1) {
          blocks.push({ start: curStart, end: i - 1 });
          curStart = -1;
        }
      }
      if (curStart !== -1) blocks.push({ start: curStart, end: lines.length - 1 });
      if (!blocks.length) return tpl;

      const perBlock = blocks.map(() => []);
      flights.forEach((f, i) => {
        const bi = Math.min(i, blocks.length - 1);
        perBlock[bi].push(f);
      });

      const out = [];
      let i = 0;
      let bIdx = 0;
      while (i < lines.length) {
        if (bIdx < blocks.length && i === blocks[bIdx].start) {
          const { start, end } = blocks[bIdx];
          const blockTpl = lines.slice(start, end + 1).join("\n");
          if (perBlock[bIdx].length) {
            out.push(
              perBlock[bIdx]
                .map(f =>
                  blockTpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) =>
                    f[key] !== undefined ? f[key] : m
                  )
                )
                .join("\n")
            );
          }
          i = end + 1;
          bIdx++;
        } else {
          out.push(lines[i]);
          i++;
        }
      }
      return out.join("\n");
    }
  }
};
</script>

<style lang="scss" scoped>
$font-stack: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
  'Helvetica Neue', Arial, sans-serif;

.admin-page {
  padding-top: 90px;
  padding-bottom: 64px;
  min-height: 100vh;
  background: #f5f7fa;
  direction: rtl;
  font-family: $font-stack;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body.body--dark .admin-page {
  background: #121212;
}

/* Header (matches MessageBuilder header) */
.admin-header {
  background:
    radial-gradient(1200px 300px at 10% -10%, rgba(99, 153, 255, 0.25), transparent 60%),
    radial-gradient(900px 240px at 110% 0%, rgba(255, 180, 120, 0.15), transparent 55%),
    linear-gradient(180deg, #0b1730 0%, #0a1226 100%);
  box-shadow: 0 4px 24px rgba(6, 15, 35, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.admin-toolbar {
  padding: 12px 18px;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.admin-brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.15) inset,
    0 8px 20px rgba(99, 102, 241, 0.35);
  flex-shrink: 0;
}

.admin-brand-title {
  font-family: $font-stack;
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.admin-brand-subtitle {
  font-family: $font-stack;
  color: rgba(255, 255, 255, 0.58);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-top: 2px;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px !important;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

/* Gate */
.gate-wrapper {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.gate-card {
  background: #fff;
  border-radius: 16px;
  padding: 36px 32px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(11, 23, 48, 0.10);
  text-align: center;
}

body.body--dark .gate-card {
  background: #1e1e1e;
  color: #e0e0e0;
}

.gate-icon { font-size: 40px; margin-bottom: 10px; }

.gate-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #0b1730;
}

body.body--dark .gate-title { color: #8ab4f8; }

.gate-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

body.body--dark .gate-subtitle { color: #aaa; }

.gate-input { margin-bottom: 16px; }

.gate-btn {
  width: 100%;
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
}

/* Body */
.admin-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 20px 16px;
  width: 100%;
  box-sizing: border-box;
}

/* Pill tabs */
.pill-tabs-wrap {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  background: #fff;
  border: 1px solid #e4e9f1;
  border-radius: 999px;
  box-shadow: 0 1px 3px rgba(11, 23, 48, 0.06);
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.pill-tabs-sub {
  margin-bottom: 14px;
  background: #f3f6fb;
  border-color: #d9e2ec;
}

body.body--dark .pill-tabs-wrap {
  background: #1e1e1e;
  border-color: #333;
}

body.body--dark .pill-tabs-sub {
  background: #1c2733;
  border-color: #344c5e;
}

.pill-tab-admin {
  font-family: $font-stack;
  border: 0;
  background: transparent;
  color: #475569;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, transform 0.1s ease;
}

.pill-tab-admin:hover { color: #0b1730; }

.pill-tab-admin.active {
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.pill-tab-sub.active {
  background: linear-gradient(180deg, #6366f1, #4f46e5);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.pill-tab-admin:active { transform: scale(0.97); }

body.body--dark .pill-tab-admin { color: #aaa; }
body.body--dark .pill-tab-admin:hover { color: #fff; }

/* Status banner */
.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  margin: 12px 0;
  font-size: 14px;
  font-weight: 500;
}

.banner-default {
  background: #f1f5f9;
  color: #475569;
}

.banner-custom {
  background: #fef3c7;
  color: #92400e;
}

body.body--dark .banner-default { background: #2a2a2a; color: #bbb; }
body.body--dark .banner-custom { background: #4a3b10; color: #fde68a; }

.banner-dirty {
  margin-inline-start: auto;
  color: #dc2626;
  font-weight: 700;
}

/* Editor card wrapper */
.editor-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(11, 23, 48, 0.08);
  margin-top: 4px;
}

body.body--dark .editor-card { background: #1e1e1e; }

/* Actions */
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.primary-btn {
  border-radius: 10px;
  padding: 0 22px;
  font-weight: 600;
  min-height: 42px;
}

.primary-btn ::v-deep .q-btn__content { font-size: 15px; }

/* Preview */
.preview-wrap { margin-top: 20px; }

.preview-label {
  font-size: 13px;
  color: #555;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

body.body--dark .preview-label { color: #bbb; }

/* Backup section */
.backup-section {
  margin-top: 20px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(11, 23, 48, 0.08);
  overflow: hidden;
}

body.body--dark .backup-section { background: #1e1e1e; }

.backup-section ::v-deep .backup-section-header {
  padding: 14px 18px;
  font-family: $font-stack;
  font-weight: 600;
  font-size: 15px;
  color: #1d4ed8;
}

body.body--dark .backup-section ::v-deep .backup-section-header { color: #8ab4f8; }

.backup-body { padding: 4px 18px 18px; }

.backup-info {
  font-size: 13.5px;
  color: #475569;
  margin: 0 0 14px;
  line-height: 1.6;
}

body.body--dark .backup-info { color: #aab; }

.backup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hidden-file-input { display: none; }

.history-block {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #d9e2ec;
}

body.body--dark .history-block { border-top-color: #2e3842; }

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 10px;
}

body.body--dark .history-title { color: #cbd5e1; }

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef2f7;
}

body.body--dark .history-row {
  background: #212a34;
  border-color: #2e3842;
}

.history-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-when {
  font-size: 12.5px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

body.body--dark .history-when { color: #94a3b8; }

.history-preview {
  font-size: 13px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body.body--dark .history-preview { color: #cbd5e1; }

/* Danger zone */
.danger-zone {
  margin-top: 28px;
  border: 2px solid #fca5a5;
  border-radius: 14px;
  background: #fff5f5;
  overflow: hidden;
}

body.body--dark .danger-zone {
  border-color: #7f1d1d;
  background: #2a1515;
}

.danger-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(180deg, #fee2e2, #fecaca);
  color: #991b1b;
  font-size: 15px;
  font-weight: 700;
  border-bottom: 1px solid #fca5a5;
  letter-spacing: 0.3px;
}

body.body--dark .danger-header {
  background: linear-gradient(180deg, #3a1414, #2a1010);
  color: #fca5a5;
  border-bottom-color: #7f1d1d;
}

.danger-icon { font-size: 18px; }

.danger-body { padding: 16px 18px 18px; }

.danger-label {
  font-size: 15px;
  font-weight: 600;
  color: #7f1d1d;
  margin-bottom: 6px;
}

body.body--dark .danger-label { color: #fecaca; }

.danger-desc {
  font-size: 13.5px;
  color: #991b1b;
  line-height: 1.7;
  margin-bottom: 14px;
}

body.body--dark .danger-desc { color: #f3b0b0; }

.danger-word {
  display: inline-block;
  padding: 0 8px;
  background: #fecaca;
  border-radius: 5px;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
}

body.body--dark .danger-word {
  background: #7f1d1d;
  color: #fecaca;
}

.danger-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
}

.danger-input {
  flex: 1;
  min-width: 200px;
}
</style>
