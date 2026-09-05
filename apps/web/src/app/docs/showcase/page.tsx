import Link from "next/link";

export default function ShowcaseDocs() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-slate-900">
      <Link href="/" className="text-sm underline">
        Back to the workbench
      </Link>
      <h1 className="mt-8 text-4xl font-semibold">
        Build a conversation that leads somewhere.
      </h1>
      <p className="mt-6 text-lg leading-8">
        AnyClick supplies selection, scoped conversation UI, editable results,
        and command completion. Your application supplies the objects and the
        server actions. The homepage uses these same primitives.
      </p>
      <h2 className="mt-12 text-2xl font-semibold">The integration boundary</h2>
      <ol className="mt-5 list-decimal space-y-4 pl-6">
        <li>
          Map selected elements to stable application object IDs. Resolve their
          current values on your server.
        </li>
        <li>
          Pass context, commands, a suggestion provider, and a conversation
          endpoint to <code>Conversation</code>.
        </li>
        <li>
          Stream AI SDK UI messages. Persist complete messages, including data
          parts, IDs, and metadata.
        </li>
        <li>
          Return a typed <code>data-result</code> part for a draft, comparison,
          form, explanation, or receipt.
        </li>
        <li>
          Use <code>actionDispatcher</code> to request a server-validated
          preview. Execute only after the visitor reviews and submits that
          preview.
        </li>
      </ol>
      <pre className="my-8 overflow-auto rounded-xl bg-slate-950 p-6 text-sm leading-7 text-slate-100">
        <code>{`import { Conversation } from '@ewjdev/anyclick-react';
import '@ewjdev/anyclick-react/styles.css';

<Conversation
  conversationId="orders:thread-1"
  endpoint="/api/chat"
  historyEndpoint="/api/history"
  context={selectedObjects}
  onContextChange={setSelectedObjects}
  objects={availableObjects}
  commands={availableCommands}
  suggestionProvider={loadCompletions}
  actionDispatcher={preparePreview}
/>`}</code>
      </pre>
      <h2 className="mt-12 text-2xl font-semibold">Server contracts</h2>
      <p className="mt-4 leading-7">
        The chat endpoint uses the AI SDK 5 UI message stream protocol. History
        returns <code>{"{ messages: ConversationMessage[] }"}</code>. The
        suggestion provider receives the input, caret, included context, and an
        AbortSignal, and returns up to five CompletionItems. The action
        dispatcher receives <code>actionId</code>, <code>objectId</code>, and
        editable <code>values</code>.
      </p>
      <p className="mt-4 leading-7">
        The reference implementation is in{" "}
        <code>apps/web/src/lib/showcase</code> and{" "}
        <code>apps/web/src/app/api/showcase</code>. It includes session
        isolation, atomic revision checks, preview binding, GitHub
        reconciliation, quotas, and a 24-hour sample workspace. Domain rules
        stay in the host application.
      </p>
      <h2 className="mt-12 text-2xl font-semibold">
        Four applications, twelve recipes
      </h2>
      <ul className="mt-4 list-disc space-y-3 pl-6">
        <li>
          Software: issue creation, field copy improvement, and error
          reproduction.
        </li>
        <li>
          Commerce: shipment updates, replacement requests, and product
          comparisons.
        </li>
        <li>
          Healthcare administration: check-in, rescheduling, and staff review.
        </li>
        <li>
          Social: post rewrites, contextual replies, and performance
          experiments.
        </li>
      </ul>
      <h2 className="mt-12 text-2xl font-semibold">Run the hosted sample</h2>
      <p className="mt-4 leading-7">
        Use Node 24, install with Yarn, and configure the server-only values
        listed in <code>.env.example</code>. Run{" "}
        <code>yarn check:showcase</code> before enabling the live service.
        Missing services show an explicit unavailable state; they never switch
        to generated fixtures or pretend that an action succeeded.
      </p>
      <p className="mt-4 leading-7">
        The demo GitHub repository must be public, dedicated to sample
        submissions, and have an <code>issues/src</code> branch. Its token needs
        Issues and Contents write permissions on that repository only. Issue
        submissions and screenshots remain public after the sample session
        expires. Jira, Cursor execution, visitor connections, and arbitrary
        website automation are outside this showcase.
      </p>
      <h2 className="mt-12 text-2xl font-semibold">
        Existing QuickChat integrations
      </h2>
      <p className="mt-4 leading-7">
        Existing props and legacy text chat remain supported. Opt into the new
        scoped controller by rendering <code>Conversation</code> directly or
        supplying the optional <code>conversation</code> prop to{" "}
        <code>QuickChat</code>. This release does not silently migrate an
        existing application's transcript or endpoint.
      </p>
    </main>
  );
}
