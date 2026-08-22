export { MailCampaignWorkflow } from "./mail-workflow";

import router from "./router";
import { configuredRedirect } from "./redirects-runtime";
import {
  handleZebraByteFormsApi,
  type FormsEnv,
} from "./forms";
import { handleMailDashboardApi } from "./mail-dashboard";
import {
  handleMailPlatformApi,
  processCampaignDeliveryMessage,
  type MailPlatformEnv,
} from "./mail-platform";
import type { MailQueueBatch } from "./mail-queue-types";
import {
  handleNewsletterDispatchApi,
  type NewsletterDispatchEnv,
} from "./newsletter-dispatch";
import {
  handleNewsletterQueueCompatApi,
  type NewsletterQueueCompatEnv,
} from "./newsletter-queue-compat";
import {
  handlePublicStatusApi,
  type PublicStatusEnv,
} from "./public-status";
import {
  handleSecurityReportApi,
  type SecurityReportEnv,
} from "./security-report";
import { withWorkerSecurityHeaders } from "./security-headers";
import {
  captureSentryException,
  captureSentryMessage,
  handleSentryClientApi,
  type SentryEnv,
} from "./sentry";
import {
  handleUpmindMailSyncApi,
  processUpmindClientSyncMessage,
  type UpmindMailSyncEnv,
} from "./upmind-mail-sync";
import {
  guardUpmindWebhookSource,
  type UpmindWebhookGuardEnv,
} from "./upmind-webhook-guard";
import {
  handleYcDealApi,
  type YcDealEnv,
} from "./yc-deal";

type WorkerEnv = Parameters<typeof router.fetch>[1] &
  FormsEnv &
  MailPlatformEnv &
  NewsletterDispatchEnv &
  NewsletterQueueCompatEnv &
  PublicStatusEnv &
  SecurityReportEnv &
  SentryEnv &
  UpmindMailSyncEnv &
  UpmindWebhookGuardEnv &
  YcDealEnv;

type ExecutionContextLike = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

function finalizeHttpResponse(request: Request, response: Response): Response {
  const securedResponse = withWorkerSecurityHeaders(response);
  const hostname = new URL(request.url).hostname.toLowerCase();
  if (hostname !== "stag.zebrabyte.ro") return securedResponse;

  const headers = new Headers(securedResponse.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(securedResponse.body, {
    status: securedResponse.status,
    statusText: securedResponse.statusText,
    headers,
  });
}

function reportInBackground(
  context: ExecutionContextLike | undefined,
  promise: Promise<unknown>,
): void {
  if (context?.waitUntil) {
    context.waitUntil(promise);
    return;
  }

  void promise;
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    context?: ExecutionContextLike,
  ): Promise<Response> {
    try {
      const publicRedirect = configuredRedirect(request);
      if (publicRedirect) {
        return finalizeHttpResponse(request, publicRedirect);
      }

      const clientErrorResponse = await handleSentryClientApi(request, env);
      if (clientErrorResponse) return finalizeHttpResponse(request, clientErrorResponse);

      const publicStatusResponse = await handlePublicStatusApi(request, env);
      if (publicStatusResponse) {
        if (publicStatusResponse.status >= 500) {
          reportInBackground(
            context,
            captureSentryMessage(env, "ZebraByte public status proxy is unavailable", {
              request,
              component: "public-status",
              status: publicStatusResponse.status,
            }),
          );
        }
        return finalizeHttpResponse(request, publicStatusResponse);
      }

      const queuedNewsletterResponse = await handleNewsletterQueueCompatApi(request, env);
      if (queuedNewsletterResponse) {
        if (queuedNewsletterResponse.status >= 500) {
          reportInBackground(
            context,
            captureSentryMessage(env, "ZebraByte queued newsletter compatibility API returned a server error", {
              request,
              component: "mail.newsletter-compat",
              status: queuedNewsletterResponse.status,
            }),
          );
        }
        return finalizeHttpResponse(request, queuedNewsletterResponse);
      }

      const dispatchResponse = await handleNewsletterDispatchApi(request, env);
      if (dispatchResponse) return finalizeHttpResponse(request, dispatchResponse);

      const upmindSourceResponse = guardUpmindWebhookSource(request, env);
      if (upmindSourceResponse) return finalizeHttpResponse(request, upmindSourceResponse);

      const upmindMailResponse = await handleUpmindMailSyncApi(request, env);
      if (upmindMailResponse) {
        if (upmindMailResponse.status >= 500) {
          reportInBackground(
            context,
            captureSentryMessage(env, "ZebraByte Upmind mail sync returned a server error", {
              request,
              component: "mail.upmind",
              status: upmindMailResponse.status,
            }),
          );
        }
        return finalizeHttpResponse(request, upmindMailResponse);
      }

      const mailDashboardResponse = await handleMailDashboardApi(request, env);
      if (mailDashboardResponse) return finalizeHttpResponse(request, mailDashboardResponse);

      const mailPlatformResponse = await handleMailPlatformApi(request, env);
      if (mailPlatformResponse) {
        if (mailPlatformResponse.status >= 500) {
          reportInBackground(
            context,
            captureSentryMessage(env, "ZebraByte mail platform returned a server error", {
              request,
              component: "mail.platform",
              status: mailPlatformResponse.status,
            }),
          );
        }
        return finalizeHttpResponse(request, mailPlatformResponse);
      }

      const securityReportResponse = await handleSecurityReportApi(request, env);
      if (securityReportResponse) {
        if (securityReportResponse.status >= 500) {
          reportInBackground(
            context,
            captureSentryMessage(env, "ZebraByte security report API returned a server error", {
              request,
              component: "security-report",
              status: securityReportResponse.status,
            }),
          );
        }
        return finalizeHttpResponse(request, securityReportResponse);
      }

      const ycDealResponse = await handleYcDealApi(request, env);
      if (ycDealResponse) {
        if (ycDealResponse.status >= 500) {
          reportInBackground(
            context,
            captureSentryMessage(env, "ZebraByte YC deal API returned a server error", {
              request,
              component: "yc-deal",
              status: ycDealResponse.status,
            }),
          );
        }
        return finalizeHttpResponse(request, ycDealResponse);
      }

      const formsResponse = await handleZebraByteFormsApi(request, env);
      if (formsResponse) {
        if (formsResponse.status >= 500) {
          reportInBackground(
            context,
            captureSentryMessage(env, "ZebraByte forms API returned a server error", {
              request,
              component: "forms",
              status: formsResponse.status,
            }),
          );
        }
        return finalizeHttpResponse(request, formsResponse);
      }

      const response = await router.fetch(request, env);
      if (response.status >= 500) {
        reportInBackground(
          context,
          captureSentryMessage(env, "ZebraByte Worker returned a server error", {
            request,
            component: "router",
            status: response.status,
          }),
        );
      }
      return finalizeHttpResponse(request, response);
    } catch (error) {
      await captureSentryException(env, error, {
        request,
        component: "worker.unhandled",
      });
      throw error;
    }
  },

  async queue(batch: MailQueueBatch, env: WorkerEnv): Promise<void> {
    for (const message of batch.messages) {
      if (message.body?.kind === "campaign-delivery") {
        await processCampaignDeliveryMessage(message, env);
        continue;
      }

      if (message.body?.kind === "upmind-client-sync") {
        await processUpmindClientSyncMessage(message, env);
        continue;
      }

      message.ack();
      await captureSentryMessage(env, "Unknown ZebraByte mail queue message was discarded", {
        component: "mail.queue",
        level: "warning",
      });
    }
  },
};
