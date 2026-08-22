const WORKER_SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://app.cal.com https://cal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google.com https://app.cal.com https://cal.com https://accesibilitate.zebrabyte.ro https://www.zebrabyte.ro; connect-src 'self' https://challenges.cloudflare.com https://api.github.com https://app.cal.com https://cal.com https://*.cal.com; frame-src https://challenges.cloudflare.com https://www.youtube.com https://app.cal.com https://cal.com https://*.cal.com; form-action 'self' https://app.cal.com https://cal.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
} as const;

/**
 * `assets.run_worker_first` means `_headers` cannot be the only security-header
 * layer: responses created or rewritten by the Worker need the same browser
 * protections attached in code. Keep this policy aligned with public/_headers.
 */
export function withWorkerSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(WORKER_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
