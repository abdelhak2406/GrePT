import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import type { ConversationExportPayload } from './export-model';
import { createArchiveDataUrl, createConversationArchive } from './export-archive';

const SAMPLE_PAYLOAD: ConversationExportPayload = {
  version: '0.1',
  source: 'chatgpt_dom',
  title: 'Archive this chat',
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
      text: 'World',
      markdown: 'World'
    }
  ]
};

describe('createConversationArchive', () => {
  it('creates a zip with markdown and json files', () => {
    const archive = createConversationArchive(SAMPLE_PAYLOAD);

    expect(archive.fileName).toBe('2026-02-22_12-34-56_Archive this chat.zip');

    const extractedFiles = unzipSync(archive.bytes);
    const markdownFile = extractedFiles['2026-02-22_12-34-56_Archive this chat.md'];
    const jsonFile = extractedFiles['2026-02-22_12-34-56_Archive this chat.json'];

    expect(markdownFile).toBeDefined();
    expect(jsonFile).toBeDefined();
    expect(strFromU8(markdownFile!)).toContain('# Archive this chat');
    expect(strFromU8(jsonFile!)).toContain('"messages"');
  });

  it('creates a zip data URL for downloads API', () => {
    const archive = createConversationArchive(SAMPLE_PAYLOAD);
    const dataUrl = createArchiveDataUrl(archive);

    expect(dataUrl.startsWith('data:application/zip;base64,')).toBe(true);
  });
});
