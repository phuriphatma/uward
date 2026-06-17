function parseGA(gaStr) {
  if (!gaStr) return null;
  const [w, d] = gaStr.split('+').map(Number);
  return w * 7 + (d || 0);
}

function formatGA(days) {
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  return `${weeks}+${remDays}`;
}

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function clearLmpEdc() {
  document.getElementById("lmp").value = "";
  document.getElementById("edc").value = "";
}

function clearKnownDateGA() {
  document.getElementById("dateA").value = "";
  document.getElementById("gaA").value = "";
}

function clearCalculatedDateGA() {
  document.getElementById("dateB").value = "";
  document.getElementById("gaB").value = "";
}

function calculate() {
  const lmpInput = document.getElementById("lmp");
  const edcInput = document.getElementById("edc");
  const dateAInput = document.getElementById("dateA");
  const dateBInput = document.getElementById("dateB");
  const gaAInput = document.getElementById("gaA");
  const gaBInput = document.getElementById("gaB");
  const out = document.getElementById("output");

  const lmpVal = lmpInput.value;
  const edcVal = edcInput.value;
  const dA = dateAInput.value;
  const dB = dateBInput.value;
  const gaA = parseGA(gaAInput.value);
  const gaB = parseGA(gaBInput.value);

  let lmpDate = lmpVal ? new Date(lmpVal) : null;
  let edcDate = edcVal ? new Date(edcVal) : null;
  let outputLines = [];

  if (!lmpDate && edcDate) {
    lmpDate = new Date(edcDate);
    lmpDate.setDate(edcDate.getDate() - 280);
    lmpInput.value = lmpDate.toISOString().slice(0, 10);
    outputLines.push(`LMP (calculated from EDC): ${formatDate(lmpDate)}.`);
  }

  if (lmpDate && !edcDate) {
    edcDate = new Date(lmpDate);
    edcDate.setDate(lmpDate.getDate() + 280);
    edcInput.value = edcDate.toISOString().slice(0, 10);
    outputLines.push(`EDC (calculated from LMP): ${formatDate(edcDate)}.`);
  }

  if (lmpDate) {
    outputLines.push(`LMP: ${formatDate(lmpDate)}.`);
    outputLines.push(`EDC: ${formatDate(edcDate)}.`);

    if (dA && !gaA) {
      // If Date A is given but GA A is not → calculate GA A
      const dateA = new Date(dA);
      const diffA = Math.floor((dateA - lmpDate) / (1000 * 60 * 60 * 24));
      const formattedGA = formatGA(diffA);
      outputLines.push(`GA on Date A (${formatDate(dateA)}): ${formattedGA}.`);
      gaAInput.value = formattedGA;
    } else if (!dA && gaA != null) {
      // If GA A is given but Date A is missing → calculate Date A
      const dateA = new Date(lmpDate);
      dateA.setDate(lmpDate.getDate() + gaA);
      dateAInput.value = dateA.toISOString().slice(0, 10);
      outputLines.push(`Date A (calculated from GA A): ${formatDate(dateA)}.`);
    }

    if (dB && !gaB) {
      // If Date B is given but GA B is not → calculate GA B
      const dateB = new Date(dB);
      const diffB = Math.floor((dateB - lmpDate) / (1000 * 60 * 60 * 24));
      const formattedGA = formatGA(diffB);
      outputLines.push(`GA on Date B (${formatDate(dateB)}): ${formattedGA}.`);
      gaBInput.value = formattedGA;
    } else if (!dB && gaB != null) {
      // If GA B is given but Date B is missing → calculate Date B
      const dateB = new Date(lmpDate);
      dateB.setDate(lmpDate.getDate() + gaB);
      dateBInput.value = dateB.toISOString().slice(0, 10);
      outputLines.push(`Date B (calculated from GA B): ${formatDate(dateB)}.`);
    }

    out.textContent = outputLines.join("\n");
    return;
  }

  if (dA && gaA != null) {
    const dateA = new Date(dA);
    lmpDate = new Date(dateA);
    lmpDate.setDate(dateA.getDate() - gaA);
    lmpInput.value = lmpDate.toISOString().slice(0, 10);
    outputLines.push(`LMP (calculated): ${formatDate(lmpDate)}.`);

    edcDate = new Date(lmpDate);
    edcDate.setDate(lmpDate.getDate() + 280);
    edcInput.value = edcDate.toISOString().slice(0, 10);
    outputLines.push(`EDC (calculated): ${formatDate(edcDate)}.`);

    if (dB && gaB == null) {
      const dateB = new Date(dB);
      const diff = (dateB - dateA) / (1000 * 60 * 60 * 24);
      const resultGA = gaA + diff;
      const formattedGA = formatGA(resultGA);
      outputLines.push(`GA on Date B (${formatDate(dateB)}): ${formattedGA}.`);
      gaBInput.value = formattedGA;
    } else if (!dB && gaB != null) {
      const diffDays = gaB - gaA;
      const targetDate = new Date(dateA);
      targetDate.setDate(dateA.getDate() + diffDays);
      const formattedDate = targetDate.toISOString().slice(0, 10);
      outputLines.push(`Date when GA is ${formatGA(gaB)}: ${formatDate(targetDate)}.`);
      dateBInput.value = formattedDate;
    } else if (dB && gaB != null) {
      out.textContent = "Please enter either Date B or GA B, not both.";
      return;
    }

    out.textContent = outputLines.join("\n");
    return;
  }

  out.textContent = "Please enter at least LMP, EDC, or Date A with GA.";
}

document.addEventListener("DOMContentLoaded", function () {
  const lmpInput = document.getElementById("lmp");
  const edcInput = document.getElementById("edc");

  lmpInput.addEventListener("change", function () {
    const lmpVal = this.value;
    if (lmpVal) {
      const lmpDate = new Date(lmpVal);
      const edcDate = new Date(lmpDate);
      edcDate.setDate(lmpDate.getDate() + 280);
      edcInput.value = edcDate.toISOString().slice(0, 10);
    }
  });

  edcInput.addEventListener("change", function () {
    const edcVal = this.value;
    if (edcVal) {
      const edcDate = new Date(edcVal);
      const lmpDate = new Date(edcDate);
      lmpDate.setDate(edcDate.getDate() - 280);
      lmpInput.value = lmpDate.toISOString().slice(0, 10);
    }
  });
});
