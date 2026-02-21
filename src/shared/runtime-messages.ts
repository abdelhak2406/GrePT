import type { ConversationExportPayload } from './export-model';

export const DOWNLOAD_GPT_ACTION_CLICKED = 'DOWNLOAD_GPT_ACTION_CLICKED';
export const DOWNLOAD_GPT_EXPORT_READY = 'DOWNLOAD_GPT_EXPORT_READY';
export const DOWNLOAD_GPT_EXPORT_FAILED = 'DOWNLOAD_GPT_EXPORT_FAILED';

export interface ActionClickedMessage {
  type: typeof DOWNLOAD_GPT_ACTION_CLICKED;
}

export interface ExportReadyMessage {
  type: typeof DOWNLOAD_GPT_EXPORT_READY;
  payload: ConversationExportPayload;
}

export interface ExportFailedMessage {
  type: typeof DOWNLOAD_GPT_EXPORT_FAILED;
  error: string;
}

export function isActionClickedMessage(value: unknown): value is ActionClickedMessage {
  return isRecord(value) && value.type === DOWNLOAD_GPT_ACTION_CLICKED;
}

export function isExportReadyMessage(value: unknown): value is ExportReadyMessage {
  return isRecord(value) && value.type === DOWNLOAD_GPT_EXPORT_READY && isRecord(value.payload);
}

export function isExportFailedMessage(value: unknown): value is ExportFailedMessage {
  return (
    isRecord(value) &&
    value.type === DOWNLOAD_GPT_EXPORT_FAILED &&
    typeof value.error === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
