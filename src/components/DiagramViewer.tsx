import {
  component$,
  useSignal,
  useVisibleTask$,
  useStore,
  $,
} from "@builder.io/qwik";

interface ViewerState {
  x: number;
  y: number;
  scale: number;
  isDragging: boolean;
  startX: number;
  startY: number;
  currentVersion: string;
}

export default component$(() => {
  const containerRef = useSignal<HTMLElement>();
  const state = useStore<ViewerState>({
    x: 0,
    y: 0,
    scale: 1,
    isDragging: false,
    startX: 0,
    startY: 0,
    currentVersion: "1.21.3",
  });

  // Available versions
  const versions = ["1.21.3"];

  // Single function to update transform
  const updateTransform = $(() => {
    if (!containerRef.value) return;

    // Keep scale within bounds
    state.scale = Math.min(Math.max(0.25, state.scale), 2);

    containerRef.value.style.setProperty("--tx", `${state.x}px`);
    containerRef.value.style.setProperty("--ty", `${state.y}px`);
    containerRef.value.style.setProperty("--scale", `${state.scale}`);
  });

  // Reset view and update version
  const resetView = $(() => {
    state.x = 0;
    state.y = 0;
    state.scale = 1;
    updateTransform();
  });

  useVisibleTask$(({ cleanup }) => {
    const container = containerRef.value;
    if (!container) return;

    // Simple pointer event handlers
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Left click only

      state.isDragging = true;
      state.startX = e.clientX - state.x;
      state.startY = e.clientY - state.y;
      container.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;

      state.x = e.clientX - state.startX;
      state.y = e.clientY - state.startY;
      updateTransform();
    };

    const onPointerUp = () => {
      state.isDragging = false;
    };

    // Simple wheel zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY * -0.001;
      const newScale = state.scale * (1 + delta);

      // Only update if scale would be within bounds
      if (newScale >= 0.25 && newScale <= 2) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        state.scale = newScale;
        state.x = x - (x - state.x) * (1 + delta);
        state.y = y - (y - state.y) * (1 + delta);
        updateTransform();
      }
    };

    // Event listeners
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });

    // Cleanup
    cleanup(() => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("wheel", onWheel);
    });
  });

  return (
    <div class="viewer">
      <button class="version-select" type="button">
        {state.currentVersion}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div class="viewer-toolbar">
        <div class="viewer-controls">
          <button
            class="viewer-button"
            onClick$={resetView}
            aria-label="Reset view"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <div class="viewer-divider" />
          <button
            class="viewer-button"
            onClick$={$((e: Event) => {
              const viewer = (e.target as HTMLElement).closest(".viewer");
              if (!viewer) return;

              if (!document.fullscreenElement) {
                try {
                  viewer.requestFullscreen();
                } catch (err) {
                  // Fallback for Safari/iOS
                  const el = viewer as any;
                  if (el.webkitRequestFullscreen) {
                    el.webkitRequestFullscreen();
                  }
                }
              } else {
                try {
                  document.exitFullscreen();
                } catch (err) {
                  // Fallback for Safari/iOS
                  const doc = document as any;
                  if (doc.webkitExitFullscreen) {
                    doc.webkitExitFullscreen();
                  }
                }
              }
            })}
            aria-label="Toggle fullscreen"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>
      <div class="viewer-content" ref={containerRef}>
        <img
          src={`/${state.currentVersion}.svg`}
          alt={`Server Software Version ${state.currentVersion}`}
          loading="eager"
          draggable={false}
        />
      </div>
    </div>
  );
});
