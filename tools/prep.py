# %%
import pandas as pd
import json

# %%
d = pd.read_excel('../01_vakcinace_dle_obci_210724.xlsx', skiprows=2)
# %%
d
# %%
kat = [
    '16+',
    '60+',
    '50-59',
    '30-49',
    '16-29',
    'do 16'
]
# %%
d = d.to_dict(orient='index').values()
# %%
out = []
for row in d:
    if row['Kraj'] == 'CELKEM':
        continue
    out.append([
        row['ObecKod'],
        row['Obec'],
        row['populace'],
        row['populace'] - row['neočkovaní'],
        row['populace.1'],
        row['populace.1'] - row['neočkovaní.1'],
        row['populace.2'],
        row['populace.2'] - row['neočkovaní.2'],
        row['populace.3'],
        row['populace.3'] - row['neočkovaní.3'],
        row['populace.4'],
        row['populace.4'] - row['neočkovaní.4'],
        row['populace.5'],
        row['populace.5'] - row['neočkovaní.5'],
    ])

# %%
with open('../data.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(out, ensure_ascii=False))
# %%
out
