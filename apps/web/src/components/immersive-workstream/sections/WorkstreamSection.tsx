import { useRef } from "react";
import { useInView, useScroll, useTransform } from "motion/react";
import type { ImmersiveTheme } from "../types";
import { DefaultWorkstreamSection } from "./DefaultWorkstreamSection";
import { HealthcareSection } from "./HealthcareSection";
import { SoftwareDevelopmentSection } from "./SoftwareDevelopmentSection";

interface WorkstreamSectionProps {
  theme: ImmersiveTheme;
  index: number;
}

export function WorkstreamSection({ theme }: WorkstreamSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  switch (theme.id) {
    case "software":
      return (
        <section
          ref={sectionRef}
          id={theme.id}
          className="relative min-h-screen w-full overflow-hidden"
        >
          <SoftwareDevelopmentSection
            theme={theme}
            scrollYProgress={scrollYProgress}
            isInView={isInView}
            bgY={bgY}
          />
        </section>
      );
    case "healthcare":
      return (
        <section
          ref={sectionRef}
          id={theme.id}
          className="relative min-h-screen w-full overflow-hidden"
        >
          <HealthcareSection
            theme={theme}
            scrollYProgress={scrollYProgress}
            isInView={isInView}
            bgY={bgY}
          />
        </section>
      );
    default:
      return (
        <section
          ref={sectionRef}
          id={theme.id}
          className="relative min-h-screen w-full overflow-hidden"
        >
          <DefaultWorkstreamSection
            theme={theme}
            scrollYProgress={scrollYProgress}
            isInView={isInView}
            bgY={bgY}
          />
        </section>
      );
  }
}
