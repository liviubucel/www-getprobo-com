import app from "./index";
import {
  isEnglishPath,
  stripEnglishPrefix,
  translateEnglishHtml,
} from "./i18n";

type WorkerEnv = Parameters<typeof app.fetch>[1];

function isHtmlResponse(response: Response): boolean {
  return response.headers.get("content-type")?.toLowerCase().includes("text/html") ?? false;
}

function withContentLanguage(response: Response, locale: "ro" | "en"): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Language", locale);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const english = isEnglishPath(url.pathname);

    if (!english) {
      const response = await app.fetch(request, env);
      return isHtmlResponse(response) ? withContentLanguage(response, "ro") : response;
    }

    const upstreamUrl = new URL(request.url);
    upstreamUrl.pathname = stripEnglishPrefix(url.pathname);
    const upstreamRequest = new Request(upstreamUrl, request);
    const response = await app.fetch(upstreamRequest, env);

    if (!isHtmlResponse(response)) {
      return response;
    }

    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "text/html; charset=UTF-8");
    headers.set("Content-Language", "en");
    headers.delete("Content-Length");
    headers.delete("Content-Encoding");
    headers.delete("ETag");

    return new Response(translateEnglishHtml(html), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
