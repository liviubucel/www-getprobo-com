<script lang="ts">
  import type { Snippet } from "svelte";
  import { browserT, getBrowserLocale } from "../lib/browser-i18n";

  const props: { children: Snippet } = $props();
  const handleSubmit = async (e: SubmitEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const button = form.querySelector('button[type="submit"]')!;
    button.setAttribute("disabled", "true");
    const data = new FormData(form);

    try {
      const response = await fetch("/api/yc-deal", {
        method: "POST",
        headers: { "Accept-Language": getBrowserLocale() },
        body: data,
      });

      if (response.ok) {
        alert(
          browserT(
            "Mulțumim pentru interes! Vom analiza solicitarea ta.",
            "Thanks for your interest! We'll review your submission.",
          ),
        );
        form.reset();
      } else {
        const result = (await response.json()) as { error?: string; message?: string };
        alert(
          result.error ||
            result.message ||
            browserT(
              "A apărut o eroare. Încearcă din nou.",
              "Something went wrong. Please try again.",
            ),
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        browserT(
          "A apărut o eroare. Încearcă din nou.",
          "Something went wrong. Please try again.",
        ),
      );
    } finally {
      button.removeAttribute("disabled");
    }
  };
</script>

<form class="flex flex-col gap-3" onsubmit={handleSubmit}>
  {@render props.children()}
</form>
