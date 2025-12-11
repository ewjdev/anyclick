Date capture

Goals

- Secure
- performant on all levels
- relevent data only
- config to control cache handling and queing

Other ideas

**“Link back to DOM”**

- Alongside screenshots, generate a **locator snippet** in the issue body:
```
// pseudo
const locator = buildLocator(element); // role=button[name="Save"], data-test-id, etc.

```

- Makes it easier for Playwright/Cypress integration later, and is super helpful for AI agents.