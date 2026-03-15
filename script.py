import PyPDF2
from pathlib import Path
path = Path(r'c:/Users/desia/Downloads/certificat-ACT-20260314-014002-628 (2).pdf')
reader = PyPDF2.PdfReader(path)
print('pages', len(reader.pages))
for i,page in enumerate(reader.pages):
    text = page.extract_text()
    print('page', i+1, 'length', len(text) if text else 0)
    if text:
        print(text[:500])
