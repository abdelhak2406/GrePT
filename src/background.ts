import type { ConversationExportPayload } from './shared/export-model';
import { toOpenWebUiChatsJson } from './shared/openwebui-export';
import {
  GREPT_ACTION_CLICKED,
  isExportFailedMessage,
  isExportReadyMessage
} from './shared/runtime-messages';

chrome.runtime.onInstalled.addListener(() => {
  console.info('[GrePt] extension installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: GREPT_ACTION_CLICKED
    });
  } catch (error) {
    console.error('[GrePt] unable to reach content script', error);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (isExportReadyMessage(message)) {
    void downloadConversation(message.payload);
    return;
  }

  if (isExportFailedMessage(message)) {
    console.error('[GrePt] export failed in content script', message.error);
  }
});

async function downloadConversation(payload: ConversationExportPayload): Promise<void> {
  const conversationsJson = toOpenWebUiChatsJson(payload);
  const exportUrl = createDataUrl(conversationsJson, 'application/json');

  await chrome.downloads.download({
    url: exportUrl,
    filename: 'grept-chats.json',
    saveAs: true,
    conflictAction: 'uniquify'
  });

  console.info(`[GrePt] exported ${payload.messages.length} messages`);
}

function createDataUrl(content: string, mimeType: string): string {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
}
