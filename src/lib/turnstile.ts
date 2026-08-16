type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "auto" | "light" | "dark";
      size?: "normal" | "compact" | "flexible";
      appearance?: "always" | "execute" | "interaction-only";
      language?: string;
    },
  ) => string;
  reset: (widgetId?: string) => void;
};

type TurnstileWindow = Window & {
  turnstile?: TurnstileApi;
  __zbtTurnstilePromise?: Promise<TurnstileApi>;
};

const SCRIPT_ID = "zbt-turnstile-api";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function targetWindow(): TurnstileWindow {
  return window as TurnstileWindow;
}

function loadTurnstile(): Promise<TurnstileApi> {
  const target = targetWindow();
  if (target.turnstile) return Promise.resolve(target.turnstile);
  if (target.__zbtTurnstilePromise) return target.__zbtTurnstilePromise;

  target.__zbtTurnstilePromise = new Promise<TurnstileApi>((resolve, reject) => {
    const resolveWhenReady = () => {
      if (target.turnstile) {
        resolve(target.turnstile);
        return;
      }
      reject(new Error("Turnstile loaded without exposing the client API."));
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", resolveWhenReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", resolveWhenReady, { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load.")), {
      once: true,
    });
    document.head.append(script);
  }).catch((error) => {
    target.__zbtTurnstilePromise = undefined;
    throw error;
  });

  return target.__zbtTurnstilePromise;
}

export async function renderTurnstile(container: HTMLElement): Promise<string | null> {
  const existingId = container.dataset.turnstileWidgetId;
  if (existingId) return existingId;

  const sitekey = container.dataset.sitekey;
  if (!sitekey) return null;

  const api = await loadTurnstile();
  if (container.dataset.turnstileWidgetId) return container.dataset.turnstileWidgetId;

  const widgetId = api.render(container, {
    sitekey,
    theme: "auto",
    size: container.dataset.size === "flexible" ? "flexible" : "normal",
    appearance: "interaction-only",
    language: document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "ro",
  });
  container.dataset.turnstileWidgetId = widgetId;
  return widgetId;
}

export function resetTurnstile(container: HTMLElement | null): void {
  if (!container) return;
  const widgetId = container.dataset.turnstileWidgetId;
  if (!widgetId) return;
  targetWindow().turnstile?.reset(widgetId);
}

export function lazyRenderTurnstile(container: HTMLElement | null): () => void {
  if (!container) return () => undefined;

  let disposed = false;
  let observer: IntersectionObserver | null = null;
  const form = container.closest("form");

  const trigger = () => {
    if (disposed || container.dataset.turnstileWidgetId) return;
    observer?.disconnect();
    observer = null;
    void renderTurnstile(container).catch(() => undefined);
  };

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) trigger();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(container);
  } else {
    window.setTimeout(trigger, 1_000);
  }

  form?.addEventListener("focusin", trigger, { once: true });
  form?.addEventListener("pointerdown", trigger, { once: true, passive: true });

  return () => {
    disposed = true;
    observer?.disconnect();
    form?.removeEventListener("focusin", trigger);
    form?.removeEventListener("pointerdown", trigger);
  };
}
