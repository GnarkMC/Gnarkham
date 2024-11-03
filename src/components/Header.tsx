import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { AVAILABLE_VERSIONS } from "../util/constants";

export interface HeaderProps {
  currentVersion: string;
  onVersionChange$: (version: string) => void;
}

export default component$<HeaderProps>(
  ({ currentVersion, onVersionChange$ }) => {
    const headerRef = useSignal<HTMLElement>();

    useVisibleTask$(({ cleanup }) => {
      const updateHeaderStyle = $(() => {
        const header = headerRef.value;
        if (!header) return;

        const scrollPosition = window.scrollY;
        const opacity = Math.max(0.65 - scrollPosition / 200, 0.2);
        const blur = Math.min(scrollPosition / 5 + 8, 16);

        header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
        header.style.backdropFilter = `blur(${blur}px)`;
      });

      window.addEventListener("scroll", updateHeaderStyle);
      cleanup(() => window.removeEventListener("scroll", updateHeaderStyle));
    });

    const sortedVersions = [...AVAILABLE_VERSIONS].sort((a, b) =>
      b.localeCompare(a)
    );

    return (
      <header class="viewer-header" ref={headerRef}>
        <div class="header-content">
          <div class="header-left">
            <h1 class="header-title">Gnurk</h1>
          </div>

          <div class="header-right">
            <select
              class="version-select"
              onChange$={(e) =>
                onVersionChange$((e.target as HTMLSelectElement).value)
              }
              value={currentVersion}
              aria-label="Select version"
            >
              {sortedVersions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
    );
  }
);
