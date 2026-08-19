import { getBrowserLocale } from "./browser-i18n";
import {
  ensureTurnstileToken,
  lazyRenderTurnstile,
  resetTurnstile,
} from "./turnstile";

type FormPayload = {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

type PublicFormCopy = {
  verifying: string;
  sending: string;
  success: string;
  securityError: string;
  requestError: string;
  networkError: string;
};

type PublicFormOptions = {
  form: HTMLFormElement;
  status: HTMLElement;
  submit: HTMLButtonElement;
  turnstile?: HTMLElement | null;
  endpoint: string;
  copy: PublicFormCopy;
  prepare?: () => void | boolean;
  resetOnSuccess?: boolean;
  onSuccess?: (payload: FormPayload) => void;
};

function setStatus(
  status: HTMLElement,
  message: string,
  state: "pending" | "success" | "error",
  focus = false,
): void {
  status.textContent = message;
  status.dataset.state = state;
  status.classList.remove("hidden");
  status.setAttribute("aria-live", state === "error" ? "assertive" : "polite");

  if (focus) {
    status.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => status.focus({ preventScroll: true }));
  }
}

function clearStatus(status: HTMLElement): void {
  status.textContent = "";
  status.dataset.state = "";
  status.classList.add("hidden");
  status.setAttribute("aria-live", "polite");
}

async function readPayload(response: Response): Promise<FormPayload> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};

  try {
    return (await response.json()) as FormPayload;
  } catch {
    return {};
  }
}

export function bindPublicForm(options: PublicFormOptions): () => void {
  const {
    form,
    status,
    submit,
    turnstile,
    endpoint,
    copy,
    prepare,
    resetOnSuccess = true,
    onSuccess,
  } = options;

  const turnstileContainer = turnstile ?? null;
  const idleLabel = submit.textContent?.trim() || "Submit";
  let busy = false;
  const cleanupTurnstile = lazyRenderTurnstile(turnstileContainer);

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (busy) return;

    if (!form.reportValidity()) return;
    if (prepare?.() === false) return;

    busy = true;
    form.setAttribute("aria-busy", "true");
    submit.disabled = true;
    clearStatus(status);

    try {
      submit.textContent = copy.verifying;
      setStatus(status, copy.verifying, "pending");

      const verified = await ensureTurnstileToken(turnstileContainer);
      if (!verified) {
        setStatus(status, copy.securityError, "error", true);
        return;
      }

      submit.textContent = copy.sending;
      setStatus(status, copy.sending, "pending");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Language": getBrowserLocale(),
        },
        body: new FormData(form),
      });
      const payload = await readPayload(response);

      if (!response.ok || payload.success !== true) {
        setStatus(
          status,
          payload.error || payload.message || copy.requestError,
          "error",
          true,
        );
        return;
      }

      if (resetOnSuccess) form.reset();
      onSuccess?.(payload);
      setStatus(status, copy.success, "success");
    } catch (error) {
      console.error("Public form submission failed:", error);
      setStatus(status, copy.networkError, "error", true);
    } finally {
      resetTurnstile(turnstileContainer);
      submit.disabled = false;
      submit.textContent = idleLabel;
      form.removeAttribute("aria-busy");
      busy = false;
    }
  };

  form.addEventListener("submit", handleSubmit);

  return () => {
    form.removeEventListener("submit", handleSubmit);
    cleanupTurnstile();
  };
}
