#!/usr/bin/env python3
import os
import re

collections_dir = '/home/wencxx/printify/imports/api/collections'

print("Checking for missing commas after regEx properties...")

files_to_check = [f for f in os.listdir(collections_dir) if f.endswith('.js') and f != 'index.js']

issues_found = False

for filename in files_to_check:
    filepath = os.path.join(collections_dir, filename)
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines, 1):
        # Check if line contains regEx but doesn't end with comma
        if 'regEx:' in line and line.strip().endswith('Id') or line.strip().endswith('Email') or line.strip().endswith('Url'):
            # Check next line to see if it should have a comma
            if i < len(lines):
                next_line = lines[i].strip()
                if next_line and not next_line.startswith('//') and not next_line.startswith('}'):
                    print(f"⚠️  {filename}:{i} - Missing comma after regEx")
                    print(f"    {line.rstrip()}")
                    issues_found = True

if not issues_found:
    print("✓ No issues found!")
else:
    print("\nPlease fix the issues above manually.")
