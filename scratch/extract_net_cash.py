import csv
import sys

dim_file = r"C:\Users\silva\Downloads\dim_contas_rows all.csv"
ledger_file = r"C:\Users\silva\Downloads\Ledger_all_Rev01.csv"
out_file = r"C:\Users\silva\Downloads\net_cash_transactions.csv"

# 1. Identify Liquid Asset accounts
liquid_codes = set()
try:
    with open(dim_file, 'r', encoding='utf-8', errors='replace') as f:
        # Check delimiter
        first_line = f.readline()
        f.seek(0)
        delim = ';' if ';' in first_line else ','
        reader = csv.DictReader(f, delimiter=delim)
        for row in reader:
            if row.get('subtype') == 'Liquid Assets':
                liquid_codes.add(row.get('code'))
except Exception as e:
    print("Error reading chart of accounts:", e)
    sys.exit(1)

print(f"Found {len(liquid_codes)} Liquid Asset accounts: {liquid_codes}")

# 2. Filter transactions
output_rows = []
try:
    with open(ledger_file, 'r', encoding='utf-8', errors='replace') as f:
        first_line = f.readline()
        f.seek(0)
        delim = ';' if ';' in first_line else ','
        reader = csv.DictReader(f, delimiter=delim)
        fieldnames = reader.fieldnames
        for row in reader:
            source = row.get('source_account', '')
            target = row.get('target_account', '')
            
            # Include if either source or target is a liquid asset
            if source in liquid_codes or target in liquid_codes:
                output_rows.append(row)
except Exception as e:
    print("Error reading ledger:", e)
    sys.exit(1)

# 3. Write output
try:
    with open(out_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=',')
        writer.writeheader()
        writer.writerows(output_rows)
    print(f"Successfully extracted {len(output_rows)} net cash transactions to {out_file}")
except Exception as e:
    print("Error writing output:", e)
