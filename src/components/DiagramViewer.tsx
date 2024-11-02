import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

interface ViewerState {
  scale: number;
  pointX: number;
  pointY: number;
  start: { x: number; y: number };
}

export default component$(() => {
  const state = useSignal<ViewerState>({
    scale: 1,
    pointX: 0,
    pointY: 0,
    start: { x: 0, y: 0 },
  });

  const isPanning = useSignal(false);
  const imageRef = useSignal<HTMLImageElement>();

  // Setup event listeners
  useVisibleTask$(({ cleanup }) => {
    const image = document.querySelector(
      ".diagram-content img"
    ) as HTMLImageElement;
    const content = document.querySelector(".diagram-content") as HTMLElement;

    if (!image || !content) return;

    // Store image reference for reset button
    imageRef.value = image;

    const setTransform = () => {
      image.style.transform = `translate(${state.value.pointX}px, ${state.value.pointY}px) scale(${state.value.scale})`;
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isPanning.value = true;
      state.value = {
        ...state.value,
        start: {
          x: e.clientX - state.value.pointX,
          y: e.clientY - state.value.pointY,
        },
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning.value) return;
      state.value = {
        ...state.value,
        pointX: e.clientX - state.value.start.x,
        pointY: e.clientY - state.value.start.y,
      };
      setTransform();
    };

    const handleMouseUp = () => {
      isPanning.value = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const xs = (e.clientX - state.value.pointX) / state.value.scale;
      const ys = (e.clientY - state.value.pointY) / state.value.scale;
      const delta = -e.deltaY * 0.01;

      state.value = {
        ...state.value,
        scale: Math.min(Math.max(0.25, state.value.scale + delta), 4),
        pointX: e.clientX - xs * state.value.scale,
        pointY: e.clientY - ys * state.value.scale,
      };
      setTransform();
    };

    const resetView = () => {
      state.value = {
        scale: 1,
        pointX: 0,
        pointY: 0,
        start: { x: 0, y: 0 },
      };
      setTransform();
    };

    // Attach event listeners
    content.addEventListener("mousedown", handleMouseDown);
    content.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    content.addEventListener("wheel", handleWheel);
    content.addEventListener("dblclick", resetView);

    // Cleanup
    cleanup(() => {
      content.removeEventListener("mousedown", handleMouseDown);
      content.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      content.removeEventListener("wheel", handleWheel);
      content.removeEventListener("dblclick", resetView);
    });
  });

  return (
    <div class="diagram-viewer">
      <div class="toolbar">
        <button
          onClick$={() => {
            if (imageRef.value) {
              state.value = {
                scale: 1,
                pointX: 0,
                pointY: 0,
                start: { x: 0, y: 0 },
              };
              imageRef.value.style.transform = `translate(0px, 0px) scale(1)`;
            }
          }}
          aria-label="Reset view"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button
          onClick$={() => {
            if (!document.fullscreenElement) {
              document.querySelector(".diagram-viewer")?.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          aria-label="Toggle fullscreen"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </div>
      <div class="diagram-content">
        <img
          src={import.meta.env.BASE_URL + "1.21.3.svg"}
          alt="Server Software"
        />
      </div>
    </div>
  );
});
