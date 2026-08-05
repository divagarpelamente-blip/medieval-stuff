import csv
import sys
import uuid

file_in = r"C:\Users\silva\Downloads\july_reconciliation_upload.csv"
file_out = r"C:\Users\silva\Downloads\july_reconciliation_upload.csv"

output_rows = []
try:
    with open(file_in, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter=',')
        fieldnames = reader.fieldnames
        for row in reader:
            if not row.get('id'):
                row['id'] = str(uuid.uuid4())
            output_rows.append(row)
except Exception as e:
    print("Error:", e)
    sys.exit(1)

try:
    with open(file_out, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=',')
        writer.writeheader()
        writer.writerows(output_rows)
    print(f"Successfully fixed {len(output_rows)} rows in {file_out}")
except Exception as e:
    print("Error:", e)
