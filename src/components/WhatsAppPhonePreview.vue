<template>
  <div class="iphone-outer">
    <div class="iphone-frame">
      <div class="iphone-island"></div>
      <div class="iphone-screen">
        <div class="wa-status-bar">
          <span class="wa-status-time">{{ clockTime }}</span>
        </div>
        <div class="wa-header">
          <span class="wa-back" aria-hidden="true">‹</span>
          <div class="wa-avatar">{{ avatarLetter }}</div>
          <div class="wa-contact">
            <div class="wa-name">{{ contactName }}</div>
            <div class="wa-presence">{{ dir === 'rtl' ? 'מחובר' : 'online' }}</div>
          </div>
          <button
            type="button"
            class="wa-edit-toggle"
            :class="{ active: editing }"
            :aria-label="editToggleLabel"
            :title="editToggleLabel"
            @click="toggleEdit"
          >
            {{ editToggleLabel }}
          </button>
        </div>
        <div v-if="editing && editHint" class="wa-edit-banner" :dir="dir">
          {{ editHint }}
        </div>
        <div class="wa-chat" :dir="dir">
          <div class="wa-bubble wa-sent" :class="{ rtl: dir === 'rtl', editing }">
            <div
              v-if="editing && spacingMode && segmentsSnapshot"
              class="wa-bubble-spacing"
              :dir="dir"
            >
              <template v-for="(seg, idx) in segmentsSnapshot">
                <span
                  v-if="seg.type === 'ws'"
                  :key="'ws-' + idx"
                  :ref="'ws' + idx"
                  class="wa-ws"
                  contenteditable="true"
                  spellcheck="false"
                  @input="onWsInput"
                  @keydown="onWsKeydown"
                  @paste="onWsPaste"
                >{{ seg.text }}</span>
                <span
                  v-else-if="seg.type === 'placeholder'"
                  :key="'ph-' + idx"
                  class="wa-token wa-token-ph"
                  contenteditable="false"
                  :title="seg.key"
                  v-html="seg.valueHtml"
                ></span>
                <b
                  v-else-if="seg.type === 'fmt' && seg.tag === 'b'"
                  :key="'fmt-' + idx"
                  class="wa-token wa-token-fmt"
                  contenteditable="false"
                >{{ seg.inner }}</b>
                <i
                  v-else-if="seg.type === 'fmt' && seg.tag === 'i'"
                  :key="'fmt-' + idx"
                  class="wa-token wa-token-fmt"
                  contenteditable="false"
                >{{ seg.inner }}</i>
                <s
                  v-else-if="seg.type === 'fmt' && seg.tag === 's'"
                  :key="'fmt-' + idx"
                  class="wa-token wa-token-fmt"
                  contenteditable="false"
                >{{ seg.inner }}</s>
                <span
                  v-else
                  :key="'tx-' + idx"
                  class="wa-token"
                  contenteditable="false"
                >{{ seg.text }}</span>
              </template>
            </div>
            <textarea
              v-else-if="editing"
              ref="editor"
              class="wa-bubble-editor"
              :value="editorValue"
              :dir="dir"
              @input="onInput"
              rows="1"
            />
            <div v-else class="wa-bubble-text" v-html="formattedHtml"></div>
            <div class="wa-bubble-meta">
              <span class="wa-bubble-time">{{ clockTime }}</span>
              <span class="wa-bubble-tick" aria-hidden="true">✓✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "WhatsAppPhonePreview",
  props: {
    text: { type: String, default: "" },
    dir: { type: String, default: "ltr" },
    contactName: { type: String, default: "Gad Elnekave" },
    editValue: { type: String, default: null },
    editHint: { type: String, default: "" },
    spacingMode: { type: Boolean, default: false },
    spacingSamples: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      editing: false,
      segmentsSnapshot: null,
      selfEmittedValue: null
    };
  },
  computed: {
    avatarLetter() {
      const n = (this.contactName || "G").trim();
      return n ? n.charAt(0).toUpperCase() : "G";
    },
    clockTime() {
      const d = new Date();
      const pad = n => String(n).padStart(2, "0");
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
    formattedHtml() {
      return this.renderWhatsApp(this.text || "");
    },
    editorValue() {
      return this.editValue !== null ? this.editValue : this.text;
    },
    editToggleLabel() {
      if (this.dir === "rtl") return this.editing ? "סיום" : "ערוך";
      return this.editing ? "Done" : "Edit";
    }
  },
  watch: {
    editing(on) {
      if (on) {
        if (this.spacingMode) this.rebuildSegments();
        this.$nextTick(() => {
          this.autoResize();
          const el = this.$refs.editor;
          if (el) el.focus();
        });
      } else {
        this.segmentsSnapshot = null;
      }
    },
    text() {
      if (this.editing) this.$nextTick(() => this.autoResize());
    },
    editValue(newVal) {
      if (this.editing) this.$nextTick(() => this.autoResize());
      if (this.editing && this.spacingMode && newVal !== this.selfEmittedValue) {
        this.rebuildSegments();
      }
    },
    spacingSamples() {
      if (this.editing && this.spacingMode) this.rebuildSegments();
    }
  },
  methods: {
    toggleEdit() {
      this.editing = !this.editing;
    },
    onInput(e) {
      const v = e.target.value;
      if (this.editValue !== null) {
        this.$emit("update:editValue", v);
      } else {
        this.$emit("update:text", v);
      }
      this.autoResize();
    },
    autoResize() {
      const el = this.$refs.editor;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    },
    rebuildSegments() {
      const tpl = this.editValue || "";
      this.segmentsSnapshot = this.tokenizeForSpacing(tpl, this.spacingSamples || {});
    },
    tokenizeForSpacing(tpl, samples) {
      const segments = [];
      const len = tpl.length;
      const wsRe = /\s/;
      let i = 0;
      while (i < len) {
        const c = tpl[i];
        if (wsRe.test(c)) {
          let j = i;
          while (j < len && wsRe.test(tpl[j])) j++;
          segments.push({ type: "ws", text: tpl.slice(i, j) });
          i = j;
          continue;
        }
        if (c === "{" && tpl[i + 1] === "{") {
          const close = tpl.indexOf("}}", i + 2);
          if (close !== -1) {
            const key = tpl.slice(i + 2, close);
            if (/^[A-Z_]+$/.test(key)) {
              const raw = tpl.slice(i, close + 2);
              const value =
                samples && samples[key] !== undefined
                  ? String(samples[key])
                  : raw;
              segments.push({
                type: "placeholder",
                raw,
                key,
                valueHtml: this.renderWhatsApp(value)
              });
              i = close + 2;
              continue;
            }
          }
        }
        const prev = i === 0 ? " " : tpl[i - 1];
        const atBoundary = i === 0 || wsRe.test(prev) || /[(\[{]/.test(prev);
        if (atBoundary && (c === "*" || c === "_" || c === "~")) {
          let j = i + 1;
          let closeIdx = -1;
          while (j < len) {
            const ch = tpl[j];
            if (ch === "\n") break;
            if (ch === c && j > i + 1 && !wsRe.test(tpl[j - 1])) {
              const after = tpl[j + 1];
              if (after === undefined || wsRe.test(after) || /[)\]}.,!?:;'"]/.test(after)) {
                closeIdx = j;
                break;
              }
            }
            j++;
          }
          if (closeIdx > i + 1) {
            const tag = c === "*" ? "b" : c === "_" ? "i" : "s";
            const inner = tpl.slice(i + 1, closeIdx);
            segments.push({
              type: "fmt",
              raw: tpl.slice(i, closeIdx + 1),
              tag,
              inner
            });
            i = closeIdx + 1;
            continue;
          }
        }
        let j = i;
        while (j < len) {
          const ch = tpl[j];
          if (wsRe.test(ch)) break;
          if (ch === "{" && tpl[j + 1] === "{") break;
          j++;
        }
        if (j === i) j = i + 1;
        segments.push({ type: "text", text: tpl.slice(i, j) });
        i = j;
      }
      return segments;
    },
    serializeSegmentsFromDom() {
      const segs = this.segmentsSnapshot || [];
      const out = [];
      for (let idx = 0; idx < segs.length; idx++) {
        const s = segs[idx];
        if (s.type === "ws") {
          const ref = this.$refs["ws" + idx];
          const el = Array.isArray(ref) ? ref[0] : ref;
          const dom = el ? el.textContent || "" : s.text;
          out.push(dom.replace(/\S/g, ""));
        } else if (s.type === "placeholder" || s.type === "fmt") {
          out.push(s.raw);
        } else {
          out.push(s.text);
        }
      }
      return out.join("");
    },
    onWsInput() {
      const newTpl = this.serializeSegmentsFromDom();
      this.selfEmittedValue = newTpl;
      this.$emit("update:editValue", newTpl);
    },
    onWsKeydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const navKeys = [
        "Backspace", "Delete", "Tab",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "PageUp", "PageDown",
        "Shift", "CapsLock", "Control", "Alt", "Meta", "Escape"
      ];
      if (navKeys.indexOf(e.key) !== -1) return;
      if (e.key === " " || e.key === "Enter" || e.key === "Spacebar") return;
      if (e.key && e.key.length === 1) {
        e.preventDefault();
      }
    },
    onWsPaste(e) {
      e.preventDefault();
      const cb = e.clipboardData || window.clipboardData;
      if (!cb) return;
      const text = cb.getData("text") || "";
      const ws = text.replace(/\S/g, "");
      if (ws) {
        try {
          document.execCommand("insertText", false, ws);
        } catch (_err) { /* noop */ }
      }
    },
    renderWhatsApp(src) {
      let s = src
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      s = s.replace(/```([\s\S]+?)```/g, "<code>$1</code>");
      s = s.replace(/(^|[^*\w])\*([^*\n]+?)\*(?![*\w])/g, "$1<b>$2</b>");
      s = s.replace(/(^|[^_\w])_([^_\n]+?)_(?![_\w])/g, "$1<i>$2</i>");
      s = s.replace(/(^|[^~\w])~([^~\n]+?)~(?![~\w])/g, "$1<s>$2</s>");
      return s;
    }
  }
};
</script>

