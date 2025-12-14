///////////////////////////////
// 1. EHR (Electronic Health Record)
///////////////////////////////

/**
 * Intents for EHR / healthcare workflows:
 * - Patient intake & onboarding
 * - Appointment scheduling & management
 * - Clinical documentation (notes, orders)
 * - Billing & eligibility
 */
export enum EhrIntent {
  // Patient intake & onboarding
  INTAKE_START = "domain.ehr.intake.start",
  INTAKE_FORM_OPEN = "domain.ehr.intake.form.open",
  INTAKE_FORM_SUBMIT = "domain.ehr.intake.form.submit",
  INTAKE_INSURANCE_CAPTURE_START = "domain.ehr.intake.insurance.capture.start",
  INTAKE_INSURANCE_CAPTURE_SUBMIT = "domain.ehr.intake.insurance.capture.submit",
  INTAKE_CONSENT_ACCEPT = "domain.ehr.intake.consent.accept",
  INTAKE_CONSENT_REJECT = "domain.ehr.intake.consent.reject",

  // Appointment scheduling
  APPT_TYPE_SELECT = "domain.ehr.appointment.type.select",
  APPT_PROVIDER_SELECT = "domain.ehr.appointment.provider.select",
  APPT_SLOT_SELECT = "domain.ehr.appointment.slot.select",
  APPT_CREATE = "domain.ehr.appointment.create",
  APPT_RESCHEDULE_START = "domain.ehr.appointment.reschedule.start",
  APPT_RESCHEDULE_SUBMIT = "domain.ehr.appointment.reschedule.submit",
  APPT_CANCEL_START = "domain.ehr.appointment.cancel.start",
  APPT_CANCEL_CONFIRM = "domain.ehr.appointment.cancel.confirm",

  // Clinical note workflows
  NOTE_OPEN = "domain.ehr.clinical.note.open",
  NOTE_CREATE = "domain.ehr.clinical.note.create",
  NOTE_EDIT = "domain.ehr.clinical.note.edit",
  NOTE_SAVE_DRAFT = "domain.ehr.clinical.note.saveDraft",
  NOTE_SIGN = "domain.ehr.clinical.note.sign",

  // Orders (labs, meds, imaging)
  ORDER_LABS_START = "domain.ehr.clinical.order.labs.start",
  ORDER_LABS_SUBMIT = "domain.ehr.clinical.order.labs.submit",
  ORDER_MED_START = "domain.ehr.clinical.order.medications.start",
  ORDER_MED_SUBMIT = "domain.ehr.clinical.order.medications.submit",
  ORDER_IMAGING_START = "domain.ehr.clinical.order.imaging.start",
  ORDER_IMAGING_SUBMIT = "domain.ehr.clinical.order.imaging.submit",

  // Eligibility & billing
  BILLING_ELIGIBILITY_CHECK_START = "domain.ehr.billing.eligibility.check.start",
  BILLING_ELIGIBILITY_CHECK_SUBMIT = "domain.ehr.billing.eligibility.check.submit",
  BILLING_ELIGIBILITY_CHECK_VIEW_RESULT = "domain.ehr.billing.eligibility.check.viewResult",
  BILLING_CLAIM_CREATE = "domain.ehr.billing.claim.create",
  BILLING_CLAIM_SUBMIT = "domain.ehr.billing.claim.submit",
}

/**
 * EHR EXAMPLES
 */

/**
 * Example 1 – New patient intake + appointment
 * 1) user clicks "Start intake"         → EhrIntent.INTAKE_START
 * 2) opens intake form                  → EhrIntent.INTAKE_FORM_OPEN
 * 3) completes and submits intake       → EhrIntent.INTAKE_FORM_SUBMIT
 * 4) starts insurance capture           → EhrIntent.INTAKE_INSURANCE_CAPTURE_START
 * 5) submits insurance info             → EhrIntent.INTAKE_INSURANCE_CAPTURE_SUBMIT
 * 6) selects "New patient visit"        → EhrIntent.APPT_TYPE_SELECT
 * 7) picks provider                     → EhrIntent.APPT_PROVIDER_SELECT
 * 8) picks slot                         → EhrIntent.APPT_SLOT_SELECT
 * 9) confirms appointment               → EhrIntent.APPT_CREATE
 * 10) later opens first note            → EhrIntent.NOTE_OPEN
 */

/**
 * Example 2 – Cancel and reschedule appointment
 * 1) provider opens appointment list    → (UI-level only or APPT_TYPE_SELECT)
 * 2) clicks "Cancel" on a visit         → EhrIntent.APPT_CANCEL_START
 * 3) confirms cancel dialog             → EhrIntent.APPT_CANCEL_CONFIRM
 * 4) selects new slot                   → EhrIntent.APPT_SLOT_SELECT
 * 5) submits reschedule                 → EhrIntent.APPT_RESCHEDULE_SUBMIT
 */

/**
 * Example 3 – Provider documenting a visit
 * 1) open note                          → EhrIntent.NOTE_OPEN
 * 2) edit sections                      → EhrIntent.NOTE_EDIT
 * 3) save draft mid-visit               → EhrIntent.NOTE_SAVE_DRAFT
 * 4) add lab order                      → EhrIntent.ORDER_LABS_START
 * 5) submit lab order                   → EhrIntent.ORDER_LABS_SUBMIT
 * 6) sign note at end                   → EhrIntent.NOTE_SIGN
 */

/**
 * Example 4 – Insurance eligibility check
 * 1) open billing / coverage section    → EhrIntent.BILLING_ELIGIBILITY_CHECK_START
 * 2) enter insurance details            → EhrIntent.INTAKE_INSURANCE_CAPTURE_SUBMIT
 * 3) submit eligibility check           → EhrIntent.BILLING_ELIGIBILITY_CHECK_SUBMIT
 * 4) view eligibility results           → EhrIntent.BILLING_ELIGIBILITY_CHECK_VIEW_RESULT
 * 5) decide to schedule visit           → EhrIntent.APPT_CREATE
 */

/**
 * Example 5 – Medication and imaging orders in one visit
 * 1) start medication order             → EhrIntent.ORDER_MED_START
 * 2) submit medication order            → EhrIntent.ORDER_MED_SUBMIT
 * 3) start imaging order                → EhrIntent.ORDER_IMAGING_START
 * 4) submit imaging order               → EhrIntent.ORDER_IMAGING_SUBMIT
 * 5) sign note                          → EhrIntent.NOTE_SIGN
 */
