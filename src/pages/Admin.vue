<template>
  <q-page class="admin-page">
    <!-- Login screen -->
    <div v-if="!authenticated" class="login-wrap">
      <q-card class="login-card">
        <q-card-section class="text-center">
          <q-icon name="lock" size="48px" color="primary" />
          <h5 class="q-mt-md q-mb-sm">פאנל ניהול תבניות</h5>
          <p class="text-grey-7 q-mb-lg">הזן סיסמה כדי לגשת</p>
          <q-input
            v-model="password"
            type="password"
            filled
            label="סיסמה"
            @keyup.enter="login"
            :error="loginError"
            :error-message="loginError ? 'סיסמה שגויה' : ''"
            autofocus
          />
          <q-btn
            color="primary"
            class="full-width q-mt-md"
            label="כניסה"
            @click="login"
          />
          <q-btn
            flat
            color="grey"
            class="full-width q-mt-sm"
            label="← חזרה לדף הראשי"
            to="/"
          />
        </q-card-section>
      </q-card>
    </div>

    <!-- Editor screen -->
    <div v-else class="editor-wrap">
      <q-header class="bg-primary">
        <q-toolbar>
          <q-btn flat icon="arrow_back" to="/" label="חזרה" />
          <q-toolbar-title>פאנל עריכת תבניות</q-toolbar-title>
          <q-btn flat icon="logout" @click="logout" label="יציאה" />
        </q-toolbar>
      </q-header>

      <div class="content q-pa-md">
        <!-- Category selector -->
        <div class="section-label">קטגוריה:</div>
        <q-tabs
          v-model="selectedCategory"
          class="bg-teal-2 text-teal-10 rounded-borders q-mb-lg"
          narrow-indicator
          dense
          align="justify"
        >
          <q-tab
            v-for="cat in categories"
            :key="cat.key"
            :name="cat.key"
            :label="cat.label.he"
          />
        </q-tabs>

        <!-- Language tabs -->
        <div class="section-label">שפה:</div>
        <q-tabs
          v-model="selectedLang"
          class="bg-blue-1 text-blue-10 rounded-borders q-mb-md"
          narrow-indicator
          dense
          align="justify"
        >
          <q-tab
            v-for="lng in languages"
            :key="lng.key"
            :name="lng.key"
            :label="lng.label"
          />
        </q-tabs>

        <q-banner
          v-if="isCustom"
          class="bg-green-1 text-green-10 q-mb-md"
          rounded
        >
          <q-icon name="check_circle" class="q-mr-sm" />
          בשימוש כרגע: תבנית מותאמת אישית שנשמרה על ידך.
        </q-banner>
        <q-banner v-else class="bg-grey-2 text-grey-8 q-mb-md" rounded>
          <q-icon name="info" class="q-mr-sm" />
          בשימוש כרגע: תבנית ברירת מחדל. כל שינוי שתשמור יחליף אותה.
        </q-banner>

        <!-- Editor -->
        <TemplateEditor
          :value="currentTemplate"
          :lang="selectedLang"
          :dir="currentDir"
          @input="onTemplateChange"
          :key="selectedCategory + selectedLang"
        />

        <!-- Action buttons -->
        <div class="actions q-mt-lg">
          <q-btn
            color="positive"
            icon="save"
            label="שמור"
            size="md"
            @click="saveCurrent"
            :disable="!dirty"
          />
          <q-btn
            color="grey"
            flat
            icon="restore"
            label="שחזר ברירת מחדל"
            class="q-ml-sm"
            @click="confirmReset"
          />
          <q-btn
            color="primary"
            flat
            icon="visibility"
            label="תצוגה מקדימה"
            class="q-ml-sm"
            @click="showPreview = !showPreview"
          />
        </div>

        <!-- Preview -->
        <q-card v-if="showPreview" class="q-mt-lg">
          <q-card-section class="bg-grey-2">
            <strong>תצוגת טקסט גולמי (עם placeholders):</strong>
          </q-card-section>
          <q-card-section>
            <pre class="preview-text" :dir="currentDir">{{ currentTemplate }}</pre>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Save confirmation dialog -->
    <q-dialog v-model="confirmResetDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">
            האם לשחזר את התבנית לברירת המחדל? כל השינויים שלך יאבדו.
          </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ביטול" v-close-popup />
          <q-btn
            color="negative"
            label="שחזר"
            @click="resetCurrent"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import TemplateEditor from "src/components/TemplateEditor.vue";
