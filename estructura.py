import os

IGNORAR = {
    "venv",
    ".venv",
    "node_modules",
    "__pycache__",
    ".git"
}

for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in IGNORAR]

    nivel = root.count(os.sep)
    sangria = "│   " * nivel
    print(f"{sangria}├── {os.path.basename(root)}")

    for archivo in files:
        print(f"{sangria}│   └── {archivo}")