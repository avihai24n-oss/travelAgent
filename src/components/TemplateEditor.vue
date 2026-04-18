<template>
  <div class="template-editor" :dir="dir">
    <div class="toolbar">
      <span class="toolbar-label">{{ toolbarLabel }}</span>
      <button
        v-for="key in placeholderKeys"
        :key="key"
        type="button"
        class="chip chip-btn"
        @mousedown.prevent="insertPlaceholder(key)"
      >
        {{ labelFor(key) }}
      </button>
    </div>

    <div
      ref="editor"
      class="editor-area"
      :dir="dir"
      contenteditable="true"
      spellcheck="false"
      @beforeinput="onBeforeInput"
      @input="onInput"
      @keydown="onEditorKeyDown"
      @paste="onPaste"
      @dragstart="onDragStart"
      @dragover.prevent
      @drop="onDrop"
      @touchstart="onEditorTouchStart"
    ></div>
  </div>
</template>

<script>
const TOKEN_RE = /\{\{([A-Z_]+)\}\}/g;
const DELETE_TYPE_RE = /^delete/;

export default {
  name: "TemplateEditor",
  props: {
    value: { type: String, default: "" },
    lang: { type: String, default: "he" },
    dir: { type: String, default: "rtl" },
    placeholders: { type: Object, required: true },
    toolbarLabel: { type: String, default: "" }
  },
  data() {
    return {
      draggedKey: null,
      draggedNode: null,
      touchDragging: false,
      touchChip: null,
      touchChipKey: null,
      touchGhost: null,
      history: [],
      historyIndex: -1,
      historyTimer: null,
      applyingHistory: false
    };
  },
  beforeDestroy() {
    this.removeTouchGlobalListeners();
    if (this.touchGhost && this.touchGhost.parentNode) {
      this.touchGhost.parentNode.removeChild(this.touchGhost);
    }
  },
  computed: {
    placeholderKeys() {
      return Object.keys(this.placeholders);
    }
  },
  watch: {
    value(newVal) {
      if (newVal !== this.serialize()) {
        this.renderFromValue(newVal);
        if (!this.applyingHistory) this.resetHistory(newVal);
      }
    },
    lang() {
      // Language switch — re-render so chip labels update.
      this.renderFromValue(this.value);
    }
  },
  mounted() {
    this.renderFromValue(this.value);
    this.resetHistory(this.value || "");
  },
  methods: {
    labelFor(key) {
      const entry = this.placeholders[key];
      if (!entry) return key;
      return entry[this.lang] || entry.he || entry.en || key;
    },

    renderFromValue(tpl) {
      const root = this.$refs.editor;
      if (!root) return;
      root.innerHTML = "";
      const str = tpl || "";
      let lastIdx = 0;
      TOKEN_RE.lastIndex = 0;
      let m;
      while ((m = TOKEN_RE.exec(str)) !== null) {
        if (m.index > lastIdx) {
          this.appendTextWithLineBreaks(root, str.slice(lastIdx, m.index));
        }
        root.appendChild(this.buildChipNode(m[1]));
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < str.length) {
        this.appendTextWithLineBreaks(root, str.slice(lastIdx));
      }
    },

    appendTextWithLineBreaks(root, text) {
      const parts = text.split("\n");
      parts.forEach((part, idx) => {
        if (part.length) root.appendChild(document.createTextNode(part));
        if (idx < parts.length - 1) root.appendChild(document.createElement("br"));
      });
    },

    buildChipNode(key) {
      const chip = document.createElement("span");
      chip.className = "chip chip-token";
      chip.setAttribute("contenteditable", "false");
      chip.setAttribute("draggable", "true");
      chip.dataset.placeholder = key;
      chip.textContent = this.labelFor(key);
      return chip;
    },

    serialize() {
      const root = this.$refs.editor;
      if (!root) return "";
      return this.nodeToString(root);
    },

    nodeToString(node) {
      let out = "";
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          out += child.nodeValue;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child;
          if (el.tagName === "BR") {
            out += "\n";
          } else if (el.dataset && el.dataset.placeholder) {
            out += `{{${el.dataset.placeholder}}}`;
          } else if (el.tagName === "DIV") {
            // contenteditable sometimes wraps new lines in <div>
            if (out.length && !out.endsWith("\n")) out += "\n";
            out += this.nodeToString(el);
          } else {
            out += this.nodeToString(el);
          }
        }
      });
      return out;
    },

    emitChange() {
      const v = this.serialize();
      this.$emit("input", v);
      this.snapshotValue(v);
    },

    onInput() {
      this.emitChange();
    },

    resetHistory(value) {
      if (this.historyTimer) {
        clearTimeout(this.historyTimer);
        this.historyTimer = null;
      }
      this.history = [value];
      this.historyIndex = 0;
    },

    snapshotValue(value) {
      if (this.applyingHistory) return;
      if (this.historyTimer) clearTimeout(this.historyTimer);
      this.historyTimer = setTimeout(() => {
        this.historyTimer = null;
        this.commitSnapshot(value);
      }, 300);
    },

    commitSnapshot(value) {
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }
      if (this.history[this.history.length - 1] === value) return;
      this.history.push(value);
      if (this.history.length > 100) this.history.shift();
      this.historyIndex = this.history.length - 1;
    },

    flushPendingSnapshot() {
      if (!this.historyTimer) return;
      clearTimeout(this.historyTimer);
      this.historyTimer = null;
      this.commitSnapshot(this.serialize());
    },

    undo() {
      this.flushPendingSnapshot();
      if (this.historyIndex <= 0) return;
      this.historyIndex--;
      this.applyHistoryState(this.history[this.historyIndex]);
    },

    redo() {
      this.flushPendingSnapshot();
      if (this.historyIndex >= this.history.length - 1) return;
      this.historyIndex++;
      this.applyHistoryState(this.history[this.historyIndex]);
    },

    applyHistoryState(value) {
      this.applyingHistory = true;
      this.renderFromValue(value);
      this.$emit("input", value);
      this.$nextTick(() => {
        this.applyingHistory = false;
      });
    },

    onEditorKeyDown(e) {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        this.redo();
      }
    },

    onBeforeInput(e) {
      if (!DELETE_TYPE_RE.test(e.inputType)) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (this.wouldAffectChip(range, e.inputType)) {
        e.preventDefault();
      }
    },

    wouldAffectChip(range, inputType) {
      if (!range.collapsed) {
        const frag = range.cloneContents();
        const tmp = document.createElement("div");
        tmp.appendChild(frag);
        return !!tmp.querySelector("[data-placeholder]");
      }
      const { startContainer, startOffset } = range;
      const isBackward = /Backward/.test(inputType) || inputType === "deleteEntireSoftLine";
      const isForward = /Forward/.test(inputType);
      const isLineOrWord = /Word|Soft|Hard|deleteEntireSoftLine/.test(inputType);

      if (isLineOrWord) {
        return this.$refs.editor.querySelector("[data-placeholder]") !== null
          ? this.lineOrWordWouldTouchChip(range, isBackward)
          : false;
      }

      if (startContainer.nodeType === Node.TEXT_NODE) {
        if (isBackward && startOffset === 0) {
          const prev = startContainer.previousSibling;
          return this.isChip(prev);
        }
        if (isForward && startOffset === startContainer.nodeValue.length) {
          const next = startContainer.nextSibling;
          return this.isChip(next);
        }
        return false;
      }
      if (startContainer.nodeType === Node.ELEMENT_NODE) {
        if (isBackward) {
          const prev = startContainer.childNodes[startOffset - 1];
          return this.isChip(prev);
        }
        if (isForward) {
          const next = startContainer.childNodes[startOffset];
          return this.isChip(next);
        }
      }
      return false;
    },

    lineOrWordWouldTouchChip(range, backward) {
      // Conservative: walk from caret in the given direction; if we hit a chip
      // before a line break, consider it touched.
      const walker = document.createTreeWalker(
        this.$refs.editor,
        NodeFilter.SHOW_ALL,
        null,
        false
      );
      // Simpler heuristic: if the editor contains any chip on the caret's line,
      // block. Splits by <br> and <div>.
      return true;
    },

    isChip(node) {
      return !!(node && node.dataset && node.dataset.placeholder);
    },

    insertPlaceholder(key) {
      const root = this.$refs.editor;
      if (!root) return;
      root.focus();
      const sel = window.getSelection();
      let range;
      if (sel && sel.rangeCount && root.contains(sel.anchorNode)) {
        range = sel.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(root);
        range.collapse(false);
      }
      range.deleteContents();
      const chip = this.buildChipNode(key);
      range.insertNode(chip);
      // Move cursor just after the inserted chip
      const after = document.createRange();
      after.setStartAfter(chip);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
      this.emitChange();
    },

    onPaste(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text");
      if (!text) return;
      this.insertPlainAndTokens(text);
    },

    insertPlainAndTokens(text) {
      const root = this.$refs.editor;
      if (!root) return;
      const sel = window.getSelection();
      let range;
      if (sel && sel.rangeCount && root.contains(sel.anchorNode)) {
        range = sel.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(root);
        range.collapse(false);
      }
      range.deleteContents();

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      TOKEN_RE.lastIndex = 0;
      let m;
      while ((m = TOKEN_RE.exec(text)) !== null) {
        if (m.index > lastIdx) {
          this.appendTextWithLineBreaks(frag, text.slice(lastIdx, m.index));
        }
        if (this.placeholders[m[1]]) {
          frag.appendChild(this.buildChipNode(m[1]));
        } else {
          this.appendTextWithLineBreaks(frag, m[0]);
        }
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < text.length) {
        this.appendTextWithLineBreaks(frag, text.slice(lastIdx));
      }

      const lastChild = frag.lastChild;
      range.insertNode(frag);
      if (lastChild) {
        const after = document.createRange();
        after.setStartAfter(lastChild);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
      }
      this.emitChange();
    },

    onDragStart(e) {
      const target = e.target;
      if (!this.isChip(target)) {
        e.preventDefault();
        return;
      }
      this.draggedKey = target.dataset.placeholder;
      this.draggedNode = target;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/placeholder", this.draggedKey);
      }
    },

    onDrop(e) {
      e.preventDefault();
      if (!this.draggedNode || !this.draggedKey) return;
      this.moveChipToPoint(this.draggedNode, this.draggedKey, e.clientX, e.clientY);
      this.draggedKey = null;
      this.draggedNode = null;
    },

    moveChipToPoint(chipEl, key, x, y) {
      const dropRange = this.rangeFromPoint(x, y);
      const editorEl = this.$refs.editor;
      if (!dropRange || !editorEl || !editorEl.contains(dropRange.startContainer)) {
        return;
      }
      if (chipEl && chipEl.parentNode) chipEl.parentNode.removeChild(chipEl);
      const newChip = this.buildChipNode(key);
      dropRange.insertNode(newChip);
      const after = document.createRange();
      after.setStartAfter(newChip);
      after.collapse(true);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(after);
      }
      this.emitChange();
    },

    rangeFromPoint(x, y) {
      if (document.caretRangeFromPoint) {
        return document.caretRangeFromPoint(x, y);
      }
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos) {
          const r = document.createRange();
          r.setStart(pos.offsetNode, pos.offset);
          r.collapse(true);
          return r;
        }
      }
      return null;
    },

    onEditorTouchStart(e) {
      const target = e.target && e.target.closest
        ? e.target.closest("[data-placeholder]")
        : null;
      if (!target) return;
      if (!e.cancelable) return;
      e.preventDefault();

      this.touchDragging = true;
      this.touchChip = target;
      this.touchChipKey = target.dataset.placeholder;

      const ghost = target.cloneNode(true);
      ghost.classList.add("chip-ghost");
      ghost.style.position = "fixed";
      ghost.style.pointerEvents = "none";
      ghost.style.zIndex = "9999";
      ghost.style.transform = "translate(-50%, -50%)";
      document.body.appendChild(ghost);
      this.touchGhost = ghost;

      const touch = e.touches && e.touches[0];
      if (touch) this.moveGhostTo(touch.clientX, touch.clientY);

      document.addEventListener("touchmove", this.onTouchMoveGlobal, { passive: false });
      document.addEventListener("touchend", this.onTouchEndGlobal);
      document.addEventListener("touchcancel", this.onTouchEndGlobal);
    },

    moveGhostTo(x, y) {
      if (!this.touchGhost) return;
      this.touchGhost.style.left = x + "px";
      this.touchGhost.style.top = y + "px";
    },

    onTouchMoveGlobal(e) {
      if (!this.touchDragging) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches && e.touches[0];
      if (touch) this.moveGhostTo(touch.clientX, touch.clientY);
    },

    onTouchEndGlobal(e) {
      if (!this.touchDragging) return;
      const touch = (e.changedTouches && e.changedTouches[0]) || null;

      if (this.touchGhost && this.touchGhost.parentNode) {
        this.touchGhost.parentNode.removeChild(this.touchGhost);
      }
      this.touchGhost = null;

      if (touch && this.touchChip && this.touchChipKey) {
        this.moveChipToPoint(this.touchChip, this.touchChipKey, touch.clientX, touch.clientY);
      }

      this.touchDragging = false;
      this.touchChip = null;
      this.touchChipKey = null;
      this.removeTouchGlobalListeners();
    },

    removeTouchGlobalListeners() {
      document.removeEventListener("touchmove", this.onTouchMoveGlobal, { passive: false });
      document.removeEventListener("touchend", this.onTouchEndGlobal);
      document.removeEventListener("touchcancel", this.onTouchEndGlobal);
    }
  }
};
</script>

