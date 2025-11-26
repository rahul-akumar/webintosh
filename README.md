# Webintosh (Nuxt 4)

A retro-inspired web desktop built with Nuxt 4, Vue 3, Pinia, Tailwind CSS, and @nuxt/ui. Deployed to GitHub Pages (SSG) with PR preview deployments.

## Setup

Install dependencies:

```bash
bun install
```

## Development

Start the dev server at http://localhost:3000:

```bash
bun run dev
```

## Production

Build the application for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

## Analytics (Google Analytics)

GA is enabled only in production via `nuxt-gtag` when `NUXT_PUBLIC_GTAG_ID` is set.
Set this environment variable in your local shell or CI/CD (GitHub Actions):

```bash
# PowerShell (Windows)
$env:NUXT_PUBLIC_GTAG_ID = "G-XXXXXXX"

# Bash
export NUXT_PUBLIC_GTAG_ID="G-XXXXXXX"
```

## CI

- Deploys to GitHub Pages on push to `main`/`master`.
- PR previews build to `gh-pages` under `/webintosh/pr-<number>/`.
- A CI workflow runs typechecking and (optionally) linting/tests. Linting runs only if an ESLint config exists; tests run only if a Vitest config/tests exist.

## License

MIT
