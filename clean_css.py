import os

css_path = r"c:\Users\Ability-Admin\Desktop\SSD\ChatBot\crypto-trading-app\frontend\src\App.css"

with open(css_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Original lines count: {len(lines)}")

# We want to remove lines 353 to 2228 (inclusive, 1-indexed)
# In 0-indexed lists, these are indices 352 to 2227 (inclusive)
# So we slice out from index 352 to 2228
keep_before = lines[:352]
keep_after = lines[2228:]

print(f"Kept before count: {len(keep_before)}")
print(f"Kept after count: {len(keep_after)}")

# Combine them to see the new indices
new_lines = keep_before + keep_after
print(f"Combined lines count: {len(new_lines)}")

# Now we need to find and replace the media query block in new_lines
media_idx = -1
for idx, line in enumerate(new_lines):
    if "@media (max-width: 900px)" in line:
        if idx + 1 < len(new_lines) and "html, body, #root" in new_lines[idx+1]:
            media_idx = idx
            break

if media_idx != -1:
    print(f"Found media query at index: {media_idx}")
    end_idx = -1
    for idx in range(media_idx, len(new_lines)):
        if "Custom Premium Styles" in new_lines[idx]:
            for j in range(idx - 1, media_idx, -1):
                if "}" in new_lines[j]:
                    end_idx = j + 1
                    break
            break
    
    if end_idx != -1:
        print(f"Found end index: {end_idx}")
        new_media_query = [
            "@media (max-width: 900px) {\n",
            "  .dashboard-wrapper {\n",
            "    flex-direction: column;\n",
            "  }\n",
            "\n",
            "  .trading-layout {\n",
            "    padding: 10px !important;\n",
            "  }\n",
            "}\n",
            "\n"
        ]
        new_lines = new_lines[:media_idx] + new_media_query + new_lines[end_idx:]
        print(f"Final lines count: {len(new_lines)}")
        
        with open(css_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print("CSS cleaned and updated successfully!")
    else:
        print("Error: Could not find closing brace of media query")
else:
    print("Error: Could not find @media (max-width: 900px) in combined CSS")