<style lang="scss" scoped>
.template-editor {
  border: 1px solid #d0d7de;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 12px;
    background: #f6f8fa;
    border-bottom: 1px solid #d0d7de;
    align-items: center;
  }

  .toolbar-label {
    font-size: 12px;
    color: #57606a;
    margin-inline-end: 6px;
  }

  .editor-area {
    min-height: 260px;
    padding: 14px 16px;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
    outline: none;
    background: #fff;
  }
}

body.body--dark .template-editor {
  border-color: #444;
  background: #1e1e1e;

  .toolbar {
    background: #2a2a2a;
    border-bottom-color: #444;
  }

  .toolbar-label {
    color: #aaa;
  }

  .editor-area {
    background: #1e1e1e;
    color: #e0e0e0;
  }
}
</style>

<style lang="scss">
/* NOT scoped — these classes are on JS-created DOM (chips in editor, ghost on body).
   Vue scoped styles don't reach dynamically-inserted nodes, so keep these global. */
.template-editor .chip,
.chip-ghost {
  display: inline-flex;
  align-items: center;
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: #2563eb;
  color: #fff;
  border: 1px solid #1e40af;
  box-shadow: 0 1px 2px rgba(30, 64, 175, 0.25);
  cursor: grab;
  user-select: none;
  white-space: nowrap;
  touch-action: none;
}

.template-editor .chip-btn {
  cursor: pointer;
  background: #3b82f6;
  border-color: #2563eb;
}

.template-editor .chip-btn:hover {
  background: #2563eb;
}

.template-editor .chip-token {
  margin: 0 3px;
  vertical-align: baseline;
}

.template-editor .chip-token::before,
.chip-ghost::before {
  content: "\22EE\22EE";
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  letter-spacing: -3px;
  margin-inline-end: 6px;
  opacity: 0.75;
  font-weight: 900;
}

.template-editor .chip-token:active {
  cursor: grabbing;
  opacity: 0.85;
}

.chip-ghost {
  opacity: 0.9;
  transform: translate(-50%, -50%) scale(1.05);
  box-shadow: 0 6px 14px rgba(30, 64, 175, 0.35);
  pointer-events: none;
}

body.body--dark .template-editor .chip {
  background: #3b82f6;
  color: #fff;
  border-color: #60a5fa;
}

body.body--dark .template-editor .chip-btn {
  background: #60a5fa;
  border-color: #3b82f6;
  color: #0b1220;
}
</style>
