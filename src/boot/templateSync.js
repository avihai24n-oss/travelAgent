// Pulls cloud template state into localStorage at app start so the editor and
// the home page render the latest content from any device. Failures are logged
// but never block boot — the app falls back to local-only behaviour.
import { bootstrapTemplateSync } from "src/assets/defaultTemplates.js";

export default async () => {
  try {
    const result = await bootstrapTemplateSync();
    if (!result.ok && result.error && result.error !== "not_configured") {
      // eslint-disable-next-line no-console
      console.warn("template sync bootstrap:", result.error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("template sync bootstrap threw:", e && e.message || e);
  }
};
