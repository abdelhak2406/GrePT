// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from 'vitest';

import { sanitizeFileName } from './sanitize-file-name';

describe('sanitizeFileName', () => {
  it('replaces invalid filename characters and normalizes spaces', () => {
    const result = sanitizeFileName('  My: invalid/ title?  ');

    expect(result).toBe('My invalid title');
  });

  it('falls back when the title has no valid characters', () => {
    const result = sanitizeFileName('....???***', 'chat-export');

    expect(result).toBe('chat-export');
  });
});
