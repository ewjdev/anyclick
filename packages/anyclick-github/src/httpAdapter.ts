import {
  HttpAdapter as CoreHttpAdapter,
} from "@ewjdev/anyclick-core";
import type { HttpAdapterOptions } from "./types";

/**
 * @deprecated Import HttpAdapter from "@ewjdev/anyclick-core" instead.
 */
export class HttpAdapter extends CoreHttpAdapter {}

/**
 * @deprecated Import createHttpAdapter from "@ewjdev/anyclick-core" instead.
 */
export function createHttpAdapter(options: HttpAdapterOptions): HttpAdapter {
  return new HttpAdapter(options);
}
