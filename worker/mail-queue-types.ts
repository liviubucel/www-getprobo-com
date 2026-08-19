export type CampaignDeliveryQueueMessage = {
  kind: "campaign-delivery";
  campaignId: string;
  deliveryId: string;
};

export type UpmindClientSyncQueueMessage = {
  kind: "upmind-client-sync";
  eventId: string;
};

export type MailQueueMessage =
  | CampaignDeliveryQueueMessage
  | UpmindClientSyncQueueMessage;

export interface MailQueueBinding {
  send: (message: MailQueueMessage, options?: { delaySeconds?: number }) => Promise<unknown>;
  sendBatch: (
    messages: Array<{
      body: MailQueueMessage;
      contentType?: "json";
      delaySeconds?: number;
    }>,
    options?: { delaySeconds?: number },
  ) => Promise<unknown>;
}

export interface MailQueueMessageEnvelope {
  readonly id: string;
  readonly attempts: number;
  readonly body: MailQueueMessage;
  ack: () => void;
  retry: (options?: { delaySeconds?: number }) => void;
}

export interface MailQueueBatch {
  readonly queue: string;
  readonly messages: readonly MailQueueMessageEnvelope[];
}