<style lang="scss" scoped>
/* iPhone 16 — 393 × 852 CSS pt. Life-size on desktop, fluid on phone. */
.iphone-outer {
  display: flex;
  justify-content: center;
  padding: 16px 8px;
  width: 100%;
  box-sizing: border-box;
}

.iphone-frame {
  position: relative;
  width: 393px;
  height: 852px;
  background: #1a1a1c;
  border-radius: 55px;
  padding: 11px;
  box-sizing: content-box;
  box-shadow:
    0 0 0 2px #2b2b2e inset,
    0 0 0 1px #050506,
    0 20px 40px rgba(0, 0, 0, 0.28),
    0 6px 12px rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}

.iphone-island {
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  width: 126px;
  height: 37px;
  background: #000;
  border-radius: 20px;
  z-index: 20;
}

.iphone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 44px;
  background: #efeae2;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Status bar */
.wa-status-bar {
  height: 54px;
  background: #008069;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 10px 28px 0 0;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

[dir="rtl"] .wa-status-bar {
  justify-content: flex-start;
  padding: 10px 0 0 28px;
}

.wa-status-time { letter-spacing: 0.3px; }

/* Header */
.wa-header {
  background: #008069;
  color: #fff;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.wa-back {
  font-size: 28px;
  line-height: 1;
  width: 16px;
  font-weight: 300;
}

.wa-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dfe5e7;
  color: #008069;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.wa-contact { flex: 1; min-width: 0; }
.wa-name { font-weight: 600; font-size: 16px; line-height: 1.2; }
.wa-presence { font-size: 12px; opacity: 0.85; margin-top: 2px; }
.wa-icon { font-size: 18px; opacity: 0.9; }

.wa-edit-toggle {
  min-width: 62px;
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  border: 0;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease, color 0.15s ease;
  flex-shrink: 0;
  font-family: inherit;
  letter-spacing: 0.2px;
}

.wa-edit-toggle:hover {
  background: rgba(255, 255, 255, 0.28);
}

.wa-edit-toggle:active {
  transform: scale(0.94);
}

.wa-edit-toggle.active {
  background: #fff;
  color: #008069;
}

/* Edit-mode hint banner */
.wa-edit-banner {
  background: #fff8e1;
  color: #7a5800;
  border-bottom: 1px solid #fdd835;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 500;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body.body--dark .wa-edit-banner {
  background: #3a2f10;
  color: #fde68a;
  border-bottom-color: #92641b;
}

/* Chat area */
.wa-chat {
  flex: 1;
  background-color: #efeae2;
  background-image:
    radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    radial-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 22px 22px, 34px 34px;
  background-position: 0 0, 11px 11px;
  padding: 14px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Message bubble — sent */
.wa-bubble {
  max-width: 85%;
  min-width: 70px;
  background: #d9fdd3;
  border-radius: 8px;
  padding: 6px 9px 7px;
  margin-bottom: 6px;
  position: relative;
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
  color: #111b21;
  font-size: 14.2px;
  line-height: 1.38;
  margin-left: auto;
  margin-right: 4px;
}

.wa-bubble.rtl {
  margin-left: 4px;
  margin-right: auto;
}

.wa-bubble::after {
  content: "";
  position: absolute;
  top: 0;
  right: -7px;
  width: 0;
  height: 0;
  border-top: 8px solid #d9fdd3;
  border-right: 8px solid transparent;
}

.wa-bubble.rtl::after {
  right: auto;
  left: -7px;
  border-right: none;
  border-left: 8px solid transparent;
  border-top: 8px solid #d9fdd3;
}

.wa-bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.wa-bubble.editing {
  background: #fff9c4;
  box-shadow: 0 0 0 2px #fdd835, 0 1px 0.5px rgba(0, 0, 0, 0.13);
}

.wa-bubble.editing::after {
  border-top-color: #fff9c4;
}

.wa-bubble-editor {
  width: 100%;
  min-height: 1.4em;
  border: 0;
  outline: 0;
  background: transparent;
  resize: none;
  font: inherit;
  color: inherit;
  padding: 0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  font-family: inherit;
  line-height: inherit;
  overflow: hidden;
}

.wa-bubble-editor:focus { outline: 0; }

.wa-bubble-spacing {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: inherit;
  font: inherit;
  color: inherit;
}

.wa-bubble-spacing .wa-token {
  display: inline;
  background: rgba(0, 128, 105, 0.08);
  border-radius: 3px;
  padding: 0 2px;
  margin: 0;
  color: inherit;
  user-select: none;
  -webkit-user-select: none;
  cursor: not-allowed;
  white-space: pre-wrap;
}

.wa-bubble-spacing .wa-token-ph {
  background: rgba(37, 99, 235, 0.14);
  color: #0b3a8f;
  font-weight: 500;
}

.wa-bubble-spacing .wa-token-fmt { background: rgba(0, 128, 105, 0.12); }

.wa-bubble-spacing .wa-ws {
  display: inline;
  outline: 0;
  min-width: 3px;
  background: rgba(253, 216, 53, 0.28);
  border-radius: 2px;
  padding: 0 1px;
  cursor: text;
  white-space: pre-wrap;
}

.wa-bubble-spacing .wa-ws:focus {
  background: rgba(253, 216, 53, 0.55);
  box-shadow: 0 0 0 1px #fbc02d inset;
}

body.body--dark .wa-bubble-spacing .wa-token {
  background: rgba(233, 237, 239, 0.10);
}

body.body--dark .wa-bubble-spacing .wa-token-ph {
  background: rgba(138, 180, 248, 0.22);
  color: #cfe0ff;
}

body.body--dark .wa-bubble-spacing .wa-token-fmt {
  background: rgba(233, 237, 239, 0.14);
}

body.body--dark .wa-bubble-spacing .wa-ws {
  background: rgba(251, 192, 45, 0.22);
}

body.body--dark .wa-bubble-spacing .wa-ws:focus {
  background: rgba(251, 192, 45, 0.42);
  box-shadow: 0 0 0 1px #fbc02d inset;
}

.wa-bubble-text ::v-deep b { font-weight: 700; }
.wa-bubble-text ::v-deep i { font-style: italic; }
.wa-bubble-text ::v-deep s { text-decoration: line-through; }
.wa-bubble-text ::v-deep code {
  font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, monospace;
  font-size: 12.5px;
  background: rgba(11, 20, 26, 0.06);
  padding: 1px 4px;
  border-radius: 3px;
}

.wa-bubble-meta {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  float: right;
  margin: 2px 0 -2px 6px;
  color: #667781;
  font-size: 11px;
  line-height: 1;
}

.wa-bubble.rtl .wa-bubble-meta {
  float: left;
  margin: 2px 6px -2px 0;
}

.wa-bubble-tick { color: #53bdeb; font-size: 13px; }

/* Responsive: fit the frame on narrow viewports (mobile). */
@media (max-width: 440px) {
  .iphone-outer { padding: 8px 0; }
  .iphone-frame {
    width: 100%;
    max-width: 393px;
    height: auto;
    aspect-ratio: 393 / 852;
    border-radius: 13vw;
    padding: 2.5vw;
  }
  .iphone-screen { border-radius: calc(13vw - 2.5vw); }
  .iphone-island {
    top: 4.5vw;
    width: 32vw;
    height: 9vw;
    border-radius: 6vw;
  }
}

/* Dark mode */
body.body--dark .iphone-frame {
  background: #0b0b0d;
}
body.body--dark .iphone-screen { background: #0b141a; }
body.body--dark .wa-chat {
  background-color: #0b141a;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
}
body.body--dark .wa-status-bar,
body.body--dark .wa-header {
  background: #202c33;
  color: #e9edef;
}
body.body--dark .wa-avatar {
  background: #6b7c85;
  color: #0b141a;
}
body.body--dark .wa-bubble {
  background: #005c4b;
  color: #e9edef;
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.5);
}
body.body--dark .wa-bubble::after {
  border-top-color: #005c4b;
}
body.body--dark .wa-bubble-meta { color: #aebac1; }
body.body--dark .wa-bubble-tick { color: #53bdeb; }
body.body--dark .wa-bubble-text ::v-deep code {
  background: rgba(255, 255, 255, 0.08);
}

body.body--dark .wa-bubble.editing {
  background: #3e3a1f;
  box-shadow: 0 0 0 2px #fbc02d, 0 1px 0.5px rgba(0, 0, 0, 0.5);
  color: #fff8e1;
}

body.body--dark .wa-bubble.editing::after {
  border-top-color: #3e3a1f;
}

body.body--dark .wa-edit-toggle {
  background: rgba(255, 255, 255, 0.1);
}

body.body--dark .wa-edit-toggle.active {
  background: #e9edef;
  color: #202c33;
}
</style>
