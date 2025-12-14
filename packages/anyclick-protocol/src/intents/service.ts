///////////////////////////////
// 3. Quoting for Contract / Contact-Based Businesses
///////////////////////////////

/**
 * This covers businesses like:
 * - contractors (plumbing, HVAC, roofing)
 * - consultants / service providers
 * - anyone generating project quotes from leads
 */
export enum ServiceQuoteIntent {
  // Lead capture
  LEAD_FORM_OPEN = "domain.serviceQuote.lead.form.open",
  LEAD_FORM_SUBMIT = "domain.serviceQuote.lead.form.submit",
  LEAD_CHANNEL_SELECT = "domain.serviceQuote.lead.channel.select", // web, phone, referral

  // Quote creation
  QUOTE_CREATE_START = "domain.serviceQuote.quote.create.start",
  QUOTE_DETAILS_SUBMIT = "domain.serviceQuote.quote.details.submit",
  QUOTE_SEND_TO_CUSTOMER = "domain.serviceQuote.quote.send",
  QUOTE_UPDATE = "domain.serviceQuote.quote.update",

  // Customer decision
  QUOTE_ACCEPT = "domain.serviceQuote.quote.accept",
  QUOTE_REJECT = "domain.serviceQuote.quote.reject",
  QUOTE_REQUEST_REVISION = "domain.serviceQuote.quote.requestRevision",

  // Scheduling
  VISIT_SCHEDULE_START = "domain.serviceQuote.visit.schedule.start",
  VISIT_SLOT_SELECT = "domain.serviceQuote.visit.slot.select",
  VISIT_CONFIRM = "domain.serviceQuote.visit.confirm",
}

/**
 * Service Quoting EXAMPLES
 */

/**
 * Example 1 – New lead to quote sent
 * 1) customer opens lead form          → ServiceQuoteIntent.LEAD_FORM_OPEN
 * 2) submits project details           → ServiceQuoteIntent.LEAD_FORM_SUBMIT
 * 3) business starts quote             → ServiceQuoteIntent.QUOTE_CREATE_START
 * 4) fills price/scope details         → ServiceQuoteIntent.QUOTE_DETAILS_SUBMIT
 * 5) sends quote to customer           → ServiceQuoteIntent.QUOTE_SEND_TO_CUSTOMER
 */

/**
 * Example 2 – Customer accepts quote and books visit
 * 1) customer opens quote page         → (view only)
 * 2) clicks "Accept quote"             → ServiceQuoteIntent.QUOTE_ACCEPT
 * 3) clicks "Schedule visit"           → ServiceQuoteIntent.VISIT_SCHEDULE_START
 * 4) selects time slot                 → ServiceQuoteIntent.VISIT_SLOT_SELECT
 * 5) confirms visit                    → ServiceQuoteIntent.VISIT_CONFIRM
 */

/**
 * Example 3 – Quote revision requested
 * 1) customer clicks "Request changes" → ServiceQuoteIntent.QUOTE_REQUEST_REVISION
 * 2) submits new requirements          → ServiceQuoteIntent.QUOTE_DETAILS_SUBMIT
 * 3) business updates quote            → ServiceQuoteIntent.QUOTE_UPDATE
 * 4) sends updated quote               → ServiceQuoteIntent.QUOTE_SEND_TO_CUSTOMER
 * 5) customer later accepts            → ServiceQuoteIntent.QUOTE_ACCEPT
 */

/**
 * Example 4 – Lead channel analytics
 * 1) lead selects "Found via Google"   → ServiceQuoteIntent.LEAD_CHANNEL_SELECT
 * 2) submits form                      → ServiceQuoteIntent.LEAD_FORM_SUBMIT
 * 3) internal user starts quote        → ServiceQuoteIntent.QUOTE_CREATE_START
 * 4) quote sent                        → ServiceQuoteIntent.QUOTE_SEND_TO_CUSTOMER
 * 5) lead never accepts                → (no QUOTE_ACCEPT)
 */

/**
 * Example 5 – Visit scheduling without quote acceptance yet
 * 1) customer submits lead             → ServiceQuoteIntent.LEAD_FORM_SUBMIT
 * 2) business proposes visit first     → ServiceQuoteIntent.VISIT_SCHEDULE_START
 * 3) customer picks slot               → ServiceQuoteIntent.VISIT_SLOT_SELECT
 * 4) visit is confirmed                → ServiceQuoteIntent.VISIT_CONFIRM
 * 5) quote is created during/after     → ServiceQuoteIntent.QUOTE_CREATE_START
 */
