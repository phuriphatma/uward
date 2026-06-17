/* Main app logic: parses inputs, renders Chart.js curves, overlays values, shows recommendations, PDF export */
(function () {
  // Tool: Test all threshold values for 'any risk' for local calculation vs PediTools API, with progress feedback
  async function testAllAnyRiskThresholdsWithFeedback() {
    const gaList = [35, 36, 37, 38, 39, 40];
    const hourList = Array.from({ length: 336 }, (_, i) => i + 1); // 1–336 hours
    let results = [];
    const btn = document.getElementById('testAllAnyRiskBtn');
    const modal = document.getElementById('testAllAnyRiskModal');
    const modalContent = document.getElementById('testAllAnyRiskModalContent');
    if (btn) btn.disabled = true;
    if (btn) btn.textContent = 'Testing...';
    if (modal) modal.style.display = 'block';
    if (modalContent) modalContent.innerHTML = '<em>Testing all thresholds, please wait...</em>';
    let total = gaList.length * hourList.length;
    let done = 0;
    let out = '';
    let failedLines = [];
    for (const ga of gaList) {
      for (const hour of hourList) {
        // Local calculation (use AAP_AnyRisk_Phototherapy and AAP_AnyRisk_Exchange for authoritative thresholds)
        let localPhoto = null, localExchange = null;
        if (window.AAP_AnyRisk_Phototherapy && window.AAP_AnyRisk_Phototherapy.getPhotoExact) {
          const pt = window.AAP_AnyRisk_Phototherapy.getPhotoExact(ga, hour);
          if (pt && typeof pt.value === 'number') localPhoto = Number(pt.value);
        }
        if (window.AAP_AnyRisk_Exchange && window.AAP_AnyRisk_Exchange.getExchangeExact) {
          const ex = window.AAP_AnyRisk_Exchange.getExchangeExact(ga, hour);
          if (ex && typeof ex.value === 'number') localExchange = Number(ex.value);
        }
        // PediTools API fetch
        const params = new URLSearchParams();
        params.append('ga', ga);
        params.append('age', hour);
        params.append('risk', 'anyrisk');
        const targetUrl = `https://peditools.org/bili2022/api/?${params.toString()}`;
        const url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
        let apiPhoto = null, apiExchange = null;
        let error = null;
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('API error');
          let apiData;
          const rawText = await resp.text();
          try {
            apiData = JSON.parse(rawText);
          } catch (e) {
            apiData = rawText;
          }
          let riskKey = 'ANY neurotoxicity risk factors';
          if (apiData && typeof apiData === 'object' && apiData.Thresholds) {
            const thresholds = apiData.Thresholds;
            if (riskKey && thresholds[riskKey]) {
              if (Array.isArray(thresholds[riskKey])) {
                const entry = thresholds[riskKey].find(e => e['Postnatal age'] == hour);
                if (entry) {
                  apiPhoto = entry['Phototherapy threshold'];
                  apiExchange = entry['Exchange threshold'];
                }
              } else {
                apiPhoto = thresholds[riskKey]['Phototherapy threshold'];
                apiExchange = thresholds[riskKey]['Exchange threshold'];
              }
            }
          } else if (typeof apiData === 'string') {
            // Try regex first
            const htmlText = apiData;
            const regex = /ANY neurotoxicity risk factors\s*([\d\.]+) mg\/dL\s*([\d\.]+) mg\/dL/i;
            const match = htmlText.match(regex);
            if (match) {
              apiPhoto = parseFloat(match[1]);
              apiExchange = parseFloat(match[2]);
            } else {
              // Parse the HTML table for matching GA, age, and risk group
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                // Find all tables
                const tables = Array.from(doc.querySelectorAll('table'));
                for (const table of tables) {
                  // Find all rows
                  const rows = Array.from(table.querySelectorAll('tr'));
                  for (const row of rows) {
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (cells.length >= 3) {
                      // Try to match risk group row
                      const riskCell = cells[0].textContent.trim().toLowerCase();
                      if (riskCell.includes('any neurotoxicity risk factors')) {
                        // Next two cells should be phototherapy and exchange
                        apiPhoto = parseFloat(cells[1].textContent);
                        apiExchange = parseFloat(cells[2].textContent);
                        break;
                      }
                    }
                  }
                  if (apiPhoto !== null && apiExchange !== null) break;
                }
              } catch (err) {
                // Ignore parse errors
              }
            }
          }
        } catch (e) {
          error = e.message;
        }
        // Compare
        let photoMatch = (localPhoto !== null && apiPhoto !== null && Math.abs(localPhoto - apiPhoto) <= 0.01);
        let exchangeMatch = (localExchange !== null && apiExchange !== null && Math.abs(localExchange - apiExchange) <= 0.01);
        let line = '';
        let isFail = false;
        if (error) {
          line = `<span style="color:red;">GA ${ga}, hour ${hour}: API error: ${error}</span>`;
          isFail = true;
        } else if (photoMatch && exchangeMatch) {
          line = `<span style="color:green;">GA ${ga}, hour ${hour}: correct</span>`;
        } else {
          line = `<span style="color:red;">GA ${ga}, hour ${hour}: not correct`;
          if (!photoMatch) line += ` (Photo: local=${localPhoto}, api=${apiPhoto})`;
          if (!exchangeMatch) line += ` (Exchange: local=${localExchange}, api=${apiExchange})`;
          // Debug: show raw API response if missing
          if ((apiPhoto === null || apiExchange === null) && typeof apiData !== 'undefined') {
            line += `<br/><span style='color:gray;font-size:smaller;'>Raw API: <pre>${typeof apiData === 'string' ? apiData : JSON.stringify(apiData, null, 2)}</pre></span>`;
          }
          line += `</span>`;
          isFail = true;
        }
        out += line + '<br/>';
        if (isFail) failedLines.push(line);
        if (modalContent && done % 10 === 0) {
          // Always show filter button at the top near close button
          const filterBtnId = 'testAllAnyRiskFilterBtn';
          const closeBtnId = 'testAllAnyRiskModalCloseBtn';
          let showFailed = window.__testAllAnyRiskShowFailed || false;
          function renderProgress() {
            let filterBtnHtml = `<button id="${filterBtnId}" style="float:left;margin-right:10px;">${showFailed ? 'Show all' : 'Show only failed'}</button>`;
            let closeBtnHtml = `<button id="${closeBtnId}" style="float:right;">×</button>`;
            let contentHtml = showFailed
              ? failedLines.join('<br/>') + `<br/><strong>Showing only failed (${failedLines.length} of ${total})</strong>` + `<em>Testing all thresholds... (${done+1} of ${total})</em>`
              : out + `<em>Testing all thresholds... (${done+1} of ${total})</em>`;
            modalContent.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">${filterBtnHtml}${closeBtnHtml}</div><div style="clear:both;"></div>` + contentHtml;
            setTimeout(() => {
              const btn = document.getElementById(filterBtnId);
              if (btn) {
                btn.onclick = () => {
                  showFailed = !showFailed;
                  window.__testAllAnyRiskShowFailed = showFailed;
                  renderProgress();
                };
              }
              const closeBtn2 = document.getElementById(closeBtnId);
              if (closeBtn2) {
                closeBtn2.onclick = function () {
                  modal.style.display = 'none';
                };
              }
            }, 0);
          }
          renderProgress();
        }
        done++;
        // Allow UI to update
        if (done % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }
    }
    if (modalContent) {
      // Add filter button for failed only, always visible at end, at top
      const filterBtnId = 'testAllAnyRiskFilterBtn';
      const closeBtnId = 'testAllAnyRiskModalCloseBtn';
      let showFailed = window.__testAllAnyRiskShowFailed || false;
      function renderFinal() {
        let filterBtnHtml = `<button id="${filterBtnId}" style="float:left;margin-right:10px;">${showFailed ? 'Show all' : 'Show only failed'}</button>`;
        let closeBtnHtml = `<button id="${closeBtnId}" style="float:right;">×</button>`;
        let contentHtml = showFailed
          ? failedLines.join('<br/>') + `<br/><strong>Showing only failed (${failedLines.length} of ${total})</strong>`
          : out + `<br/><strong>Done. Tested ${total} thresholds.</strong>`;
        modalContent.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">${filterBtnHtml}${closeBtnHtml}</div><div style="clear:both;"></div>` + contentHtml;
        setTimeout(() => {
          const btn = document.getElementById(filterBtnId);
          if (btn) {
            btn.onclick = () => {
              showFailed = !showFailed;
              window.__testAllAnyRiskShowFailed = showFailed;
              renderFinal();
            };
          }
          const closeBtn2 = document.getElementById(closeBtnId);
          if (closeBtn2) {
            closeBtn2.onclick = function () {
              modal.style.display = 'none';
            };
          }
        }, 0);
      }
      renderFinal();
    }
    if (btn) btn.disabled = false;
    if (btn) btn.textContent = 'Check all thresholds (any risk)';
  }

  // Expose for manual testing
  window.testAllAnyRiskThresholds = testAllAnyRiskThresholdsWithFeedback;
  // Expose for manual testing
  window.testAllAnyRiskThresholds = testAllAnyRiskThresholds;
  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  const ctx = $('#chart');
  let chart;

  function parseList(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(v => !isNaN(v));
  }

  function zipToPoints(hoursList, biliList) {
    const n = Math.min(hoursList.length, biliList.length);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push({ x: hoursList[i], y: biliList[i] });
    return pts.sort((a, b) => a.x - b.x);
  }

  // Data persistence functions
  function saveFormData() {
    try {
      const formData = {
        ga: $('#ga').value,
        ageHours: $('#ageHours').value,
        bili: $('#bili').value,
        risk: ($('input[name="risk"]:checked') || {}).value,
        dob: $('#dob').value,
        dom: $('#dom').value,
        datasetKind: ($('#datasetKind') || {}).value,
        verifyInput: ($('#verifyInput') || {}).value
      };
      localStorage.setItem('pedBiliFormData', JSON.stringify(formData));
    } catch (e) {
      // Ignore localStorage errors (e.g., quota exceeded, private browsing)
    }
  }

  function loadFormData() {
    try {
      const saved = localStorage.getItem('pedBiliFormData');
      if (!saved) return;

      const formData = JSON.parse(saved);

      // Restore form values
      if (formData.ga) $('#ga').value = formData.ga;
      if (formData.ageHours) $('#ageHours').value = formData.ageHours;
      if (formData.bili) $('#bili').value = formData.bili;
      if (formData.risk) {
        const riskRadio = $(`input[name="risk"][value="${formData.risk}"]`);
        if (riskRadio) riskRadio.checked = true;
      }
      if (formData.dob) $('#dob').value = formData.dob;
      if (formData.dom) $('#dom').value = formData.dom;
      if (formData.datasetKind && $('#datasetKind')) $('#datasetKind').value = formData.datasetKind;
      if (formData.verifyInput && $('#verifyInput')) $('#verifyInput').value = formData.verifyInput;

    } catch (e) {
      // Ignore errors in loading/parsing saved data
    }
  }

  function buildDatasets() {
    const ga = Number($('#ga').value);
    const ageHoursList = parseList($('#ageHours').value);
    const biliList = parseList($('#bili').value);
    const risk = ($('input[name="risk"]:checked') || {}).value || 'no_risk';

    const sets = DemoThresholds.getCurves(ga, risk);
    const datasets = [];

    const palette = {
      no_risk: { pt: '#22c55e', ex: '#f59e0b' },
      any_risk: { pt: '#16a34a', ex: '#d97706' }
    };

    if (sets.no_risk) {
      datasets.push({ label: 'Phototherapy (no risk, demo)', data: sets.no_risk.phototherapy, borderColor: palette.no_risk.pt, pointRadius: 0, tension: .3 });
      datasets.push({ label: 'Exchange (no risk, demo)', data: sets.no_risk.exchange, borderColor: palette.no_risk.ex, pointRadius: 0, tension: .3 });
    }
    if (sets.any_risk) {
      datasets.push({ label: 'Phototherapy (any risk, demo)', data: sets.any_risk.phototherapy, borderColor: palette.any_risk.pt, pointRadius: 0, tension: .3 });
      datasets.push({ label: 'Exchange (any risk, demo)', data: sets.any_risk.exchange, borderColor: palette.any_risk.ex, pointRadius: 0, tension: .3 });
    }

    // AAP exchange table overlay when risk includes any_risk or both
    if (risk !== 'no_risk' && window.AAP_AnyRisk_Exchange) {
      const exAAP = window.AAP_AnyRisk_Exchange.tables[ga] || window.AAP_AnyRisk_Exchange.tables[38];
      datasets.push({ label: 'Exchange (AAP any risk)', data: exAAP, borderColor: '#ef4444', pointRadius: 0, tension: 0 });
    }

    // AAP phototherapy overlay (any risk) if dataset present
    if (risk !== 'no_risk' && window.AAP_AnyRisk_Phototherapy) {
      const ptAAP = window.AAP_AnyRisk_Phototherapy.tables[ga] || window.AAP_AnyRisk_Phototherapy.tables[38] || [];
      if (ptAAP.length) {
        datasets.push({ label: 'Phototherapy (AAP any risk)', data: ptAAP, borderColor: '#22c55e', pointRadius: 0, tension: 0, borderDash: [6, 4] });
      }
    }

    // Plot user provided points
    if (ageHoursList.length && biliList.length) {
      const points = zipToPoints(ageHoursList, biliList);
      datasets.push({ label: 'Patient bilirubin', data: points, showLine: false, borderColor: '#0ea5e9', backgroundColor: '#0ea5e9', pointRadius: 4 });
    }

    return { datasets, ga, risk, ageHoursList, biliList };
  }

  // Chart removed; keep datasets builder for parsing only.

  function computeSummary() {
    const { ga, risk, ageHoursList, biliList } = buildDatasets();
    const age = ageHoursList[ageHoursList.length - 1];
    const bili = biliList[biliList.length - 1];

    let rec = DemoThresholds.recommendation({ age, bili, ga, risk });
    const hasBili = (typeof bili === 'number' && isFinite(bili));

    // If any-risk selected, show AAP exchange for that GA as authoritative overlay
    let aapEx = null;
    let aapExactText = 'hi';
    if (risk !== 'no_risk' && window.AAP_AnyRisk_Exchange) {
      if (typeof age === 'number' && !isNaN(age)) {
        const exact = window.AAP_AnyRisk_Exchange.getExchangeExact(ga, age);
        aapEx = Number(exact.value.toFixed(1));
      }
      // If user entered multiple ages, show the exact table value for each
      if (ageHoursList.length) {
        const rows = ageHoursList.map((h, i) => {
          const ex = window.AAP_AnyRisk_Exchange.getExchangeExact(ga, h);
          const pt = (window.AAP_AnyRisk_Phototherapy && window.AAP_AnyRisk_Phototherapy.getPhotoExact) ? window.AAP_AnyRisk_Phototherapy.getPhotoExact(ga, h) : null;
          const ptV = pt && typeof pt.value === 'number' ? Number(pt.value.toFixed(1)) : null;
          const exV = Number(ex.value.toFixed(1));
          const both = (ptV != null) ? `(${ptV}, ${exV})` : `${exV}`;
          const tbili = (typeof biliList[i] === 'number' && !isNaN(biliList[i])) ? biliList[i] : null;
          const cmp = tbili != null ? (tbili >= ex.value ? '≥' : '<') : '';
          const tbiliTxt = tbili != null ? ` · TSB ${tbili} (${cmp} ${exV})` : '';
          return `h${ex.hour}: ${both}${tbiliTxt}`;
        });

      }
    }

    // Phototherapy exact, if table present
    let aapPt = null;
    if (risk !== 'no_risk' && window.AAP_AnyRisk_Phototherapy) {
      if (typeof age === 'number' && !isNaN(age)) {
        const exactPt = window.AAP_AnyRisk_Phototherapy.getPhotoExact(ga, age);
        if (exactPt && typeof exactPt.value === 'number') aapPt = Number(exactPt.value.toFixed(1));
      }
    }

    // Build primary threshold header
    let headerHtml = '';
    if (aapPt != null && aapEx != null) {
      headerHtml = `<div class="primary-threshold">(${aapPt}, ${aapEx}) mg/dL</div>`;
    } else if (aapPt != null) {
      headerHtml = `<div class="primary-threshold">${aapPt} mg/dL</div>`;
    } else if (aapEx != null) {
      headerHtml = `<div class="primary-threshold">${aapEx} mg/dL</div>`;
    }

    // Meta line under header
    const metaParts = [];
    metaParts.push(`<strong>GA:</strong> ${ga} wks`);
    if (typeof age !== 'undefined') metaParts.push(`<strong>Age:</strong> ${age} h`);
    const riskText = risk.replace('_', ' ');
    metaParts.push(`<span class="muted"><strong>Risk:</strong> ${riskText}</span>`);
    const metaHtml = `<div class="secondary-meta">${metaParts.join(' · ')}</div>`;

    const details = [];
    if (hasBili) details.push(`<div><strong>Patient TSB:</strong> ${bili} mg/dL</div>`);
    // Prefer AAP exchange determination if applicable
    if (aapEx != null && hasBili) {
      if (bili >= aapEx) {
        rec = { level: 'Exchange threshold or higher (AAP any risk)', detail: rec.detail, pt: rec.pt, ex: aapEx };
      }
    }
    if (hasBili) {
      details.push(`<div><strong>Assessment:</strong> ${rec.level}</div>`);
      if (rec.pt) details.push(`<div class="small muted">Demo phototherapy ~ ${rec.pt} mg/dL; demo exchange ~ ${rec.ex} mg/dL</div>`);
    }


    $('#summary').innerHTML = [headerHtml, metaHtml, ...details].filter(Boolean).join('');
  }

  // PDF export removed

  function calcAge() {
    const dob = $('#dob').value; // datetime-local
    const dom = $('#dom').value;
    if (!dob || !dom) return;
    const t0 = new Date(dob).getTime();
    const t1 = new Date(dom).getTime();
    if (isNaN(t0) || isNaN(t1) || t1 <= t0) return;
    const hours = Math.round((t1 - t0) / 36e5);
    $('#ageHours').value = String(hours);
  }

  // Verification helpers
  function parseTableNumbers(text) {
    if (!text) return [];
    // extract all numbers (allow decimals)
    const arr = (text.match(/[-+]?[0-9]*\.?[0-9]+/g) || []).map(Number).filter(n => Number.isFinite(n));
    return arr;
  }

  function isHeader024(nums) {
    if (nums.length !== 24) return false;
    for (let i = 0; i < 24; i++) { if (nums[i] !== i) return false; }
    return true;
  }

  function parseAAPDayRows(text) {
    // Parses lines like: "0 13.1 13.3 ... 16.0" (25 numbers) and ignores the leading day index.
    // Also ignores a header line "0 1 2 ... 23".
    const lines = text.split(/\r?\n/);
    const rows = []; for (var i = 0; i < 15; i++) { rows[i] = null; }
    for (const line of lines) {
      const nums = (line.match(/[-+]?[0-9]*\.?[0-9]+/g) || []).map(Number).filter(n => Number.isFinite(n));
      if (!nums.length) continue;
      if (isHeader024(nums)) continue; // skip hour header
      // day-labeled rows: 25 numbers, first is 0..14
      if (nums.length === 25 && Number.isInteger(nums[0]) && nums[0] >= 0 && nums[0] <= 14) {
        const day = nums[0];
        const vals = nums.slice(1);
        if (vals.length === 24) rows[day] = vals;
      } else if (nums.length === 24) {
        // Some tables omit the day label; fill the first available day slot
        var day = -1; for (var di = 0; di < rows.length; di++) { if (rows[di] === null) { day = di; break; } }
        if (day !== -1) rows[day] = nums;
      }
    }
    // Flatten if all rows present
    var ok = true; for (var ri = 0; ri < rows.length; ri++) { if (!Array.isArray(rows[ri]) || rows[ri].length !== 24) { ok = false; break; } }
    if (ok) {
      var out = [];
      for (var rr = 0; rr < rows.length; rr++) {
        for (var hh = 0; hh < rows[rr].length; hh++) out.push(rows[rr][hh]);
      }
      return out;
    }
    return [];
  }

  function convertToJsRows() {
    const raw = $('#verifyInput').value;
    const lines = raw.split(/\r?\n/);
    const rows = []; for (var i = 0; i < 15; i++) { rows[i] = null; }
    for (const line of lines) {
      const nums = (line.match(/[-+]?[0-9]*\.?[0-9]+/g) || []).map(Number).filter(n => Number.isFinite(n));
      if (!nums.length) continue;
      if (isHeader024(nums)) continue;
      if (nums.length === 25 && Number.isInteger(nums[0]) && nums[0] >= 0 && nums[0] <= 14) {
        const day = nums[0];
        const vals = nums.slice(1);
        if (vals.length === 24) rows[day] = vals;
      } else if (nums.length === 24) {
        var day = -1; for (var di = 0; di < rows.length; di++) { if (rows[di] === null) { day = di; break; } }
        if (day !== -1) rows[day] = nums;
      }
    }
    // Validate provided rows have 24 values
    for (let d = 0; d < 15; d++) {
      if (rows[d] && rows[d].length !== 24) {
        $('#convertOutput').value = `Row for day ${d} has ${rows[d].length} values; expected 24.`;
        return;
      }
    }
    // Determine last filled day and plateau value
    let lastFilled = -1;
    for (let d = 14; d >= 0; d--) { if (rows[d]) { lastFilled = d; break; } }
    if (lastFilled === -1) {
      $('#convertOutput').value = 'No rows detected. Paste day-labeled rows or lines of 24 values.';
      return;
    }
    const plateau = Number((rows[lastFilled][23] != null ? rows[lastFilled][23] : rows[lastFilled][rows[lastFilled].length - 1]).toFixed(1));
    // Auto-fill missing days with a flat plateau row up to day 14
    for (let d = 0; d < 15; d++) {
      if (!rows[d]) rows[d] = Array(24).fill(plateau);
    }
    // format
    const js = rows.map(r => `[${r.map(v => Number(v.toFixed(1))).join(',')}]`).join(',\n    ');
    $('#convertOutput').value = js;
  }

  async function copyConverted() {
    const txt = $('#convertOutput').value || '';
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
    } catch (e) {
      // ignore
    }
  }

  function getInternalHourlyForGA(ga) {
    const kind = ($('#datasetKind') && $('#datasetKind').value) || 'exchange';
    let arr = [];
    if (kind === 'phototherapy') {
      arr = (window.AAP_AnyRisk_Phototherapy && window.AAP_AnyRisk_Phototherapy.tables[ga]) || [];
    } else {
      arr = (window.AAP_AnyRisk_Exchange && window.AAP_AnyRisk_Exchange.tables[ga]) || [];
    }
    return arr.map(p => p.y);
  }

  function verifyAgainstDataset() {
    const ga = Number($('#ga').value);
    const raw = $('#verifyInput').value;
    let nums = parseAAPDayRows(raw);
    let parsedMode = 'day-rows';
    if (nums.length === 0) {
      nums = parseTableNumbers(raw);
      parsedMode = 'flat';
    }
    const expected = getInternalHourlyForGA(ga);
    const out = [];
    if (expected.length === 0) {
      $('#verifyOutput').innerHTML = 'No dataset found for this GA.';
      return;
    }
    if (nums.length !== expected.length) {
      out.push(`Count mismatch: pasted ${nums.length} numbers; dataset has ${expected.length}.`);
    }
    const n = Math.min(nums.length, expected.length);
    let mismatches = 0;
    for (let i = 0; i < n; i++) {
      const a = Number(nums[i].toFixed(3));
      const b = Number(expected[i].toFixed(3));
      if (a !== b) {
        mismatches++;
        const day = Math.floor(i / 24), hour = i % 24;
        if (mismatches <= 25) {
          out.push(`Mismatch at day ${day}, hour ${hour}: pasted ${a} vs dataset ${b}`);
        }
      }
    }
    if (mismatches === 0 && nums.length === expected.length) {
      out.unshift(`All values match the JS dataset for this GA. (Parsed as ${parsedMode})`);
    } else {
      out.unshift(`Found ${mismatches} mismatches.`);
      if (mismatches > 25) out.push(`…and ${mismatches - 25} more.`);
    }
    $('#verifyOutput').innerHTML = out.join('<br/>');
  }

  function exportDatasetJSON() {
    const ga = Number($('#ga').value);
    const kind = ($('#datasetKind') && $('#datasetKind').value) || 'exchange';
    const table = kind === 'phototherapy'
      ? ((window.AAP_AnyRisk_Phototherapy && window.AAP_AnyRisk_Phototherapy.tables[ga]) || [])
      : ((window.AAP_AnyRisk_Exchange && window.AAP_AnyRisk_Exchange.tables[ga]) || []);
    const obj = table.map(p => ({ hour: p.x, value: p.y }));
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (kind === 'phototherapy') ? `aap_anyrisk_phototherapy_ga${ga}.json` : `aap_anyrisk_exchange_ga${ga}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // PediTools API integration
  async function fetchPediToolsBili2022() {
    const ga = $('#ga').value;
    const age = $('#ageHours').value;
    const bili = $('#bili').value;
    const risk = ($('input[name="risk"]:checked') || {}).value;
    // Build query string
    const params = new URLSearchParams();
    if (ga) params.append('ga', ga);
    if (age) params.append('age', age);
    if (bili) params.append('bili', bili);
    if (risk && risk !== 'both') params.append('risk', risk.replace('_', ''));
    // Use AllOrigins CORS proxy
    const targetUrl = `https://peditools.org/bili2022/api/?${params.toString()}`;
    // Use Logo CORS Proxy (codetabs.com)
    const url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    // Show only results card content here
    $('#peditoolsResult').innerHTML = `<em>Loading API results...</em>`;

    // Remove legacy preview rendering. All API details are shown in the tabbed interface only.
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('API error');
      let apiData;
      const rawText = await resp.text();
      try {
        apiData = JSON.parse(rawText);
      } catch (e) {
        apiData = rawText;
      }

      // Extract API thresholds robustly
      let apiPhoto = null, apiExchange = null;
      let riskKey = (risk === 'any_risk') ? 'ANY neurotoxicity risk factors' : (risk === 'no_risk' ? 'No neurotoxicity risk factors' : null);
      if (apiData && typeof apiData === 'object' && apiData.Thresholds) {
        const thresholds = apiData.Thresholds;
        if (riskKey && thresholds[riskKey]) {
          if (Array.isArray(thresholds[riskKey])) {
            const hour = parseInt(age, 10);
            const entry = thresholds[riskKey].find(e => e['Postnatal age'] == hour);
            if (entry) {
              apiPhoto = entry['Phototherapy threshold'];
              apiExchange = entry['Exchange threshold'];
            }
          } else {
            apiPhoto = thresholds[riskKey]['Phototherapy threshold'];
            apiExchange = thresholds[riskKey]['Exchange threshold'];
          }
        }
      } else if (typeof apiData === 'string') {
        // Try regex first
        const htmlText = apiData;
        const regex = /ANY neurotoxicity risk factors\s*([\d\.]+) mg\/dL\s*([\d\.]+) mg\/dL/i;
        const match = htmlText.match(regex);
        if (match) {
          apiPhoto = parseFloat(match[1]);
          apiExchange = parseFloat(match[2]);
        } else {
          // Parse the HTML table for matching GA, age, and risk group
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            // Find all tables
            const tables = Array.from(doc.querySelectorAll('table'));
            for (const table of tables) {
              // Find all rows
              const rows = Array.from(table.querySelectorAll('tr'));
              for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length >= 3) {
                  // Try to match risk group row
                  const riskCell = cells[0].textContent.trim().toLowerCase();
                  if (riskCell.includes('any neurotoxicity risk factors')) {
                    // Next two cells should be phototherapy and exchange
                    apiPhoto = parseFloat(cells[1].textContent);
                    apiExchange = parseFloat(cells[2].textContent);
                    break;
                  }
                }
              }
              if (apiPhoto !== null && apiExchange !== null) break;
            }
          } catch (err) {
            // Ignore parse errors
          }
        }
      }

      // Get local calculated thresholds from your UI
      // Find the primary-threshold div and extract values
      let localPhoto = null, localExchange = null;
      const primaryDiv = document.querySelector('.primary-threshold');
      if (primaryDiv) {
        const match = primaryDiv.textContent.match(/\(([^,]+),\s*([^\)]+)\) mg\/dL/);
        if (match) {
          localPhoto = parseFloat(match[1]);
          localExchange = parseFloat(match[2]);
        } else {
          const singleMatch = primaryDiv.textContent.match(/([\d\.]+) mg\/dL/);
          if (singleMatch) localPhoto = parseFloat(singleMatch[1]);
        }
      }

      // Build all API details content
      let comparisonHtml = '<h3>Threshold Comparison</h3>';
      comparisonHtml += '<table border="1" cellpadding="6" style="border-collapse:collapse;max-width:400px;">';
      comparisonHtml += '<tr><th></th><th>Phototherapy</th><th>Exchange</th></tr>';
      comparisonHtml += `<tr><td><strong>Local</strong></td><td>${localPhoto ?? '-'}<\/td><td>${localExchange ?? '-'}<\/td></tr>`;
      comparisonHtml += `<tr><td><strong>API</strong></td><td>${apiPhoto ?? '-'}<\/td><td>${apiExchange ?? '-'}<\/td></tr>`;
      comparisonHtml += '<\/table>';
      let samePhoto = (localPhoto !== null && apiPhoto !== null && Math.abs(localPhoto - apiPhoto) <= 0.01);
      let sameExchange = (localExchange !== null && apiExchange !== null && Math.abs(localExchange - apiExchange) <= 0.01);
      let matchHtml = '';
      if (samePhoto && sameExchange) {
        matchHtml = `<div style="color:green;font-weight:bold;">✅ Your calculation matches the API for both thresholds.<\/div>`;
      } else if (!samePhoto && !sameExchange) {
        matchHtml = `<div style="color:red;font-weight:bold;">❌ Both thresholds differ from the API.<\/div>`;
      } else {
        if (!samePhoto) matchHtml += `<div style="color:red;font-weight:bold;">❌ Phototherapy threshold differs from API.<\/div>`;
        else matchHtml += `<div style="color:green;font-weight:bold;">✅ Phototherapy threshold matches API.<\/div>`;
        if (!sameExchange) matchHtml += `<div style="color:red;font-weight:bold;">❌ Exchange threshold differs from API.<\/div>`;
        else matchHtml += `<div style="color:green;font-weight:bold;">✅ Exchange threshold matches API.<\/div>`;
      }
      let tableHtml = '<h3>PediTools Table Extracted</h3>';
      if (typeof apiData === 'string') {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(apiData, 'text/html');
          // Find the first table with threshold values
          const tables = Array.from(doc.querySelectorAll('table'));
          if (tables.length) {
            tableHtml += tables[0].outerHTML;
          }
        } catch (err) {
          // Ignore parse errors
        }
      }
      let previewHtml = '<h3>PediTools Page Preview:</h3>' + `<iframe src="${targetUrl}" width="400" height="300" style="border:1px solid #ccc; transform:scale(0.8); transform-origin:0 0;"></iframe>`;
      let rawHtml = '<details><summary>Raw API response</summary>';
      rawHtml += `<pre style="white-space:pre-wrap;word-break:break-word;">${typeof apiData === 'string' ? apiData : JSON.stringify(apiData, null, 2)}</pre>`;
      rawHtml += '</details>';

      // Compose all sections together
      let allDetailsHtml = comparisonHtml + matchHtml + tableHtml + previewHtml + rawHtml;
      // Results card only shows summary and match status
      $('#peditoolsResult').innerHTML = matchHtml;
      // Set up API details overlay
      const showBtn = document.getElementById('showApiDetailsBtn');
      const overlay = document.getElementById('peditoolsApiDetailsOverlay');
      const contentDiv = document.getElementById('peditoolsApiDetailsContent');
      const closeBtn = document.getElementById('closeApiDetailsBtn');
      if (showBtn && overlay && contentDiv && closeBtn) {
        showBtn.style.display = '';
        contentDiv.innerHTML = allDetailsHtml;
        showBtn.onclick = function () {
          overlay.style.display = 'block';
          showBtn.style.display = 'none';
        };
        closeBtn.onclick = function () {
          overlay.style.display = 'none';
          showBtn.style.display = '';
        };
      }
    } catch (e) {
      $('#peditoolsResult').innerHTML = `<span style="color:red;">Error fetching API: ${e.message}</span>`;
    }
  }

  // Attach event listeners for API and test buttons
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      const apiBtn = document.getElementById('peditoolsApiBtn');
      if (apiBtn) apiBtn.addEventListener('click', fetchPediToolsBili2022);
      const testBtn = document.getElementById('testAllAnyRiskBtn');
      if (testBtn) testBtn.addEventListener('click', testAllAnyRiskThresholdsWithFeedback);
      const testModal = document.getElementById('testAllAnyRiskModal');
      const testModalClose = document.getElementById('testAllAnyRiskModalClose');
      if (testModalClose) testModalClose.addEventListener('click', function () {
        testModal.style.display = 'none';
      });
    });
  } else {
    const apiBtn = document.getElementById('peditoolsApiBtn');
    if (apiBtn) apiBtn.addEventListener('click', fetchPediToolsBili2022);
    const testBtn = document.getElementById('testAllAnyRiskBtn');
    if (testBtn) testBtn.addEventListener('click', testAllAnyRiskThresholdsWithFeedback);
    const testModal = document.getElementById('testAllAnyRiskModal');
    const testModalClose = document.getElementById('testAllAnyRiskModalClose');
    if (testModalClose) testModalClose.addEventListener('click', function () {
      testModal.style.display = 'none';
    });
  }

  // Events
  // Live updates on change
  $('#resetBtn').addEventListener('click', () => {
    setTimeout(() => {
      $('#summary').textContent = '';
      // Clear saved data when reset is clicked
      try { localStorage.removeItem('pedBiliFormData'); } catch (e) { }
      computeSummary();
    }, 0);
  });
  $('#calcAgeBtn').addEventListener('click', () => { calcAge(); computeSummary(); saveFormData(); });

  // Recompute on every keystroke as well as change, and save data
  $$('#controls input').forEach(el => el.addEventListener('input', () => { computeSummary(); saveFormData(); }));
  $$('#controls input, #controls select').forEach(el => el.addEventListener('change', () => { computeSummary(); saveFormData(); }));

  // Also save data when age calculator fields change
  if ($('#dob')) $('#dob').addEventListener('change', saveFormData);
  if ($('#dom')) $('#dom').addEventListener('change', saveFormData);
  if ($('#datasetKind')) $('#datasetKind').addEventListener('change', saveFormData);
  if ($('#verifyInput')) $('#verifyInput').addEventListener('input', saveFormData);

  $('#verifyBtn').addEventListener('click', verifyAgainstDataset);
  $('#exportBtn').addEventListener('click', exportDatasetJSON);
  $('#convertBtn').addEventListener('click', convertToJsRows);
  $('#copyConvertBtn').addEventListener('click', copyConverted);

  // Load saved data and initial render
  loadFormData();
  computeSummary();
})();


