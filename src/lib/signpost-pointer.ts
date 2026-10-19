import { PHONE_MAX_WIDTH } from "./signpost-layout";

/**
 * Stop immediately on blur; refocusing waits for a fresh pointer movement.
 * Phone-width windows stay at rest, because their signs are sized edge to edge.
 */
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
    if (host.innerWidth <= PHONE_MAX_WIDTH) {
      move(0);
      return;
    }
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
  function onResize() {
    // Resizing down to a phone width must not leave the signpost tilted.
    if (host.innerWidth <= PHONE_MAX_WIDTH) move(0);
  }
  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("resize", onResize);
  host.addEventListener("blur", pause);
  page.addEventListener("visibilitychange", onVisibility);
  return () => {
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("resize", onResize);
    host.removeEventListener("blur", pause);
    page.removeEventListener("visibilitychange", onVisibility);
    pause();
  };
}
