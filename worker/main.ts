import router from "./router";
import {
  handleZebraByteFormsApi,
  type FormsEnv,
} from "./forms";

type WorkerEnv = Parameters<typeof router.fetch>[1] & FormsEnv;

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const formsResponse = await handleZebraByteFormsApi(request, env);
    if (formsResponse) return formsResponse;
    return router.fetch(request, env);
  },
};
