document.addEventListener("DOMContentLoaded", function () {

/* ================= AUTH ================= */
const isLoggedIn = localStorage.getItem("isLoggedIn");
if (isLoggedIn !== "true") {
    window.location.href = "login.html";
    return;
}
/* ================= LOGOUT ================= */
document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
});
})
/* ══════════════════════════════════════════════
   DASHBOARD / MEASUREMENT LOGIC
   ══════════════════════════════════════════════ */
let dashState = { type: 'Length', action: 'Comparison' };

const UNIT_RATES = {
  Length: { Meter: 1, Kilometer: 1000, Centimeter: 0.01, Millimeter: 0.001 },
  Weight: { Kilogram: 1, Gram: 0.001, Tonne: 1000 },
  Temperature: { Celsius: 'C', Fahrenheit: 'F', Kelvin: 'K' }, // Custom handling below
  Volume: { Liters: 1, Milliliters: 0.001, Gallons: 3.78541 }
};

// Converts ANY unit to its Base Unit (e.g. anything to Meter, Celsius, etc)
function toBase(val, unit, type) {
  if (type === 'Temperature') {
    if (unit === 'Celsius') return val;
    if (unit === 'Fahrenheit') return (val - 32) * 5 / 9;
    if (unit === 'Kelvin') return val - 273.15;
  }
  return val * UNIT_RATES[type][unit];
}

// Converts from Base Unit to target Unit
function fromBase(val, unit, type) {
  if (type === 'Temperature') {
    if (unit === 'Celsius') return val;
    if (unit === 'Fahrenheit') return (val * 9 / 5) + 32;
    if (unit === 'Kelvin') return val + 273.15;
  }
  return val / UNIT_RATES[type][unit];
}

function initDashboard() {
  if (!document.getElementById('workspace')) return; 
  renderWorkspace();
}

function selectType(type, element) {
  document.querySelectorAll('.type-card').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  dashState.type = type;
  renderWorkspace();
}

function selectAction(action, element) {
  document.querySelectorAll('.action-btn').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  dashState.action = action;
  renderWorkspace();
}

function hideResult() {
  const rb = document.getElementById('resultBox');
  if(rb) rb.classList.remove('show');
}

function renderWorkspace() {
  const workspace = document.getElementById('workspace');
  if(!workspace) return;
  
  const units = Object.keys(UNIT_RATES[dashState.type] || {});
  let optionsHtml = '';
  units.forEach(u => optionsHtml += `<option value="${u}">${u}</option>`);

  // Clear workspace
  workspace.innerHTML = '';

  if (dashState.action === 'Conversion') {
    workspace.innerHTML = `
      <div class="io-grid">
        <div class="io-box">
          <div class="io-label">FROM</div>
          <div class="io-input-group">
            <input type="number" id="valFrom" class="io-input" value="1" oninput="hideResult()">
            <select id="unitFrom" class="io-select" onchange="hideResult()">${optionsHtml}</select>
          </div>
        </div>
        <div class="io-box">
          <div class="io-label">TO UNIT</div>
          <div class="io-input-group">
          <input type="number" id="valFrom" class="io-input" value="1" oninput="hideResult()">
            <select id="unitTo" class="io-select" onchange="hideResult()">${optionsHtml}</select>
          </div>
        </div>
      </div>
      <div class="action-row">
        <button class="calc-btn" onclick="runConversion()">Convert</button>
      </div>
      <div class="result-box" id="resultBox">
        <div class="result-header">Converted Value</div>
        <div class="result-content" id="resultValue">--</div>
        <div class="result-sub" id="resultUnit">--</div>
      </div>
    `;
    const unitToSelect = document.getElementById('unitTo');
    if(units.length > 1 && unitToSelect) unitToSelect.selectedIndex = 1;
    
  } else if (dashState.action === 'Comparison') {
    workspace.innerHTML = `
      <div class="io-grid">
        <div class="io-box">
          <div class="io-label">VALUE 1</div>
          <div class="io-input-group">
            <input type="number" id="val1" class="io-input" value="1" oninput="hideResult()">
            <select id="unit1" class="io-select" onchange="hideResult()">${optionsHtml}</select>
          </div>
        </div>
        <div class="io-box">
          <div class="io-label">VALUE 2</div>
          <div class="io-input-group">
            <input type="number" id="val2" class="io-input" value="1" oninput="hideResult()">
            <select id="unit2" class="io-select" onchange="hideResult()">${optionsHtml}</select>
          </div>
        </div>
      </div>
      <div class="action-row">
        <button class="calc-btn" onclick="runComparison()">Compare</button>
      </div>
      <div class="result-box" id="resultBox">
        <div class="result-header">Comparison Result</div>
        <div class="result-content" id="resultValue" style="font-size: 28px;">--</div>
      </div>
    `;
    const unit2Select = document.getElementById('unit2');
    if(units.length > 1 && unit2Select) unit2Select.selectedIndex = 1;

  } else if (dashState.action === 'Arithmetic') {
    workspace.innerHTML = `
      <div class="io-grid">
        <div class="io-box">
          <div class="io-label">VALUE 1</div>
          <div class="io-input-group">
            <input type="number" id="val1" class="io-input" value="1" oninput="hideResult()">
            <select id="unit1" class="io-select" onchange="hideResult()">${optionsHtml}</select>
          </div>
        </div>
        <div class="math-operator">
          <select id="mathOp" class="math-select" onchange="hideResult()">
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="*">×</option>
            <option value="/">÷</option>
          </select>
        </div>
        <div class="io-box">
          <div class="io-label">VALUE 2</div>
          <div class="io-input-group">
            <input type="number" id="val2" class="io-input" value="1" oninput="hideResult()">
            <select id="unit2" class="io-select" onchange="hideResult()">${optionsHtml}</select>
          </div>
        </div>
      </div>
      <div class="io-grid" style="margin-top: 20px;">
        <div class="io-box" style="flex: unset; width: 100%;">
          <div class="io-label">TARGET OUTPUT UNIT</div>
          <select id="unitResult" class="io-select" onchange="hideResult()">${optionsHtml}</select>
        </div>
      </div>
      <div class="action-row">
        <button class="calc-btn" onclick="runArithmetic()">Calculate</button>
      </div>
      <div class="result-box" id="resultBox">
        <div class="result-header">Calculated Result</div>
        <div class="result-content" id="resultValue">--</div>
        <div class="result-sub" id="resultUnit">--</div>
      </div>
    `;
  }
}

