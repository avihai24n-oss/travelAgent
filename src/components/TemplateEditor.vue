<template>
  <div class="template-editor-wrapper">
    <div class="toolbar">
      <span class="toolbar-label">{{ labels.addPlaceholder }}</span>
      <q-btn
        v-for="p in placeholders"
        :key="p.key"
        size="sm"
        dense
        unelevated
        color="primary"
        class="placeholder-add-btn q-ma-xs"
        :label="p.label[lang] || p.label.en"
        @click="insertPlaceholder(p.key)"
      />
    </div>

    <div
      ref="editor"
      class="editor"
      :class="{ rtl: dir === 'rtl' }"
      :dir="dir"
      contenteditable="true"
      @input="onInput"
      @beforeinput="onBeforeInput"
      @keydown="onKeyDown"
      @paste="onPaste"
      @drop.prevent
    ></div>

    <p class="hint">{{ labels.hint }}</p>
  </div>
</template>

<script>
import { PLACEHOLDERS } from "src/assets/defaultTemplates.js";

const LABELS_BY_LANG = {
  he: {
    addPlaceholder: "הוסף placeholder:",
    hint:
      "💡 הצ'יפים הכחולים לא ניתנים למחיקה. אפשר להזיז אותם על ידי חיתוך והדבקה (Cmd+X / Cmd+V) או לגרור עם העכבר."
  },
  en: {
    addPlaceholder: "Insert placeholder:",
    hint:
      "💡 Blue chips cannot be deleted. You can move them by cut & paste (Cmd+X / Cmd+V) or drag with the mouse."
  },
  fr: {
    addPlaceholder: "Insérer un placeholder :",
    hint:
      "💡 Les puces bleues ne peuvent pas être supprimées. Vous pouvez les déplacer par couper-coller (Cmd+X / Cmd+V) ou par glisser-déposer."
  }
};

