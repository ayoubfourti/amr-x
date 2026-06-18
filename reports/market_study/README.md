# Market Study

Autonomous modular robot market research and analysis for AMR-X platform.

## Contribution Rules

- Add real sources only, no fake citations
- Use `references.bib` for citations
- Keep claims short and sourced
- Use tables for structured research
- One person owns each section
- No fake market data or prices

## Repository Structure

- `main.tex` - Main LaTeX document
- `references.bib` - Bibliography
- `sections/` - Section files (each chapter)
- `tables/` - Data tables (competitors, clients, pricing)
- `figures/` - Diagrams and images
- `build/market_study/market_study.pdf` - Generated PDF output (ignored)

## Target Sectors

- Factories
- Warehouses
- Logistics hubs
- Hospitals
- Hotels
- Universities
- Security operations

## Building PDF

From the repository root:

```bash
bash tools/build_reports.sh
```

Or from this folder, use `latexmk main.tex`. The local `.latexmkrc` sends output to `../../build/market_study/`.

If an editor runs `pdflatex main.tex` directly, it may create `.aux`, `.log`, `.toc`, and `.pdf` files in this folder. Those are ignored build artifacts and should be deleted, not committed.

## Folder Explanation

- **sections/** - Individual chapters for market analysis
- **tables/** - Structured data comparison (competitors, pricing, client segments)
- **figures/** - Charts, graphs, and concept images
- **build/market_study/market_study.pdf** - Built PDF output (ignored)
