import { Role } from "../src/lib/roles";

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Role;
    };
  }
}
