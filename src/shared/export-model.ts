// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
