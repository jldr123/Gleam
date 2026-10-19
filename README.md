# Gleam

A few quiet minutes each evening to notice what was good today. Three gratitudes, one guided question, and a mood with a sentence, then a gentle record of it all over time.

Requirements: [Gleam: Requirements](https://claude.ai/code/artifact/60299fc3-d26a-49ba-9947-78c4f128137b)

## Stack

React 19, TypeScript, Vite, Tailwind 4, Zustand (persisted to localStorage), Framer Motion, and `vite-plugin-pwa`. Deployed on Vercel.

## Develop

```sh
npm install
npm run dev     # http://localhost:5173, also on your network for phone testing
npm test
npm run build
```

## Testing on iPhone

Open the Vercel URL in Safari, tap Share, then Add to Home Screen. Entries live only on that device.

Settings has prototype tools: shift the clock by a day, add 40 demo nights, or erase everything.
