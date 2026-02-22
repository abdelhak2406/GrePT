import { describe, expect, it } from 'vitest';

import type { ConversationExportPayload } from './export-model';
import { toOpenWebUiChatsJson } from './openwebui-export';

const SAMPLE_PAYLOAD: ConversationExportPayload = {
  version: '0.1',
  source: 'chatgpt_dom',
  title: 'Open WebUI Import Sample',
  url: 'https://chatgpt.com/c/sample',
  exportedAt: '2026-02-22T12:34:56.000Z',
  partial: false,
  warnings: [],
  messages: [
    {
      order: 1,
      role: 'user',
      text: 'Hello',
      markdown: 'Hello'
    },
    {
      order: 2,
      role: 'assistant',
      text: 'Hi there',
      markdown: 'Hi there'
    }
  ]
};

describe('toOpenWebUiChatsJson', () => {
  it('serializes an Open WebUI-native import array', () => {
    const json = toOpenWebUiChatsJson(SAMPLE_PAYLOAD);
    const parsed = JSON.parse(json) as Array<{
      chat: {
        title: string;
        timestamp: number;
        models: string[];
        history: {
          currentId: string;
          messages: Record<
            string,
            {
              id: string;
              parentId: string | null;
              childrenIds: string[];
              role: string;
            }
          >;
        };
        messages: Array<{ id: string; role: string }>;
      };
      created_at: number;
      updated_at: number;
      folder_id: null;
    }>;

    expect(parsed).toHaveLength(1);

    const imported = parsed[0];
    expect(imported?.chat.title).toBe('Open WebUI Import Sample');
    expect(imported?.chat.models).toEqual(['gpt-4o-mini']);
    expect(imported?.created_at).toBe(1771763696);
    expect(imported?.updated_at).toBe(1771763696);
    expect(imported?.folder_id).toBeNull();

    const firstMessage = imported?.chat.messages[0];
    const secondMessage = imported?.chat.messages[1];

    expect(firstMessage?.role).toBe('user');
    expect(secondMessage?.role).toBe('assistant');
    expect(imported?.chat.history.currentId).toBe(secondMessage?.id);

    const firstHistory = firstMessage ? imported?.chat.history.messages[firstMessage.id] : undefined;
    const secondHistory = secondMessage
      ? imported?.chat.history.messages[secondMessage.id]
      : undefined;

    expect(firstHistory?.parentId).toBeNull();
    expect(firstHistory?.childrenIds).toEqual([secondMessage?.id]);
    expect(secondHistory?.parentId).toBe(firstMessage?.id);
    expect(secondHistory?.childrenIds).toEqual([]);
  });

  it('maps non-user roles to assistant for Open WebUI compatibility', () => {
    const json = toOpenWebUiChatsJson({
      ...SAMPLE_PAYLOAD,
      messages: [
        {
          order: 1,
          role: 'tool',
          text: 'Tool output',
          markdown: 'Tool output'
        }
      ]
    });

    const parsed = JSON.parse(json) as Array<{
      chat: {
        messages: Array<{ role: string }>;
      };
    }>;

    expect(parsed[0]?.chat.messages[0]?.role).toBe('assistant');
  });
});
