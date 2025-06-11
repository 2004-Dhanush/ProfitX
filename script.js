
const INR_RATE = 1;
const API_URL = "https://analytics-b01j.onrender.com/entries";

async function uploadEntry() {
  const date = document.getElementById("inputDate").value;
  const invest = parseFloat(document.getElementById("inputInvestment").value);
  const cash = parseFloat(document.getElementById("inputCash").value);
  const gpay = parseFloat(document.getElementById("inputGpay").value);

  if (!date || isNaN(invest) || isNaN(cash) || isNaN(gpay)) {
    alert("Please fill out all fields correctly.");
    return;
  }

  const profit = -invest + cash + gpay;
  const entry = { date, invest, cash, gpay, profit };

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  clearForm();
  updateUI();
}

function clearForm() {
  document.getElementById("inputDate").value = "";
  document.getElementById("inputInvestment").value = "";
  document.getElementById("inputCash").value = "";
  document.getElementById("inputGpay").value = "";
}


async function applyFilter() {
  const month = document.getElementById("monthFilter").value;
  const year = document.getElementById("yearFilter").value;

  const res = await fetch("https://analytics-b01j.onrender.com/entries");
  const data = await res.json();

  const filtered = data.filter(entry => {
    const d = new Date(entry.date);
    const isMonthMatch = month === "" || d.getMonth().toString() === month;
    const isYearMatch = year === "" || d.getFullYear().toString() === year;
    return isMonthMatch && isYearMatch;
  });

  const totalInvested = filtered.reduce((acc, val) => acc + val.invest, 0);
  const totalCash = filtered.reduce((acc, val) => acc + val.cash, 0);
  const totalGpay = filtered.reduce((acc, val) => acc + val.gpay, 0);

  document.getElementById("totalInvested").textContent = `₹${totalInvested.toFixed(2)}`;
  document.getElementById("totalCash").textContent = `₹${totalCash.toFixed(2)}`;
  document.getElementById("totalGpay").textContent = `₹${totalGpay.toFixed(2)}`;
  document.getElementById("totalIncome").textContent = `₹${(totalCash + totalGpay).toFixed(2)}`;
}


async function updateUI() {
  const res = await fetch(API_URL);
  const entries = await res.json();

  if (document.getElementById("historyTable")) {
    renderTable(entries);
  }

  updateDashboard(entries);
  renderChart(entries);
}

