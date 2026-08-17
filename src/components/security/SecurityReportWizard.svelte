<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import { browserT, getBrowserLocale } from "../../lib/browser-i18n";
  import { ensureTurnstileToken, resetTurnstile } from "../../lib/turnstile";

  let { siteKey }: { siteKey: string } = $props();

  const steps = [
    ["Identitate", "Identity"],
    ["Contact verificat", "Verified contact"],
    ["Activ afectat", "Affected asset"],
    ["Clasificare", "Classification"],
    ["Detalii tehnice", "Technical detail"],
    ["Reproducere", "Reproduction"],
    ["Impact", "Impact"],
    ["Dovezi", "Evidence"],
    ["Disclosure", "Disclosure"],
    ["Revizuire", "Review"],
  ] as const;

  const values = $state({
    firstName: "",
    lastName: "",
    organization: "",
    jobTitle: "",
    phone: "",
    country: "",
    email: "",
    emailVerificationToken: "",
    affectedAsset: "",
    assetType: "",
    environment: "",
    discoveredAt: "",
    authRequired: "",
    accountContext: "",
    category: "",
    severity: "",
    summary: "",
    technicalDescription: "",
    prerequisites: "",
    reproduction: "",
    expectedBehavior: "",
    actualBehavior: "",
    impact: "",
    dataExposure: "",
    affectedUsers: "",
    exploitability: "",
    poc: "",
    evidenceUrl: "",
    remediation: "",
    disclosure: "",
    requestedDisclosureDate: "",
    disclosedElsewhere: "",
    otherRecipients: "",
    authorizationAcknowledgement: false,
    safeTestingAcknowledgement: false,
    accuracyAcknowledgement: false,
    privacyAcknowledgement: false,
  });

  let step = $state(0);
  let stepError = $state("");
  let statusMessage = $state("");
  let emailCode = $state("");
  let codeSent = $state(false);
  let emailVerified = $state(false);
  let resendIn = $state(0);
  let sendingCode = $state(false);
  let verifyingCode = $state(false);
  let submitting = $state(false);
  let successReference = $state("");
  let stepHeading: HTMLElement | null = null;
  let emailTurnstile: HTMLElement | null = null;
  let finalTurnstile: HTMLElement | null = null;
  let cooldownTimer: number | null = null;

  const tr = (ro: string, en: string) => browserT(ro, en);
  const locale = () => getBrowserLocale();
  const text = (pair: readonly [string, string]) => tr(pair[0], pair[1]);
  const blank = (value: string) => !value.trim();

  function startCooldown(seconds = 60) {
    if (cooldownTimer) window.clearInterval(cooldownTimer);
    resendIn = seconds;
    cooldownTimer = window.setInterval(() => {
      resendIn = Math.max(0, resendIn - 1);
      if (resendIn === 0 && cooldownTimer) {
        window.clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  }

  onDestroy(() => {
    if (cooldownTimer) window.clearInterval(cooldownTimer);
  });

  async function focusStep() {
    await tick();
    stepHeading?.focus();
    window.scrollTo({ top: Math.max(0, (stepHeading?.getBoundingClientRect().top || 0) + window.scrollY - 150), behavior: "smooth" });
  }

  function setStep(next: number) {
    step = Math.min(steps.length - 1, Math.max(0, next));
    stepError = "";
    statusMessage = "";
    void focusStep();
  }

  function requireValues(items: Array<[string, string]>) {
    const missing = items.find(([value]) => blank(value));
    if (!missing) return true;
    stepError = tr(`Completează câmpul „${missing[1]}”.`, `Complete the “${missing[1]}” field.`);
    return false;
  }

  function validateStep() {
    stepError = "";
    if (step === 0) {
      return requireValues([
        [values.firstName, tr("Prenume", "First name")],
        [values.lastName, tr("Nume", "Last name")],
        [values.organization, tr("Organizație", "Organization")],
        [values.jobTitle, tr("Funcție / rol", "Job title / role")],
      ]);
    }
    if (step === 1) {
      if (!requireValues([
        [values.phone, tr("Telefon", "Phone")],
        [values.country, tr("Țară", "Country")],
        [values.email, "Email"],
      ])) return false;
      if (!emailVerified || !values.emailVerificationToken) {
        stepError = tr("Verifică adresa de email cu codul primit înainte de a continua.", "Verify your email with the received code before continuing.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      return requireValues([
        [values.affectedAsset, tr("Activ afectat", "Affected asset")],
        [values.assetType, tr("Tip activ", "Asset type")],
        [values.environment, tr("Mediu", "Environment")],
        [values.discoveredAt, tr("Data descoperirii", "Discovery date")],
      ]);
    }
    if (step === 3) {
      if (values.authRequired === "no") values.accountContext = "N/A";
      return requireValues([
        [values.authRequired, tr("Autentificare necesară", "Authentication required")],
        [values.accountContext, tr("Context acces / cont", "Access / account context")],
        [values.category, tr("Categorie", "Category")],
        [values.severity, tr("Severitate", "Severity")],
      ]);
    }
    if (step === 4) {
      return requireValues([
        [values.summary, tr("Rezumat", "Summary")],
        [values.technicalDescription, tr("Descriere tehnică", "Technical description")],
      ]);
    }
    if (step === 5) {
      return requireValues([
        [values.prerequisites, tr("Prerechizite", "Prerequisites")],
        [values.reproduction, tr("Pași de reproducere", "Reproduction steps")],
        [values.expectedBehavior, tr("Comportament așteptat", "Expected behavior")],
        [values.actualBehavior, tr("Comportament observat", "Actual behavior")],
      ]);
    }
    if (step === 6) {
      return requireValues([
        [values.impact, tr("Impact", "Impact")],
        [values.dataExposure, tr("Expunere de date", "Data exposure")],
        [values.affectedUsers, tr("Utilizatori / conturi afectate", "Affected users / accounts")],
        [values.exploitability, tr("Exploatabilitate", "Exploitability")],
      ]);
    }
    if (step === 7) {
      if (!requireValues([
        [values.poc, tr("PoC / dovezi", "PoC / evidence")],
        [values.evidenceUrl, tr("URL dovezi", "Evidence URL")],
        [values.remediation, tr("Remediere sugerată", "Suggested remediation")],
      ])) return false;
      try {
        const url = new URL(values.evidenceUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("invalid");
      } catch {
        stepError = tr("URL-ul pentru dovezi trebuie să înceapă cu http:// sau https://.", "The evidence URL must start with http:// or https://.");
        return false;
      }
      return true;
    }
    if (step === 8) {
      if (values.disclosedElsewhere === "no") values.otherRecipients = "N/A";
      return requireValues([
        [values.disclosure, tr("Preferință disclosure", "Disclosure preference")],
        [values.requestedDisclosureDate, tr("Dată / condiție disclosure", "Disclosure date / condition")],
        [values.disclosedElsewhere, tr("Dezvăluit în altă parte", "Disclosed elsewhere")],
        [values.otherRecipients, tr("Alți destinatari", "Other recipients")],
      ]);
    }
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    setStep(step + 1);
  }

  function previousStep() {
    setStep(step - 1);
  }

  function turnstileValue(container: HTMLElement | null) {
    return (container?.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value || "";
  }

  async function requestCode() {
    stepError = "";
    statusMessage = "";
    if (blank(values.email)) {
      stepError = tr("Introdu adresa de email.", "Enter your email address.");
      return;
    }
    sendingCode = true;
    try {
      const ok = await ensureTurnstileToken(emailTurnstile);
      if (!ok) throw new Error(tr("Verificarea anti-abuz nu a putut fi finalizată.", "The anti-abuse verification could not be completed."));
      const body = new FormData();
      body.set("email", values.email.trim());
      body.set("cf-turnstile-response", turnstileValue(emailTurnstile));
      const response = await fetch(`/api/security-report/email/start?lang=${locale()}`, {
        method: "POST",
        headers: { "Accept-Language": locale() },
        body,
      });
      const result = (await response.json()) as { success?: boolean; message?: string; error?: string; resendAfter?: number };
      if (!response.ok || !result.success) throw new Error(result.error || tr("Codul nu a putut fi trimis.", "The code could not be sent."));
      codeSent = true;
      emailVerified = false;
      values.emailVerificationToken = "";
      statusMessage = result.message || tr("Codul a fost trimis.", "The code was sent.");
      startCooldown(result.resendAfter || 60);
      resetTurnstile(emailTurnstile);
    } catch (error) {
      stepError = error instanceof Error ? error.message : tr("Codul nu a putut fi trimis.", "The code could not be sent.");
      resetTurnstile(emailTurnstile);
    } finally {
      sendingCode = false;
    }
  }

  async function verifyCode() {
    stepError = "";
    statusMessage = "";
    if (!/^\d{6}$/.test(emailCode.trim())) {
      stepError = tr("Introdu codul de 6 cifre primit prin email.", "Enter the six-digit code received by email.");
      return;
    }
    verifyingCode = true;
    try {
      const body = new FormData();
      body.set("email", values.email.trim());
      body.set("code", emailCode.trim());
      const response = await fetch(`/api/security-report/email/verify?lang=${locale()}`, {
        method: "POST",
        headers: { "Accept-Language": locale() },
        body,
      });
      const result = (await response.json()) as { success?: boolean; message?: string; error?: string; verificationToken?: string };
      if (!response.ok || !result.success || !result.verificationToken) throw new Error(result.error || tr("Codul nu este valid.", "The code is not valid."));
      values.emailVerificationToken = result.verificationToken;
      emailVerified = true;
      statusMessage = result.message || tr("Email verificat.", "Email verified.");
    } catch (error) {
      stepError = error instanceof Error ? error.message : tr("Emailul nu a putut fi verificat.", "The email could not be verified.");
    } finally {
      verifyingCode = false;
    }
  }

  function changeEmail() {
    emailVerified = false;
    codeSent = false;
    emailCode = "";
    values.emailVerificationToken = "";
    statusMessage = "";
  }

  async function submitReport() {
    stepError = "";
    statusMessage = "";
    if (!values.authorizationAcknowledgement || !values.safeTestingAcknowledgement || !values.accuracyAcknowledgement || !values.privacyAcknowledgement) {
      stepError = tr("Confirmă toate cele patru declarații înainte de trimitere.", "Confirm all four declarations before submitting.");
      return;
    }
    if (!emailVerified || !values.emailVerificationToken) {
      stepError = tr("Verificarea emailului a expirat. Revino la pasul de contact și verifică din nou.", "Your email verification has expired. Return to the contact step and verify it again.");
      return;
    }

    submitting = true;
    try {
      const ok = await ensureTurnstileToken(finalTurnstile);
      if (!ok) throw new Error(tr("Verificarea anti-abuz nu a putut fi finalizată.", "The anti-abuse verification could not be completed."));

      if (values.authRequired === "no") values.accountContext = "N/A";
      if (values.disclosedElsewhere === "no") values.otherRecipients = "N/A";

      const body = new FormData();
      body.set("website", "");
      for (const [key, value] of Object.entries(values)) {
        if (typeof value === "boolean") {
          if (value) body.set(key, "on");
        } else {
          body.set(key, value);
        }
      }
      body.set("cf-turnstile-response", turnstileValue(finalTurnstile));

      const response = await fetch(`/api/security-report?lang=${locale()}`, {
        method: "POST",
        headers: { "Accept-Language": locale() },
        body,
      });
      const result = (await response.json()) as { success?: boolean; error?: string; reference?: string };
      if (!response.ok || !result.success || !result.reference) throw new Error(result.error || tr("Raportul nu a putut fi trimis.", "The report could not be submitted."));
      successReference = result.reference;
      statusMessage = tr("Raportul a fost transmis în siguranță.", "The report was submitted securely.");
    } catch (error) {
      stepError = error instanceof Error ? error.message : tr("Raportul nu a putut fi trimis.", "The report could not be submitted.");
      resetTurnstile(finalTurnstile);
    } finally {
      submitting = false;
    }
  }
</script>

{#if successReference}
  <section class="rounded-2xl border bg-level-0 p-7 sm:p-10" aria-live="polite">
    <p class="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-[0.14em]">{tr("Raport înregistrat", "Report received")}</p>
    <h2 class="text-h3 mb-4 font-medium">{tr("Mulțumim. Raportul a intrat în fluxul de securitate ZebraByte.", "Thank you. Your report is now in the ZebraByte security workflow.")}</h2>
    <p class="text-muted-foreground mb-6 leading-relaxed">{tr("Păstrează referința de mai jos pentru orice comunicare ulterioară. Am trimis și o confirmare la adresa de email verificată.", "Keep the reference below for any follow-up. We also sent an acknowledgement to your verified email address.")}</p>
    <div class="inline-flex rounded-xl border bg-active px-5 py-3 font-mono text-lg font-medium">{successReference}</div>
  </section>
{:else}
  <div class="mb-7">
    <div class="mb-3 flex items-center justify-between gap-4 text-sm">
      <span class="font-medium">{tr("Pasul", "Step")} {step + 1} {tr("din", "of")} {steps.length}</span>
      <span class="text-muted-foreground">{text(steps[step])}</span>
    </div>
    <div class="h-1.5 overflow-hidden rounded-full bg-active" role="progressbar" aria-valuemin="1" aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label={tr("Progres raport vulnerabilitate", "Vulnerability report progress")}>
      <div class="bg-foreground h-full rounded-full transition-[width] duration-300" style={`width:${((step + 1) / steps.length) * 100}%`}></div>
    </div>
  </div>

  <section class="rounded-2xl border bg-level-0 p-6 sm:p-8">
    <header class="mb-8 max-w-180" tabindex="-1" bind:this={stepHeading}>
      <p class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-[0.14em]">{text(steps[step])}</p>
      {#if step === 0}<h2 class="text-h4 font-medium">{tr("Cine raportează problema?", "Who is reporting the issue?")}</h2>{/if}
      {#if step === 1}<h2 class="text-h4 font-medium">{tr("Cum putem confirma identitatea de contact?", "How can we verify your contact identity?")}</h2>{/if}
      {#if step === 2}<h2 class="text-h4 font-medium">{tr("Ce activ ZebraByte este afectat?", "Which ZebraByte asset is affected?")}</h2>{/if}
      {#if step === 3}<h2 class="text-h4 font-medium">{tr("Cum clasifici vulnerabilitatea?", "How would you classify the vulnerability?")}</h2>{/if}
      {#if step === 4}<h2 class="text-h4 font-medium">{tr("Descrie problema tehnică.", "Describe the technical issue.")}</h2>{/if}
      {#if step === 5}<h2 class="text-h4 font-medium">{tr("Cum reproducem problema?", "How do we reproduce the issue?")}</h2>{/if}
      {#if step === 6}<h2 class="text-h4 font-medium">{tr("Care este impactul demonstrabil?", "What is the demonstrable impact?")}</h2>{/if}
      {#if step === 7}<h2 class="text-h4 font-medium">{tr("Ce dovezi și remediere propui?", "What evidence and remediation do you propose?")}</h2>{/if}
      {#if step === 8}<h2 class="text-h4 font-medium">{tr("Cum coordonăm disclosure-ul?", "How should we coordinate disclosure?")}</h2>{/if}
      {#if step === 9}<h2 class="text-h4 font-medium">{tr("Revizuiește și confirmă raportul.", "Review and confirm your report.")}</h2>{/if}
      <p class="text-muted-foreground mt-3 text-sm leading-relaxed">{tr("Toate informațiile solicitate sunt obligatorii. Dacă un câmp nu se aplică, scrie N/A atunci când este permis.", "All requested information is required. If a field does not apply, enter N/A where permitted.")}</p>
    </header>

    {#if step === 0}
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Prenume", "First name")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.firstName} autocomplete="given-name" /></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Nume", "Last name")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.lastName} autocomplete="family-name" /></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Organizație / companie", "Organization / company")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.organization} autocomplete="organization" /></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Funcție / rol", "Job title / role")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.jobTitle} autocomplete="organization-title" /></label>
      </div>
    {:else if step === 1}
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Telefon", "Phone")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.phone} autocomplete="tel" inputmode="tel" /></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Țară", "Country")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.country} autocomplete="country-name" /></label>
      </div>
      <div class="mt-6 rounded-xl border p-5">
        <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label class="grid gap-2"><span class="text-sm font-medium">Email *</span><input class="rounded-xl border bg-transparent px-4 py-3 disabled:opacity-60" bind:value={values.email} autocomplete="email" type="email" disabled={emailVerified} /></label>
          {#if emailVerified}
            <button type="button" class="rounded-xl border px-4 py-3 text-sm font-medium" onclick={changeEmail}>{tr("Schimbă emailul", "Change email")}</button>
          {:else}
            <button type="button" class="rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-50" disabled={sendingCode || resendIn > 0} onclick={requestCode}>{sendingCode ? tr("Se trimite…", "Sending…") : resendIn > 0 ? `${tr("Retrimite în", "Resend in")} ${resendIn}s` : tr("Trimite cod", "Send code")}</button>
          {/if}
        </div>
        {#if !emailVerified}<div class="mt-4" bind:this={emailTurnstile} data-sitekey={siteKey} data-size="flexible"></div>{/if}
        {#if codeSent && !emailVerified}
          <div class="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label class="grid gap-2"><span class="text-sm font-medium">{tr("Cod de verificare (6 cifre)", "Verification code (6 digits)")} *</span><input class="rounded-xl border bg-transparent px-4 py-3 font-mono tracking-[0.3em]" bind:value={emailCode} inputmode="numeric" maxlength="6" autocomplete="one-time-code" /></label>
            <button type="button" class="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50" disabled={verifyingCode} onclick={verifyCode}>{verifyingCode ? tr("Se verifică…", "Verifying…") : tr("Verifică", "Verify")}</button>
          </div>
        {/if}
        {#if emailVerified}<p class="mt-4 text-sm font-medium">✓ {tr("Adresă de email verificată", "Email address verified")}</p>{/if}
      </div>
    {:else if step === 2}
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="grid gap-2 sm:col-span-2"><span class="text-sm font-medium">{tr("Activ / URL / hostname afectat", "Affected asset / URL / hostname")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.affectedAsset} placeholder="https://…" /></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Tip activ", "Asset type")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.assetType}><option value="">—</option><option value="website">Website</option><option value="api">API</option><option value="portal">Portal</option><option value="worker-edge">Worker / edge</option><option value="dns-domain">DNS / domain</option><option value="email">Email</option><option value="hosting">Hosting</option><option value="application">Application</option><option value="other">Other</option></select></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Mediu", "Environment")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.environment}><option value="">—</option><option value="production">Production</option><option value="staging">Staging</option><option value="development">Development</option><option value="unknown">Unknown</option></select></label>
        <label class="grid gap-2 sm:col-span-2"><span class="text-sm font-medium">{tr("Data și ora aproximativă a descoperirii", "Approximate discovery date and time")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.discoveredAt} type="datetime-local" /></label>
      </div>
    {:else if step === 3}
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Necesită autentificare?", "Authentication required?")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.authRequired}><option value="">—</option><option value="yes">{tr("Da", "Yes")}</option><option value="no">{tr("Nu", "No")}</option><option value="unknown">{tr("Nu știu", "Unknown")}</option></select></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Severitate estimată", "Estimated severity")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.severity}><option value="">—</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="unsure">Unsure</option></select></label>
        <label class="grid gap-2 sm:col-span-2"><span class="text-sm font-medium">{tr("Categorie", "Category")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.category}><option value="">—</option><option value="access-control">Access control</option><option value="authentication">Authentication</option><option value="injection">Injection</option><option value="xss">XSS</option><option value="ssrf">SSRF</option><option value="csrf">CSRF</option><option value="data-exposure">Data exposure</option><option value="misconfiguration">Misconfiguration</option><option value="dependency">Dependency</option><option value="business-logic">Business logic</option><option value="cryptography">Cryptography</option><option value="file-upload">File upload</option><option value="information-disclosure">Information disclosure</option><option value="other">Other</option></select></label>
        {#if values.authRequired !== "no"}<label class="grid gap-2 sm:col-span-2"><span class="text-sm font-medium">{tr("Contextul contului / nivelul de acces folosit", "Account context / access level used")} *</span><textarea class="min-h-28 rounded-xl border bg-transparent px-4 py-3" bind:value={values.accountContext} placeholder={tr("Nu include parole, chei sau token-uri. Scrie N/A dacă nu se aplică.", "Do not include passwords, keys or tokens. Enter N/A if not applicable.")}></textarea></label>{/if}
      </div>
    {:else if step === 4}
      <div class="grid gap-5">
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Rezumat scurt", "Short summary")} *</span><textarea class="min-h-24 rounded-xl border bg-transparent px-4 py-3" bind:value={values.summary} maxlength="500"></textarea></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Descriere tehnică completă", "Full technical description")} *</span><textarea class="min-h-52 rounded-xl border bg-transparent px-4 py-3 font-mono text-sm" bind:value={values.technicalDescription}></textarea></label>
      </div>
    {:else if step === 5}
      <div class="grid gap-5">
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Prerechizite", "Prerequisites")} *</span><textarea class="min-h-28 rounded-xl border bg-transparent px-4 py-3" bind:value={values.prerequisites}></textarea></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Pași exacți de reproducere", "Exact reproduction steps")} *</span><textarea class="min-h-52 rounded-xl border bg-transparent px-4 py-3 font-mono text-sm" bind:value={values.reproduction} placeholder="1. …&#10;2. …&#10;3. …"></textarea></label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="grid gap-2"><span class="text-sm font-medium">{tr("Comportament așteptat", "Expected behavior")} *</span><textarea class="min-h-28 rounded-xl border bg-transparent px-4 py-3" bind:value={values.expectedBehavior}></textarea></label>
          <label class="grid gap-2"><span class="text-sm font-medium">{tr("Comportament observat", "Actual behavior")} *</span><textarea class="min-h-28 rounded-xl border bg-transparent px-4 py-3" bind:value={values.actualBehavior}></textarea></label>
        </div>
      </div>
    {:else if step === 6}
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="grid gap-2 sm:col-span-2"><span class="text-sm font-medium">{tr("Impact de securitate demonstrabil", "Demonstrable security impact")} *</span><textarea class="min-h-40 rounded-xl border bg-transparent px-4 py-3" bind:value={values.impact}></textarea></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Expunere de date observată", "Observed data exposure")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.dataExposure}><option value="">—</option><option value="none-observed">None observed</option><option value="metadata">Metadata</option><option value="personal-data">Personal data</option><option value="credentials-secrets">Credentials / secrets</option><option value="financial-data">Financial data</option><option value="customer-content">Customer content</option><option value="unknown">Unknown</option><option value="other">Other</option></select></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Exploatabilitate", "Exploitability")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.exploitability}><option value="">—</option><option value="reliable">Reliable</option><option value="intermittent">Intermittent</option><option value="complex">Complex</option><option value="theoretical">Theoretical</option><option value="unknown">Unknown</option></select></label>
        <label class="grid gap-2 sm:col-span-2"><span class="text-sm font-medium">{tr("Utilizatori / conturi afectate", "Affected users / accounts")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.affectedUsers} placeholder={tr("Număr aproximativ sau N/A", "Approximate number or N/A")} /></label>
      </div>
    {:else if step === 7}
      <div class="grid gap-5">
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Proof of Concept / dovezi", "Proof of Concept / evidence")} *</span><textarea class="min-h-48 rounded-xl border bg-transparent px-4 py-3 font-mono text-sm" bind:value={values.poc} placeholder={tr("Fără parole, chei private, token-uri sau date personale inutile. Folosește N/A dacă nu există PoC.", "No passwords, private keys, tokens or unnecessary personal data. Use N/A if no PoC exists.")}></textarea></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("URL securizat către dovezi", "Secure evidence URL")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.evidenceUrl} type="url" placeholder="https://…" /></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Remediere sugerată", "Suggested remediation")} *</span><textarea class="min-h-32 rounded-xl border bg-transparent px-4 py-3" bind:value={values.remediation} placeholder={tr("Descrie propunerea sau scrie N/A.", "Describe your proposal or enter N/A.")}></textarea></label>
      </div>
    {:else if step === 8}
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Preferință de disclosure", "Disclosure preference")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.disclosure}><option value="">—</option><option value="private">{tr("Privat", "Private")}</option><option value="coordinated">{tr("Disclosure coordonat", "Coordinated disclosure")}</option><option value="no-preference">{tr("Fără preferință", "No preference")}</option></select></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Dată / condiție solicitată pentru disclosure", "Requested disclosure date / condition")} *</span><input class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.requestedDisclosureDate} placeholder={tr("ex. după remediere / N/A", "e.g. after remediation / N/A")} /></label>
        <label class="grid gap-2"><span class="text-sm font-medium">{tr("Ai dezvăluit problema în altă parte?", "Have you disclosed the issue elsewhere?")} *</span><select class="rounded-xl border bg-transparent px-4 py-3" bind:value={values.disclosedElsewhere}><option value="">—</option><option value="no">{tr("Nu", "No")}</option><option value="yes">{tr("Da", "Yes")}</option></select></label>
        {#if values.disclosedElsewhere !== "no"}<label class="grid gap-2"><span class="text-sm font-medium">{tr("Alți destinatari / unde a fost dezvăluită", "Other recipients / where disclosed")} *</span><textarea class="min-h-28 rounded-xl border bg-transparent px-4 py-3" bind:value={values.otherRecipients}></textarea></label>{/if}
      </div>
    {:else}
      <div class="grid gap-6">
        <div class="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
          <div class="bg-level-0 p-4"><span class="text-muted-foreground block text-xs uppercase tracking-wide">{tr("Reporter", "Reporter")}</span><strong>{values.firstName} {values.lastName}</strong><div class="text-muted-foreground text-sm">{values.email}</div></div>
          <div class="bg-level-0 p-4"><span class="text-muted-foreground block text-xs uppercase tracking-wide">{tr("Activ", "Asset")}</span><strong>{values.affectedAsset}</strong><div class="text-muted-foreground text-sm">{values.assetType} · {values.environment}</div></div>
          <div class="bg-level-0 p-4"><span class="text-muted-foreground block text-xs uppercase tracking-wide">{tr("Clasificare", "Classification")}</span><strong>{values.category}</strong><div class="text-muted-foreground text-sm">{values.severity}</div></div>
          <div class="bg-level-0 p-4"><span class="text-muted-foreground block text-xs uppercase tracking-wide">Disclosure</span><strong>{values.disclosure}</strong><div class="text-muted-foreground text-sm">{values.disclosedElsewhere === "yes" ? tr("Dezvăluit și altor părți", "Also disclosed to other parties") : tr("Nu a fost dezvăluit altundeva", "Not disclosed elsewhere")}</div></div>
        </div>

        <div class="grid gap-4">
          <label class="flex gap-3 text-sm leading-relaxed"><input class="mt-1 size-4 shrink-0" type="checkbox" bind:checked={values.authorizationAcknowledgement} /><span>{tr("Confirm că am testat numai active pentru care am avut permisiunea necesară și că informațiile din raport descriu acel scop autorizat.", "I confirm I tested only assets for which I had the necessary permission and that this report describes that authorized scope.")} *</span></label>
          <label class="flex gap-3 text-sm leading-relaxed"><input class="mt-1 size-4 shrink-0" type="checkbox" bind:checked={values.safeTestingAcknowledgement} /><span>{tr("Confirm că nu am efectuat DoS, nu am menținut persistență și nu am șters, modificat sau exfiltrat date peste minimul necesar pentru demonstrație.", "I confirm I did not perform DoS, maintain persistence, or delete, modify or exfiltrate data beyond the minimum necessary for demonstration.")} *</span></label>
          <label class="flex gap-3 text-sm leading-relaxed"><input class="mt-1 size-4 shrink-0" type="checkbox" bind:checked={values.accuracyAcknowledgement} /><span>{tr("Confirm că informațiile furnizate sunt complete și corecte după cunoștința mea.", "I confirm the information provided is complete and accurate to the best of my knowledge.")} *</span></label>
          <label class="flex gap-3 text-sm leading-relaxed"><input class="mt-1 size-4 shrink-0" type="checkbox" bind:checked={values.privacyAcknowledgement} /><span>{tr("Sunt de acord ca ZebraByte să prelucreze datele de contact și conținutul raportului pentru triere, investigație, remediere și comunicare privind această vulnerabilitate.", "I agree that ZebraByte may process my contact data and report content for triage, investigation, remediation and communication concerning this vulnerability.")} *</span></label>
        </div>
        <div bind:this={finalTurnstile} data-sitekey={siteKey} data-size="flexible"></div>
      </div>
    {/if}

    <div class="mt-8 min-h-6" aria-live="polite">
      {#if stepError}<p class="text-sm font-medium text-destructive">{stepError}</p>{:else if statusMessage}<p class="text-sm font-medium">{statusMessage}</p>{/if}
    </div>

    <footer class="mt-5 flex items-center justify-between gap-4 border-t pt-6">
      <button type="button" class="rounded-xl border px-5 py-3 text-sm font-medium disabled:opacity-30" disabled={step === 0 || submitting} onclick={previousStep}>{tr("Înapoi", "Back")}</button>
      {#if step < steps.length - 1}
        <button type="button" class="rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background" onclick={nextStep}>{tr("Continuă", "Continue")} →</button>
      {:else}
        <button type="button" class="rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-50" disabled={submitting} onclick={submitReport}>{submitting ? tr("Se transmite în siguranță…", "Submitting securely…") : tr("Trimite raportul", "Submit report")}</button>
      {/if}
    </footer>
  </section>
{/if}
