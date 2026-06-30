---
"@viz-cx/api": patch
---

Generate the exported `VERSION` constant from `package.json` at build time so it can no longer drift from the published package version (it was stuck at `0.1.0`). Also correct the package `author` and `LICENSE` copyright contact email.
