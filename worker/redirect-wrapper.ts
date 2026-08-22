export { MailCampaignWorkflow } from "./main";

import worker from "./main";
import { resolveRedirect } from "../src/lib/redirects.mjs";
import { isEnglishPath, stripEnglishPrefix, toEnglishPath } from "./i18n";

type WorkerEnv = Parameters<typeof worker.fetch>[1];
type ExecutionContextLike = Parameters<typeof worker.fetch>[2];
type QueueBatch = Parameters<NonNullable<typeof worker.queue>>[0];

function configuredRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const url = new URL(request.url);
  const english = isEnglishPath(url.pathname);
  const lookupPath = english ? stripEnglishPrefix(url.pathname) : url.pathname;
  const rule = resolveRedirect(lookupPath);
  if (!rule) return null;

  const target = new URL(rule.destination, url.origin);
  if (english && target.origin === url.origin) {
    target.pathname = toEnglishPath(target.pathname);
  }
  if (!target.search && url.search) target.search = url.search;

  return new Response(null, {
    status: rule.status,
    headers: {
      Location: target.toString(),
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    context?: ExecutionContextLike,
  ): Promise<Response> {
    const redirect = configuredRedirect(request);
    if (redirect) return redirect;
    return worker.fetch(request, env, context);
  },

  async queue(batch: QueueBatch, env: WorkerEnv): Promise<void> {
    return worker.queue(batch, env);
  },
};
