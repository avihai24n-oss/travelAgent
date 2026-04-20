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
          <span class="wa-icon" aria-hidden="true">📞</span>
        </div>
        <div class="wa-chat" :dir="dir">
          <div class="wa-bubble wa-sent" :class="{ rtl: dir === 'rtl' }">
            <div class="wa-bubble-text" v-html="formattedHtml"></div>
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
    contactName: { type: String, default: "Gad Elnekave" }
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
    }
  },
  methods: {
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
</style>
