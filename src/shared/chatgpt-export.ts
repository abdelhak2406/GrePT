import type { ConversationExportPayload, ConversationMessage } from './export-model';

type ChatGptRole = 'assistant' | 'user';

interface ChatGptMessage {
  id: string;
  author: {
    role: ChatGptRole;
  };
  create_time: number;
  update_time: number;
  content: {
    content_type: 'text';
    parts: string[];
  };
  status: 'finished_successfully';
  end_turn: true;
  weight: 1;
  metadata: {
    model_slug: string;
  };
}

interface ChatGptMappingNode {
  id: string;
  message: ChatGptMessage | null;
  parent: string | null;
  children: string[];
}

interface ChatGptConversation {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, ChatGptMappingNode>;
  current_node: string;
  conversation_template_id: null;
  plugin_ids: null;
  is_archived: false;
}

const DEFAULT_MODEL_SLUG = 'gpt-4o-mini';

export function toChatGptConversationsJson(payload: ConversationExportPayload): string {
  const conversation = toChatGptConversation(payload);
  return `${JSON.stringify([conversation], null, 2)}\n`;
}

function toChatGptConversation(payload: ConversationExportPayload): ChatGptConversation {
  const messages = payload.messages
    .map((message) => normalizeMessage(message))
    .filter((message): message is ConversationMessage => message !== null);

  if (messages.length === 0) {
    throw new Error('Cannot export an empty conversation.');
  }

  const rootId = crypto.randomUUID();
  const conversationId = crypto.randomUUID();
  const baseTimestamp = Math.max(1, toUnixTimestamp(payload.exportedAt) - messages.length);
  const mapping: Record<string, ChatGptMappingNode> = {
    [rootId]: {
      id: rootId,
      message: null,
      parent: null,
      children: []
    }
  };

  let previousNodeId = rootId;
  let currentNodeId = rootId;

  for (const [index, message] of messages.entries()) {
    const nodeId = crypto.randomUUID();
    const createTime = baseTimestamp + index;

    mapping[nodeId] = {
      id: nodeId,
      parent: previousNodeId,
      children: [],
      message: {
        id: nodeId,
        author: {
          role: toChatGptRole(message)
        },
        create_time: createTime,
        update_time: createTime,
        content: {
          content_type: 'text',
          parts: [message.markdown || message.text]
        },
        status: 'finished_successfully',
        end_turn: true,
        weight: 1,
        metadata: {
          model_slug: DEFAULT_MODEL_SLUG
        }
      }
    };

    mapping[previousNodeId]?.children.push(nodeId);
    previousNodeId = nodeId;
    currentNodeId = nodeId;
  }

  return {
    id: conversationId,
    title: payload.title,
    create_time: baseTimestamp,
    update_time: baseTimestamp + messages.length,
    mapping,
    current_node: currentNodeId,
    conversation_template_id: null,
    plugin_ids: null,
    is_archived: false
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

function toChatGptRole(message: ConversationMessage): ChatGptRole {
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
