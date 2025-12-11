Adapters buildout

Build out adapters and providers to make it easy to implement Anyclick into all web environments.

Prioritize

- React
- Vue
- Threejs
- R3F

**Adapter ergonomics**

- Standardize something like:
```
interface AnyclickAdapter {
  submit(payload: AnyclickPayload): Promise<{ url?: string }>;
}

```

- And a tiny guide: “Write an adapter in 30 lines” → big draw for OSS contributors.