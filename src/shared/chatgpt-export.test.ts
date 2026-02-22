import { describe, expect, it } from 'vitest';

import type { ConversationExportPayload } from './export-model';
import { toChatGptConversationsJson } from './chatgpt-export';

const SAMPLE_PAYLOAD: ConversationExportPayload = {
  version: '0.1',
  source: 'chatgpt_dom',
  title: 'LibreChat Import Sample',
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

describe('toChatGptConversationsJson', () => {
  it('serializes a ChatGPT-compatible conversations.json payload', () => {
    const json = toChatGptConversationsJson(SAMPLE_PAYLOAD);
    const parsed = JSON.parse(json) as Array<{
      title: string;
      mapping: Record<
        string,
        {
          parent: string | null;
          message: null | {
            author: { role: string };
            metadata: { model_slug: string };
            content: { content_type: string; parts: string[] };
          };
        }
      >;
    }>;

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);

    const conversation = parsed[0];
    expect(conversation?.title).toBe('LibreChat Import Sample');

    const mappingEntries = Object.values(conversation?.mapping ?? {});
    const messageEntries = mappingEntries.filter((entry) => entry.message !== null);

    expect(messageEntries).toHaveLength(2);
    expect(messageEntries[0]?.message?.author.role).toBe('user');
    expect(messageEntries[1]?.message?.author.role).toBe('assistant');
    expect(messageEntries[1]?.message?.content.content_type).toBe('text');
    expect(messageEntries[1]?.message?.metadata.model_slug).toBe('gpt-4o-mini');
  });

  it('maps non-user roles to assistant for importer compatibility', () => {
    const json = toChatGptConversationsJson({
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
      mapping: Record<string, { message: null | { author: { role: string } } }>;
    }>;

    const conversation = parsed[0];
    const entry = Object.values(conversation?.mapping ?? {}).find((item) => item.message !== null);
    expect(entry?.message?.author.role).toBe('assistant');
  });
});
