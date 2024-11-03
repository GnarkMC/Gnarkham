import {
  component$,
  useSignal,
  useVisibleTask$,
  useStore,
  $,
} from "@builder.io/qwik";
import Header from "./Header";
import { DEFAULT_VERSION, ZOOM, MOVEMENT } from "../util/constants";

export default component$(() => {
  const viewerRef = useSignal<HTMLElement>();
  const contentRef = useSignal<HTMLElement>();
  const currentVersion = useSignal(DEFAULT_VERSION);
  const sliderValue = useSignal(50);

  const state = useStore<ViewerState>({
    transform: { x: 0, y: 0, scale: 1 },
    drag: {
      active: false,
      start: { x: 0, y: 0 },
    },
    loading: false,
    error: "",
  });

  const updateTransform = $(() => {
    const content = contentRef.value;
    if (!content) return;

    const { x, y, scale } = state.transform;
    content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  });

  const loadSVG = $(async (version: string) => {
    const content = contentRef.value;
    if (!content) return false;

    state.loading = true;
    state.error = "";

    try {
      const response = await fetch(`/src/assets/${version}.svg`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const text = await response.text();
      content.innerHTML = text;

      const svg = content.querySelector("svg");
      if (svg) {
        Object.assign(svg.style, {
          width: "100%",
          height: "100%",
          display: "block",
        });
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", `Diagram version ${version}`);
      }

      return true;
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to load SVG";
      return false;
    } finally {
      state.loading = false;
    }
  });

  const handleVersionChange = $(async (version: string) => {
    const success = await loadSVG(version);
    if (success) {
      currentVersion.value = version;
    }
  });

  const handlePointerDown = $((e: PointerEvent) => {
    if (e.button !== 0) return;

    state.drag.active = true;
    state.drag.start = {
      x: e.clientX - state.transform.x,
      y: e.clientY - state.transform.y,
    };

    const viewer = viewerRef.value;
    if (viewer) viewer.style.cursor = "grabbing";
  });

  const handlePointerMove = $((e: PointerEvent) => {
    if (!state.drag.active) return;

    state.transform.x = e.clientX - state.drag.start.x;
    state.transform.y = e.clientY - state.drag.start.y;
    updateTransform();
  });

  const handlePointerUp = $(() => {
    state.drag.active = false;

    const viewer = viewerRef.value;
    if (viewer) viewer.style.cursor = "grab";
  });

  const handleZoom = $((e: WheelEvent) => {
    e.preventDefault();

    const viewer = viewerRef.value;
    if (!viewer) return;

    const rect = viewer.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const delta = e.deltaY * ZOOM.WHEEL_FACTOR;
    const newScale = state.transform.scale * (1 + delta);

    if (newScale >= ZOOM.MIN && newScale <= ZOOM.MAX) {
      state.transform.scale = newScale;
      state.transform.x = point.x - (point.x - state.transform.x) * (1 + delta);
      state.transform.y = point.y - (point.y - state.transform.y) * (1 + delta);
      updateTransform();

      sliderValue.value = ((newScale - ZOOM.MIN) / (ZOOM.MAX - ZOOM.MIN)) * 100;
    }
  });

  const handleZoomChange = $((e: Event) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    sliderValue.value = value;

    const newScale = (value / 100) * (ZOOM.MAX - ZOOM.MIN) + ZOOM.MIN;
    state.transform.scale = newScale;
    updateTransform();
  });

  const handleLink = $((e: MouseEvent) => {
    if (state.drag.active) return;

    const link = (e.target as Element).closest("a");
    if (link) {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (href) window.open(href, "_blank", "noopener noreferrer");
    }
  });

  const handleKeyboard = $((e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        state.transform.x -= MOVEMENT.STEP;
        break;
      case "ArrowRight":
        state.transform.x += MOVEMENT.STEP;
        break;
      case "ArrowUp":
        state.transform.y -= MOVEMENT.STEP;
        break;
      case "ArrowDown":
        state.transform.y += MOVEMENT.STEP;
        break;
      case "+":
        state.transform.scale = Math.min(
          ZOOM.MAX,
          state.transform.scale + ZOOM.STEP
        );
        sliderValue.value =
          ((state.transform.scale - ZOOM.MIN) / (ZOOM.MAX - ZOOM.MIN)) * 100;
        break;
      case "-":
        state.transform.scale = Math.max(
          ZOOM.MIN,
          state.transform.scale - ZOOM.STEP
        );
        sliderValue.value =
          ((state.transform.scale - ZOOM.MIN) / (ZOOM.MAX - ZOOM.MIN)) * 100;
        break;
      case "0":
        reset();
        break;
      default:
        return;
    }

    e.preventDefault();
    updateTransform();
  });

  useVisibleTask$(({ cleanup }) => {
    const viewer = viewerRef.value;
    const content = contentRef.value;
    if (!viewer || !content) return;

    loadSVG(currentVersion.value);

    viewer.addEventListener("pointerdown", handlePointerDown);
    viewer.addEventListener("pointermove", handlePointerMove);
    viewer.addEventListener("pointerup", handlePointerUp);
    viewer.addEventListener("pointercancel", handlePointerUp);
    viewer.addEventListener("wheel", handleZoom, { passive: false });
    viewer.addEventListener("keydown", handleKeyboard);
    content.addEventListener("click", handleLink);

    cleanup(() => {
      viewer.removeEventListener("pointerdown", handlePointerDown);
      viewer.removeEventListener("pointermove", handlePointerMove);
      viewer.removeEventListener("pointerup", handlePointerUp);
      viewer.removeEventListener("pointercancel", handlePointerUp);
      viewer.removeEventListener("wheel", handleZoom);
      viewer.removeEventListener("keydown", handleKeyboard);
      content.removeEventListener("click", handleLink);
    });
  });

  const reset = $(() => {
    state.transform = { x: 0, y: 0, scale: 1 };
    sliderValue.value = 50;
    updateTransform();
  });

  return (
    <div
      class="viewer-container"
      ref={viewerRef}
      tabIndex={0}
      role="application"
      aria-label="Diagram viewer"
    >
      <Header
        currentVersion={currentVersion.value}
        onVersionChange$={handleVersionChange}
      />

      <div class="zoom-controls">
        <div class="zoom-slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue.value}
            class="zoom-slider"
            orient="vertical"
            aria-label="Zoom level"
            onChange$={handleZoomChange}
          />
        </div>
        <button class="zoom-reset" onClick$={reset} aria-label="Reset view">
          <span class="icon">⟲</span>
        </button>
      </div>

      {state.loading && (
        <div class="viewer-overlay" role="status">
          Loading...
        </div>
      )}

      {state.error && (
        <div class="viewer-overlay viewer-error" role="alert">
          {state.error}
        </div>
      )}

      <div
        class="viewer-content"
        ref={contentRef}
        aria-hidden={state.loading}
      />
    </div>
  );
});
