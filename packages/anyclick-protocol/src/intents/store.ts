///////////////////////////////
// 2. Small Business Online Store & Fulfillment
///////////////////////////////

/**
 * Intents for a small business online shop:
 * - Catalog browsing
 * - Cart management
 * - Checkout & payment
 * - Shipping / fulfillment
 * This covers "normal ecommerce" plus basic fulfillment interactions.
 */
export enum StoreIntent {
  // Catalog & product discovery
  CATALOG_FILTER_APPLY = "domain.store.catalog.filter.apply",
  CATALOG_SORT_APPLY = "domain.store.catalog.sort.apply",
  CATALOG_PRODUCT_OPEN = "domain.store.catalog.product.open",
  CATALOG_PRODUCT_COMPARE_ADD = "domain.store.catalog.product.compare.add",
  CATALOG_PRODUCT_COMPARE_REMOVE = "domain.store.catalog.product.compare.remove",

  // Cart
  CART_ADD = "domain.store.cart.add",
  CART_UPDATE = "domain.store.cart.update",
  CART_REMOVE = "domain.store.cart.remove",
  CART_VIEW = "domain.store.cart.view",

  // Checkout
  CHECKOUT_START = "domain.store.checkout.start",
  CHECKOUT_CONTACT_SUBMIT = "domain.store.checkout.contact.submit",
  CHECKOUT_SHIPPING_SUBMIT = "domain.store.checkout.shipping.submit",
  CHECKOUT_PAYMENT_SUBMIT = "domain.store.checkout.payment.submit",
  ORDER_COMPLETE = "domain.store.order.complete",

  // Fulfillment & post-purchase
  FULFILLMENT_ADDRESS_ADD = "domain.store.fulfillment.address.add",
  FULFILLMENT_ADDRESS_UPDATE = "domain.store.fulfillment.address.update",
  FULFILLMENT_DELIVERY_OPTION_SELECT = "domain.store.fulfillment.delivery.option.select",
  FULFILLMENT_TRACK_VIEW = "domain.store.fulfillment.track.view",
  FULFILLMENT_RETURN_START = "domain.store.fulfillment.return.start",
}

/**
 * Store EXAMPLES
 */

/**
 * Example 1 – Simple checkout
 * 1) apply filter "Hats"                → StoreIntent.CATALOG_FILTER_APPLY
 * 2) open product detail                → StoreIntent.CATALOG_PRODUCT_OPEN
 * 3) add to cart                        → StoreIntent.CART_ADD
 * 4) view cart                          → StoreIntent.CART_VIEW
 * 5) start checkout                     → StoreIntent.CHECKOUT_START
 * 6) submit contact info                → StoreIntent.CHECKOUT_CONTACT_SUBMIT
 * 7) submit shipping details            → StoreIntent.CHECKOUT_SHIPPING_SUBMIT
 * 8) submit payment                     → StoreIntent.CHECKOUT_PAYMENT_SUBMIT
 * 9) order completed                    → StoreIntent.ORDER_COMPLETE
 */

/**
 * Example 2 – Customer changes mind on shipping
 * 1) start checkout                     → StoreIntent.CHECKOUT_START
 * 2) select delivery option             → StoreIntent.FULFILLMENT_DELIVERY_OPTION_SELECT
 * 3) update shipping address            → StoreIntent.FULFILLMENT_ADDRESS_UPDATE
 * 4) re-select faster shipping          → StoreIntent.FULFILLMENT_DELIVERY_OPTION_SELECT
 * 5) complete order                     → StoreIntent.ORDER_COMPLETE
 */

/**
 * Example 3 – Abandoned cart (store-level analytics)
 * 1) add to cart                        → StoreIntent.CART_ADD
 * 2) view cart                          → StoreIntent.CART_VIEW
 * 3) start checkout                     → StoreIntent.CHECKOUT_START
 * 4) never submit payment               → (no CHECKOUT_PAYMENT_SUBMIT)
 * 5) later, email campaign references this behavior
 */

/**
 * Example 4 – View and track fulfillment
 * 1) complete order                     → StoreIntent.ORDER_COMPLETE
 * 2) user opens order history           → StoreIntent.FULFILLMENT_TRACK_VIEW
 * 3) user clicks tracking link          → StoreIntent.FULFILLMENT_TRACK_VIEW (again)
 * 4) user starts return                 → StoreIntent.FULFILLMENT_RETURN_START
 * 5) store support sees all steps in Anyclick tooling
 */

/**
 * Example 5 – Compare products
 * 1) add product A to compare           → StoreIntent.CATALOG_PRODUCT_COMPARE_ADD
 * 2) add product B                      → StoreIntent.CATALOG_PRODUCT_COMPARE_ADD
 * 3) open compare view                  → StoreIntent.CATALOG_PRODUCT_OPEN (compare mode)
 * 4) remove product B                   → StoreIntent.CATALOG_PRODUCT_COMPARE_REMOVE
 * 5) add product A to cart              → StoreIntent.CART_ADD
 */
