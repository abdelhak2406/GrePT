import { strToU8, zipSync } from 'fflate';

import type { ConversationExportPayload } from './export-model';
import {
  createExportBaseFileName,
  toJsonExportString,
  toMarkdownExportString
} from './export-serializers';

export interface ConversationArchive {
  fileName: string;
  bytes: Uint8Array;
}

export function createConversationArchive(payload: ConversationExportPayload): ConversationArchive {
  const baseName = createExportBaseFileName(payload.title, payload.exportedAt);
  const markdownText = toMarkdownExportString(payload);
  const jsonText = toJsonExportString(payload);

  const archiveContents = {
    [`${baseName}.md`]: strToU8(markdownText),
    [`${baseName}.json`]: strToU8(jsonText)
  };

  const archiveBytes = zipSync(archiveContents, { level: 6 });
  const bytes = Uint8Array.from(archiveBytes);

  return {
    fileName: `${baseName}.zip`,
    bytes
  };
}

export function createArchiveDataUrl(archive: ConversationArchive): string {
  return `data:application/zip;base64,${toBase64(archive.bytes)}`;
}

function toBase64(bytes: Uint8Array): string {
  const chunkSize = 8192;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    let chunkText = '';

    for (const byte of chunk) {
      chunkText += String.fromCharCode(byte);
    }

    binary += chunkText;
  }

  return btoa(binary);
}
