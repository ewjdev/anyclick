import { Ac } from "@/components/tracking";
import { HomepageIntent } from "@/lib/intents";
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

  const sectionContent = (
    <section
      ref={sectionRef}
      id={theme.id}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {theme.id === "software" ? (
        <SoftwareDevelopmentSection
          theme={theme}
          scrollYProgress={scrollYProgress}
          isInView={true}
          bgY={bgY}
        />
      ) : theme.id === "healthcare" ? (
        <HealthcareSection
          theme={theme}
          scrollYProgress={scrollYProgress}
          isInView={isInView}
          bgY={bgY}
        />
      ) : (
        <DefaultWorkstreamSection
          theme={theme}
          scrollYProgress={scrollYProgress}
          isInView={isInView}
          bgY={bgY}
        />
      )}
    </section>
  );

  return (
    <Ac.View
      intent={HomepageIntent.WORKSTREAM_CARD_INTERACT}
      threshold={0.1}
      metadata={{
        action: "view",
        "section-id": theme.id,
        "section-title": theme.title,
      }}
    >
      {sectionContent}
    </Ac.View>
  );
}
