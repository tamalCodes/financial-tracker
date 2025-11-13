import { useEffect } from "react";

export function useLockBodyScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const { body, documentElement } = document;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyPosition = body.style.position;
    const originalBodyWidth = body.style.width;
    const originalHtmlHeight = documentElement.style.height;

    body.style.overflow = "hidden";
    body.style.position = "relative";
    body.style.width = "100%";
    documentElement.style.height = "100%";

    return () => {
      body.style.overflow = originalBodyOverflow;
      body.style.position = originalBodyPosition;
      body.style.width = originalBodyWidth;
      documentElement.style.height = originalHtmlHeight;
    };
  }, [enabled]);
}