function renderTable(entries) {
  const table = document.getElementById("historyTable");
  table.innerHTML = "";

  entries.forEach(entry => {
    const color = entry.profit >= 0 ? 'green' : 'red';
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <span class="display">${entry.date}</span>
        <input class="edit-input"  type="date" value="${entry.date}" style="display:none" />
      </td>
      <td>
        <span class="display">₹${entry.invest.toFixed(2)}</span>
        <input class="edit-input"  type="number" value="${entry.invest}" style="display:none" />
      </td>
      <td>
        <span class="display">₹${entry.cash.toFixed(2)}</span>
        <input class="edit-input" type="number" value="${entry.cash}" style="display:none" />
      </td>
      <td>
        <span class="display">₹${entry.gpay.toFixed(2)}</span>
        <input class="edit-input" type="number" value="${entry.gpay}" style="display:none" />
      </td>
      <td style="color:${color};">
        <span class="display">₹${entry.profit.toFixed(2)}</span>
      </td>
      <td>
       <button class="edit-btn" title="Edit" style="font-size:16px;padding:10px 15px;"><i class="fas fa-edit"></i></button>
    <button class="update-btn" style="display:none;font-size:16.5px;padding:10px 15px" title="Update"><i class="fas fa-check"></i></button>
    <button class="delete-btn" title="Delete" style="font-size:16px;padding:10px 15px;margin-top:5px"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;

    table.appendChild(tr);

    const editBtn = tr.querySelector(".edit-btn");
    const updateBtn = tr.querySelector(".update-btn");
    const deleteBtn = tr.querySelector(".delete-btn");

    editBtn.onclick = () => {
      toggleEdit(tr, true);
      editBtn.style.display = "none";
      updateBtn.style.display = "inline-block";
    };

    updateBtn.onclick = async () => {
      const inputs = tr.querySelectorAll(".edit-input");
      const date = inputs[0].value;
      const invest = parseFloat(inputs[1].value);
      const cash = parseFloat(inputs[2].value);
      const gpay = parseFloat(inputs[3].value);

      if (!date || isNaN(invest) || isNaN(cash) || isNaN(gpay)) {
        alert("Please fill out all fields correctly.");
        return;
      }

      const profit = -invest + cash + gpay;
      const updatedEntry = { date, invest, cash, gpay, profit };

      await fetch(`${API_URL}/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEntry),
      });

      toggleEdit(tr, false);
      editBtn.style.display = "inline-block";
      updateBtn.style.display = "none";

      updateUI();
    };

    deleteBtn.onclick = async () => {
      if (!confirm("Are you sure you want to delete this entry?")) return;
      await fetch(`${API_URL}/${entry._id}`, { method: "DELETE" });
      updateUI();
    };
  });
}

function toggleEdit(tr, isEdit) {
  const spans = tr.querySelectorAll("span.display");
  const inputs = tr.querySelectorAll(".edit-input");
  spans.forEach(span => (span.style.display = isEdit ? "none" : "inline"));
  inputs.forEach(input => (input.style.display = isEdit ? "inline-block" : "none"));
}

function updateDashboard(entries) {
  if (!document.getElementById("profit")) return;

  let totalProfit = 0, totalInvestment = 0, totalCash = 0, totalGpay = 0;
  let todayProfit = 0, todayInvestment = 0, monthlyProfit = 0;

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth();

  entries.forEach(entry => {
    totalProfit += entry.profit;
    totalInvestment += entry.invest;
    totalCash += entry.cash;
    totalGpay += entry.gpay;

    const entryDate = new Date(entry.date);
    if (entry.date === today) {
      todayProfit += entry.profit;
      todayInvestment += entry.invest;
    }
    if (entryDate.getMonth() === currentMonth) {
      monthlyProfit += entry.profit;
    }
  });

  document.getElementById("profit").textContent = `₹${todayProfit.toFixed(2)}`;
  document.getElementById("investment").textContent = `₹${todayInvestment.toFixed(2)}`;
  document.getElementById("monthlyProfit").textContent = monthlyProfit.toFixed(2);
  document.getElementById("totalCash").textContent = `₹${totalCash.toFixed(2)}`;
  document.getElementById("totalGpay").textContent = `₹${totalGpay.toFixed(2)}`;
  document.getElementById("totalIncome").textContent = `₹${(totalCash + totalGpay).toFixed(2)}`;

  const monthName = new Date().toLocaleString("default", { month: "long" });
  document.getElementById("monthHeader").textContent = `${monthName}'s Profit`;
}

function updateTotals(entries) {
  const totalInvest = entries.reduce((sum, entry) => sum + entry.invest, 0);

  const investEl = document.getElementById("totalInvested");
  if (investEl) investEl.textContent = `₹${totalInvest.toFixed(2)}`;
}


function renderChart(entries) {
  if (!document.getElementById('profitChart')) return;

  const ctx = document.getElementById('profitChart').getContext('2d');
  const labels = entries.map(e => e.date);  // X-axis: Dates
  const data = entries.map(e => (e.profit * INR_RATE).toFixed(2)); // Y-axis: Profits

  if (window.myChart) window.myChart.destroy();  // Clear existing chart if any

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Profit Over Time (₹)',
        data: data,
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        fill: true,
        tension: 0.4  // Smooth curve
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Profit (₹)'
          },
          beginAtZero: true
        }
      }
    }
  });
}


function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const date = now.toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  if (document.getElementById('clock')) {
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById('dateNow').textContent = date;
  }
}

setInterval(updateClock, 1000);

async function initializeApp() {

    const res = await fetch("https://analytics-b01j.onrender.com/entries");
    const entries = await res.json();
    if(entries){
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('nav.bottom-nav').style.display = 'flex';
   }
}
initializeApp();

window.onload = async () => {
  const res = await fetch(API_URL);
  const entries = await res.json();

  updateUI();        // existing UI update
  renderChart(entries); // existing chart render
  updateTotals(entries); // <- add this line
  applyFilter();
};

