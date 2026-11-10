# Routes

File-based routing with TanStack Router. Each `.tsx` file here is a screen; the
router plugin regenerates `routeTree.gen.ts` on `npm run dev` / `npm run build`.

| File | Screen |
| --- | --- |
| `index.tsx` | App launch redirect |
| `welcome.tsx` | Signed-out onboarding |
| `auth.tsx` | Sign in / sign up / email code |
| `_authenticated/route.tsx` | Tab bar shell + sign-in guard |
| `_authenticated/*.tsx` | Train, Advanced, History, Profile, lessons, placement, onboarding |
