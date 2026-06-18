# V1 Product Definition Dossier

This folder contains the final AMR-X V1 Product Definition Dossier in LaTeX.

## Source Files

- `main.tex` - Main LaTeX document.
- `sections/` - Report section files.
- `sections/modules/` - Module-specific report sections.
- `tables/generated/` - Generated LaTeX tables from `config/` and `data/`.

## Building PDF

From the repository root:

```bash
bash tools/build_reports.sh
```

Or from this folder, use `latexmk main.tex`. The local `.latexmkrc` sends output to `../../build/v1_product_definition/`.

If an editor runs `pdflatex main.tex` directly, it may create `.aux`, `.log`, `.toc`, and `.pdf` files in this folder. Those are ignored build artifacts and should be deleted, not committed.

## Rules

- Do not manually edit `tables/generated/`.
- Edit source CSV files under `data/` and regenerate tables.
- Use `TBD` for undecided values.
