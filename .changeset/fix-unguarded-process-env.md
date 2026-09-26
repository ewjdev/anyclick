---
"@ewjdev/anyclick-core": patch
---

Guard `process.env.NODE_ENV` access for browser environments without bundler defines. Previously, loading the ESM build via CDN `<script type="module">`, in browser extensions, or with Rollup/esbuild setups that don't replace `process.env.NODE_ENV` would throw `ReferenceError: process is not defined`. The debug logging checks now use a module-level constant with a `typeof process !== "undefined"` guard.
