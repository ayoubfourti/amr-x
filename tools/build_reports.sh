#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build/reports"

python3 "$ROOT_DIR/tools/generate_specs.py"
python3 "$ROOT_DIR/tools/generate_latex_tables.py"

build_report() {
  local report_dir="$1"
  local output_dir="$2"

  mkdir -p "$output_dir"
  (
    cd "$report_dir"
    pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$output_dir" main.tex
    if [ -f "$output_dir/main.aux" ] && [ -f references.bib ]; then
      (
        cd "$output_dir"
        BIBINPUTS="$report_dir:" bibtex main
      )
      pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$output_dir" main.tex
      pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$output_dir" main.tex
    else
      pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$output_dir" main.tex
    fi
  )
}

build_report "$ROOT_DIR/reports/market_study" "$BUILD_DIR/market_study"
build_report "$ROOT_DIR/reports/v1_product_definition" "$BUILD_DIR/v1_product_definition"
