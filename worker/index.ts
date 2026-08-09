const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ycVerifyRegex = /^https:\/\/www\.ycombinator\.com\/verify\/.+$/;

interface Env {
  ASSETS: {
    fetch: (request: Request | URL | string) => Promise<Response>;
  };
  N8N_YC_DEAL_WEBHOOK_URL: string;
  WEBHOOK_AUTH_USERNAME: string;
  WEBHOOK_AUTH_PASSWORD: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/yc-deal" && request.method === "POST") {
      return handleYcDeal(request, env);
    }

    const isMarkdownAlternate =
      url.pathname.endsWith(".md") && !url.pathname.startsWith("/md/");

    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/_astro/") ||
      url.pathname.startsWith("/static/") ||
      (url.pathname.match(/\.\w+$/) && !isMarkdownAlternate)
    ) {
      return env.ASSETS.fetch(request);
    }

    const accept = request.headers.get("Accept")?.toLowerCase() || "";
    if (isMarkdownAlternate || accept.includes("text/markdown")) {
      const requestPath = isMarkdownAlternate
        ? url.pathname.slice(0, -3)
        : url.pathname;
      const path = requestPath === "/" ? "" : requestPath.replace(/\/+$/, "");
      const candidates = path
        ? [`/md${path}.md`, `/md${path}/index.md`]
        : ["/md/index.md"];

      for (const candidate of candidates) {
        const response = await env.ASSETS.fetch(new URL(candidate, url.origin));

        if (response.ok) {
          const headers = new Headers(response.headers);
          headers.set("Content-Type", "text/markdown; charset=utf-8");
          addVaryAccept(headers);

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      }
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    addVaryAccept(headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

async function handleYcDeal(request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.formData();
    const email = data.get("email")?.toString();
    const link = data.get("link")?.toString();

    if (!email || !link) {
      return jsonResponse(
        { error: "email and verification link are required" },
        400,
      );
    }

    if (!emailRegex.test(email)) {
      return jsonResponse({ error: "invalid email format" }, 400);
    }

    if (!ycVerifyRegex.test(link)) {
      return jsonResponse({ error: "invalid verification link" }, 400);
    }

    const auth = btoa(`${env.WEBHOOK_AUTH_USERNAME}:${env.WEBHOOK_AUTH_PASSWORD}`);

    const webhookResponse = await fetch(env.N8N_YC_DEAL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ email, link }),
    });

    if (!webhookResponse.ok) {
      console.error(
        "cannot process yc deal submission:",
        await webhookResponse.text(),
      );
      return jsonResponse({ error: "internal server error" }, 500);
    }

    return jsonResponse({}, 200);
  } catch (error) {
    console.error("cannot process yc deal submission:", error);
    return jsonResponse({ error: "internal server error" }, 500);
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function addVaryAccept(headers: Headers): void {
  const vary = headers.get("Vary");
  const values = vary
    ? vary
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  if (!values.some((value) => value.toLowerCase() === "accept")) {
    headers.set("Vary", [...values, "Accept"].join(", "));
  }
}
