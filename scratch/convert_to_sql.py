import csv
import sys
import re

file_in = r"C:\Users\silva\Downloads\july_reconciliation.csv"
file_out = r"C:\Users\silva\Downloads\july_reconciliation_insert.sql"

def enforce_strict_datetime(d_str):
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

def escape_sql(val):
    if val is None:
        return "NULL"
    # Escape single quotes
    val = str(val).replace("'", "''")
    return f"'{val}'"

sql_statements = []

try:
    with open(file_in, 'r', encoding='utf-8', errors='replace') as f:
        first_line = f.readline()
        f.seek(0)
        delim = ';' if ';' in first_line else ','
        
        reader = csv.DictReader(f, delimiter=delim)
        
        for row in reader:
            created_at = enforce_strict_datetime(row.get('created_at', ''))
            value_date = enforce_strict_datetime(row.get('value_date', ''))
            posting_date = enforce_strict_datetime(row.get('posting_date', ''))
            payment_date = enforce_strict_datetime(row.get('payment_date', ''))
            amount = format_decimal(row.get('amount', '0'))
            
            profile_id = row.get('profile_id', '')
            year = row.get('year', '')
            target_account = row.get('target_account', '')
            source_account = row.get('source_account', '')
            flow = row.get('flow', '')
            payment_status = row.get('payment_status', '')
            month = row.get('month', '')
            quarter = row.get('quarter', '')
            typ = row.get('type', 'Unknown')
            subtype = row.get('subtype', 'Unknown')
            entity = row.get('entity', 'Unknown')
            category = row.get('category', 'Unknown')
            origin = row.get('origin', '')
            description = row.get('description', '')
            
            # We omit the 'id' column so that Postgres generates it automatically
            columns = [
                "profile_id", "created_at", "value_date", "posting_date", 
                "payment_date", "year", "amount", "target_account", 
                "source_account", "flow", "payment_status", "month", 
                "quarter", "type", "subtype", "entity", "category", 
                "origin", "description"
            ]
            
            values = [
                escape_sql(profile_id), 
                escape_sql(created_at), 
                escape_sql(value_date), 
                escape_sql(posting_date),
                escape_sql(payment_date),
                escape_sql(year),
                amount, # Numeric doesn't need quotes usually, but we can quote or not. We'll leave unquoted.
                escape_sql(target_account),
                escape_sql(source_account),
                escape_sql(flow),
                escape_sql(payment_status),
                escape_sql(month),
                escape_sql(quarter),
                escape_sql(typ),
                escape_sql(subtype),
                escape_sql(entity),
                escape_sql(category),
                escape_sql(origin),
                escape_sql(description)
            ]
            
            sql = f"INSERT INTO public.ledger ({', '.join(columns)}) VALUES ({', '.join(values)});"
            sql_statements.append(sql)
            
except Exception as e:
    print("Error loading ledger:", e)
    sys.exit(1)

try:
    with open(file_out, 'w', encoding='utf-8') as f:
        f.write("-- SQL Insert script for july_reconciliation transactions\n")
        f.write("-- Note: The 'id' column is intentionally omitted to allow Supabase to auto-generate UUIDs\n\n")
        f.write("\n".join(sql_statements))
        f.write("\n")
    print(f"Successfully generated {len(sql_statements)} SQL INSERT statements in {file_out}")
except Exception as e:
    print("Error writing SQL file:", e)
