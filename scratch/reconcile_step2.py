import csv
import sys
import datetime
import re

profile_id = 'd8bd5b93-4bd8-4077-863e-8a28f9ab3b6e'

dim_file = r"C:\Users\silva\Downloads\dim_contas_rows all.csv"
cc_file = r"C:\Users\silva\Downloads\CGD Cartao Credito Extracto Julho.csv"
chk_file = r"C:\Users\silva\Downloads\CGD Ordem Extracto Julho.csv"
out_file = r"C:\Users\silva\Downloads\july_reconciliation.csv"

accounts = []
try:
    with open(dim_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            accounts.append(row)
except Exception as e:
    print("Error loading chart of accounts:", e)
    sys.exit(1)

def get_exact_account(code):
    for acc in accounts:
        if acc['code'] == code:
            return acc
    return None

def get_month_str(date_str):
    if not date_str: return ''
    try:
        date_str = date_str.replace('/', '-')
        m = int(date_str.split('-')[1])
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        return months[m-1]
    except:
        return ''

def get_quarter(date_str):
    if not date_str: return ''
    try:
        date_str = date_str.replace('/', '-')
        m = int(date_str.split('-')[1])
        if m <= 3: return 'Q1'
        if m <= 6: return 'Q2'
        if m <= 9: return 'Q3'
        return 'Q4'
    except:
        return ''

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

def extract_year(d_str):
    if not d_str: return ''
    d_str = d_str.strip().replace('/', '-')
    match = re.search(r'(\d{4})-\d{2}-\d{2}', d_str)
    if match: return match.group(1)
    match = re.search(r'\d{2}-\d{2}-(\d{4})', d_str)
    if match: return match.group(1)
    return ''

def format_decimal(val_str):
    if not val_str: return 0.0
    val_str = val_str.replace('.', '').replace(',', '.')
    try: return float(val_str)
    except: return 0.0

output_rows = []

chk_account = get_exact_account('11010001') # Checking Accounts CGD
cc_account = get_exact_account('21010001') # Credit Cards CGD

if not chk_account: chk_account = {'code': 'Unknown'}
if not cc_account: cc_account = {'code': 'Unknown'}

current_time_str = enforce_strict_date(datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%d'))

# Process Credit Card
try:
    with open(cc_file, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
    for line in lines:
        parts = line.strip().split(';')
        if len(parts) >= 6:
            data_mov = parts[0].strip()
            data_valor = parts[1].strip()
            desc = parts[2].strip()
            debito_str = parts[3]
            credito_str = parts[4]
            
            if not data_mov or data_mov == 'Data' or data_mov.startswith('Conta') or data_mov.startswith('Cart'):
                continue
            if data_mov == '31-07-2026' and not desc: continue
            if desc == 'Totais' or desc == '': continue
                
            amount = 0.0
            flow = 'outflow'
            source = cc_account['code']
            
            debito = format_decimal(debito_str)
            credito = format_decimal(credito_str)
            
            if debito > 0:
                amount = debito
                flow = 'outflow'
            elif credito > 0:
                amount = credito
                flow = 'inflow'
                
            matched_acc = None
            if 'GASOLINEIRAS' in desc: matched_acc = get_exact_account('63010001')
            elif 'A.S.OEIRAS' in desc: matched_acc = get_exact_account('63010001')
            elif 'IMPOSTO' in desc: matched_acc = get_exact_account('69020001')
            elif 'CBD' in desc: matched_acc = get_exact_account('64020001')
            elif 'PAGAMENTO AUTOMATICO' in desc:
                source = chk_account['code']
                matched_acc = get_exact_account('21010001')
                flow = 'transfer'
            
            if matched_acc:
                target = matched_acc['code']
                typ = matched_acc['type']
                subtype = matched_acc['subtype']
                category = matched_acc['category']
                entity = matched_acc['entity']
            else:
                target = 'Unknown'
                typ = 'Unknown'
                subtype = 'Unknown'
                category = 'Unknown'
                entity = 'Unknown'
            
            d_format = enforce_strict_date(data_mov)
            if not d_format: continue
            v_format = enforce_strict_date(data_valor)
            
            output_rows.append({
                'id': '',
                'profile_id': profile_id,
                'created_at': current_time_str,
                'value_date': v_format,
                'posting_date': d_format,
                'payment_date': d_format,
                'year': extract_year(data_mov),
                'amount': f"{amount:.2f}",
                'target_account': target,
                'source_account': source,
                'flow': flow,
                'payment_status': 'Completed',
                'month': get_month_str(data_mov),
                'quarter': get_quarter(data_mov),
                'type': typ,
                'subtype': subtype,
                'entity': entity,
                'category': category,
                'origin': 'Pedro',
                'description': desc
            })
except Exception as e:
    print("CC Error:", e)

# Process Checking Account
try:
    with open(chk_file, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
    for line in lines:
        parts = line.strip().split(';')
        if len(parts) >= 8:
            data_mov = parts[0].strip()
            data_valor = parts[1].strip()
            desc = parts[2].strip()
            debito_str = parts[3]
            credito_str = parts[4]
            
            if not data_mov or data_mov == 'Data mov.' or data_mov.startswith('Conta'):
                continue
                
            amount = 0.0
            flow = 'outflow'
            source = chk_account['code']
            
            debito = format_decimal(debito_str)
            credito = format_decimal(credito_str)
            
            is_income = False
            if debito > 0:
                amount = debito
                flow = 'outflow'
            elif credito > 0:
                amount = credito
                flow = 'inflow'
                is_income = True
                
            matched_acc = None
            
            if 'C CLASSIC' in desc:
                matched_acc = get_exact_account('21010001')
                flow = 'transfer'
            elif 'Organon' in desc:
                matched_acc = get_exact_account('71010001')
            elif 'Pedro Silva' in desc and amount == 710.12:
                matched_acc = get_exact_account('61010001')
            elif 'BP DUARTE' in desc or 'CEPSA' in desc:
                matched_acc = get_exact_account('63010001')
            elif 'VIA VERDE' in desc:
                matched_acc = get_exact_account('63010002')
            elif 'ENDESA' in desc:
                matched_acc = get_exact_account('61010002')
            elif 'FARMACIA' in desc or 'WELLS' in desc or 'CBD' in desc:
                matched_acc = get_exact_account('64020001')
            elif 'SKRILL' in desc:
                matched_acc = get_exact_account('66040001')
            elif 'GOOGLE' in desc:
                matched_acc = get_exact_account('66030002')
            elif 'MANUT CONTA' in desc:
                matched_acc = get_exact_account('69020001')
            elif 'UNIVERSO' in desc:
                matched_acc = get_exact_account('21010002')
                flow = 'transfer'
            elif 'Trf Mbway' in desc:
                if is_income:
                    matched_acc = get_exact_account('11010001')
                else:
                    matched_acc = get_exact_account('69040001')
            
            if not matched_acc:
                target = 'Unknown'
                typ = 'Unknown'
                subtype = 'Unknown'
                category = 'Unknown'
                entity = 'Unknown'
                if is_income:
                    target = chk_account['code']
                    source = 'Unknown'
            else:
                if is_income and flow != 'transfer':
                    source = matched_acc['code']
                    target = chk_account['code']
                else:
                    target = matched_acc['code']
                typ = matched_acc['type']
                subtype = matched_acc['subtype']
                category = matched_acc['category']
                entity = matched_acc['entity']
            
            d_format = enforce_strict_date(data_mov)
            if not d_format: continue
            v_format = enforce_strict_date(data_valor)
            
            output_rows.append({
                'id': '',
                'profile_id': profile_id,
                'created_at': current_time_str,
                'value_date': v_format,
                'posting_date': d_format,
                'payment_date': d_format,
                'year': extract_year(data_mov),
                'amount': f"{amount:.2f}",
                'target_account': target,
                'source_account': source,
                'flow': flow,
                'payment_status': 'Completed',
                'month': get_month_str(data_mov),
                'quarter': get_quarter(data_mov),
                'type': typ,
                'subtype': subtype,
                'entity': entity,
                'category': category,
                'origin': 'Pedro',
                'description': desc
            })
except Exception as e:
    print("Chk Error:", e)

fieldnames = ['id','profile_id','created_at','value_date','posting_date','payment_date','year','amount','target_account','source_account','flow','payment_status','month','quarter','type','subtype','entity','category','origin','description']

with open(out_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(output_rows)

print("Done. Total output rows:", len(output_rows))
