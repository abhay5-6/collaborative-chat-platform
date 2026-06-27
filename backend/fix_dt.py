import os
d = 'app/models'
for f in os.listdir(d):
    if f.endswith('.py'):
        p = os.path.join(d, f)
        with open(p, 'r', encoding='utf8') as file:
            content = file.read()
        content = content.replace('lambda: datetime.now(timezone.utc)', 'datetime.utcnow')
        with open(p, 'w', encoding='utf8') as file:
            file.write(content)
