import {
  component$,
  useSignal,
  useVisibleTask$,
  useStore,
  $,
} from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

type ElementSignal = Signal<HTMLElement | undefined>;

export default component$(() => {
  const viewerRef = useSignal<HTMLElement>();
  const contentRef = useSignal<HTMLElement>();
  const svgRef = useSignal<SVGElement>();

  const state = useStore({
    x: 0,
    y: 0,
    scale: 1,
    isDragging: false,
    startX: 0,
    startY: 0,
    dragTarget: null as Element | null,
  });

  useVisibleTask$(({ cleanup }) => {
    const viewer = viewerRef.value;
    const content = contentRef.value;

    // Early return if elements aren't available
    if (!viewer || !content) return;

    async function injectSVG() {
      try {
        const response = await fetch("/1.21.3.svg");
        const text = await response.text();
        content.innerHTML = text;
        const svg = content.querySelector("svg");
        if (svg) {
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.display = "block";
          svg.style.objectFit = "contain";
          svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svgRef.value = svg;

          svg.querySelectorAll("a").forEach((link) => {
            link.onclick = (e) => {
              if (!state.isDragging) {
                const href = link.getAttribute("href");
                if (href) window.open(href, "_blank");
              }
              e.preventDefault();
            };
          });
        }
      } catch (error) {
        console.error("Error loading SVG:", error);
      }
    }

    function updateTransform() {
      content.style.setProperty("--tx", `${state.x}px`);
      content.style.setProperty("--ty", `${state.y}px`);
      content.style.setProperty("--scale", `${state.scale}`);
    }

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;

      const target = e.target as Element;
      state.dragTarget = target;

      state.isDragging = true;
      state.startX = e.clientX - state.x;
      state.startY = e.clientY - state.y;
      viewer.style.cursor = "grabbing";
      viewer.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!state.isDragging) return;
      state.x = e.clientX - state.startX;
      state.y = e.clientY - state.startY;
      updateTransform();
    }

    function onPointerUp(e: PointerEvent) {
      const wasDragging = state.isDragging;
      state.isDragging = false;
      viewer.style.cursor = "grab";

      if (!wasDragging && state.dragTarget) {
        const link = state.dragTarget.closest("a");
        if (link) {
          const href = link.getAttribute("href");
          if (href) window.open(href, "_blank");
        }
      }

      state.dragTarget = null;
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = state.scale * (1 + delta);

      if (newScale >= 0.25 && newScale <= 2) {
        const rect = viewer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        state.scale = newScale;
        state.x = x - (x - state.x) * (1 + delta);
        state.y = y - (y - state.y) * (1 + delta);
        updateTransform();
      }
    }

    injectSVG();

    viewer.addEventListener("pointerdown", onPointerDown);
    viewer.addEventListener("pointermove", onPointerMove);
    viewer.addEventListener("pointerup", onPointerUp);
    viewer.addEventListener("pointercancel", onPointerUp);
    viewer.addEventListener("wheel", onWheel, { passive: false });

    cleanup(() => {
      viewer.removeEventListener("pointerdown", onPointerDown);
      viewer.removeEventListener("pointermove", onPointerMove);
      viewer.removeEventListener("pointerup", onPointerUp);
      viewer.removeEventListener("pointercancel", onPointerUp);
      viewer.removeEventListener("wheel", onWheel);
    });
  });

  const onReset = $(() => {
    const content = contentRef.value;
    if (!content) return;

    state.x = 0;
    state.y = 0;
    state.scale = 1;
    content.style.setProperty("--tx", "0px");
    content.style.setProperty("--ty", "0px");
    content.style.setProperty("--scale", "1");
  });

  const onFullscreen = $(() => {
    const element = viewerRef.value;
    if (!element) return;
    document.fullscreenElement
      ? document.exitFullscreen()
      : element.requestFullscreen();
  });

  return (
    <div class="viewer" ref={viewerRef}>
      <button class="version-select" type="button">
        1.21.3
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
          <button class="viewer-button" onClick$={onReset}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5" />
            </svg>
          </button>
          <div class="viewer-divider" />
          <button class="viewer-button" onClick$={onFullscreen}>
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

      <div class="viewer-content" ref={contentRef} />
    </div>
  );
});
