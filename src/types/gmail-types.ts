export interface EmailMetadata {
  id: string;
  threadId: string;
  snippet: string;
  from: {
    name?: string;
    email: string;
  };
  to: {
    name?: string;
    email: string;
  }[];
  subject: string;
  date: Date;
  labels: {
    id: string;
    name: string;
  }[];
  hasAttachments: boolean;
  isUnread: boolean;
  isImportant: boolean;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  isHtml?: boolean;
}

export interface DraftEmailOptions extends SendEmailOptions {
  id?: string; // For updating existing drafts
}
