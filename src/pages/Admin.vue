<template>
  <q-page class="admin-page" dir="rtl">
    <q-header class="admin-header">
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="goHome"
          aria-label="חזרה"
        />
        <q-toolbar-title class="admin-title">
          <span>&#9881;</span>&nbsp;ניהול תבניות
        </q-toolbar-title>
        <q-btn
          v-if="authed"
          flat
          dense
          icon="logout"
          label="יציאה"
          no-caps
          @click="logout"
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
      <!-- Category tabs -->
      <q-tabs
        v-model="activeCategory"
        class="cat-tabs"
        dense
        no-caps
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab
          v-for="cat in CATEGORIES"
          :key="cat.key"
          :name="cat.key"
          :label="cat.label.he"
        />
      </q-tabs>

      <!-- Language tabs -->
      <q-tabs
        v-model="activeLang"
        class="lang-tabs"
        dense
        no-caps
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab
          v-for="lng in LANGUAGES"
          :key="lng.key"
          :name="lng.key"
          :label="lng.label.he"
        />
      </q-tabs>

      <!-- Status banner -->
      <div class="status-banner" :class="isCustom ? 'banner-custom' : 'banner-default'">
        <span class="banner-icon">{{ isCustom ? '✏️' : '📄' }}</span>
        <span class="banner-text">
          {{ isCustom ? 'תבנית מותאמת אישית (שמורה)' : 'תבנית ברירת מחדל' }}
        </span>
        <span v-if="unsaved" class="banner-dirty">• לא נשמר</span>
      </div>

      <!-- Editor -->
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

      <!-- Action buttons -->
      <div class="action-row">
        <q-btn
          color="primary"
          label="שמור"
          icon="save"
          unelevated
          no-caps
          :disable="!unsaved"
          @click="onSave"
        />
        <q-btn
          color="grey-7"
          label="שחזר ברירת מחדל"
          icon="restore"
          outline
          no-caps
          @click="onReset"
        />
        <q-btn
          color="secondary"
          label="תצוגה מקדימה"
          icon="visibility"
          outline
          no-caps
          @click="onPreview"
        />
      </div>

      <!-- Preview -->
      <div v-if="previewText" class="preview-box" :dir="currentDir">
        <div class="preview-label">תצוגה מקדימה (עם ערכי דוגמה):</div>
        <pre class="preview-pre">{{ previewText }}</pre>
      </div>
    </div>

    <q-dialog v-model="confirmReset">
      <q-card class="confirm-card" dir="rtl">
        <q-card-section class="confirm-title">שחזור ברירת מחדל</q-card-section>
        <q-card-section class="confirm-body">
          פעולה זו תמחק את התבנית המותאמת אישית עבור {{ currentLangLabel }}
          ותחזיר את ברירת המחדל. להמשיך?
        </q-card-section>
        <q-card-actions align="left">
          <q-btn flat label="ביטול" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            label="שחזר"
            color="negative"
            no-caps
            @click="confirmResetAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import TemplateEditor from "src/components/TemplateEditor.vue";
import {
  PLACEHOLDERS,
  CATEGORIES,
  LANGUAGES,
  DEFAULT_TEMPLATES,
  loadTemplate,
  saveTemplate,
  resetTemplate,
  hasCustomTemplate
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
    BAGGAGE: "✅ מזוודה (23 ק\"ג)\n✅ תיק עלייה למטוס",
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
    BAGGAGE: "1 checked bag (23kg)\n1 carry-on",
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
    BAGGAGE: "1 bagage en soute (23kg)\n1 bagage cabine",
    CHANGE_FEE: "$100",
    CANCEL_FEE: "250",
    NO_SHOW: "Totalement perdu",
    TICKET_ISSUANCE: "Immédiat",
    FAREWELL: "Cordialement,\nGad Elnekave"
  }
};

export default {
  name: "AdminPage",
  components: { TemplateEditor },
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
      confirmReset: false,
      isCustom: false
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
    },
    onEditorInput(newVal) {
      this.draftValue = newVal;
    },
    onSave() {
      saveTemplate(this.activeCategory, this.activeLang, this.draftValue);
      this.savedValue = this.draftValue;
      this.isCustom = true;
      this.$q.notify({
        type: "positive",
        message: "התבנית נשמרה",
        position: "top",
        timeout: 1500
      });
    },
    onReset() {
      this.confirmReset = true;
    },
    confirmResetAction() {
      resetTemplate(this.activeCategory, this.activeLang);
      const def = (DEFAULT_TEMPLATES[this.activeCategory] || {})[this.activeLang] || "";
      this.savedValue = def;
      this.draftValue = def;
      this.isCustom = false;
      this.confirmReset = false;
      this.$q.notify({
        type: "info",
        message: "הוחזרה ברירת המחדל",
        position: "top",
        timeout: 1500
      });
    },
    onPreview() {
      const sample = PREVIEW_SAMPLES[this.activeLang] || PREVIEW_SAMPLES.en;
      const rendered = (this.draftValue || "").replace(
        /\{\{([A-Z_]+)\}\}/g,
        (m, key) => (sample[key] !== undefined ? sample[key] : m)
      );
      this.previewText = rendered;
    }
  }
};
</script>

<style lang="scss" scoped>
.admin-page {
  padding-top: 80px;
  padding-bottom: 48px;
  min-height: 100vh;
  background: #f5f7fa;
  direction: rtl;
}

body.body--dark .admin-page {
  background: #121212;
}

.admin-header {
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
}

.admin-title {
  font-size: 17px;
  font-weight: 600;
}

.gate-wrapper {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.gate-card {
  background: #fff;
  border-radius: 14px;
  padding: 32px 28px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  text-align: center;
}

body.body--dark .gate-card {
  background: #1e1e1e;
  color: #e0e0e0;
}

.gate-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.gate-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #1a73e8;
}

.gate-subtitle {
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
}

body.body--dark .gate-subtitle {
  color: #aaa;
}

.gate-input {
  margin-bottom: 16px;
}

.gate-btn {
  width: 100%;
  border-radius: 8px;
  padding: 10px;
}

.admin-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.cat-tabs,
.lang-tabs {
  background: #fff;
  border-radius: 10px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

body.body--dark .cat-tabs,
body.body--dark .lang-tabs {
  background: #1e1e1e;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  margin: 12px 0;
  font-size: 13px;
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

body.body--dark .banner-default {
  background: #2a2a2a;
  color: #bbb;
}

body.body--dark .banner-custom {
  background: #4a3b10;
  color: #fde68a;
}

.banner-dirty {
  margin-inline-start: auto;
  color: #dc2626;
  font-weight: 700;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preview-box {
  margin-top: 16px;
  background: #e7ffdb;
  border-radius: 10px;
  padding: 12px 14px;
}

body.body--dark .preview-box {
  background: #1a3a2a;
}

.preview-label {
  font-size: 12px;
  color: #555;
  font-weight: 600;
  margin-bottom: 6px;
}

body.body--dark .preview-label {
  color: #bbb;
}

.preview-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  color: #111;
}

body.body--dark .preview-pre {
  color: #e0e0e0;
}

.confirm-card {
  min-width: 300px;
  direction: rtl;
}

.confirm-title {
  font-weight: 700;
  font-size: 16px;
}

.confirm-body {
  font-size: 14px;
  line-height: 1.6;
}
</style>
