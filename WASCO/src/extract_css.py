import os
import re

app_js_path = r'c:\Users\sekho\Desktop\DB Application\wasco\src\App.js'
app_css_path = r'c:\Users\sekho\Desktop\DB Application\wasco\src\App.css'

with open(app_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the style block
style_pattern = r'      <style>{`\n(.*?)      `}</style>\n'
match = re.search(style_pattern, content, re.DOTALL)
if match:
    css_content = match.group(1)
    # Remove leading 8 spaces from each line for better formatting
    css_lines = css_content.split('\n')
    cleaned_css_lines = []
    for line in css_lines:
        if line.startswith('        '):
            cleaned_css_lines.append(line[8:])
        else:
            cleaned_css_lines.append(line)
    
    # Ensure there's no trailing empty line at the beginning
    cleaned_css = '\n'.join(cleaned_css_lines).strip() + '\n'
    
    with open(app_css_path, 'w', encoding='utf-8') as f:
        f.write(cleaned_css)
    
    # Remove style block from App.js
    new_content = content[:match.start()] + content[match.end():]
    
    # Add import './App.css';
    if "import './App.css';" not in new_content:
        new_content = new_content.replace(
            "import React, { useState } from 'react';",
            "import React, { useState } from 'react';\nimport './App.css';"
        )
        
    with open(app_js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Successfully extracted styles to App.css and updated App.js")
else:
    print("Style block not found")
