import zipfile
import xml.etree.ElementTree as ET
import json
import os

def read_xlsx(file_path):
    ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    data = []
    shared_strings = []
    
    with zipfile.ZipFile(file_path, 'r') as z:
        # Read shared strings
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_xml = z.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_xml)
            for si in root.findall('ns:si', ns):
                t = si.find('ns:t', ns)
                if t is not None:
                    shared_strings.append(t.text)
                else:
                    # Handle rich text strings (r)
                    res = []
                    for r in si.findall('ns:r', ns):
                        rt = r.find('ns:t', ns)
                        if rt is not None:
                            res.append(rt.text)
                    shared_strings.append("".join(res))

        # Read sheet1
        sheet_xml = z.read('xl/worksheets/sheet1.xml')
        root = ET.fromstring(sheet_xml)
        
        sheet_data = root.find('ns:sheetData', ns)
        for row in sheet_data.findall('ns:row', ns):
            row_data = {}
            for c in row.findall('ns:c', ns):
                ref = c.get('r') # e.g., A1, B1
                col_letter = "".join([char for char in ref if char.isalpha()])
                t = c.get('t') # cell type
                v = c.find('ns:v', ns)
                if v is not None:
                    val = v.text
                    if t == 's': # shared string
                        val = shared_strings[int(val)]
                    row_data[col_letter] = val
            data.append(row_data)
    return data

if __name__ == "__main__":
    xlsx_file = r'c:\xampp\htdocs\patrimonio\Patrimonio\patrimonio\patrimonio\Patrimonio BLOCO C1 - BRUNO.xlsx'
    try:
        results = read_xlsx(xlsx_file)
        # Store first 100 rows for analysis
        with open('excel_data.json', 'w', encoding='utf-8') as f:
            json.dump(results[:100], f, indent=4, ensure_ascii=False)
        print(f"Successfully read {len(results)} rows. Sample saved to excel_data.json")
    except Exception as e:
        print(f"Error: {e}")