export default {
  name: "TemplateEditor",
  props: {
    value: { type: String, default: "" },
    lang: { type: String, default: "he" },
    dir: { type: String, default: "rtl" }
  },
  data() {
    return {
      placeholders: PLACEHOLDERS,
      internalUpdate: false
    };
  },
  computed: {
    labels() {
      return LABELS_BY_LANG[this.lang] || LABELS_BY_LANG.en;
    },
    placeholderMap() {
      const map = {};
      this.placeholders.forEach(p => (map[p.key] = p));
      return map;
    }
  },
  mounted() {
    this.renderFromValue();
  },
  watch: {
    value(newVal) {
      if (!this.internalUpdate) this.renderFromValue();
    },
    lang() {
      this.rerenderChipLabels();
    }
  },
  methods: {
    // Convert a template string (with {{KEY}} tokens) into DOM nodes.
    renderFromValue() {
      const el = this.$refs.editor;
      if (!el) return;
      el.innerHTML = "";
      const parts = this.splitTemplate(this.value);
      parts.forEach(part => {
        if (part.type === "text") {
          // Split on newlines to preserve them as <br>
          const lines = part.value.split("\n");
          lines.forEach((line, idx) => {
            if (line) el.appendChild(document.createTextNode(line));
            if (idx < lines.length - 1) el.appendChild(document.createElement("br"));
          });
        } else if (part.type === "placeholder") {
          el.appendChild(this.buildChip(part.key));
        }
      });
    },

    splitTemplate(str) {
      const regex = /\{\{([A-Z_]+)\}\}/g;
      const result = [];
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIdx) {
          result.push({ type: "text", value: str.substring(lastIdx, match.index) });
        }
        result.push({ type: "placeholder", key: match[1] });
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < str.length) {
        result.push({ type: "text", value: str.substring(lastIdx) });
      }
      return result;
    },

    buildChip(key) {
      const span = document.createElement("span");
      span.className = "chip";
      span.setAttribute("contenteditable", "false");
      span.setAttribute("draggable", "true");
      span.setAttribute("data-key", key);
      const p = this.placeholderMap[key];
      const label = p ? (p.label[this.lang] || p.label.en) : key;
      span.textContent = label;
      span.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", `{{${key}}}`);
        e.dataTransfer.effectAllowed = "move";
      });
      return span;
    },

    rerenderChipLabels() {
      const el = this.$refs.editor;
      if (!el) return;
      el.querySelectorAll(".chip").forEach(chip => {
        const key = chip.getAttribute("data-key");
        const p = this.placeholderMap[key];
        if (p) chip.textContent = p.label[this.lang] || p.label.en;
      });
    },

    // Called on every input event — serialize DOM back to a template string.
    onInput() {
      this.internalUpdate = true;
      const serialized = this.serialize();
      this.$emit("input", serialized);
      this.$nextTick(() => { this.internalUpdate = false; });
    },

    serialize() {
      const el = this.$refs.editor;
      if (!el) return "";
      let result = "";
      const walk = node => {
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            result += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName === "BR") {
              result += "\n";
            } else if (child.tagName === "DIV") {
              // Browsers sometimes wrap new lines in <div> — treat as newline before content.
              if (result && !result.endsWith("\n")) result += "\n";
              walk(child);
            } else if (child.classList && child.classList.contains("chip")) {
              const key = child.getAttribute("data-key");
              if (key) result += `{{${key}}}`;
            } else {
              walk(child);
            }
          }
        });
      };
      walk(el);
      return result;
    },

    // Block any deletion that would remove a chip.
    onBeforeInput(e) {
      const deletionTypes = [
        "deleteContentBackward",
        "deleteContentForward",
        "deleteByCut",
        "deleteWordBackward",
        "deleteWordForward",
        "deleteSoftLineBackward",
        "deleteSoftLineForward",
        "deleteHardLineBackward",
        "deleteHardLineForward",
        "deleteEntireSoftLine"
      ];
      if (!deletionTypes.includes(e.inputType)) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);

      // If a chip is fully or partially inside the current range, block.
      if (this.rangeContainsChip(range)) {
        e.preventDefault();
        return;
      }

      // Collapsed selection: check the adjacent node that would be deleted.
      if (range.collapsed) {
        const chipAdjacent = this.findAdjacentChip(range, e.inputType);
        if (chipAdjacent) e.preventDefault();
      }
    },

    onKeyDown(e) {
      // Extra safety: block selection+typing that replaces a chip.
      if (e.key === "Delete" || e.key === "Backspace") {
        // beforeinput handles this too; kept for older Safari fallback.
      }
    },

    onPaste(e) {
      // Force plain text paste — don't let rich HTML break the chip structure.
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text/plain");
      if (!text) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      // If the clipboard text contains a placeholder token, rebuild chips for it
      if (/\{\{[A-Z_]+\}\}/.test(text)) {
        const parts = this.splitTemplate(text);
        range.deleteContents();
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (part.type === "text") {
            const lines = part.value.split("\n");
            lines.forEach((line, idx) => {
              if (line) frag.appendChild(document.createTextNode(line));
              if (idx < lines.length - 1) frag.appendChild(document.createElement("br"));
            });
          } else if (part.type === "placeholder") {
            frag.appendChild(this.buildChip(part.key));
          }
        });
        range.insertNode(frag);
        sel.collapseToEnd();
      } else {
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        sel.collapseToEnd();
      }
      this.onInput();
    },

    rangeContainsChip(range) {
      if (range.collapsed) return false;
      const container = range.commonAncestorContainer;
      const chips = (container.nodeType === Node.ELEMENT_NODE
        ? container
        : container.parentElement
      ).querySelectorAll
        ? (container.nodeType === Node.ELEMENT_NODE
            ? container
            : container.parentElement
          ).querySelectorAll(".chip")
        : [];
      for (const chip of chips) {
        if (range.intersectsNode(chip)) return true;
      }
      return false;
    },

    findAdjacentChip(range, inputType) {
      const node = range.startContainer;
      const offset = range.startOffset;
      const isBackward = inputType.toLowerCase().includes("backward");

      if (node.nodeType === Node.TEXT_NODE) {
        // At the very start/end of a text node next to a chip
        if (isBackward && offset === 0) {
          const prev = node.previousSibling;
          if (prev && prev.classList && prev.classList.contains("chip")) return prev;
        }
        if (!isBackward && offset === node.textContent.length) {
          const next = node.nextSibling;
          if (next && next.classList && next.classList.contains("chip")) return next;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Cursor between element children
        const children = node.childNodes;
        const target = isBackward ? children[offset - 1] : children[offset];
        if (target && target.classList && target.classList.contains("chip")) return target;
      }
      return null;
    },

    insertPlaceholder(key) {
      const el = this.$refs.editor;
      el.focus();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
        // No cursor inside — append at end
        el.appendChild(this.buildChip(key));
      } else {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const chip = this.buildChip(key);
        range.insertNode(chip);
        // Move cursor after chip
        range.setStartAfter(chip);
        range.setEndAfter(chip);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      this.onInput();
    }
  }
};
</script>

<style lang="scss" scoped>
.template-editor-wrapper {
  width: 100%;
}

.toolbar {
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(0, 150, 136, 0.08);
  border-radius: 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-label {
  font-size: 13px;
  margin-right: 8px;
  margin-left: 8px;
  color: #555;
  font-weight: 500;
}

.placeholder-add-btn {
  text-transform: none;
  font-size: 11px;
}

.editor {
  min-height: 360px;
  padding: 14px 16px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fafafa;
  font-family: "Segoe UI", Tahoma, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
  overflow-y: auto;
  max-height: 600px;
}

.editor.rtl {
  text-align: right;
  direction: rtl;
}

.editor:focus {
  border-color: #009688;
  background: #fff;
}

.hint {
  font-size: 12px;
  color: #777;
  margin-top: 6px;
}
</style>

<style lang="scss">
/* Global styles for the chip so they apply inside contenteditable */
.editor .chip {
  display: inline-block;
  padding: 2px 10px;
  margin: 0 3px;
  background: linear-gradient(135deg, #1976d2, #0d47a1);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  user-select: none;
  cursor: grab;
  vertical-align: middle;
  white-space: nowrap;
}

.editor .chip:active {
  cursor: grabbing;
}
</style>
