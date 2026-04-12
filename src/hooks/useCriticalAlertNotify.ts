"use client";

import { useEffect, useRef } from "react";

/**
 * When status first enters CRITICAL, POSTs to /api/alert-notify (server throttles duplicates).
 */
export function useCriticalAlertNotify(
  isCritical: boolean,
  criticalAssetTags: string[],
  source: string
) {
  const prevCritical = useRef(false);
  const tagsKey = [...criticalAssetTags].filter(Boolean).sort().join("|");

  useEffect(() => {
    const tags = tagsKey ? tagsKey.split("|").filter(Boolean) : [];
    const shouldNotify = isCritical && tags.length > 0 && !prevCritical.current;
    prevCritical.current = isCritical;

    if (!shouldNotify) return;

    fetch("/api/alert-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets: tags, source }),
    }).catch(() => {});
  }, [isCritical, tagsKey, source]);
}
