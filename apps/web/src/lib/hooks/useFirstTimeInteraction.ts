"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "anyclick_hero_interaction_complete";

export function useFirstTimeInteraction() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window === "undefined") {
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    setHasInteracted(stored === "true");
  }, []);

  const markComplete = () => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(STORAGE_KEY, "true");
    setHasInteracted(true);
  };

  return {
    hasInteracted: isClient ? hasInteracted : false,
    markComplete,
  };
}
