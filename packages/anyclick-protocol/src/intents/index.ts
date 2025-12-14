import { ArtworkIntent } from "./art";
import { EhrIntent } from "./ehr";
import { InsuranceIntent } from "./insurance";
import { ServiceQuoteIntent } from "./service";
import { StoreIntent } from "./store";

export * from "./art";
export * from "./ehr";
export * from "./insurance";
export * from "./service";
export * from "./store";

///////////////////////////////
// Aggregated union type
///////////////////////////////

/**
 * Union of all intents defined here.
 * In your app you can narrow this union by:
 *  - importing only the enums you care about
 *  - or restricting to a smaller type alias.
 */
export type AnyclickIntent =
  | EhrIntent
  | StoreIntent
  | ServiceQuoteIntent
  | InsuranceIntent
  | ArtworkIntent;
