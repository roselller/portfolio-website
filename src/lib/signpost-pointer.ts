/** Stop immediately on blur; refocusing waits for a fresh pointer movement. */
export function bindSignpostPointer(
  host: Pick<Window, "addEventListener" | "removeEventListener" | "innerWidth">,
  page: Pick<
    Document,
    "addEventListener" | "removeEventListener" | "hasFocus" | "visibilityState"
  >,
  move: (angle: number) => void,
  pause: () => void,
) {
  function onMove(event: Event) {
    const pointer = event as PointerEvent;
    if (
      pointer.pointerType === "touch" ||
      !page.hasFocus() ||
      page.visibilityState !== "visible"
    )
      return;
    const normalized = Math.max(
      -1,
      Math.min(1, (pointer.clientX / Math.max(1, host.innerWidth)) * 2 - 1),
    );
    const angle = (-normalized * Math.PI) / 9;
    move(Math.min(Math.PI / 18, angle));
  }
  function onVisibility() {
    if (page.visibilityState !== "visible") pause();
  }
  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("blur", pause);
  page.addEventListener("visibilitychange", onVisibility);
  return () => {
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("blur", pause);
    page.removeEventListener("visibilitychange", onVisibility);
    pause();
  };
}
