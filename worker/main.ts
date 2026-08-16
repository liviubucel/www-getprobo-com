import router from "./router";
import {
  handleZebraByteFormsApi,
  type FormsEnv,
} from "./forms";
import {
  handleNewsletterDispatchApi,
  type NewsletterDispatchEnv,
} from "./newsletter-dispatch";
import { handlePublicStatusApi } from "./public-status";
import {
  captureSentryException,
  captureSentryMessage,
  handleSentryClientApi,
  type SentryEnv,
} from "./sentry";

type WorkerEnv = Parameters<typeof router.fetch>[1] &
  FormsEnv &
  NewsletterDispatchEnv &
  SentryEnv;

type ExecutionContextLike = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

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
      const clientErrorResponse = await handleSentryClientApi(request, env);
      if (clientErrorResponse) return clientErrorResponse;

      const publicStatusResponse = await handlePublicStatusApi(request);
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
        return publicStatusResponse;
      }

      const dispatchResponse = await handleNewsletterDispatchApi(request, env);
      if (dispatchResponse) return dispatchResponse;

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
        return formsResponse;
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
      return response;
    } catch (error) {
      await captureSentryException(env, error, {
        request,
        component: "worker.unhandled",
      });
      throw error;
    }
  },
};
