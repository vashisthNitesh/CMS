import re

with open('/Users/nitesh/Downloads/Bigfoot Tracker.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add CSS for export button inside <style>
css_btn = """
    .export-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 14px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: all 0.2s;
    }
    .export-btn:hover {
      background: var(--surface);
      border-color: var(--border2);
      transform: translateY(-1px);
    }
"""
text = text.replace('/* ── ANIMATIONS ── */', css_btn + '\n    /* ── ANIMATIONS ── */')

# 2. Add Export Button
btn_html = """
        <button id="export-btn" class="export-btn" onclick="exportData()" title="Export to Excel">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export XLS
        </button>
        <span class="header-date"
"""
text = text.replace('<span class="header-date"', btn_html)

# 3. Add JS Function before </body>
js_code = """
  <script>
    function exportData() {
      let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
      html += '<head><meta charset="UTF-8"></head><body>';
      html += '<table border="1" style="font-family: sans-serif; font-size: 11pt; border-collapse: collapse;">';
      
      // KPI Section
      html += '<tr><th colspan="2" style="background:#0d1424; color:#fff; font-size:14pt; padding:10px;">Project KPIs</th></tr>';
      html += '<tr><td style="font-weight:bold;">MSA Allocated</td><td>150</td></tr>';
      html += '<tr><td style="font-weight:bold;">Total Logged Hours</td><td>1,552</td></tr>';
      html += '<tr><td style="font-weight:bold;">Budget Overrun</td><td>934% (1,402 hrs over MSA)</td></tr>';
      html += '<tr><td style="font-weight:bold;">Departments Active</td><td>4 (Haulage, Medicare, Distribution, HQ)</td></tr>';
      
      // Effort Breakdown
      html += '<tr><td colspan="2"></td></tr>';
      html += '<tr><th colspan="2" style="background:#0d1424; color:#fff; font-size:14pt; padding:10px;">Effort Breakdown (Logged Hours)</th></tr>';
      html += '<tr><td style="font-weight:bold;">Haulage, HQ Transport</td><td>438 hrs (350 core + 88 post-production)</td></tr>';
      html += '<tr><td style="font-weight:bold;">Medicare</td><td>530 hrs</td></tr>';
      html += '<tr><td style="font-weight:bold;">Distribution</td><td>460 hrs</td></tr>';
      html += '<tr><td style="font-weight:bold;">Dashboard</td><td>48 hrs</td></tr>';
      html += '<tr><td style="font-weight:bold;">Integrations</td><td>108 hrs (Email, HRMS, NetSuite, GPS)</td></tr>';
      
      // Timelines & Phases - Extracting from DOM
      html += '<tr><td colspan="4"></td></tr>';
      html += '<tr><th colspan="4" style="background:#0d1424; color:#fff; font-size:14pt; padding:10px;">Department Timelines & Integrations</th></tr>';
      html += '<tr><th style="background:#efefef; font-weight:bold; padding:5px;">Category</th><th style="background:#efefef; font-weight:bold; padding:5px;">Phase</th><th style="background:#efefef; font-weight:bold; padding:5px;">Date</th><th style="background:#efefef; font-weight:bold; padding:5px;">Status/Notes</th></tr>';
      
      const cards = document.querySelectorAll('details.dept-card');
      cards.forEach(card => {
        let deptName = card.querySelector('.dept-name, .dept-name-wrap, summary').innerText;
        deptName = deptName.replace(/[\\r\\n▾]+/g, ' ').trim();
        
        const rows = card.querySelectorAll('.phase-row');
        rows.forEach(row => {
          const phaseName = row.querySelector('.phase-name')?.innerText.trim() || '';
          const phaseDates = row.querySelector('.phase-dates')?.innerText.trim() || '';
          const phaseNote = row.querySelector('.phase-note')?.innerText.trim() || '';
          const statusElem = row.querySelector('.phase-status');
          let status = '';
          if(statusElem) {
            if(statusElem.classList.contains('status-done')) status = 'Completed';
            else if(statusElem.classList.contains('status-active')) status = 'Active/In-Progress';
            else status = 'Pending';
          }
          let noteFinal = status;
          if(phaseNote) noteFinal += ' - ' + phaseNote;
          
          html += `<tr>
            <td style="padding:5px;">${deptName}</td>
            <td style="padding:5px;">${phaseName}</td>
            <td style="padding:5px;">${phaseDates}</td>
            <td style="padding:5px;">${noteFinal}</td>
          </tr>`;
        });
      });
      
      html += '</table></body></html>';
      
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bigfoot_Project_Status.xls';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  </script>
</body>
"""
text = text.replace('</body>', js_code)

with open('/Users/nitesh/Downloads/Bigfoot Tracker.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Export functionality added")
