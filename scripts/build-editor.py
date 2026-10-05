from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
shell=(root/'editor.html').read_text()
shell=re.sub(r'<script defer src="[^"]+"></script>','',shell)
css='\n'.join((root/'assets'/name).read_text() for name in ['fonts.css','styles.css','editor.css'])
shell=re.sub(r'<link rel="stylesheet" href="[^"]+">','',shell)
shell=shell.replace('</head>','<style>'+css+'</style></head>')
js='\n'.join((root/'assets'/name).read_text() for name in ['tree.js','model.js','markdown.js','export-template.js','export.js','editor.js'])
js=re.sub(r'</script',lambda m:'<\\/script',js,flags=re.IGNORECASE)
shell=shell.replace('</body>','<script>'+js+'</script></body>')
(root/'exercise-editor.html').write_text(shell)
