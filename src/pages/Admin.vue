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
          flat
          round
          dense
          :icon="darkMode ? 'light_mode' : 'dark_mode'"
          color="white"
          class="icon-btn"
          @click="toggleDarkMode"
          :aria-label="darkMode ? 'מצב בהיר' : 'מצב חושך'"
        />
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
          v-for="cat in categories"
          :key="cat.key"
          type="button"
          class="pill-tab-admin"
          :class="{ active: activeCategory === cat.key }"
          @click="activeCategory = cat.key"
        >
          {{ cat.label.he }}
        </button>
        <button
          type="button"
          class="pill-tab-admin pill-add"
          @click="openAddCategory"
          aria-label="הוסף קטגוריה"
        >
          + קטגוריה חדשה
        </button>
      </div>

      <!-- Edit/delete strip (custom categories only) -->
      <div v-if="!activeIsBuiltIn" class="custom-cat-actions">
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          color="primary"
          icon="edit"
          label="ערוך שם"
          @click="openEditCategory"
        />
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          color="negative"
          icon="delete"
          label="מחק קטגוריה"
          @click="openDeleteCategory"
        />
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
      <div class="status-banner" :class="bannerClass">
        <span class="banner-icon">{{ bannerIcon }}</span>
        <span class="banner-text">{{ bannerText }}</span>
        <span v-if="unsaved" class="banner-dirty">• לא נשמר</span>
      </div>

      <!-- View-mode switch -->
      <div class="view-switch" role="tablist" aria-label="מצב עריכה">
        <button
          type="button"
          class="view-switch-btn"
          :class="{ active: !showPreview }"
          @click="showPreview = false"
          role="tab"
          :aria-selected="!showPreview"
        >
          <span class="view-switch-icon">📝</span>
          <span>עורך טקסט</span>
        </button>
        <button
          type="button"
          class="view-switch-btn"
          :class="{ active: showPreview }"
          @click="showPreview = true"
          role="tab"
          :aria-selected="showPreview"
        >
          <span class="view-switch-icon">📱</span>
          <span>תצוגה כטלפון</span>
        </button>
      </div>

      <!-- Editor -->
      <div v-if="!showPreview" class="editor-card">
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

      <!-- Preview (replaces editor in place) -->
      <div v-else class="preview-wrap">
        <div class="preview-label">
          תצוגה מקדימה (ערכי דוגמה) — לחץ ״ערוך״ לעריכה בפורמט טלפון
        </div>
        <WhatsAppPhonePreview
          :text="previewText"
          :edit-value="draftValue"
          :dir="currentDir"
          contact-name="Gad Elnekave"
          :spacing-mode="true"
          :spacing-samples="spacingSamples"
          edit-hint="עריכת רווחים בלבד — אפשר להוסיף או למחוק רווחים ושורות בין המילים. לחץ ״שמור״ לשמירה."
          @update:editValue="draftValue = $event"
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

      <!-- Danger zone (only for categories that have a built-in default to restore to) -->
      <div v-if="activeHasDefault" class="danger-zone">
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

    <!-- Add/edit category dialog -->
    <q-dialog v-model="categoryDialog.open" persistent>
      <q-card class="cat-dialog-card" dir="rtl">
        <q-card-section class="cat-dialog-header">
          {{ categoryDialog.mode === 'add' ? 'הוסף קטגוריה חדשה' : 'ערוך שם קטגוריה' }}
        </q-card-section>
        <q-card-section class="cat-dialog-body">
          <q-input
            v-model="categoryDialog.labelHe"
            outlined
            dense
            dir="rtl"
            label="שם בעברית (חובה)"
            class="cat-dialog-input"
            :error="!!categoryDialog.error"
            :error-message="categoryDialog.error"
            @keyup.enter="submitCategoryDialog"
          />
          <q-input
            v-model="categoryDialog.labelEn"
            outlined
            dense
            dir="ltr"
            label="Name (English)"
            class="cat-dialog-input"
          />
          <q-input
            v-model="categoryDialog.labelFr"
            outlined
            dense
            dir="ltr"
            label="Nom (Français)"
            class="cat-dialog-input"
          />
          <div class="cat-dialog-hint">
            השמות באנגלית/צרפתית הם אופציונליים — אם תשאיר ריק נשתמש בעברית.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="cat-dialog-actions">
          <q-btn flat no-caps label="ביטול" @click="closeCategoryDialog" />
          <q-btn
            color="primary"
            unelevated
            no-caps
            :label="categoryDialog.mode === 'add' ? 'הוסף' : 'שמור'"
            @click="submitCategoryDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete category confirm dialog -->
    <q-dialog v-model="deleteDialog.open" persistent>
      <q-card class="cat-dialog-card" dir="rtl">
        <q-card-section class="cat-dialog-header danger-header-text">
          מחיקת קטגוריה
        </q-card-section>
        <q-card-section class="cat-dialog-body">
          <div class="cat-delete-text">
            האם למחוק את הקטגוריה <b>{{ deleteTargetLabel }}</b>?
            פעולה זו תמחק גם את כל התבניות וההיסטוריה שלה בכל השפות.
            <br />הפעולה אינה הפיכה.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="cat-dialog-actions">
          <q-btn flat no-caps label="ביטול" @click="deleteDialog.open = false" />
          <q-btn
            color="negative"
            unelevated
            no-caps
            label="מחק לצמיתות"
            icon="delete_forever"
            @click="confirmDeleteCategory"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import TemplateEditor from "src/components/TemplateEditor.vue";
