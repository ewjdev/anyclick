/**
 * Homepage-specific intents for the Anyclick web app.
 *
 * These intents follow the protocol convention: `web.<page>.<section>.<action>`
 * and may be promoted to the protocol package if they prove useful across apps.
 *
 * @module intents/homepage
 */

export enum HomepageIntent {
  // ============================================================================
  // Navigation
  // ============================================================================
  NAV_LOGO_CLICK = "web.homepage.nav.logo.click",
  NAV_DOCS_CLICK = "web.homepage.nav.docs.click",
  NAV_EXAMPLES_CLICK = "web.homepage.nav.examples.click",
  NAV_GITHUB_CLICK = "web.homepage.nav.github.click",
  NAV_GET_STARTED_CLICK = "web.homepage.nav.getStarted.click",

  // ============================================================================
  // Hero Section
  // ============================================================================
  HERO_VIEW = "web.homepage.hero.view",
  HERO_CTA_CLICK = "web.homepage.hero.cta.click",
  HERO_CODE_COPY = "web.homepage.hero.code.copy",

  // ============================================================================
  // Immersive Workstream Section
  // ============================================================================
  WORKSTREAM_SECTION_VIEW = "web.homepage.workstream.section.view",
  WORKSTREAM_NAV_CLICK = "web.homepage.workstream.nav.click",
  WORKSTREAM_CARD_INTERACT = "web.homepage.workstream.card.interact",

  COPY_EDITOR_CODE = "web.homepage.editor.code.copy",

  // ============================================================================
  // Features Section
  // ============================================================================
  FEATURES_SECTION_VIEW = "web.homepage.features.section.view",
  FEATURES_CARD_HOVER = "web.homepage.features.card.hover",

  // ============================================================================
  // Packages Section
  // ============================================================================
  PACKAGES_SECTION_VIEW = "web.homepage.packages.section.view",
  PACKAGES_CARD_HOVER = "web.homepage.packages.card.hover",

  // ============================================================================
  // Quick Start Section
  // ============================================================================
  QUICKSTART_SECTION_VIEW = "web.homepage.quickstart.section.view",
  QUICKSTART_CODE_COPY = "web.homepage.quickstart.code.copy",
  QUICKSTART_DOCS_CLICK = "web.homepage.quickstart.docs.click",

  // ============================================================================
  // Roadmap Summary Section
  // ============================================================================
  ROADMAP_SECTION_VIEW = "web.homepage.roadmap.section.view",
  ROADMAP_FEATURE_REQUEST_CLICK = "web.homepage.roadmap.featureRequest.click",
  ROADMAP_LINK_CLICK = "web.homepage.roadmap.link.click",

  // ============================================================================
  // Footer
  // ============================================================================
  FOOTER_VIEW = "web.homepage.footer.view",
  FOOTER_LINK_CLICK = "web.homepage.footer.link.click",

  // ============================================================================
  // Engagement Metrics (Scroll Depth)
  // ============================================================================
  SCROLL_DEPTH_25 = "web.homepage.scroll.depth.25",
  SCROLL_DEPTH_50 = "web.homepage.scroll.depth.50",
  SCROLL_DEPTH_75 = "web.homepage.scroll.depth.75",
  SCROLL_DEPTH_100 = "web.homepage.scroll.depth.100",

  // ============================================================================
  // Engagement Metrics (Time on Page)
  // ============================================================================
  TIME_ON_PAGE_30S = "web.homepage.engagement.time.30s",
  TIME_ON_PAGE_60S = "web.homepage.engagement.time.60s",
  TIME_ON_PAGE_120S = "web.homepage.engagement.time.120s",
}

/**
 * Type alias for homepage intent values.
 */
export type HomepageIntentType = `${HomepageIntent}`;
