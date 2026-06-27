import os
import re

directories = [
    "c:/Users/abhay/Desktop/Rework - Copy/frontend/app",
    "c:/Users/abhay/Desktop/Rework - Copy/frontend/components"
]

replacements = {
    "bg-zinc-950": "bg-background",
    "bg-zinc-900": "bg-muted",
    "bg-zinc-800": "bg-card",
    "border-zinc-800": "border-border",
    "border-zinc-700": "border-border",
    "text-zinc-400": "text-muted-foreground",
    "text-zinc-500": "text-muted-foreground",
    "bg-neutral-950": "bg-background",
    "border-neutral-800": "border-border",
    "text-white": "text-foreground",
    "text-black": "text-primary-foreground",
    "bg-black": "bg-background",
    "text-zinc-300": "text-foreground",
    "bg-transparent text-white": "bg-background text-foreground"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for old, new in replacements.items():
        # we can just string replace because tailwind classes are space separated or quote separated
        # but to avoid partial matches we can use regex boundaries if needed, but string replace is safer if we know exact classes
        new_content = new_content.replace(old, new)

    # Some specific fixes for white/black buttons
    new_content = new_content.replace("bg-white text-primary-foreground", "bg-primary text-primary-foreground")
    new_content = new_content.replace("bg-white", "bg-primary")

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                process_file(os.path.join(root, file))

print("Done")
