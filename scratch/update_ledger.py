import csv
import sys
import re

dim_file = r"C:\Users\silva\Downloads\dim_contas_rows all.csv"
ledger_in = r"C:\Users\silva\Downloads\Ledger_all_.csv"
ledger_out = r"C:\Users\silva\Downloads\Ledger_all_Rev01.csv"

accounts = {}
try:
    with open(dim_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            accounts[row['code']] = row
except Exception as e:
    print("Error loading chart of accounts:", e)
    sys.exit(1)

def enforce_strict_date(d_str):
    if not d_str: return ''
    d_str = d_str.strip()
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
    with open(ledger_in, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            row['id'] = ''
            
            row['created_at'] = enforce_strict_date(row.get('created_at', ''))
            row['value_date'] = enforce_strict_date(row.get('value_date', ''))
            row['posting_date'] = enforce_strict_date(row.get('posting_date', ''))
            row['payment_date'] = enforce_strict_date(row.get('payment_date', ''))
            row['amount'] = format_decimal(row.get('amount', '0'))
            
            target_code = row.get('target_account', '').strip()
            source_code = row.get('source_account', '').strip()
            flow = row.get('flow', '').strip()
            
            class_code = target_code
            if flow == 'inflow' and source_code.startswith('7'): class_code = source_code
            elif flow == 'inflow' and source_code.startswith('4'): class_code = source_code
            elif flow == 'inflow' and target_code.startswith('1') and not source_code.startswith('1'): class_code = source_code
                
            if target_code.startswith('6') or target_code.startswith('7'): class_code = target_code
            if source_code.startswith('6') or source_code.startswith('7'): class_code = source_code
                
            if class_code in accounts:
                acc = accounts[class_code]
                row['type'] = acc.get('type', 'Unknown')
                row['subtype'] = acc.get('subtype', 'Unknown')
                row['category'] = acc.get('category', 'Unknown')
                row['entity'] = acc.get('entity', 'Unknown')
            else:
                row['type'] = 'Unknown'
                row['subtype'] = 'Unknown'
                row['category'] = 'Unknown'
                row['entity'] = 'Unknown'

            output_rows.append(row)
except Exception as e:
    print("Error loading ledger:", e)
    sys.exit(1)

try:
    with open(ledger_out, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)
    print(f"Successfully wrote {len(output_rows)} rows to {ledger_out}")
except Exception as e:
    print("Error writing ledger:", e)
