<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { browserT, getBrowserLocale } from "../lib/browser-i18n";
  import { bindPublicForm } from "../lib/public-form";

  const props: { children: Snippet } = $props();
  const turnstileSiteKey = "0x4AAAAAABBpDfopxKwUIKF_";

  let formElement!: HTMLFormElement;
  let statusElement!: HTMLParagraphElement;
  let turnstileElement!: HTMLDivElement;

  onMount(() => {
    const submit = formElement.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submit) return;

    return bindPublicForm({
      form: formElement,
      status: statusElement,
      submit,
      turnstile: turnstileElement,
      endpoint: "/api/yc-deal",
      headers: () => ({
        "Accept-Language": getBrowserLocale(),
      }),
      copy: {
        verifying: browserT("Se verifică...", "Verifying..."),
        sending: browserT("Se trimite...", "Sending..."),
        success: browserT(
          "Solicitarea a fost trimisă. Vom verifica eligibilitatea și revenim cu detalii.",
          "Your request was sent. We'll verify eligibility and follow up with details.",
        ),
        securityError: browserT(
          "Verificarea de securitate nu este încă disponibilă. Încearcă din nou.",
          "Security verification is not ready yet. Please try again.",
        ),
        requestError: browserT(
          "Solicitarea nu a putut fi procesată.",
          "Your request could not be processed.",
        ),
        networkError: browserT(
          "A apărut o eroare de rețea. Încearcă din nou.",
          "A network error occurred. Please try again.",
        ),
      },
    });
  });
</script>

<form bind:this={formElement} class="flex flex-col gap-3">
  {@render props.children()}
  <div
    bind:this={turnstileElement}
    class="max-w-full overflow-hidden"
    data-turnstile-container
    data-sitekey={turnstileSiteKey}
    data-size="flexible"
    aria-label="Security verification"
  ></div>
  <p
    bind:this={statusElement}
    class="text-muted-foreground hidden rounded-lg border px-3 py-2 text-sm"
    role="status"
    aria-live="polite"
  ></p>
</form>