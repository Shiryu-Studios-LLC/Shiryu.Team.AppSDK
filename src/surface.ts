const DEFAULT_SURFACE_SCALE = 0.98;
const SURFACE_STYLE_ID = "shiryu-team-sdk-surface-scale";

export interface TeamSurfaceSettings {
  scale?: number | false;
}

function isEmbeddedSurface() {
  return typeof window !== "undefined" && window.parent !== window;
}

function getEffectiveScale(scale?: number | false) {
  if (scale === false) return null;
  if (typeof scale === "number" && Number.isFinite(scale) && scale > 0) {
    return scale;
  }
  return DEFAULT_SURFACE_SCALE;
}

export function applyEmbeddedSurfaceSettings(
  settings: TeamSurfaceSettings = {},
) {
  if (typeof document === "undefined" || !isEmbeddedSurface()) return;

  const scale = getEffectiveScale(settings.scale);
  const existingStyle = document.getElementById(
    SURFACE_STYLE_ID,
  ) as HTMLStyleElement | null;

  let styleTag = existingStyle;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = SURFACE_STYLE_ID;
    document.head.appendChild(styleTag);
  }

  if (scale && scale !== 1) {
    document.documentElement.style.setProperty(
      "--shiryu-surface-scale",
      String(scale),
    );
  } else {
    document.documentElement.style.removeProperty("--shiryu-surface-scale");
  }

  styleTag.textContent = `
    html, body {
      height: 100%;
      min-height: 100%;
      overflow: hidden;
    }

    body {
      margin: 0;
      padding: 0;
      ${scale && scale !== 1 ? "zoom: var(--shiryu-surface-scale);" : ""}
    }

    #root,
    #__next,
    [data-shiryu-surface-root="true"] {
      width: 100%;
      height: 100%;
      min-height: 100%;
      overflow: hidden;
    }

    ${scale && scale !== 1 ? `
    #root,
    #__next,
    [data-shiryu-surface-root="true"] {
      width: calc(100% / var(--shiryu-surface-scale));
      height: calc(100% / var(--shiryu-surface-scale));
      min-height: calc(100% / var(--shiryu-surface-scale));
    }
    ` : ""}

    @supports not (zoom: 1) {
      body {
        zoom: normal;
      }

      ${scale && scale !== 1 ? `
      #root,
      #__next,
      [data-shiryu-surface-root="true"] {
        transform: scale(var(--shiryu-surface-scale));
        transform-origin: top left;
      }
      ` : ""}
    }
  `;
}
