from pathlib import Path
path = Path('resources/js/Pages/Pasteur/Liturgie/Index.jsx')
lines = path.read_text().splitlines()
start = None
end = None
for i, line in enumerate(lines):
    if '                    {activeTab === "formations" && (' in line:
        start = i
        break
if start is None:
    raise SystemExit('start marker not found')
for j in range(start + 1, len(lines)):
    if '                    {activeTab === "annonces" && (' in lines[j]:
        end = j
        break
if end is None:
    raise SystemExit('end marker not found')
new_lines = lines[:start] + lines[end:]
path.write_text("\n".join(new_lines) + "\n")
