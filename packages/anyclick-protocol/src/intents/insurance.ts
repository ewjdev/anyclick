///////////////////////////////
// 4. Insurance Marketing & Quoting
///////////////////////////////

/**
 * Intents for:
 * - capturing insurance leads
 * - providing quotes and comparisons
 * - driving marketing flows
 */
export enum InsuranceIntent {
  // Lead capture & marketing
  LEAD_LANDING_VIEW = "domain.insurance.lead.landing.view",
  LEAD_FORM_OPEN = "domain.insurance.lead.form.open",
  LEAD_FORM_SUBMIT = "domain.insurance.lead.form.submit",
  LEAD_CHANNEL_SELECT = "domain.insurance.lead.channel.select",

  // Quote flows
  QUOTE_FLOW_START = "domain.insurance.quote.flow.start",
  QUOTE_PROFILE_SUBMIT = "domain.insurance.quote.profile.submit", // age, vehicle, home, etc.
  QUOTE_COVERAGE_SELECT = "domain.insurance.quote.coverage.select",
  QUOTE_GENERATE = "domain.insurance.quote.generate", // "Get my quotes" click
  QUOTE_RESULT_VIEW = "domain.insurance.quote.result.view",

  // Carrier / product actions
  QUOTE_OPTION_SELECT = "domain.insurance.quote.option.select",
  QUOTE_OPTION_SAVE = "domain.insurance.quote.option.save", // save for later
  QUOTE_OPTION_APPLY = "domain.insurance.quote.option.apply", // start application

  // Follow-up & nurturing
  LEAD_FOLLOWUP_CHANNEL_SELECT = "domain.insurance.lead.followup.channel.select", // email, phone, sms
  LEAD_FOLLOWUP_SCHEDULE = "domain.insurance.lead.followup.schedule",
}

/**
 * Insurance EXAMPLES
 */

/**
 * Example 1 – Standard "Get a quote" flow
 * 1) user lands on quote page          → InsuranceIntent.LEAD_LANDING_VIEW
 * 2) opens quote form                  → InsuranceIntent.LEAD_FORM_OPEN
 * 3) submits profile details           → InsuranceIntent.QUOTE_PROFILE_SUBMIT
 * 4) clicks "Get my quotes"            → InsuranceIntent.QUOTE_GENERATE
 * 5) views quote results               → InsuranceIntent.QUOTE_RESULT_VIEW
 */

/**
 * Example 2 – Choose coverage and apply
 * 1) starts quote flow                 → InsuranceIntent.QUOTE_FLOW_START
 * 2) selects coverage level            → InsuranceIntent.QUOTE_COVERAGE_SELECT
 * 3) views specific quote option       → InsuranceIntent.QUOTE_OPTION_SELECT
 * 4) saves quote                       → InsuranceIntent.QUOTE_OPTION_SAVE
 * 5) clicks "Apply now"                → InsuranceIntent.QUOTE_OPTION_APPLY
 */

/**
 * Example 3 – Marketing attribution for leads
 * 1) selects lead channel "Facebook"   → InsuranceIntent.LEAD_CHANNEL_SELECT
 * 2) submits lead/quote form           → InsuranceIntent.LEAD_FORM_SUBMIT
 * 3) views initial quote results       → InsuranceIntent.QUOTE_RESULT_VIEW
 * 4) abandons before applying          → (no QUOTE_OPTION_APPLY)
 * 5) later enters followup flow        → InsuranceIntent.LEAD_FOLLOWUP_SCHEDULE
 */

/**
 * Example 4 – Multi-channel follow up
 * 1) quote generated                   → InsuranceIntent.QUOTE_GENERATE
 * 2) user chooses "Text me updates"    → InsuranceIntent.LEAD_FOLLOWUP_CHANNEL_SELECT
 * 3) scheduled call                    → InsuranceIntent.LEAD_FOLLOWUP_SCHEDULE
 * 4) later returns to quote            → InsuranceIntent.QUOTE_RESULT_VIEW
 * 5) eventually applies                → InsuranceIntent.QUOTE_OPTION_APPLY
 */

/**
 * Example 5 – Coverage experimentation
 * 1) profile submitted                 → InsuranceIntent.QUOTE_PROFILE_SUBMIT
 * 2) user experiments with coverage    → InsuranceIntent.QUOTE_COVERAGE_SELECT (multiple times)
 * 3) regenerates quotes                → InsuranceIntent.QUOTE_GENERATE
 * 4) selects final option              → InsuranceIntent.QUOTE_OPTION_SELECT
 * 5) shares quote via email (app-level) and then applies → InsuranceIntent.QUOTE_OPTION_APPLY
 */