import {
  CATEGORIES,
  LANGUAGES,
  loadTemplate,
  saveTemplate,
  resetTemplate,
  hasCustomTemplate,
  DEFAULT_TEMPLATES
} from "src/assets/defaultTemplates.js";

// Simple client-side password — this is not serious security; it's just a gate
// to prevent random visitors from editing templates. Change here as needed.
const ADMIN_PASSWORD = "gad2026";
const AUTH_STORAGE_KEY = "adminAuthenticated";

export default {
  name: "Admin",
  components: { TemplateEditor },
  data() {
    return {
      authenticated: false,
      password: "",
      loginError: false,

      categories: CATEGORIES,
      languages: LANGUAGES,

      selectedCategory: "flight",
      selectedLang: "he",

      currentTemplate: "",
      lastLoaded: "",
      dirty: false,
      isCustom: false,

      showPreview: false,
      confirmResetDialog: false
    };
  },
  computed: {
    currentDir() {
      const l = this.languages.find(x => x.key === this.selectedLang);
      return l ? l.dir : "ltr";
    }
  },
  created() {
    this.authenticated = sessionStorage.getItem(AUTH_STORAGE_KEY) === "1";
    if (this.authenticated) this.loadCurrent();
  },
  watch: {
    selectedCategory() { this.loadCurrent(); },
    selectedLang() { this.loadCurrent(); }
  },
  methods: {
    login() {
      if (this.password === ADMIN_PASSWORD) {
        this.authenticated = true;
        sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
        this.loginError = false;
        this.password = "";
        this.loadCurrent();
      } else {
        this.loginError = true;
      }
    },
    logout() {
      this.authenticated = false;
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    },
    loadCurrent() {
      const tpl = loadTemplate(this.selectedCategory, this.selectedLang);
      this.currentTemplate = tpl;
      this.lastLoaded = tpl;
      this.dirty = false;
      this.isCustom = hasCustomTemplate(this.selectedCategory, this.selectedLang);
    },
    onTemplateChange(newVal) {
      this.currentTemplate = newVal;
      this.dirty = newVal !== this.lastLoaded;
    },
    saveCurrent() {
      const ok = saveTemplate(this.selectedCategory, this.selectedLang, this.currentTemplate);
      if (ok) {
        this.lastLoaded = this.currentTemplate;
        this.dirty = false;
        this.isCustom = true;
        this.$q.notify({
          message: "✅ התבנית נשמרה בהצלחה! השינוי ישתקף בדף הראשי.",
          color: "positive",
          position: "top",
          timeout: 2500
        });
      } else {
        this.$q.notify({
          message: "❌ שגיאה בשמירה",
          color: "negative",
          position: "top"
        });
      }
    },
    confirmReset() {
      this.confirmResetDialog = true;
    },
    resetCurrent() {
      resetTemplate(this.selectedCategory, this.selectedLang);
      this.loadCurrent();
      this.$q.notify({
        message: "שוחזרה תבנית ברירת המחדל",
        color: "info",
        position: "top"
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.login-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  direction: rtl;
}

.editor-wrap {
  direction: rtl;
}

.content {
  max-width: 1000px;
  margin: 0 auto;
}

.section-label {
  font-size: 13px;
  color: #555;
  margin-bottom: 6px;
  font-weight: 500;
}

.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-text {
  white-space: pre-wrap;
  font-family: "Segoe UI", Tahoma, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}
</style>
