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
    const lmpInput = document.getElementById('anchor-lmp');
    const edcInput = document.getElementById('anchor-edc');
    const usgDateInput = document.getElementById('anchor-usg-date');
    const usgGaInput = document.getElementById('anchor-usg-ga');
    const clearBtn = document.getElementById('clear-anchor-btn');
    
    const targetRowsDiv = document.getElementById('target-rows');
    const addTargetBtn = document.getElementById('add-target-btn');

    let baseDate0 = null; // Date when GA is 0+0

    function flash(el) {
        el.style.backgroundColor = 'var(--u-primary-tint, #f0f9ff)';
        setTimeout(() => el.style.backgroundColor = 'var(--u-surface, #fff)', 500);
    }

    function triggerUpdates() {
        if (baseDate0 && !isNaN(baseDate0.getTime())) {
            const edc = new Date(baseDate0);
            edc.setDate(baseDate0.getDate() + 280);
            if (typeof window.updateWheelDates === 'function') {
                window.updateWheelDates(baseDate0, edc);
            }
        }
        
        // Update all target rows
        if (!baseDate0) return;
        const rows = targetRowsDiv.children;
        for (let i = 0; i < rows.length; i++) {
            const dateInput = rows[i].querySelector('.target-date-input');
            const gaInput = rows[i].querySelector('.target-ga-input');
            
            if (dateInput.value) {
                const targetDate = new Date(dateInput.value);
                const diff = Math.floor((targetDate - baseDate0) / (1000 * 60 * 60 * 24));
                gaInput.value = formatGA(diff);
            } else if (gaInput.value) {
                const gaVal = parseGA(gaInput.value);
                if (gaVal !== null) {
                    const targetDate = new Date(baseDate0);
                    targetDate.setDate(baseDate0.getDate() + gaVal);
                    dateInput.value = toISODate(targetDate);
                }
            }
        }
    }

    lmpInput.addEventListener('input', () => {
        if (!lmpInput.value) return;
        const lmp = new Date(lmpInput.value);
        baseDate0 = new Date(lmp);
        
        const edc = new Date(lmp);
        edc.setDate(lmp.getDate() + 280);
        edcInput.value = toISODate(edc);
        flash(edcInput);
        
        usgDateInput.value = "";
        usgGaInput.value = "";
        
        triggerUpdates();
    });

    edcInput.addEventListener('input', () => {
        if (!edcInput.value) return;
        const edc = new Date(edcInput.value);
        baseDate0 = new Date(edc);
        baseDate0.setDate(edc.getDate() - 280);
        
        lmpInput.value = toISODate(baseDate0);
        flash(lmpInput);
        
        usgDateInput.value = "";
        usgGaInput.value = "";
        
        triggerUpdates();
    });

    function handleUsg() {
        if (usgDateInput.value && usgGaInput.value) {
            const gaVal = parseGA(usgGaInput.value);
            if (gaVal !== null) {
                const usgDate = new Date(usgDateInput.value);
                baseDate0 = new Date(usgDate);
                baseDate0.setDate(usgDate.getDate() - gaVal);
                
                lmpInput.value = toISODate(baseDate0);
                flash(lmpInput);
                
                const edc = new Date(baseDate0);
                edc.setDate(baseDate0.getDate() + 280);
                edcInput.value = toISODate(edc);
                flash(edcInput);
                
                triggerUpdates();
            }
        }
    }

    usgDateInput.addEventListener('input', handleUsg);
    usgGaInput.addEventListener('input', handleUsg);

    clearBtn.addEventListener('click', () => {
        lmpInput.value = "";
        edcInput.value = "";
        usgDateInput.value = "";
        usgGaInput.value = "";
        baseDate0 = null;
        triggerUpdates();
    });

    let targetCount = 0;
    function addTargetRow() {
        targetCount++;
        const id = targetCount;
        
        const row = document.createElement('div');
        row.style.cssText = "display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-end; width: 100%;";
        row.innerHTML = `
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 13px;">Date</label>
                <input type="date" id="target-date-${id}" class="target-date-input" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
            </div>
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 13px;">GA</label>
                <input type="text" id="target-ga-${id}" class="target-ga-input" placeholder="e.g. 37+0" style="margin: 0; background: var(--u-surface, #fff); color: var(--u-ink, #0f172a); border: 1px solid var(--u-line-2, #cbd5e1); border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
            </div>
            <button class="remove-target-btn" style="background: transparent; border: none; color: var(--u-bad, #ef4444); font-size: 18px; cursor: pointer; padding: 10px; line-height: 1; width: auto; flex-shrink: 0;">&times;</button>
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
                flash(gaInput);
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
                flash(dateInput);
            } else {
                dateInput.value = "";
            }
        });
        
        row.querySelector('.remove-target-btn').addEventListener('click', () => {
            row.remove();
        });
        
        if (targetCount === 1) {
            dateInput.value = toISODate(new Date());
            if (baseDate0) dateInput.dispatchEvent(new Event('input'));
        }
    }
    
    addTargetBtn.addEventListener('click', addTargetRow);

    // Initial setup
    addTargetRow(); // Add one default target row
});

window.calculate = function() {};
window.clearLmpEdc = function() {};
window.clearKnownDateGA = function() {};
window.clearCalculatedDateGA = function() {};

