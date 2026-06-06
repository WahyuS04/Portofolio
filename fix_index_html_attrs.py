from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
text = re.sub(r"\s*data-i18n-(?:id|en|placeholder-id|placeholder-en)=(?:\"[^\"]*\"|'[^']*')", '', text)
text = re.sub(r"\s*(?:download|crossorigin)=(?:\"None\"|'None')", '', text)
path.write_text(text, encoding='utf-8')
print('cleaned index.html')
