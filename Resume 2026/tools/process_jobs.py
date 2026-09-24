#!/usr/bin/env python3
"""
Job Search Processor
Loads scored jobs, outputs Excel + CSV, updates exclusion list.
Scoring and industrial relevance tagging done by AI before calling this script.
"""

import json
import csv
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False
    print("WARNING: openpyxl not installed. Excel output disabled.", file=sys.stderr)

# Paths
BASE_DIR = Path(__file__).parent.parent
TMP_DIR = BASE_DIR / ".tmp"
EXCLUSION_FILE = BASE_DIR / "exclusion_urls.json"
OUTPUT_CSV = BASE_DIR / "job_listings_fresh.csv"
OUTPUT_XLSX = BASE_DIR / "job_listings_fresh.xlsx"

# CSV columns
FIELDNAMES = [
    'Rank', 'Title', 'Company', 'Location', 'Work_Type',
    'Distance_km', 'Commute_Estimate', 'Relevancy_Score',
    'Industrial_Relevance', 'Salary', 'URL', 'Platform', 'Reasoning'
]


def load_json(filepath):
    """Load JSON file, return empty list if not found."""
    if not filepath.exists():
        return []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def save_json(filepath, data):
    """Save data to JSON file."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_exclusions():
    """Load exclusion URLs from JSON file."""
    return set(load_json(EXCLUSION_FILE))


def save_exclusions(exclusions):
    """Save exclusion URLs to JSON file."""
    save_json(EXCLUSION_FILE, sorted(list(exclusions)))


def deduplicate_jobs(jobs):
    """Remove duplicates by title+company combo."""
    seen = set()
    unique = []
    for job in jobs:
        key = (job.get('title', '').strip().lower(),
               job.get('company', '').strip().lower())
        if key not in seen:
            seen.add(key)
            unique.append(job)
    return unique


def filter_exclusions(jobs, exclusion_urls):
    """Remove jobs whose URLs are in the exclusion set."""
    return [job for job in jobs if job.get('url', '') not in exclusion_urls]


def clean_company_field(company):
    """Clean noise from company field."""
    if not company:
        return company
    noise_patterns = [
        "Often replies in 1 day",
        "Often replies in 2 days",
        "Often replies in 3 days",
        "Often replies within a day",
    ]
    for noise in noise_patterns:
        if noise in company:
            company = company.replace(noise, "").strip()
    return company


def write_csv(jobs, filepath):
    """Write jobs to CSV file."""
    if not jobs:
        print("No jobs to write to CSV.", file=sys.stderr)
        return

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()

        for i, job in enumerate(jobs, 1):
            writer.writerow({
                'Rank': i,
                'Title': job.get('title', ''),
                'Company': clean_company_field(job.get('company', '')),
                'Location': job.get('location', ''),
                'Work_Type': job.get('work_type', 'Unknown'),
                'Distance_km': job.get('distance_km', ''),
                'Commute_Estimate': job.get('commute_estimate', ''),
                'Relevancy_Score': job.get('score', ''),
                'Industrial_Relevance': job.get('industrial_relevance', 'None detected'),
                'Salary': job.get('salary', ''),
                'URL': job.get('url', ''),
                'Platform': job.get('source', ''),
                'Reasoning': job.get('reasoning', '')
            })

    print(f"CSV written: {len(jobs)} jobs → {filepath}", file=sys.stderr)


def write_excel(jobs, filepath):
    """Write jobs to Excel file with formatting."""
    if not HAS_OPENPYXL:
        print("openpyxl not available. Skipping Excel output.", file=sys.stderr)
        return

    if not jobs:
        print("No jobs to write to Excel.", file=sys.stderr)
        return

    wb = Workbook()
    ws = wb.active
    ws.title = "Job Listings"

    # Header styling
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # Write headers
    for col, header in enumerate(FIELDNAMES, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    # Write data
    for i, job in enumerate(jobs, 1):
        row = i + 1
        values = [
            i,
            job.get('title', ''),
            clean_company_field(job.get('company', '')),
            job.get('location', ''),
            job.get('work_type', 'Unknown'),
            job.get('distance_km', ''),
            job.get('commute_estimate', ''),
            job.get('score', ''),
            job.get('industrial_relevance', 'None detected'),
            job.get('salary', ''),
            job.get('url', ''),
            job.get('source', ''),
            job.get('reasoning', '')
        ]
        for col, value in enumerate(values, 1):
            cell = ws.cell(row=row, column=col, value=value)
            cell.border = thin_border
            cell.alignment = Alignment(vertical="center", wrap_text=True)

        # Color code by score
        score = job.get('score', 0)
        if isinstance(score, (int, float)):
            score_cell = ws.cell(row=row, column=8)  # Column H = Score
            if score >= 80:
                score_cell.fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
            elif score >= 60:
                score_cell.fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
            elif score < 40:
                score_cell.fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")

    # Auto-fit column widths
    column_widths = {
        'A': 6,   # Rank
        'B': 45,  # Title
        'C': 30,  # Company
        'D': 25,  # Location
        'E': 15,  # Work Type
        'F': 12,  # Distance (km)
        'G': 30,  # Commute Estimate
        'H': 12,  # Score
        'I': 30,  # Industrial Relevance
        'J': 20,  # Salary
        'K': 50,  # URL
        'L': 12,  # Platform
        'M': 50,  # Reasoning
    }
    for col_letter, width in column_widths.items():
        ws.column_dimensions[col_letter].width = width

    # Freeze top row
    ws.freeze_panes = "A2"

    # Auto-filter
    ws.auto_filter.ref = ws.dimensions

    wb.save(filepath)
    print(f"Excel written: {len(jobs)} jobs → {filepath}", file=sys.stderr)


def open_file(filepath):
    """Open file with default application (Windows)."""
    if sys.platform == "win32":
        os.startfile(str(filepath))
        print(f"Opened: {filepath}", file=sys.stderr)
    else:
        print(f"Output saved: {filepath}", file=sys.stderr)


def main():
    """Main processing pipeline."""
    print("=" * 50, file=sys.stderr)
    print("Job Search Processor", file=sys.stderr)
    print("=" * 50, file=sys.stderr)

    # Load scored jobs
    scored_file = TMP_DIR / "scored_jobs.json"
    if not scored_file.exists():
        print(f"ERROR: {scored_file} not found.", file=sys.stderr)
        print("Run scoring first (Step 5 in workflow).", file=sys.stderr)
        sys.exit(1)

    scored_data = load_json(scored_file)
    # Handle both list and dict formats
    if isinstance(scored_data, dict):
        scored_jobs = scored_data.get('jobs', [])
    else:
        scored_jobs = scored_data
    print(f"Loaded {len(scored_jobs)} scored jobs", file=sys.stderr)

    # Sort by score descending
    scored_jobs.sort(key=lambda x: x.get('score', 0), reverse=True)

    # Take top 50
    top_jobs = scored_jobs[:50]
    print(f"Top 50 jobs selected", file=sys.stderr)

    # Write CSV
    write_csv(top_jobs, OUTPUT_CSV)

    # Write Excel
    write_excel(top_jobs, OUTPUT_XLSX)

    # Update exclusions
    exclusion_urls = load_exclusions()
    new_urls = {job.get('url', '') for job in top_jobs if job.get('url', '')}
    updated_exclusions = exclusion_urls.union(new_urls)
    save_exclusions(updated_exclusions)
    print(f"Exclusions: {len(exclusion_urls)} → {len(updated_exclusions)} URLs", file=sys.stderr)

    # Auto-open Excel
    if HAS_OPENPYXL and OUTPUT_XLSX.exists():
        open_file(OUTPUT_XLSX)

    print("=" * 50, file=sys.stderr)
    print("Done!", file=sys.stderr)
    print("=" * 50, file=sys.stderr)


if __name__ == "__main__":
    main()
