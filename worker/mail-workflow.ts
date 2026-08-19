import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import {
  activateScheduledCampaign,
  type MailPlatformEnv,
} from "./mail-platform";

export type MailCampaignWorkflowParams = {
  campaignId: string;
  scheduledAt: string;
};

export class MailCampaignWorkflow extends WorkflowEntrypoint<
  MailPlatformEnv,
  MailCampaignWorkflowParams
> {
  async run(
    event: WorkflowEvent<MailCampaignWorkflowParams>,
    step: WorkflowStep,
  ): Promise<void> {
    const { campaignId, scheduledAt } = event.payload;
    const timestamp = Date.parse(scheduledAt);
    if (!campaignId || !Number.isFinite(timestamp)) return;

    if (timestamp > Date.now()) {
      await step.sleepUntil("wait for campaign schedule", timestamp);
    }

    await step.do(
      "release scheduled campaign",
      {
        retries: { limit: 5, delay: "30 seconds", backoff: "exponential" },
        timeout: "5 minutes",
      },
      async () => {
        await activateScheduledCampaign(campaignId, this.env);
      },
    );
  }
}
