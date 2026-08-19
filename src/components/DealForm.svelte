<script lang="ts">
  import type { Snippet } from "svelte";
  import { browserT, getBrowserLocale } from "../lib/browser-i18n";

  const props: { children: Snippet } = $props();
  let busy = false;

  const isYcVerificationLink = (value: string) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        (url.hostname === "www.ycombinator.com" || url.hostname === "ycombinator.com") &&
        url.pathname.startsWith("/verify/") &&
        url.pathname.length > "/verify/".length
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;

    const form = e.currentTarget as HTMLFormElement;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const linkInput = form.querySelector<HTMLInputElement>('input[name="link"]');
    if (!button || !linkInput || !form.reportValidity()) return;

    linkInput.setCustomValidity("");
    if (!isYcVerificationLink(linkInput.value.trim())) {
      linkInput.setCustomValidity(
        browserT(
          "Introdu un link valid de verificare Y Combinator.",
          "Enter a valid Y Combinator verification link.",
        ),
      );
      linkInput.reportValidity();
      return;
    }

    const idleLabel = button.textContent?.trim() || browserT("Solicită oferta", "Claim deal");
    let status = form.querySelector<HTMLElement>("[data-deal-status]");
    if (!status) {
      status = document.createElement("p");
      status.dataset.dealStatus = "true";
      status.className = "sr-only";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      form.append(status);
    }

    const restore = () => {
      button.disabled = false;
      button.textContent = idleLabel;
      form.removeAttribute("aria-busy");
      busy = false;
    };

    busy = true;
    button.disabled = true;
    button.textContent = browserT("Se trimite...", "Sending...");
    form.setAttribute("aria-busy", "true");
    status.textContent = browserT("Se trimite solicitarea.", "Sending your request.");

    try {
      const response = await fetch("/api/yc-deal", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Language": getBrowserLocale(),
        },
        body: new FormData(form),
      });

      let result: { success?: boolean; error?: string; message?: string } = {};
      try {
        result = (await response.json()) as typeof result;
      } catch {
        result = {};
      }

      if (!response.ok || result.success !== true) {
        status.textContent =
          result.error ||
          result.message ||
          browserT(
            "Solicitarea nu a putut fi trimisă. Încearcă din nou.",
            "Your request could not be sent. Please try again.",
          );
        button.textContent = browserT("Încearcă din nou", "Try again");
        window.setTimeout(restore, 2200);
        return;
      }

      form.reset();
      status.textContent = browserT(
        "Solicitarea a fost trimisă. Vom verifica eligibilitatea și revenim cu detalii.",
        "Your request was sent. We'll verify eligibility and follow up with details.",
      );
      button.textContent = browserT("Solicitare trimisă", "Request sent");
      window.setTimeout(restore, 2200);
    } catch (error) {
      console.error("Error submitting YC deal form:", error);
      status.textContent = browserT(
        "A apărut o eroare de rețea. Încearcă din nou.",
        "A network error occurred. Please try again.",
      );
      button.textContent = browserT("Încearcă din nou", "Try again");
      window.setTimeout(restore, 2200);
    }
  };
</script>

<form class="flex flex-col gap-3" onsubmit={handleSubmit}>
  {@render props.children()}
</form>
