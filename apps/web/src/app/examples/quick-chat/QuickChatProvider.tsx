"use client";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import {
  AnyclickProvider,
  DEFAULT_QUICK_CHAT_CONFIG,
} from "@ewjdev/anyclick-react";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

const QuickChatProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AnyclickProvider
      adapter={adapter}
      scoped
      quickChatConfig={DEFAULT_QUICK_CHAT_CONFIG}
    >
      {children}
    </AnyclickProvider>
  );
};

export default QuickChatProvider;
