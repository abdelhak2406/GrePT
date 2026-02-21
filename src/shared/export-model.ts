export type ConversationRole = 'assistant' | 'system' | 'tool' | 'unknown' | 'user';

export interface ConversationMessage {
  order: number;
  role: ConversationRole;
  text: string;
  markdown: string;
}

export interface ConversationExportPayload {
  version: '0.1';
  source: 'chatgpt_dom';
  title: string;
  url: string;
  exportedAt: string;
  partial: boolean;
  warnings: string[];
  messages: ConversationMessage[];
}
