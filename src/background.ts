import type { ConversationExportPayload } from './shared/export-model';
import {
  createExportBaseFileName,
  toJsonExportString,
  toMarkdownExportString
} from './shared/export-serializers';
import {
  DOWNLOAD_GPT_ACTION_CLICKED,
  isExportFailedMessage,
  isExportReadyMessage
} from './shared/runtime-messages';

chrome.runtime.onInstalled.addListener(() => {
  console.info('[DownloadGPT] extension installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: DOWNLOAD_GPT_ACTION_CLICKED
    });
  } catch (error) {
    console.error('[DownloadGPT] unable to reach content script', error);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (isExportReadyMessage(message)) {
    void downloadConversation(message.payload);
    return;
  }

  if (isExportFailedMessage(message)) {
    console.error('[DownloadGPT] export failed in content script', message.error);
  }
});

async function downloadConversation(payload: ConversationExportPayload): Promise<void> {
  const baseName = createExportBaseFileName(payload.title, payload.exportedAt);
  const markdownText = toMarkdownExportString(payload);
  const jsonText = toJsonExportString(payload);

  await chrome.downloads.download({
    url: createDataUrl(markdownText, 'text/markdown'),
    filename: `${baseName}.md`,
    saveAs: false,
    conflictAction: 'uniquify'
  });

  await chrome.downloads.download({
    url: createDataUrl(jsonText, 'application/json'),
    filename: `${baseName}.json`,
    saveAs: false,
    conflictAction: 'uniquify'
  });

  console.info(`[DownloadGPT] exported ${payload.messages.length} messages`);
}

function createDataUrl(content: string, mimeType: string): string {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
}
