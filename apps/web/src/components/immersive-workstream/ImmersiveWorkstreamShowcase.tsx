"use client";

import { Ac } from "@/components/tracking";
import { HomepageIntent } from "@/lib/intents";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavigationRail } from "./NavigationRail";
import { WorkstreamSection } from "./sections/WorkstreamSection";
import { getImmersiveThemes } from "./themes";

export function ImmersiveWorkstreamShowcase({
  className,
}: {
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRailVisible, setIsRailVisible] = useState(false);
  const immersiveThemes = useMemo(() => getImmersiveThemes(), []);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionIds = immersiveThemes.map((t) => t.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const lastSection = sections[sections.length - 1];

    const updateRailVisibility = () => {
      const lastSectionRect = lastSection.getBoundingClientRect();
      const isPastLastSection = lastSectionRect.bottom < 0;
      const hasVisibleSection = sections.some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });
      setIsRailVisible(hasVisibleSection && !isPastLastSection);
    };

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionIds.indexOf(entry.target.id);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    const handleScroll = () => updateRailVisibility();

    sections.forEach((section) => {
      activeObserver.observe(section);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      activeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [immersiveThemes]);

  const handleNavigate = (index: number) => {
    const theme = immersiveThemes[index];
    const section = document.getElementById(theme.id);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Ac.View intent={HomepageIntent.WORKSTREAM_SECTION_VIEW} threshold={0.1}>
      <Ac.Context metadata={{ section: "workstream" }}>
        <div ref={containerRef} className={cn("relative", className)}>
          <NavigationRail
            themes={immersiveThemes}
            activeIndex={activeIndex}
            isVisible={isRailVisible}
            onNavigate={handleNavigate}
          />

          <div>
            {immersiveThemes.map((theme, index) => (
              <WorkstreamSection key={theme.id} theme={theme} index={index} />
            ))}
          </div>
        </div>
      </Ac.Context>
    </Ac.View>
  );
}
