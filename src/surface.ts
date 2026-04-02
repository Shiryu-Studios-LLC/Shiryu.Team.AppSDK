const DEFAULT_SURFACE_SCALE = 1;
const DEFAULT_MIN_SCALE = 0.97;
const DEFAULT_WIDTH_BREAKPOINT = 1440;
const DEFAULT_HEIGHT_BREAKPOINT = 900;
const SURFACE_STYLE_ID = "shiryu-team-sdk-surface-scale";
const SURFACE_SCALE_PROP = "--shiryu-surface-scale";
let teardownSurfaceResize: (() => void) | null = null;

export interface TeamSurfaceSettings {
  scale?: number | false;
  responsive?: boolean;
  minScale?: number;
  widthBreakpoint?: number;
  heightBreakpoint?: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getResponsiveScale(
  baseScale: number,
  settings: TeamSurfaceSettings,
) {
  if (settings.responsive === false || typeof window === "undefined") {
    return baseScale;
  }

  const minScale =
    typeof settings.minScale === "number" &&
    Number.isFinite(settings.minScale) &&
    settings.minScale > 0
      ? settings.minScale
      : DEFAULT_MIN_SCALE;
  const widthBreakpoint =
    typeof settings.widthBreakpoint === "number" &&
    Number.isFinite(settings.widthBreakpoint) &&
    settings.widthBreakpoint > 0
      ? settings.widthBreakpoint
      : DEFAULT_WIDTH_BREAKPOINT;
  const heightBreakpoint =
    typeof settings.heightBreakpoint === "number" &&
    Number.isFinite(settings.heightBreakpoint) &&
    settings.heightBreakpoint > 0
      ? settings.heightBreakpoint
      : DEFAULT_HEIGHT_BREAKPOINT;

  const widthFactor =
    window.innerWidth < widthBreakpoint
      ? window.innerWidth / widthBreakpoint
      : 1;
  const heightFactor =
    window.innerHeight < heightBreakpoint
      ? window.innerHeight / heightBreakpoint
      : 1;

  return clamp(Math.min(baseScale, widthFactor, heightFactor), minScale, 1);
}

export function applyEmbeddedSurfaceSettings(
  settings: TeamSurfaceSettings = {},
) {
  if (typeof document === "undefined" || !isEmbeddedSurface()) return;

  const baseScale = getEffectiveScale(settings.scale);
  const existingStyle = document.getElementById(
    SURFACE_STYLE_ID,
  ) as HTMLStyleElement | null;

  let styleTag = existingStyle;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = SURFACE_STYLE_ID;
    document.head.appendChild(styleTag);
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
      zoom: var(${SURFACE_SCALE_PROP}, 1);
    }

    #root,
    #__next,
    [data-shiryu-surface-root="true"] {
      width: 100%;
      height: 100%;
      min-height: 100%;
      overflow: hidden;
    }

    @supports not (zoom: 1) {
      body {
        zoom: normal;
      }

      #root,
      #__next,
      [data-shiryu-surface-root="true"] {
        width: calc(100% / var(${SURFACE_SCALE_PROP}, 1));
        height: calc(100% / var(${SURFACE_SCALE_PROP}, 1));
        min-height: calc(100% / var(${SURFACE_SCALE_PROP}, 1));
        transform: scale(var(${SURFACE_SCALE_PROP}, 1));
        transform-origin: top left;
      }
    }
  `;

  function applyScaleValue() {
    if (!baseScale || baseScale === 1) {
      document.documentElement.style.removeProperty(SURFACE_SCALE_PROP);
      return;
    }

    document.documentElement.style.setProperty(
      SURFACE_SCALE_PROP,
      String(getResponsiveScale(baseScale, settings)),
    );
  }

  teardownSurfaceResize?.();
  teardownSurfaceResize = null;
  applyScaleValue();

  if (!baseScale || baseScale === 1 || settings.responsive === false) {
    return;
  }

  const handleResize = () => applyScaleValue();
  window.addEventListener("resize", handleResize);
  window.visualViewport?.addEventListener("resize", handleResize);
  teardownSurfaceResize = () => {
    window.removeEventListener("resize", handleResize);
    window.visualViewport?.removeEventListener("resize", handleResize);
  };
}
