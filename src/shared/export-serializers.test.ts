// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from 'vitest';

import type { ConversationExportPayload } from './export-model';
import {
  createExportBaseFileName,
  toJsonExportString,
  toMarkdownExportString
} from './export-serializers';

const SAMPLE_PAYLOAD: ConversationExportPayload = {
  version: '0.1',
  source: 'chatgpt_dom',
  title: 'How to parse markdown?',
  url: 'https://chatgpt.com/c/sample',
  exportedAt: '2026-02-22T12:34:56.000Z',
  partial: false,
  warnings: [],
  messages: [
    {
      order: 1,
      role: 'user',
      text: 'Show me an example.',
      markdown: 'Show me an example.'
    },
    {
      order: 2,
      role: 'assistant',
      text: 'Sure, here is one.',
      markdown: 'Sure, here is one.\n\n```ts\nconsole.log("hello");\n```'
    }
  ]
};

describe('createExportBaseFileName', () => {
  it('formats timestamp and sanitizes title', () => {
    const fileName = createExportBaseFileName('  My: invalid/ title? ', SAMPLE_PAYLOAD.exportedAt);

    expect(fileName).toBe('2026-02-22_12-34-56_My invalid title');
  });
});

describe('toJsonExportString', () => {
  it('exports schema with exported_at and message text only', () => {
    const text = toJsonExportString(SAMPLE_PAYLOAD);
    const parsed = JSON.parse(text) as {
      exported_at: string;
      messages: Array<{ markdown?: string; text: string }>;
    };

    expect(parsed.exported_at).toBe('2026-02-22T12:34:56.000Z');
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[1]?.text).toBe('Sure, here is one.');
    expect(parsed.messages[1]?.markdown).toBeUndefined();
  });
});

describe('toMarkdownExportString', () => {
  it('includes metadata and message markdown content', () => {
    const markdown = toMarkdownExportString(SAMPLE_PAYLOAD);

    expect(markdown).toContain('# How to parse markdown?');
    expect(markdown).toContain('- Source: https://chatgpt.com/c/sample');
    expect(markdown).toContain('## 1. User');
    expect(markdown).toContain('## 2. Assistant');
    expect(markdown).toContain('```ts');
  });
});
