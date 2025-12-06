---
"@ewjdev/anyclick-react": major
---

**BREAKING:** Replace `InspectDialog` with `InspectSimple`

- Remove `InspectDialog` export in favor of new lightweight `InspectSimple` component
- Add `InspectDialogManager` for automatic inspect event handling
- New `InspectSimple` features:
  - Compact, consolidated layout with icon-only action buttons
  - Mobile-responsive bottom drawer on small screens
  - Click-outside to close
  - Auto-dismiss status messages after 5 seconds
  - Better feedback messaging with color-coded status

**Migration:**
```tsx
// Before
import { InspectDialog } from '@ewjdev/anyclick-react';

// After
import { InspectSimple, InspectDialogManager } from '@ewjdev/anyclick-react';
```
