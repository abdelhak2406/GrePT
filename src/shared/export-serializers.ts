// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ConversationExportPayload } from './export-model';
import { sanitizeFileName } from './sanitize-file-name';

interface JsonExportMessage {
  order: number;
  role: string;
  text: string;
}

interface JsonExportDocument {
  version: string;
  source: string;
  title: string;
  url: string;
  exported_at: string;
  partial?: true;
  warnings?: string[];
  messages: JsonExportMessage[];
}

export function createExportBaseFileName(title: string, exportedAt: string): string {
  const datePrefix = formatTimestampForFileName(exportedAt);
  const safeTitle = sanitizeFileName(title, 'conversation');
  return `${datePrefix}_${safeTitle}`;
}

export function toJsonExportString(payload: ConversationExportPayload): string {
  const document = toJsonExport(payload);
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function toMarkdownExportString(payload: ConversationExportPayload): string {
  const lines: string[] = [];

  lines.push(`# ${payload.title}`);
  lines.push('');
  lines.push(`- Source: ${payload.url}`);
  lines.push(`- Exported at: ${payload.exportedAt}`);

  if (payload.partial) {
    lines.push('- Partial export: yes');
  }

  if (payload.warnings.length > 0) {
    lines.push('- Warnings:');
    for (const warning of payload.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  lines.push('');
  lines.push('---');

  for (const message of payload.messages) {
    const roleTitle = message.role.charAt(0).toUpperCase() + message.role.slice(1);
    lines.push('');
    lines.push(`## ${message.order}. ${roleTitle}`);
    lines.push('');
    lines.push(message.markdown || message.text);
  }

  lines.push('');
  return `${lines.join('\n').trimEnd()}\n`;
}

function toJsonExport(payload: ConversationExportPayload): JsonExportDocument {
  return {
    version: payload.version,
    source: payload.source,
    title: payload.title,
    url: payload.url,
    exported_at: payload.exportedAt,
    ...(payload.partial ? { partial: true as const } : {}),
    ...(payload.warnings.length > 0 ? { warnings: payload.warnings } : {}),
    messages: payload.messages.map((message) => ({
      order: message.order,
      role: message.role,
      text: message.text
    }))
  };
}

function formatTimestampForFileName(isoTimestamp: string): string {
  const parsedDate = new Date(isoTimestamp);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'unknown-date';
  }

  const year = parsedDate.getUTCFullYear();
  const month = padNumber(parsedDate.getUTCMonth() + 1);
  const day = padNumber(parsedDate.getUTCDate());
  const hour = padNumber(parsedDate.getUTCHours());
  const minute = padNumber(parsedDate.getUTCMinutes());
  const second = padNumber(parsedDate.getUTCSeconds());
  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}