import WhatsAppPhonePreview from "src/components/WhatsAppPhonePreview.vue";
import { LocalStorage } from "quasar";
import {
  PLACEHOLDERS,
  LANGUAGES,
  DEFAULT_TEMPLATES,
  FLIGHT_ITEM_KEYS,
  loadTemplate,
  saveTemplate,
  resetTemplate,
  hasCustomTemplate,
  hasDefaultTemplate,
  loadHistory,
  exportAllTemplates,
  importAllTemplates,
  getAllCategories,
  addCategory,
  renameCategory,
  deleteCategory,
  isBuiltInCategory
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
      "*מסלול הטיסות 🌍*\n*טיסה/ות הלוך🛫*\nטיסת El Al - *LY543*\nתל אביב ⬅️ אתונה (ATH)\nמחלקת תיירים/עסקים/פרמיום\nממריא יום ג' 19 מאי 19:30\nנוחת    יום ג' 19 מאי 21:40\n💺 (מושב - *XX*)\n\n*טיסה/ות חזור 🛬*\nטיסת El Al - *LY542*\nאתונה (ATH) ⬅️ תל אביב\nמחלקת תיירים/עסקים/פרמיום\nממריא יום ב' 25 מאי 10:35\nנוחת    יום ב' 25 מאי 12:35\n💺(מושב - *XX*)",
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
      "*Itinerary 🌍*\n*Outbound flight🛫*\nEl Al - *LY543*\nTel-aviv ➡️ Athens (ATH)\nEconomy/Premium/Business Class\nDpt. Tue. 19 MAY 19:30\nArr.  Tue. 19 MAY 21:40\n💺 (Seat *XX*)\n\n*Inbound flight 🛬*\nEl Al - *LY542*\nAthens (ATH) ➡️ Tel-aviv\nEconomy/Premium/Business Class\nDpt. Mon. 25 MAY 10:35\nArr.  Mon. 25 MAY 12:35\n💺 (Seat *XX*)",
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
      "*Itinéraire 🌍*\n*Vol aller 🛫*\nEl Al - *LY543*\nTel-aviv ➡️ Athens (ATH)\nEconomy/Premium/Business Class\nDpt. Mar 19 MAI 19:30\nArr.  Mar 19 MAI 21:40\n💺 (Siege *XX*)\n\n*Vol retour 🛬*\nEl Al - *LY542*\nAthens (ATH) ➡️ Tel-aviv (TLV)\nEconomy/Premium/Business Class\nDpt. Lun 25 MAI 10:35\nArr.  Lun 25 MAI 12:35\n💺 (Siege *XX*)",
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

// Sample per-flight data for the Preview button — round-trip TLV ↔ ATH, 2 flights.
const PREVIEW_FLIGHTS = {
  he: [
    {
      FLIGHT_DIRECTION: "טיסה/ות הלוך🛫",
      FLIGHT_AIRLINE: "El Al",
      FLIGHT_NUMBER: "LY543",
      FLIGHT_ORIGIN_CITY: "תל אביב",
      FLIGHT_ORIGIN_CODE: "TLV",
      FLIGHT_DEST_CITY: "אתונה",
      FLIGHT_DEST_CODE: "ATH",
      FLIGHT_DEPART_DAY: "יום ג'",
      FLIGHT_DEPART_DATE: "19",
      FLIGHT_DEPART_MONTH: "מאי",
      FLIGHT_DEPART_TIME: "19:30",
      FLIGHT_ARRIVE_DAY: "יום ג'",
      FLIGHT_ARRIVE_DATE: "19",
      FLIGHT_ARRIVE_MONTH: "מאי",
      FLIGHT_ARRIVE_TIME: "21:40",
      FLIGHT_CLASS: "מחלקת תיירים"
    },
    {
      FLIGHT_DIRECTION: "טיסה/ות חזור 🛬",
      FLIGHT_AIRLINE: "El Al",
      FLIGHT_NUMBER: "LY542",
      FLIGHT_ORIGIN_CITY: "אתונה",
      FLIGHT_ORIGIN_CODE: "ATH",
      FLIGHT_DEST_CITY: "תל אביב",
      FLIGHT_DEST_CODE: "TLV",
      FLIGHT_DEPART_DAY: "יום ב'",
      FLIGHT_DEPART_DATE: "25",
      FLIGHT_DEPART_MONTH: "מאי",
      FLIGHT_DEPART_TIME: "10:35",
      FLIGHT_ARRIVE_DAY: "יום ב'",
      FLIGHT_ARRIVE_DATE: "25",
      FLIGHT_ARRIVE_MONTH: "מאי",
      FLIGHT_ARRIVE_TIME: "12:35",
      FLIGHT_CLASS: "מחלקת תיירים"
    }
  ],
  en: [
    {
      FLIGHT_DIRECTION: "Outbound flight🛫",
      FLIGHT_AIRLINE: "El Al",
      FLIGHT_NUMBER: "LY543",
      FLIGHT_ORIGIN_CITY: "Tel-aviv",
      FLIGHT_ORIGIN_CODE: "TLV",
      FLIGHT_DEST_CITY: "Athens",
      FLIGHT_DEST_CODE: "ATH",
      FLIGHT_DEPART_DAY: "Tue",
      FLIGHT_DEPART_DATE: "19",
      FLIGHT_DEPART_MONTH: "MAY",
      FLIGHT_DEPART_TIME: "19:30",
      FLIGHT_ARRIVE_DAY: "Tue",
      FLIGHT_ARRIVE_DATE: "19",
      FLIGHT_ARRIVE_MONTH: "MAY",
      FLIGHT_ARRIVE_TIME: "21:40",
      FLIGHT_CLASS: "Economy"
    },
    {
      FLIGHT_DIRECTION: "Inbound flight 🛬",
      FLIGHT_AIRLINE: "El Al",
      FLIGHT_NUMBER: "LY542",
      FLIGHT_ORIGIN_CITY: "Athens",
      FLIGHT_ORIGIN_CODE: "ATH",
      FLIGHT_DEST_CITY: "Tel-aviv",
      FLIGHT_DEST_CODE: "TLV",
      FLIGHT_DEPART_DAY: "Mon",
      FLIGHT_DEPART_DATE: "25",
      FLIGHT_DEPART_MONTH: "MAY",
      FLIGHT_DEPART_TIME: "10:35",
      FLIGHT_ARRIVE_DAY: "Mon",
      FLIGHT_ARRIVE_DATE: "25",
      FLIGHT_ARRIVE_MONTH: "MAY",
      FLIGHT_ARRIVE_TIME: "12:35",
      FLIGHT_CLASS: "Economy"
    }
  ],
  fr: [
    {
      FLIGHT_DIRECTION: "Vol aller 🛫",
      FLIGHT_AIRLINE: "El Al",
      FLIGHT_NUMBER: "LY543",
      FLIGHT_ORIGIN_CITY: "Tel-aviv",
      FLIGHT_ORIGIN_CODE: "TLV",
      FLIGHT_DEST_CITY: "Athens",
      FLIGHT_DEST_CODE: "ATH",
      FLIGHT_DEPART_DAY: "Mar",
      FLIGHT_DEPART_DATE: "19",
      FLIGHT_DEPART_MONTH: "MAI",
      FLIGHT_DEPART_TIME: "19:30",
      FLIGHT_ARRIVE_DAY: "Mar",
      FLIGHT_ARRIVE_DATE: "19",
      FLIGHT_ARRIVE_MONTH: "MAI",
      FLIGHT_ARRIVE_TIME: "21:40",
      FLIGHT_CLASS: "Économie"
    },
    {
      FLIGHT_DIRECTION: "Vol retour 🛬",
      FLIGHT_AIRLINE: "El Al",
      FLIGHT_NUMBER: "LY542",
      FLIGHT_ORIGIN_CITY: "Athens",
      FLIGHT_ORIGIN_CODE: "ATH",
      FLIGHT_DEST_CITY: "Tel-aviv",
      FLIGHT_DEST_CODE: "TLV",
      FLIGHT_DEPART_DAY: "Lun",
      FLIGHT_DEPART_DATE: "25",
      FLIGHT_DEPART_MONTH: "MAI",
      FLIGHT_DEPART_TIME: "10:35",
      FLIGHT_ARRIVE_DAY: "Lun",
      FLIGHT_ARRIVE_DATE: "25",
      FLIGHT_ARRIVE_MONTH: "MAI",
      FLIGHT_ARRIVE_TIME: "12:35",
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
      LANGUAGES,
      categories: getAllCategories(),
      activeCategory: "flight",
      activeLang: "he",
      draftValue: "",
      savedValue: "",
      showPreview: false,
      isCustom: false,
      resetConfirmText: "",
      history: [],
      darkMode: false,
      categoryDialog: {
        open: false,
        mode: "add",
        editingKey: null,
        labelHe: "",
        labelEn: "",
        labelFr: "",
        error: ""
      },
      deleteDialog: {
        open: false,
        targetKey: null
      }
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
    activeIsBuiltIn() {
      return isBuiltInCategory(this.activeCategory);
    },
    activeHasDefault() {
      return hasDefaultTemplate(this.activeCategory);
    },
    bannerClass() {
      if (this.isCustom) return "banner-custom";
      if (!this.activeHasDefault) return "banner-empty";
      return "banner-default";
    },
    bannerIcon() {
      if (this.isCustom) return "✏️";
      if (!this.activeHasDefault) return "📋";
      return "📄";
    },
    bannerText() {
      if (this.isCustom) return "תבנית מותאמת אישית (שמורה)";
      if (!this.activeHasDefault) return "תבנית חדשה — הדבק או הקלד את הפורמט שלך";
      return "תבנית ברירת מחדל";
    },
    deleteTargetLabel() {
      const cat = this.categories.find(c => c.key === this.deleteDialog.targetKey);
      return cat ? cat.label.he : "";
    },
    unsaved() {
      return this.draftValue !== this.savedValue;
    },
    editorKey() {
      return `${this.activeCategory}:${this.activeLang}`;
    },
    previewText() {
      const sample = PREVIEW_SAMPLES[this.activeLang] || PREVIEW_SAMPLES.en;
      const flights = PREVIEW_FLIGHTS[this.activeLang] || PREVIEW_FLIGHTS.en;
      const expanded = this.expandFlightBlockPreview(this.draftValue || "", flights);
      return expanded.replace(
        /\{\{([A-Z_]+)\}\}/g,
        (m, key) => (sample[key] !== undefined ? sample[key] : m)
      );
    },
    spacingSamples() {
      const base = PREVIEW_SAMPLES[this.activeLang] || PREVIEW_SAMPLES.en;
      const flight = (PREVIEW_FLIGHTS[this.activeLang] || PREVIEW_FLIGHTS.en)[0] || {};
      return { ...base, ...flight };
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
    this.darkMode = !!LocalStorage.getItem("darkMode");
    this.$q.dark.set(this.darkMode);
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
      this.showPreview = false;
    },
    goHome() {
      this.$router.push("/");
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      this.$q.dark.set(this.darkMode);
      LocalStorage.set("darkMode", this.darkMode);
    },
    loadCurrent() {
      const cat = this.activeCategory;
      const lang = this.activeLang;
      const loaded = loadTemplate(cat, lang);
      this.savedValue = loaded;
      this.draftValue = loaded;
      this.isCustom = hasCustomTemplate(cat, lang);
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
          this.refreshCategories();
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
    refreshCategories() {
      this.categories = getAllCategories();
    },
    openAddCategory() {
      this.categoryDialog = {
        open: true,
        mode: "add",
        editingKey: null,
        labelHe: "",
        labelEn: "",
        labelFr: "",
        error: ""
      };
    },
    openEditCategory() {
      const cat = this.categories.find(c => c.key === this.activeCategory);
      if (!cat) return;
      this.categoryDialog = {
        open: true,
        mode: "edit",
        editingKey: cat.key,
        labelHe: cat.label.he || "",
        labelEn: cat.label.en === cat.label.he ? "" : (cat.label.en || ""),
        labelFr: cat.label.fr === cat.label.he ? "" : (cat.label.fr || ""),
        error: ""
      };
    },
    closeCategoryDialog() {
      this.categoryDialog.open = false;
    },
    submitCategoryDialog() {
      const he = (this.categoryDialog.labelHe || "").trim();
      if (!he) {
        this.categoryDialog.error = "יש להזין שם בעברית";
        return;
      }
      const label = {
        he,
        en: (this.categoryDialog.labelEn || "").trim(),
        fr: (this.categoryDialog.labelFr || "").trim()
      };
      try {
        if (this.categoryDialog.mode === "add") {
          const rec = addCategory(label);
          this.refreshCategories();
          this.activeCategory = rec.key;
          this.$q.notify({
            type: "positive",
            message: "הקטגוריה נוספה",
            position: "top",
            timeout: 1500
          });
        } else {
          renameCategory(this.categoryDialog.editingKey, label);
          this.refreshCategories();
          this.$q.notify({
            type: "positive",
            message: "השם עודכן",
            position: "top",
            timeout: 1500
          });
        }
        this.closeCategoryDialog();
      } catch (e) {
        this.categoryDialog.error = "שמירה נכשלה — נסה שנית";
      }
    },
    openDeleteCategory() {
      if (this.activeIsBuiltIn) return;
      this.deleteDialog = { open: true, targetKey: this.activeCategory };
    },
    confirmDeleteCategory() {
      const key = this.deleteDialog.targetKey;
      if (!key || isBuiltInCategory(key)) {
        this.deleteDialog.open = false;
        return;
      }
      try {
        deleteCategory(key);
        this.deleteDialog.open = false;
        this.activeCategory = "flight";
        this.refreshCategories();
        this.loadCurrent();
        this.$q.notify({
          type: "info",
          message: "הקטגוריה נמחקה",
          position: "top",
          timeout: 1800
        });
      } catch (e) {
        this.$q.notify({
          type: "negative",
          message: "מחיקה נכשלה",
          position: "top",
          timeout: 1800
        });
      }
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

      const segs = [];
      let cur = null;
      for (let li = 0; li < lines.length; li++) {
        const ln = lines[li];
        if (ln.trim() === "") {
          if (cur) { segs.push(cur); cur = null; }
          segs.push({ type: "blank" });
        } else {
          if (!cur) cur = { type: "para", lines: [], hasFlight: false };
          cur.lines.push(ln);
          if (flightKeyRe.test(ln)) cur.hasFlight = true;
        }
      }
      if (cur) segs.push(cur);

      const blockIdx = [];
      segs.forEach((s, si) => {
        if (s.type === "para" && s.hasFlight) blockIdx.push(si);
      });
      if (!blockIdx.length) return tpl;

      const perBlock = blockIdx.map(() => []);
      flights.forEach((f, fi) => {
        const bi = Math.min(fi, blockIdx.length - 1);
        perBlock[bi].push(f);
      });

      const out = [];
      for (let si = 0; si < segs.length; si++) {
        const s = segs[si];
        if (s.type === "blank") { out.push(""); continue; }
        const bi = blockIdx.indexOf(si);
        if (bi === -1) {
          out.push(s.lines.join("\n"));
        } else if (perBlock[bi].length) {
          out.push(
            perBlock[bi]
              .map(f =>
                s.lines.join("\n").replace(/\{\{([A-Z_]+)\}\}/g, (m, key) =>
                  f[key] !== undefined ? f[key] : m
                )
              )
              .join("\n")
          );
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

/* View-mode switch (Editor vs Phone preview) */
.view-switch {
  display: flex;
  gap: 6px;
  padding: 5px;
  background: #fff;
  border: 1px solid #e4e9f1;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(11, 23, 48, 0.06);
  margin: 6px 0 14px;
  width: 100%;
  box-sizing: border-box;
}

body.body--dark .view-switch {
  background: #1e1e1e;
  border-color: #333;
}

.view-switch-btn {
  flex: 1;
  font-family: $font-stack;
  border: 0;
  background: transparent;
  color: #475569;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.view-switch-btn:hover { color: #0b1730; }

.view-switch-btn:active { transform: scale(0.98); }

.view-switch-btn.active {
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.32);
}

body.body--dark .view-switch-btn { color: #aaa; }
body.body--dark .view-switch-btn:hover { color: #fff; }

.view-switch-icon { font-size: 18px; line-height: 1; }

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

/* Add-category pill */
.pill-add {
  border: 1px dashed #94a3b8 !important;
  color: #1d4ed8 !important;
  background: transparent;
}

body.body--dark .pill-add {
  border-color: #4b5563 !important;
  color: #8ab4f8 !important;
}

.pill-add:hover {
  background: #eff6ff !important;
  border-color: #2563eb !important;
}

body.body--dark .pill-add:hover {
  background: #1e293b !important;
}

/* Custom category edit/delete strip */
.custom-cat-actions {
  display: flex;
  gap: 6px;
  margin: 0 0 10px;
  flex-wrap: wrap;
}

/* Banner for empty (newly created custom) categories */
.banner-empty {
  background: #e0f2fe;
  color: #075985;
}

body.body--dark .banner-empty {
  background: #0c2a3a;
  color: #7dd3fc;
}

/* Category add/edit/delete dialogs */
.cat-dialog-card {
  min-width: 320px;
  max-width: 440px;
  border-radius: 14px;
  font-family: $font-stack;
}

body.body--dark .cat-dialog-card {
  background: #1e1e1e;
  color: #e0e0e0;
}

.cat-dialog-header {
  font-size: 17px;
  font-weight: 700;
  color: #0b1730;
  padding: 18px 20px 8px;
}

body.body--dark .cat-dialog-header { color: #8ab4f8; }

.cat-dialog-header.danger-header-text { color: #991b1b; }
body.body--dark .cat-dialog-header.danger-header-text { color: #fca5a5; }

.cat-dialog-body {
  padding: 8px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cat-dialog-input { width: 100%; }

.cat-dialog-hint {
  font-size: 12.5px;
  color: #64748b;
  line-height: 1.5;
}

body.body--dark .cat-dialog-hint { color: #94a3b8; }

.cat-delete-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
}

body.body--dark .cat-delete-text { color: #cbd5e1; }

.cat-dialog-actions {
  padding: 8px 16px 16px;
  gap: 6px;
}
</style>
