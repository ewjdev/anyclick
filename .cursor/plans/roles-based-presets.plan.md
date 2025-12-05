**Role‑based presets**

- You already list roles on the homepage (QA, dev, PM, designer, etc.). anyclick.ewj.dev
- You could expose **presets**:

```
import { createPresetMenu } from '@ewjdev/anyclick-react/presets';

const menu = createPresetMenu('qa'); // or 'pm' | 'designer'

```

- Each preset preconfigures:
  - menu items,
  - default feedback types (bug / UX papercut / feature idea),
  - which context is captured (logs, screenshots, etc).
