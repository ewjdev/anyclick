import { createHttpAdapter } from "@ewjdev/anyclick-github";

export const adapter = createHttpAdapter({ endpoint: "/api/feedback" });
