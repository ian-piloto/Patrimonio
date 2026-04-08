import zipfile
import xml.etree.ElementTree as ET
import json

def get_shared_strings(z):
    shared_strings = []
    ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    if 'xl/sharedStrings.xml' in z.namelist():
        ss_xml = z.read('xl/sharedStrings.xml')
        root = ET.fromstring(ss_xml)
        for si in root.findall('ns:si', ns):
            t = si.find('ns:t', ns)
            if t is not None:
                shared_strings.append(t.text)
            else:
                res = []
                for r in si.findall('ns:r', ns):
                    rt = r.find('ns:t', ns)
                    if rt is not None:
                        res.append(rt.text)
                shared_strings.append("".join(res))
    return shared_strings

def read_sheet(z, sheet_name, shared_strings):
    ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    data = []
    sheet_xml = z.read(f'xl/worksheets/{sheet_name}.xml')
    root = ET.fromstring(sheet_xml)
    sheet_data = root.find('ns:sheetData', ns)
    for row in sheet_data.findall('ns:row', ns):
        row_data = {}
        for c in row.findall('ns:c', ns):
            ref = c.get('r')
            col_letter = "".join([char for char in ref if char.isalpha()])
            t = c.get('t')
            v = c.find('ns:v', ns)
            if v is not None:
                val = v.text
                if t == 's':
                    val = shared_strings[int(val)]
                row_data[col_letter] = val
        if row_data:
            data.append(row_data)
    return data

if __name__ == "__main__":
    xlsx_file = r'c:\xampp\htdocs\patrimonio\Patrimonio\patrimonio\patrimonio\Patrimonio BLOCO C1 - BRUNO.xlsx'
    with zipfile.ZipFile(xlsx_file, 'r') as z:
        ss = get_shared_strings(z)
        sheets = {}
        for s in ['sheet1', 'sheet2', 'sheet3']:
            try:
                sheets[s] = read_sheet(z, s, ss)[:50] # 50 rows sample
            except Exception as e:
                sheets[s] = f"Error: {e}"
        
        with open('sheets_sample.json', 'w', encoding='utf-8') as f:
            json.dump(sheets, f, indent=4, ensure_ascii=False)
    print("Sheets sample saved to sheets_sample.json")
