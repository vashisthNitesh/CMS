import re

with open('/Users/nitesh/Downloads/Bigfoot Tracker.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. replace `<div class="dept-card" onclick="toggleCard(this)">`
# To find the matching `</div>`, we can find the start of `class="dept-card"`, then do a simple balanced bracket check or just rely on indentation (it's 8 spaces).
# Actually, since it's exactly 8 spaces indented `</div>`, we can replace `<div class="dept-card" onclick="toggleCard(this)">` with `<details class="dept-card">`
# and we can find the closing `</div>` by looking for `</div>\n\n        <!-- ` or `</div>\n\n      </div>`
# Let's just use regular expressions carefully.

# Better: use re to find all dept-card starts, and since we know we want to replace `<div class="dept-card-header">` with `<summary class="dept-card-header">` and its matching `</div>` with `</summary>`.

text = text.replace('<div class="dept-card" onclick="toggleCard(this)">', '<details class="dept-card">')

# Replace the closing div of dept-card-header
text = text.replace('<div class="dept-card-header">\n', '<summary class="dept-card-header">\n')
text = re.sub(r'(<summary class="dept-card-header">.*?)\n\s+</div>', r'\1\n          </summary>', text, flags=re.DOTALL)

# But distinguishing the `</div>` of dept-card-header is easy: it is right before `<div class="dept-phase-list">`.
# So let's replace `</div>\n          <div class="dept-phase-list">` with `</summary>\n          <div class="dept-phase-list">`
text = text.replace('          </div>\n          <div class="dept-phase-list">', '          </summary>\n          <div class="dept-phase-list">')

# Wait, the start of summary is:
text = text.replace('<div class="dept-card-header">', '<summary class="dept-card-header">')

# For the closing `</details>`, it occurs right before a blank line or `</div>` of the parent grid.
text = text.replace('          </div>\n        </div>\n\n        <!--', '          </div>\n        </details>\n\n        <!--')
# And the last one in the section:
text = text.replace('          </div>\n        </div>\n\n      </div>', '          </div>\n        </details>\n\n      </div>')

# Now CSS modifications
css_additions = """
    details { display: block; }
    summary { display: block; list-style: none; }
    summary::-webkit-details-marker { display: none; }
"""
text = text.replace('    .dept-card.open .toggle-btn {', css_additions + '    details.dept-card[open] .toggle-btn {')
text = text.replace('.dept-card.open .dept-phase-list {', 'details.dept-card[open] .dept-phase-list {')

# For animation, we can add a visual open animation since details doesn't natively animate max-height smoothly without the `name` attribute or a bit of hack, but users are fine with instant. We will just use it as is.
# We also should remove scripts to ensure no errors.
text = re.sub(r'<script>.*?</script>', '', text, flags=re.DOTALL)

with open('/Users/nitesh/Downloads/Bigfoot Tracker.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
