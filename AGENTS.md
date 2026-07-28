# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## Running the checks

`bun run lint` imports `.nuxt/eslint.config.mjs`, which only exists after a
**dev-mode** prepare - `nuxt.config.ts` registers `@nuxt/eslint` only when
`NODE_ENV === 'development'`. A production `bun run build` removes it. Before
linting a fresh checkout, or after any build, run:

```
NODE_ENV=development bunx nuxt prepare
```

On macOS, `nuxt dev` (and therefore the `bun run test:e2e` web server) can die
with `EMFILE: too many open files, watch` followed by `spawn EBADF`. That is the
FSEvents recursive-watch limit, not the fd limit, so raising `ulimit -n` does not
help. Start it with polling instead:

```
CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=1000 bunx nuxt dev --port <port>
```

## Theming

`app/assets/css/themes.css` is the whole theme system and the only place colours
belong. `:root` holds shared tokens plus documented defaults for every chrome
knob; each `[data-theme="<id>"]` block redefines the same set. `app/stores/session.ts`
owns persistence and `applyTheme()`.

Two rules that the themes depend on:

- Components must consume tokens, never hardcode a colour, radius or shadow.
  A hardcoded value is invisible until a theme needs a different one.
- A new knob must have a `:root` default that reproduces what the existing
  themes already rendered, so adding it changes nothing until a theme opts in.
  Verify by replaying the same scripted session against every theme before and
  after and diffing the frames.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
