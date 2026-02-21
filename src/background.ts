chrome.runtime.onInstalled.addListener(() => {
  console.info('[DownloadGPT] extension installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  await chrome.tabs.sendMessage(tab.id, {
    type: 'DOWNLOAD_GPT_ACTION_CLICKED'
  });
});
