import zipfile
import xml.etree.ElementTree as ET
import json
import os

def read_xlsx_sheet3(file_path):
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
                    res = []
                    for r in si.findall('ns:r', ns):
                        rt = r.find('ns:t', ns)
                        if rt is not None:
                            res.append(rt.text)
                    shared_strings.append("".join(res))

        # Read sheet3
        sheet_xml = z.read('xl/worksheets/sheet3.xml')
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
    try:
        results = read_xlsx_sheet3(xlsx_file)
        with open('excel_full.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=4, ensure_ascii=False)
        print(f"Successfully extracted {len(results)} rows from sheet3.")
    except Exception as e:
        print(f"Error: {e}")
