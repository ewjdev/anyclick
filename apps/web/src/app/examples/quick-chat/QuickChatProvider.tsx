"use client";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider } from "@ewjdev/anyclick-react";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

const QuickChatProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AnyclickProvider
      adapter={adapter}
      scoped
      quickChatConfig={{
        endpoint: "/api/anyclick/chat",
        model: "gpt-4o-mini",
        maxResponseLength: 500,
        showRedactionUI: true,
        showSuggestions: true,
      }}
    >
      {children}
    </AnyclickProvider>
  );
};

export default QuickChatProvider;
