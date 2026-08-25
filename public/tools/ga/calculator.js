// New Reactive GA Calculator Logic

function parseGA(gaStr) {
  if (!gaStr) return null;
  const match = gaStr.match(/^(\d+)(?:\+(\d+))?$/);
  if (!match) return null;
  const w = parseInt(match[1], 10);
  const d = match[2] ? parseInt(match[2], 10) : 0;
  return w * 7 + d;
}

function formatGA(days) {
  if (days < 0) return "Before conception";
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  return `${weeks}+${remDays}`;
}

function formatDate(date) {
  if (!date || isNaN(date.getTime())) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function toISODate(date) {
    if (!date || isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

document.addEventListener("DOMContentLoaded", () => {
    const anchorTypeRadios = document.querySelectorAll('input[name="anchorType"]');
    const anchorInputsDiv = document.getElementById('anchor-inputs');
    const anchorSummary = document.getElementById('anchor-summary');
    const targetRowsDiv = document.getElementById('target-rows');
    const addTargetBtn = document.getElementById('add-target-btn');

    let currentAnchorType = 'lmp';
    let baseDate0 = null; // Date when GA is 0+0

    function renderAnchorInputs() {
        if (currentAnchorType === 'lmp') {
            anchorInputsDiv.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-weight: bold; font-size: 14px;">LMP Date</label>
                    <input type="date" id="anchor-lmp" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
                </div>
            `;
            document.getElementById('anchor-lmp').addEventListener('input', calculateAnchor);
        } else if (currentAnchorType === 'edc') {
            anchorInputsDiv.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-weight: bold; font-size: 14px;">EDC Date</label>
                    <input type="date" id="anchor-edc" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
                </div>
            `;
            document.getElementById('anchor-edc').addEventListener('input', calculateAnchor);
        } else if (currentAnchorType === 'usg') {
            anchorInputsDiv.innerHTML = `
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: bold; font-size: 14px;">Known Date</label>
                        <input type="date" id="anchor-usg-date" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: bold; font-size: 14px;">Known GA</label>
                        <input type="text" id="anchor-usg-ga" placeholder="e.g. 10+3" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
                    </div>
                </div>
            `;
            document.getElementById('anchor-usg-date').addEventListener('input', calculateAnchor);
            document.getElementById('anchor-usg-ga').addEventListener('input', calculateAnchor);
        }
        
        // Auto-focus the first input
        const firstInput = anchorInputsDiv.querySelector('input');
        if (firstInput) firstInput.focus();
        
        calculateAnchor();
    }

    function calculateAnchor() {
        baseDate0 = null;
        
        if (currentAnchorType === 'lmp') {
            const lmpVal = document.getElementById('anchor-lmp').value;
            if (lmpVal) baseDate0 = new Date(lmpVal);
        } else if (currentAnchorType === 'edc') {
            const edcVal = document.getElementById('anchor-edc').value;
            if (edcVal) {
                const edcDate = new Date(edcVal);
                baseDate0 = new Date(edcDate);
                baseDate0.setDate(edcDate.getDate() - 280);
            }
        } else if (currentAnchorType === 'usg') {
            const dateVal = document.getElementById('anchor-usg-date').value;
            const gaVal = parseGA(document.getElementById('anchor-usg-ga').value);
            if (dateVal && gaVal !== null) {
                const knownDate = new Date(dateVal);
                baseDate0 = new Date(knownDate);
                baseDate0.setDate(knownDate.getDate() - gaVal);
            }
        }

        if (baseDate0 && !isNaN(baseDate0.getTime())) {
            const edc = new Date(baseDate0);
            edc.setDate(baseDate0.getDate() + 280);
            anchorSummary.style.display = 'block';
            anchorSummary.innerHTML = `Derived LMP: ${formatDate(baseDate0)} &nbsp;&bull;&nbsp; Derived EDC: ${formatDate(edc)}`;
            // Trigger target updates
            updateAllTargets();
            
            // Draw wheel if drawWheel exists (assuming it's loaded from main HTML scripts)
            if (typeof window.updateWheelDates === 'function') {
                window.updateWheelDates(baseDate0, edc);
            }
        } else {
            anchorSummary.style.display = 'none';
        }
    }

    let targetCount = 0;
    function addTargetRow() {
        targetCount++;
        const id = targetCount;
        
        const row = document.createElement('div');
        row.style.cssText = "display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-end;";
        row.innerHTML = `
            <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 13px;">Date</label>
                <input type="date" id="target-date-${id}" class="target-date-input" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 13px;">GA</label>
                <input type="text" id="target-ga-${id}" class="target-ga-input" placeholder="GA (e.g. 37+0)" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
            </div>
            <button class="remove-target-btn" style="background: transparent; border: none; color: var(--u-bad, #ef4444); font-size: 18px; cursor: pointer; padding: 10px; line-height: 1;">&times;</button>
        `;
        
        targetRowsDiv.appendChild(row);
        
        const dateInput = row.querySelector(`#target-date-${id}`);
        const gaInput = row.querySelector(`#target-ga-${id}`);
        
        dateInput.addEventListener('input', () => {
            if (!baseDate0) return;
            const dateVal = dateInput.value;
            if (dateVal) {
                const targetDate = new Date(dateVal);
                const diff = Math.floor((targetDate - baseDate0) / (1000 * 60 * 60 * 24));
                gaInput.value = formatGA(diff);
                gaInput.style.backgroundColor = 'var(--u-primary-tint, #f0f9ff)';
                setTimeout(() => gaInput.style.backgroundColor = 'var(--u-surface, #fff)', 500);
            } else {
                gaInput.value = "";
            }
        });
        
        gaInput.addEventListener('input', () => {
            if (!baseDate0) return;
            const gaVal = parseGA(gaInput.value);
            if (gaVal !== null) {
                const targetDate = new Date(baseDate0);
                targetDate.setDate(baseDate0.getDate() + gaVal);
                dateInput.value = toISODate(targetDate);
                dateInput.style.backgroundColor = 'var(--u-primary-tint, #f0f9ff)';
                setTimeout(() => dateInput.style.backgroundColor = 'var(--u-surface, #fff)', 500);
            } else {
                dateInput.value = "";
            }
        });
        
        row.querySelector('.remove-target-btn').addEventListener('click', () => {
            row.remove();
        });
        
        // If it's the very first row, auto-fill today's date
        if (targetCount === 1) {
            dateInput.value = toISODate(new Date());
            // It will auto-calculate if anchor is set
            if (baseDate0) dateInput.dispatchEvent(new Event('input'));
        }
    }
    
    function updateAllTargets() {
        if (!baseDate0) return;
        const rows = targetRowsDiv.children;
        for (let i = 0; i < rows.length; i++) {
            const dateInput = rows[i].querySelector('.target-date-input');
            const gaInput = rows[i].querySelector('.target-ga-input');
            
            // If date is set, recalculate GA
            if (dateInput.value) {
                const targetDate = new Date(dateInput.value);
                const diff = Math.floor((targetDate - baseDate0) / (1000 * 60 * 60 * 24));
                gaInput.value = formatGA(diff);
            } else if (gaInput.value) {
                // If GA is set but not date, recalculate Date
                const gaVal = parseGA(gaInput.value);
                if (gaVal !== null) {
                    const targetDate = new Date(baseDate0);
                    targetDate.setDate(baseDate0.getDate() + gaVal);
                    dateInput.value = toISODate(targetDate);
                }
            }
        }
    }

    anchorTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentAnchorType = e.target.value;
            renderAnchorInputs();
        });
    });

    addTargetBtn.addEventListener('click', addTargetRow);

    // Initial setup
    renderAnchorInputs();
    addTargetRow(); // Add one default target row
});

// Overwrite window.calculate to prevent errors from other scripts trying to call the old function
window.calculate = function() {};
window.clearLmpEdc = function() {};
window.clearKnownDateGA = function() {};
window.clearCalculatedDateGA = function() {};

