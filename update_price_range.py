#!/usr/bin/env python
"""
Script to update all occurrences of price_range to price_level in Python test files.
"""
import os
import re
import sys

def update_price_range_to_level(file_path):
    """Update price_range to price_level in a file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace in model instantiations
    content = re.sub(r'price_range\s*=\s*(["\']?\d+["\']?)', r'price_level=\1', content)
    
    # Replace in field names
    content = re.sub(r'price_range', r'price_level', content)
    
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

def main():
    """Main function to scan and update files."""
    test_dir = 'core/tests'
    
    # Ensure the test directory exists
    if not os.path.isdir(test_dir):
        print(f"Error: Directory {test_dir} not found.")
        sys.exit(1)
    
    # Find all Python files in the test directory
    for root, _, files in os.walk(test_dir):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                print(f"Processing: {file_path}")
                update_price_range_to_level(file_path)
    
    print("Done! All files processed.")

if __name__ == "__main__":
    main() 