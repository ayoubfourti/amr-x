#!/usr/bin/env python3
"""Generate LaTeX tables from controlled CSV source files."""

from __future__ import annotations

import csv
import re
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

SOFT_BREAK = "\u0000SOFT_BREAK\u0000"


def add_soft_breaks(value: str) -> str:
    """Allow LaTeX to wrap long tokens inside narrow generated table columns."""

    def split_word(match: re.Match[str]) -> str:
        word = match.group(0)
        return SOFT_BREAK.join(word[index : index + 5] for index in range(0, len(word), 5))

    return re.sub(r"[A-Za-z0-9]{6,}", split_word, value)


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
    chunks = []
    for chunk in add_soft_breaks(value).split(SOFT_BREAK):
        chunks.append("".join(replacements.get(char, char) for char in chunk))
        chunks.append(r"\allowbreak{}")
    chunks.pop()
    return "".join(chunks)


def render_table(csv_path: Path) -> str:
    with csv_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    if not rows:
        return "% Generated table placeholder. Source CSV contains no rows.\nTBD\n"

    headers = list(rows[0].keys())
    column_width = 0.98 / max(len(headers), 1)
    font_size = r"\tiny" if len(headers) > 8 else r"\scriptsize"
    column_spec = "".join(
        [
            rf">{{\raggedright\arraybackslash}}p{{{column_width:.3f}\textwidth}}"
            for _ in headers
        ]
    )
    lines = [
        r"% !TEX root = ../../main.tex",
        f"% Generated from {csv_path.relative_to(ROOT)}. Do not edit manually.",
        r"\begingroup",
        font_size,
        r"\setlength{\tabcolsep}{1pt}",
        r"\setlength{\emergencystretch}{3em}",
        rf"\begin{{longtable}}{{{column_spec}}}",
        r"\toprule",
        " & ".join(latex_escape(header.replace("_", " ").title()) for header in headers)
        + r" \\",
        r"\midrule",
        r"\endhead",
    ]
    for row in rows:
        lines.append(" & ".join(latex_escape(row.get(header, "")) for header in headers) + r" \\")
    lines.extend([r"\bottomrule", r"\end{longtable}", r"\endgroup", ""])
    return "\n".join(lines)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for csv_path, output_name in TABLES.items():
        (OUTPUT_DIR / output_name).write_text(render_table(csv_path), encoding="utf-8")


if __name__ == "__main__":
    main()
