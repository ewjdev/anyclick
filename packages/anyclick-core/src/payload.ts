import type { FeedbackPayload, FeedbackType, PageContext } from './types';
import { buildElementContext } from './dom';

/**
 * Build page context from the current window/document
 */
export function buildPageContext(): PageContext {
  // Guard for SSR environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      url: '',
      title: '',
      referrer: '',
      screen: { width: 0, height: 0 },
      viewport: { width: 0, height: 0 },
      userAgent: '',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build a complete FeedbackPayload from an element and feedback type
 */
export function buildFeedbackPayload(
  element: Element,
  type: FeedbackType,
  options: {
    comment?: string;
    metadata?: Record<string, unknown>;
    maxInnerTextLength?: number;
    maxOuterHTMLLength?: number;
    maxAncestors?: number;
    stripAttributes?: string[];
  } = {}
): FeedbackPayload {
  const { comment, metadata, ...elementOptions } = options;

  return {
    type,
    comment,
    element: buildElementContext(element, elementOptions),
    page: buildPageContext(),
    metadata,
  };
}

