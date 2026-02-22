import type { ConversationExportPayload, ConversationMessage } from './export-model';

type OpenWebUiRole = 'assistant' | 'user';

interface OpenWebUiMessage {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  role: OpenWebUiRole;
  content: string;
  model: string;
  done: true;
  context: null;
}

interface OpenWebUiChat {
  id: string;
  title: string;
  models: string[];
  messages: OpenWebUiMessage[];
  history: {
    currentId: string;
    messages: Record<string, OpenWebUiMessage>;
  };
  options: Record<string, never>;
  timestamp: number;
}

interface OpenWebUiImportItem {
  chat: OpenWebUiChat;
  created_at: number;
  updated_at: number;
  folder_id: null;
  meta: Record<string, never>;
}

const DEFAULT_MODEL = 'gpt-4o-mini';

export function toOpenWebUiChatsJson(payload: ConversationExportPayload): string {
  const document = [toOpenWebUiImportItem(payload)];
  return `${JSON.stringify(document, null, 2)}\n`;
}

function toOpenWebUiImportItem(payload: ConversationExportPayload): OpenWebUiImportItem {
  const normalizedMessages = payload.messages
    .map((message) => normalizeMessage(message))
    .filter((message): message is ConversationMessage => message !== null);

  if (normalizedMessages.length === 0) {
    throw new Error('Cannot export an empty conversation.');
  }

  const timestamp = toUnixTimestamp(payload.exportedAt);
  const chatId = crypto.randomUUID();
  const messages: OpenWebUiMessage[] = [];
  const historyMessages: Record<string, OpenWebUiMessage> = {};

  let parentId: string | null = null;

  for (const sourceMessage of normalizedMessages) {
    const messageId = crypto.randomUUID();
    const message: OpenWebUiMessage = {
      id: messageId,
      parentId,
      childrenIds: [],
      role: toOpenWebUiRole(sourceMessage),
      content: sourceMessage.markdown || sourceMessage.text,
      model: DEFAULT_MODEL,
      done: true,
      context: null
    };

    if (parentId) {
      historyMessages[parentId]?.childrenIds.push(messageId);
    }

    messages.push(message);
    historyMessages[messageId] = message;
    parentId = messageId;
  }

  const currentId = parentId;

  if (!currentId) {
    throw new Error('Unable to determine current message id for export.');
  }

  const chat: OpenWebUiChat = {
    id: chatId,
    title: payload.title,
    models: [DEFAULT_MODEL],
    messages,
    history: {
      currentId,
      messages: historyMessages
    },
    options: {},
    timestamp
  };

  return {
    chat,
    created_at: timestamp,
    updated_at: timestamp,
    folder_id: null,
    meta: {}
  };
}

function normalizeMessage(message: ConversationMessage): ConversationMessage | null {
  const content = (message.markdown || message.text).trim();
  if (content.length === 0) {
    return null;
  }

  return {
    ...message,
    markdown: content
  };
}

function toOpenWebUiRole(message: ConversationMessage): OpenWebUiRole {
  if (message.role === 'user') {
    return 'user';
  }

  return 'assistant';
}

function toUnixTimestamp(isoTimestamp: string): number {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return Math.floor(Date.now() / 1000);
  }

  return Math.floor(parsed.getTime() / 1000);
}
