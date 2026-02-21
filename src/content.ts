const INIT_MARKER_ID = 'download-gpt-init-marker';

if (!document.getElementById(INIT_MARKER_ID)) {
  const marker = document.createElement('meta');
  marker.id = INIT_MARKER_ID;
  marker.setAttribute('data-extension', 'download-gpt');
  document.head.append(marker);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'DOWNLOAD_GPT_ACTION_CLICKED') {
    return;
  }

  console.info('[DownloadGPT] action clicked. Export flow not implemented yet.');
});
