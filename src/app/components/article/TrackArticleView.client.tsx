'use client';

import { useEffect } from 'react';

export default function TrackArticleView({ articleId }: { articleId: number }) {
  useEffect(() => {
    if (!Number.isInteger(articleId) || articleId <= 0) {
      return;
    }

    const sessionKey = `tracked-article-view:${articleId}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        return;
      }
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // Ignore storage failures (private mode, disabled storage, etc.)
    }

    const payload = JSON.stringify({ articleId });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/track-view', new Blob([payload], { type: 'application/json' }));
      return;
    }

    void fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  }, [articleId]);

  return null;
}
