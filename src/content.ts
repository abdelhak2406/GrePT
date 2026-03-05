// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type {
  ConversationExportPayload,
  ConversationMessage,
  ConversationRole
} from './shared/export-model';

const GREPT_ACTION_CLICKED = 'GREPT_ACTION_CLICKED';
const GREPT_EXPORT_READY = 'GREPT_EXPORT_READY';
const GREPT_EXPORT_FAILED = 'GREPT_EXPORT_FAILED';

const INIT_MARKER_ID = 'grept-init-marker';
const CONTENT_CONTAINER_SELECTORS = ['main', '[role="main"]'] as const;

if (!document.getElementById(INIT_MARKER_ID)) {
  const marker = document.createElement('meta');
  marker.id = INIT_MARKER_ID;
  marker.setAttribute('data-extension', 'grept');
  document.head.append(marker);
}

chrome.runtime.onMessage.addListener((message) => {
  if (!isActionClickedMessage(message)) {
    return;
  }

  void handleExportRequest();
});

async function handleExportRequest(): Promise<void> {
  try {
    await settlePage();
    const payload = extractConversationFromDom();
    await chrome.runtime.sendMessage({
      type: GREPT_EXPORT_READY,
      payload
    });
  } catch (error) {
    const message = toErrorMessage(error);
    await chrome.runtime.sendMessage({
      type: GREPT_EXPORT_FAILED,
      error: message
    });
  }
}

async function settlePage(): Promise<void> {
  window.scrollTo(0, document.body.scrollHeight);
  await delay(250);
}

function extractConversationFromDom(): ConversationExportPayload {
  const messageNodes = getMessageNodes();
  const messages = messageNodes
    .map((node, index) => extractMessage(node, index + 1))
    .filter((message): message is ConversationMessage => message !== null);

  if (messages.length === 0) {
    throw new Error('No chat messages found on this page.');
  }

  const warnings = detectWarnings();

  return {
    version: '0.1',
    source: 'chatgpt_dom',
    title: extractTitle(),
    url: window.location.href,
    exportedAt: new Date().toISOString(),
    partial: warnings.length > 0,
    warnings,
    messages
  };
}

function getMessageNodes(): HTMLElement[] {
  const roleNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-message-author-role]')
  );

  if (roleNodes.length > 0) {
    return roleNodes;
  }

  const container = getPrimaryContainer();
  const fallbackNodes = Array.from(container.querySelectorAll<HTMLElement>('article'));

  return fallbackNodes.filter((node) => getVisibleText(node).length > 0);
}

function getPrimaryContainer(): HTMLElement {
  for (const selector of CONTENT_CONTAINER_SELECTORS) {
    const found = document.querySelector<HTMLElement>(selector);
    if (found) {
      return found;
    }
  }

  return document.body;
}

function extractMessage(node: HTMLElement, order: number): ConversationMessage | null {
  const text = getVisibleText(node);
  if (text.length === 0) {
    return null;
  }

  const markdown = toMarkdown(node);
  return {
    order,
    role: extractRole(node),
    text,
    markdown: markdown.length > 0 ? markdown : text
  };
}

function extractRole(node: HTMLElement): ConversationRole {
  const rawRole = node.getAttribute('data-message-author-role');

  if (rawRole === 'assistant' || rawRole === 'system' || rawRole === 'tool' || rawRole === 'user') {
    return rawRole;
  }

  if (rawRole && rawRole.length > 0) {
    return 'unknown';
  }

  const userIndicator = node.querySelector('[data-testid*="user"]');
  if (userIndicator) {
    return 'user';
  }

  const assistantIndicator = node.querySelector('[data-testid*="assistant"]');
  if (assistantIndicator) {
    return 'assistant';
  }

  return 'unknown';
}

function extractTitle(): string {
  const heading = document.querySelector<HTMLElement>('main h1');
  if (heading?.textContent) {
    return normalizeWhitespace(heading.textContent);
  }

  const title = normalizeWhitespace(document.title.replace(/\s*-\s*ChatGPT$/i, ''));
  if (title.length > 0) {
    return title;
  }

  return 'Conversation';
}

