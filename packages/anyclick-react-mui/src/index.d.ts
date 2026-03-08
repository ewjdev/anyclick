import type { ReactElement } from "react";
import type {
  AnyclickStyleAdapter,
  AnyclickStyleProviderProps,
} from "@ewjdev/anyclick-react";

export interface MuiAnyclickStyleOptions {
  density?: "comfortable" | "compact";
  elevation?: number;
  useTextField?: boolean;
  variantMapping?: {
    button?: "contained" | "outlined" | "text";
    field?: "filled" | "outlined" | "standard";
  };
}

export declare function createMuiAnyclickStyleAdapter(
  options?: MuiAnyclickStyleOptions,
): AnyclickStyleAdapter;

export interface MuiAnyclickStyleProviderProps
  extends AnyclickStyleProviderProps {
  options?: MuiAnyclickStyleOptions;
}

export declare function MuiAnyclickStyleProvider(
  props: MuiAnyclickStyleProviderProps,
): ReactElement;
