#!/usr/bin/env python3
"""Generate LaTeX tables from controlled CSV source files."""

from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "reports" / "v1_product_definition" / "tables" / "generated"

TABLES = {
    ROOT / "data" / "bom" / "bom_base_v1.csv": "base_bom_table.tex",
    ROOT / "data" / "bom" / "bom_arm_module.csv": "arm_bom_table.tex",
    ROOT / "data" / "components" / "component_candidates.csv": "component_candidates_table.tex",
    ROOT / "data" / "modules" / "module_decision_matrix.csv": "module_decision_matrix_table.tex",
    ROOT / "data" / "modules" / "module_interface_requirements.csv": "module_interface_requirements_table.tex",
    ROOT / "data" / "requirements" / "requirements_matrix.csv": "requirements_matrix_table.tex",
}


def latex_escape(value: str) -> str:
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_\allowbreak{}",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
        "/": r"/\allowbreak{}",
        "-": r"-\allowbreak{}",
    }
    return "".join(replacements.get(char, char) for char in value)


def render_table(csv_path: Path) -> str:
    with csv_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    if not rows:
        return "% Generated table placeholder. Source CSV contains no rows.\nTBD\n"

    headers = list(rows[0].keys())
    first_header = headers[0]
    lines = [
        r"% !TEX root = ../../main.tex",
        f"% Generated from {csv_path.relative_to(ROOT)}. Do not edit manually.",
        r"\small",
        r"\begin{longtable}{>{\raggedright\arraybackslash}p{0.28\textwidth}>{\raggedright\arraybackslash}p{0.62\textwidth}}",
        r"\toprule",
        r"Field & Value \\",
        r"\midrule",
        r"\endhead",
    ]
    for index, row in enumerate(rows, start=1):
        record_id = row.get(first_header) or f"Row {index}"
        lines.extend(
            [
                r"\multicolumn{2}{l}{\textbf{"
                + latex_escape(str(record_id))
                + r"}} \\",
                r"\midrule",
            ]
        )
        for header in headers:
            label = header.replace("_", " ").title()
            lines.append(
                f"{latex_escape(label)} & {latex_escape(row.get(header, ''))} \\\\"
            )
        if index != len(rows):
            lines.append(r"\midrule")
    lines.extend([r"\bottomrule", r"\end{longtable}", r"\normalsize", ""])
    return "\n".join(lines)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for csv_path, output_name in TABLES.items():
        (OUTPUT_DIR / output_name).write_text(render_table(csv_path), encoding="utf-8")


if __name__ == "__main__":
    main()
