const APP_SHELL_STYLE_ID = "shiryu-team-sdk-app-shell";

function isEmbeddedSurface() {
  return typeof window !== "undefined" && window.parent !== window;
}

export type ShiryuAppShellMode = "standard" | "compact";

export interface ShiryuAppShellClassNames {
  root: string;
  sidebar: string;
  sidebarScroll: string;
  sidebarBrand: string;
  sidebarBrandCopy: string;
  sidebarKicker: string;
  sidebarTitle: string;
  sidebarDescription: string;
  nav: string;
  navLink: string;
  navLinkActive: string;
  navIcon: string;
  main: string;
  mainScroll: string;
  header: string;
  card: string;
  pill: string;
  sectionKicker: string;
  scrollbar: string;
}

export function composeShiryuClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getShiryuAppShellClassNames(mode: ShiryuAppShellMode = "standard"): ShiryuAppShellClassNames {
  const isCompact = mode === "compact";

  return {
    root: composeShiryuClassNames("shiryu-app-shell", isCompact && "shiryu-app-shell-compact"),
    sidebar: composeShiryuClassNames("shiryu-app-sidebar", isCompact && "shiryu-app-sidebar-compact"),
    sidebarScroll: "shiryu-app-sidebar-scroll",
    sidebarBrand: "shiryu-app-sidebar-brand",
    sidebarBrandCopy: "shiryu-app-sidebar-brand-copy",
    sidebarKicker: "shiryu-app-sidebar-kicker",
    sidebarTitle: "shiryu-app-sidebar-title",
    sidebarDescription: "shiryu-app-sidebar-description",
    nav: "shiryu-app-sidebar-nav",
    navLink: "shiryu-app-sidebar-nav-link",
    navLinkActive: "shiryu-app-sidebar-nav-link-active",
    navIcon: "shiryu-app-sidebar-nav-icon",
    main: "shiryu-app-main",
    mainScroll: "shiryu-app-scroll",
    header: "shiryu-app-header",
    card: "shiryu-card",
    pill: "shiryu-pill",
    sectionKicker: "shiryu-section-kicker",
    scrollbar: "shiryu-scrollbar",
  };
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

    .shiryu-app-shell-compact .shiryu-app-sidebar,
    .shiryu-app-sidebar-compact {
      width: 97px;
      min-width: 97px;
      align-items: center;
      gap: 16px;
      padding: 18px 10px;
    }

    .shiryu-app-sidebar-brand {
      width: 100%;
    }

    .shiryu-app-sidebar-brand-copy {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .shiryu-app-shell-compact .shiryu-app-sidebar-brand,
    .shiryu-app-sidebar-compact .shiryu-app-sidebar-brand {
      display: none;
    }

    .shiryu-app-shell-compact .shiryu-app-sidebar-brand-copy,
    .shiryu-app-sidebar-compact .shiryu-app-sidebar-brand-copy {
      align-items: center;
      text-align: center;
    }

    .shiryu-app-sidebar-kicker,
    .shiryu-app-sidebar-title,
    .shiryu-app-sidebar-description {
      min-width: 0;
    }

    .shiryu-app-sidebar-kicker {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--shiryu-shell-accent);
    }

    .shiryu-app-sidebar-title {
      margin: 0;
      font-size: 1rem;
      line-height: 1.05;
      color: var(--shiryu-shell-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .shiryu-app-sidebar-description {
      margin: 0;
      font-size: 0.86rem;
      line-height: 1.55;
      color: var(--shiryu-shell-text-muted);
    }

    .shiryu-app-sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .shiryu-app-sidebar-nav-link {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      width: 100%;
      min-height: 46px;
      padding: 12px 14px;
      border-radius: 18px;
      color: #dbdee1;
      text-decoration: none;
      transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
    }

    .shiryu-app-shell-compact .shiryu-app-sidebar-nav-link,
    .shiryu-app-sidebar-compact .shiryu-app-sidebar-nav-link {
      justify-content: center;
      padding: 12px;
    }

    .shiryu-app-sidebar-nav-link:hover,
    .shiryu-app-sidebar-nav-link-active {
      background: rgba(129, 140, 248, 0.16);
      color: #ffffff;
      transform: translateX(2px);
    }

    .shiryu-app-shell-compact .shiryu-app-sidebar-nav-link:hover,
    .shiryu-app-shell-compact .shiryu-app-sidebar-nav-link-active,
    .shiryu-app-sidebar-compact .shiryu-app-sidebar-nav-link:hover,
    .shiryu-app-sidebar-compact .shiryu-app-sidebar-nav-link-active {
      transform: none;
    }

    .shiryu-app-sidebar-nav-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
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

    @media (max-width: 980px) {
      .shiryu-app-shell,
      .shiryu-app-shell-compact {
        flex-direction: column;
      }

      .shiryu-app-sidebar,
      .shiryu-app-sidebar-compact,
      .shiryu-app-shell-compact .shiryu-app-sidebar {
        width: 100%;
        min-width: 0;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-right: 0;
        border-bottom: 1px solid var(--shiryu-shell-border);
      }

      .shiryu-app-sidebar-nav {
        width: auto;
        flex-direction: row;
      }

      .shiryu-app-shell-compact .shiryu-app-sidebar-brand-copy,
      .shiryu-app-sidebar-compact .shiryu-app-sidebar-brand-copy {
        align-items: flex-start;
        text-align: left;
      }
    }
  `;
}