function detectWarnings(): string[] {
  const warnings: string[] = [];

  if (document.querySelector('[data-testid="conversation-turn-loading"]')) {
    warnings.push('Conversation appears to still be loading. Export may be partial.');
  }

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
  const continuationButton = buttons.find((button) => {
    const text = normalizeWhitespace(button.textContent ?? '').toLowerCase();
    return text.includes('continue generating') || text.includes('load more');
  });

  if (continuationButton) {
    warnings.push('Conversation has additional content behind a button. Export may be partial.');
  }

  return warnings;
}

function getVisibleText(node: HTMLElement): string {
  return normalizeWhitespace(node.innerText ?? '');
}

function toMarkdown(root: HTMLElement): string {
  const markdown = nodeToMarkdown(root);
  return normalizeMarkdown(markdown);
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  if (node.getAttribute('aria-hidden') === 'true') {
    return '';
  }

  const tagName = node.tagName.toLowerCase();

  if (tagName === 'pre') {
    return renderCodeBlock(node);
  }

  if (tagName === 'code' && node.parentElement?.tagName.toLowerCase() !== 'pre') {
    const text = normalizeWhitespace(node.textContent ?? '');
    return text.length > 0 ? `\`${text}\`` : '';
  }

  if (tagName === 'a') {
    const href = node.getAttribute('href');
    const label = normalizeWhitespace(childrenToMarkdown(node));
    if (!href) {
      return label;
    }

    const safeLabel = label.length > 0 ? label : href;
    return `[${safeLabel}](${href})`;
  }

  if (tagName === 'br') {
    return '\n';
  }

  if (tagName === 'p') {
    const content = normalizeWhitespace(childrenToMarkdown(node));
    return content.length > 0 ? `${content}\n\n` : '';
  }

  if (tagName === 'ul') {
    return renderList(node, false);
  }

  if (tagName === 'ol') {
    return renderList(node, true);
  }

  if (tagName === 'blockquote') {
    const content = normalizeWhitespace(childrenToMarkdown(node));
    if (content.length === 0) {
      return '';
    }

    const quoted = content
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
    return `${quoted}\n\n`;
  }

  if (/^h[1-6]$/.test(tagName)) {
    const level = Number(tagName.charAt(1));
    const content = normalizeWhitespace(childrenToMarkdown(node));
    if (content.length === 0) {
      return '';
    }

    return `${'#'.repeat(level)} ${content}\n\n`;
  }

  if (tagName === 'li') {
    return `${normalizeWhitespace(childrenToMarkdown(node))}\n`;
  }

  return childrenToMarkdown(node);
}

function childrenToMarkdown(node: HTMLElement): string {
  return Array.from(node.childNodes)
    .map((child) => nodeToMarkdown(child))
    .join('');
}

function renderCodeBlock(node: HTMLElement): string {
  const codeNode = node.querySelector('code');
  const className = codeNode?.className ?? '';
  const languageMatch = className.match(/language-([\w-]+)/);
  const language = languageMatch?.[1] ?? '';
  const rawCode = (codeNode?.textContent ?? node.textContent ?? '').replace(/\s+$/g, '');

  if (rawCode.length === 0) {
    return '';
  }

  return `\n\`\`\`${language}\n${rawCode}\n\`\`\`\n\n`;
}

function renderList(node: HTMLElement, ordered: boolean): string {
  const items = Array.from(node.children).filter((child) => child.tagName.toLowerCase() === 'li');
  if (items.length === 0) {
    return '';
  }

  const lines = items.map((item, index) => {
    const content = normalizeWhitespace(childrenToMarkdown(item as HTMLElement));
    if (ordered) {
      return `${index + 1}. ${content}`;
    }

    return `- ${content}`;
  });

  return `${lines.join('\n')}\n\n`;
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeMarkdown(value: string): string {
  return value
    .replace(/\r/g, '\n')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown export error.';
}

function isActionClickedMessage(value: unknown): value is { type: typeof GREPT_ACTION_CLICKED } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === GREPT_ACTION_CLICKED
  );
}
