import type { CompletionItem, ConversationContext } from "./types";

export function localCompletions(
  input: string,
  caret: number,
  commands: CompletionItem[],
  objects: ConversationContext[],
): CompletionItem[] {
  const token = input.slice(0, caret).match(/(?:^|\s)([/@][^\s]*)$/)?.[1];
  if (!token) return [];
  const query = token.slice(1).toLowerCase();
  const items: CompletionItem[] =
    token[0] === "/"
      ? commands
      : objects.map((context) => ({
          id: context.id,
          label: context.label,
          value: `@${context.id}`,
          kind: "mention",
          description: context.description,
          context,
        }));
  return items
    .filter((item) =>
      `${item.value} ${item.label}`.toLowerCase().includes(query),
    )
    .slice(0, 5);
}

export function insertCompletion(
  input: string,
  caret: number,
  item: CompletionItem,
): string {
  if (item.kind === "completion") return item.value;
  const prefix = input.slice(0, caret);
  return prefix.replace(/[/@][^\s]*$/, item.value + " ") + input.slice(caret);
}
