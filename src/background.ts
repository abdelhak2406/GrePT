import type { ConversationExportPayload } from './shared/export-model';
import { createArchiveDataUrl, createConversationArchive } from './shared/export-archive';
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
  const archive = createConversationArchive(payload);
  const archiveUrl = createArchiveDataUrl(archive);

  await chrome.downloads.download({
    url: archiveUrl,
    filename: archive.fileName,
    saveAs: true,
    conflictAction: 'uniquify'
  });

  console.info(`[DownloadGPT] exported ${payload.messages.length} messages`);
}
