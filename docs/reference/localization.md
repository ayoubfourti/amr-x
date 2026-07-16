# Documentation Localization Guide

AMR-X documentation is translated from Markdown source files during the
MkDocs build. Translation does not happen dynamically in the browser, and no
external translation service is called at runtime.

## Current translation coverage

| Content | English | French | German | Arabic |
|---|---|---|---|---|
| Documentation navigation | Available | Translated | Translated | Translated |
| Documentation homepage | Available | Translated | Translated | Translated |
| Technical pages | Available | English fallback | English fallback | English fallback |
| Next.js landing page | Available | Translated | Translated | Translated |

The language selector changes the navigation, theme language, search
configuration, and translated homepage. A technical page remains in English
until a corresponding localized Markdown file is added.

## Source locations

| Responsibility | Source |
|---|---|
| Languages, translated navigation, and fallback behavior | `mkdocs.yml` |
| English documentation homepage | `docs/index.md` |
| French documentation homepage | `docs/index.fr.md` |
| German documentation homepage | `docs/index.de.md` |
| Arabic documentation homepage | `docs/index.ar.md` |
| Documentation translation dependency | `requirements-docs.txt` |
| Next.js website text | `website/lib/i18n.js` |

## File naming convention

English is the canonical source and uses the ordinary `.md` filename.
Translations are stored beside it using a locale suffix:

```text
simulation.md       # English source
simulation.fr.md    # French translation
simulation.de.md    # German translation
simulation.ar.md    # Arabic translation
```

For example, translating `docs/robotics/simulation.md` requires adding:

```text
docs/robotics/simulation.fr.md
docs/robotics/simulation.de.md
docs/robotics/simulation.ar.md
```

MkDocs then generates these routes:

```text
/docs/robotics/simulation/
/docs/fr/robotics/simulation/
/docs/de/robotics/simulation/
/docs/ar/robotics/simulation/
```

## English fallback

The i18n plugin uses:

```yaml
fallback_to_default: true
```

When a localized file is absent, MkDocs publishes the current English source
under the localized route. This keeps every navigation link usable while
translations are added progressively. It does not mean that the page has
already been translated.

## Translation rules

- Translate explanatory prose, headings, captions, table labels, and explicit
  admonition titles.
- Do not translate terminal commands, source code, filenames, repository
  paths, ROS packages, topics, services, actions, message fields, API routes,
  JSON/YAML/XML keys, or configuration values.
- Preserve Markdown structure, anchors, links, image paths, tables, and code
  fence languages.
- Keep technical meaning aligned with the current English source.
- When an English page changes materially, update its translations or remove
  stale localized files so readers receive the current English fallback.
- Arabic prose uses right-to-left layout; code and terminal examples remain
  left-to-right.

## Add or update a translation

1. Locate the canonical English Markdown file.
2. Copy its structure into the appropriate locale-suffixed file.
3. Translate prose without changing technical identifiers.
4. Preview the appropriate locale route.
5. Build all languages in strict mode:

```bash
npm run check:docs
```

For a combined website and documentation check, run:

```bash
npm run check
```

## Required dependencies

Use the repository commands so MkDocs loads the required i18n plugin:

```bash
npm run setup:docs
npm run docs
```

Do not start the documentation with a globally installed `mkdocs` executable.
The repository command verifies the pinned MkDocs, Material, and
`mkdocs-static-i18n` versions before starting.
