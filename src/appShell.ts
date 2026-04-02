const APP_SHELL_STYLE_ID = "shiryu-team-sdk-app-shell";

function isEmbeddedSurface() {
  return typeof window !== "undefined" && window.parent !== window;
}

export function applyEmbeddedAppShellTheme() {
  if (typeof document === "undefined" || !isEmbeddedSurface()) return;

  let styleTag = document.getElementById(APP_SHELL_STYLE_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = APP_SHELL_STYLE_ID;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    :root {
      --shiryu-shell-bg: #1e1f22;
      --shiryu-shell-sidebar: #232428;
      --shiryu-shell-panel: #2b2d31;
      --shiryu-shell-main: #313338;
      --shiryu-shell-elevated: #404249;
      --shiryu-shell-border: rgba(255, 255, 255, 0.05);
      --shiryu-shell-border-strong: rgba(255, 255, 255, 0.08);
      --shiryu-shell-text: #ffffff;
      --shiryu-shell-text-muted: #94a3b8;
      --shiryu-shell-text-subtle: #6b7280;
      --shiryu-shell-accent: #818cf8;
    }

    .shiryu-app-shell {
      display: flex;
      min-height: 100%;
      overflow: hidden;
      background: var(--shiryu-shell-bg);
      color: var(--shiryu-shell-text);
    }

    .shiryu-app-sidebar {
      display: flex;
      width: 300px;
      min-width: 300px;
      flex-direction: column;
      border-right: 1px solid var(--shiryu-shell-border);
      background: var(--shiryu-shell-sidebar);
    }

    .shiryu-app-sidebar-scroll,
    .shiryu-app-scroll {
      min-height: 0;
      overflow-y: auto;
    }

    .shiryu-app-main {
      display: flex;
      min-width: 0;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
      background: var(--shiryu-shell-main);
    }

    .shiryu-app-header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      border-bottom: 1px solid var(--shiryu-shell-border);
      padding: 24px 28px 20px;
    }

    .shiryu-card {
      border: 1px solid var(--shiryu-shell-border);
      border-radius: 16px;
      background: var(--shiryu-shell-panel);
    }

    .shiryu-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      border: 1px solid var(--shiryu-shell-border-strong);
      background: #2f3136;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #cbd5e1;
    }

    .shiryu-section-kicker {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--shiryu-shell-text-subtle);
    }

    .shiryu-scrollbar {
      scrollbar-color: rgba(129, 140, 248, 0.55) transparent;
      scrollbar-width: thin;
    }

    .shiryu-scrollbar::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    .shiryu-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .shiryu-scrollbar::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: rgba(129, 140, 248, 0.45);
      border: 2px solid transparent;
      background-clip: padding-box;
    }

    .shiryu-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(129, 140, 248, 0.68);
      border: 2px solid transparent;
      background-clip: padding-box;
    }
  `;
}
