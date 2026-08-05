import csv
import sys
import re

file_in = r"C:\Users\silva\Downloads\july_reconciliation.csv"
file_out = r"C:\Users\silva\Downloads\july_reconciliation_upload.csv"

def enforce_strict_date(d_str):
    if not d_str: return ''
    d_str = d_str.strip().replace('/', '-')
    match = re.search(r'(\d{4}-\d{2}-\d{2})', d_str)
    if match: return f"{match.group(1)} 01:01:01"
    match = re.search(r'(\d{2})[-/](\d{2})[-/](\d{4})', d_str)
    if match:
        d, m, y = match.groups()
        return f"{y}-{m}-{d} 01:01:01"
    return d_str

def format_decimal(val_str):
    if not val_str: return '0.00'
    val_str = val_str.replace(',', '.')
    try: return f"{float(val_str):.2f}"
    except: return val_str

output_rows = []
try:
    with open(file_in, 'r', encoding='utf-8', errors='replace') as f:
        # User saved from Excel in Portugal, so the delimiter became ';'
        reader = csv.DictReader(f, delimiter=';')
        
        # If it happens to be comma separated anyway, we can fallback, but we saw semicolons in the header
        fieldnames = reader.fieldnames
        if fieldnames and len(fieldnames) == 1 and ';' not in fieldnames[0]:
            f.seek(0)
            reader = csv.DictReader(f, delimiter=',')
            fieldnames = reader.fieldnames

        for row in reader:
            row['id'] = ''
            row['created_at'] = enforce_strict_date(row.get('created_at', ''))
            row['value_date'] = enforce_strict_date(row.get('value_date', ''))
            row['posting_date'] = enforce_strict_date(row.get('posting_date', ''))
            row['payment_date'] = enforce_strict_date(row.get('payment_date', ''))
            row['amount'] = format_decimal(row.get('amount', '0'))
            
            output_rows.append(row)
except Exception as e:
    print("Error loading ledger:", e)
    sys.exit(1)

try:
    with open(file_out, 'w', newline='', encoding='utf-8') as f:
        # Write out with standard comma delimiter for Supabase
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=',')
        writer.writeheader()
        writer.writerows(output_rows)
    print(f"Successfully wrote {len(output_rows)} rows to {file_out}")
except Exception as e:
    print("Error writing ledger:", e)
