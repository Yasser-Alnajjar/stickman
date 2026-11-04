type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };

export function isFullscreen(): boolean {
  const d = document as FsDocument;
  return !!(document.fullscreenElement ?? d.webkitFullscreenElement);
}

/** Works on Chrome/Firefox/Edge (standard API) and Safari (webkit-prefixed). */
export async function toggleFullscreen(): Promise<void> {
  const d = document as FsDocument;
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else await d.webkitExitFullscreen?.();
    } else {
      const el = document.documentElement as FsElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else await el.webkitRequestFullscreen?.();
    }
  } catch (e) {
    console.warn('[fullscreen] unavailable', e);
  }
}
