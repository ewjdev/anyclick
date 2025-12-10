"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const sectionIds = immersiveThemes.map((t) => t.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const lastSection = sections[sections.length - 1];
    const intersectingSections = new Set<string>();

    const updateRailVisibility = () => {
      const lastSectionRect = lastSection.getBoundingClientRect();
      const isPastLastSection = lastSectionRect.bottom < 0;
      const hasVisibleSection = sections.some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });
      setIsRailVisible(hasVisibleSection && !isPastLastSection);
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id;
          if (entry.isIntersecting) {
            intersectingSections.add(sectionId);
          } else {
            intersectingSections.delete(sectionId);
          }
        });
        updateRailVisibility();
      },
      { threshold: 0.1 },
    );

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
      visibilityObserver.observe(section);
      activeObserver.observe(section);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      visibilityObserver.disconnect();
      activeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [immersiveThemes]);

  const handleNavigate = (index: number) => {
    const section = document.getElementById(immersiveThemes[index].id);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
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
  );
}
