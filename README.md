# Anyclick

> Capture rich context for every click – and send it to your issues, metrics, and AI tools.

Anyclick is a tiny JS/React library that turns **any click on your app** into a
structured event with:

- full page context (URL, title, viewport, user agent)
- DOM context for the exact element (selector, ancestors, text/html snippet, position)

Out of the box you get:

- **Right-click feedback** – report an issue, request a feature, or say “I like this”
  on any element, with one click.
- **GitHub integration** – open issues pre-filled with DOM context.
- A simple **adapter system** – pipe events to your backend, database, or AI tools.

Roadmap:

- Click behavior tracking (usage metrics like “lightweight FullStory”)
- Status feedback buttons (e.g. “this feature is confusing / broken / great”)
- AI adapters for summarizing & prioritizing feedback at scale.
****