function showResultBox(val, subText) {
  document.getElementById('resultValue').innerHTML = val;
  const subEl = document.getElementById('resultUnit');
  if(subEl) subEl.innerHTML = subText || '';
  document.getElementById('resultBox').classList.add('show');
}

function runConversion() {
  const valFrom = parseFloat(document.getElementById('valFrom').value) || 0;
  const unitFrom = document.getElementById('unitFrom').value;
  const unitTo = document.getElementById('unitTo').value;

  // Convert to Base, then to Target
  const baseVal = toBase(valFrom, unitFrom, dashState.type);
  const finalVal = fromBase(baseVal, unitTo, dashState.type);

  showResultBox(parseFloat(finalVal.toFixed(4)), unitTo);
}

function runComparison() {
  const val1 = parseFloat(document.getElementById('val1').value) || 0;
  const val2 = parseFloat(document.getElementById('val2').value) || 0;
  const unit1 = document.getElementById('unit1').value;
  const unit2 = document.getElementById('unit2').value;

  // Convert both to base units to safely compare
  const base1 = toBase(val1, unit1, dashState.type);
  const base2 = toBase(val2, unit2, dashState.type);

  // Allow tiny floating point differences
  const diff = base1 - base2;
  const epsilon = 0.000001; 
  
  let stringResult = "";
  if (Math.abs(diff) < epsilon) {
    stringResult = `<span style="color:#2ecc71;">${val1} ${unit1} is <b>Equal To</b> ${val2} ${unit2}</span>`;
  } else if (diff > 0) {
    stringResult = `${val1} ${unit1} is <br/><b>Greater Than</b><br/> ${val2} ${unit2}`;
  } else {
    stringResult = `${val1} ${unit1} is <br/><b>Less Than</b><br/> ${val2} ${unit2}`;
  }

  showResultBox(stringResult, null);
}

function runArithmetic() {
  const val1 = parseFloat(document.getElementById('val1').value) || 0;
  const val2 = parseFloat(document.getElementById('val2').value) || 0;
  const unit1 = document.getElementById('unit1').value;
  const unit2 = document.getElementById('unit2').value;
  const op = document.getElementById('mathOp').value;
  const unitResult = document.getElementById('unitResult').value;

  // Convert to base units for calculation
  const base1 = toBase(val1, unit1, dashState.type);
  const base2 = toBase(val2, unit2, dashState.type);

  let baseResult = 0;
  switch (op) {
    case '+': baseResult = base1 + base2; break;
    case '-': baseResult = base1 - base2; break;
    case '*': baseResult = base1 * base2; break;
    case '/': baseResult = base2 !== 0 ? (base1 / base2) : 0; break; 
  }

  // Handle Division by zero gracefully
  if (op === '/' && base2 === 0) {
    showResultBox("Cannot divide by zero", "");
    return;
  }

  // Convert back from base to the selected target unit
  const finalVal = fromBase(baseResult, unitResult, dashState.type);
  showResultBox(parseFloat(finalVal.toFixed(4)), unitResult);
}