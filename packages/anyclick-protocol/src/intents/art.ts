///////////////////////////////
// 5. Artwork Online Sales (Prints, Originals, Commissions)
///////////////////////////////

/**
 * Intents for an online art marketplace or artist shop:
 * - Browsing gallery
 * - Configuring product (size, frame, medium)
 * - Buying physical items
 * - Requesting commissions
 */
export enum ArtworkIntent {
  // Gallery discovery
  GALLERY_VIEW = "domain.art.gallery.view",
  GALLERY_FILTER_APPLY = "domain.art.gallery.filter.apply",
  GALLERY_SORT_APPLY = "domain.art.gallery.sort.apply",
  GALLERY_ARTWORK_OPEN = "domain.art.gallery.artwork.open",

  // Product config
  ARTWORK_VARIANT_SELECT = "domain.art.artwork.variant.select", // size, finish
  ARTWORK_FRAME_OPTION_SELECT = "domain.art.artwork.frame.select",

  // Cart & purchase
  ARTWORK_CART_ADD = "domain.art.cart.add",
  ARTWORK_CART_REMOVE = "domain.art.cart.remove",
  ARTWORK_CHECKOUT_START = "domain.art.checkout.start",
  ARTWORK_ORDER_COMPLETE = "domain.art.order.complete",

  // Commissions
  COMMISSION_REQUEST_START = "domain.art.commission.request.start",
  COMMISSION_DETAILS_SUBMIT = "domain.art.commission.details.submit",
  COMMISSION_QUOTE_SEND = "domain.art.commission.quote.send",
  COMMISSION_QUOTE_ACCEPT = "domain.art.commission.quote.accept",
  COMMISSION_QUOTE_REJECT = "domain.art.commission.quote.reject",
}

/**
 * Artwork EXAMPLES
 */

/**
 * Example 1 – Buy a print
 * 1) user opens gallery                → ArtworkIntent.GALLERY_VIEW
 * 2) filters by artist/style           → ArtworkIntent.GALLERY_FILTER_APPLY
 * 3) opens a specific piece            → ArtworkIntent.GALLERY_ARTWORK_OPEN
 * 4) selects size/variant              → ArtworkIntent.ARTWORK_VARIANT_SELECT
 * 5) adds to cart                      → ArtworkIntent.ARTWORK_CART_ADD
 * 6) starts checkout                   → ArtworkIntent.ARTWORK_CHECKOUT_START
 * 7) completes order                   → ArtworkIntent.ARTWORK_ORDER_COMPLETE
 */

/**
 * Example 2 – Frame selection journey
 * 1) open artwork page                 → ArtworkIntent.GALLERY_ARTWORK_OPEN
 * 2) select frame type                 → ArtworkIntent.ARTWORK_FRAME_OPTION_SELECT
 * 3) change size variant               → ArtworkIntent.ARTWORK_VARIANT_SELECT
 * 4) add to cart                       → ArtworkIntent.ARTWORK_CART_ADD
 * 5) later remove from cart            → ArtworkIntent.ARTWORK_CART_REMOVE
 */

/**
 * Example 3 – Commission request flow
 * 1) clicks "Request a commission"     → ArtworkIntent.COMMISSION_REQUEST_START
 * 2) fills description + budget        → ArtworkIntent.COMMISSION_DETAILS_SUBMIT
 * 3) artist sends quote                → ArtworkIntent.COMMISSION_QUOTE_SEND
 * 4) customer accepts quote            → ArtworkIntent.COMMISSION_QUOTE_ACCEPT
 * 5) (downstream) order and payment handled by app/store layer
 */

/**
 * Example 4 – Commission rejected (market research)
 * 1) commission request started        → ArtworkIntent.COMMISSION_REQUEST_START
 * 2) details submitted                 → ArtworkIntent.COMMISSION_DETAILS_SUBMIT
 * 3) quote sent                        → ArtworkIntent.COMMISSION_QUOTE_SEND
 * 4) customer rejects quote            → ArtworkIntent.COMMISSION_QUOTE_REJECT
 * 5) marketing learns pricing friction from these patterns
 */

/**
 * Example 5 – Browsing-only behavior
 * 1) gallery view                      → ArtworkIntent.GALLERY_VIEW
 * 2) filter/sort changes               → ArtworkIntent.GALLERY_FILTER_APPLY / GALLERY_SORT_APPLY
 * 3) open several artworks             → ArtworkIntent.GALLERY_ARTWORK_OPEN (multiple)
 * 4) no ARTWORK_CART_ADD events        → clearly "research mode"
 * 5) retargeting / email flows can be tuned around this segment
 */
