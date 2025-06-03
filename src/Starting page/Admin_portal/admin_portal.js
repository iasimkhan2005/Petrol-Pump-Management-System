fetchRemainingFuel();
//This function will the show the content of the selected section on the left navbar and hide the others 
function showsection(id){
    const sections = document.querySelectorAll('main .section');
    sections.forEach(section => section.classList.add('hidden'));

    const target = document.getElementById(id);
    if(target){
        target.classList.remove('hidden');

        // Refresh dashboard content every time it's shown
        if (id === 'dashboard') {
            showActiveStockOnDashboard();
            fetchRemainingFuel(); // also refresh fuel info
        }

        else if (id === 'sales-report') {
            loadSalesReport();
        }
    }
}


async function showActiveStockOnDashboard() {
    try {
        const res = await axios.get('http://localhost:5000/active_stock/current');
        const { stock_id, selling_price, remaining_fuel, fuel_type } = res.data;

        const existingCard = document.getElementById('activeStockCard');
        if (existingCard !== null && existingCard !== undefined) {
            existingCard.remove();
        }


        const container = document.createElement('div');
        container.id = 'activeStockCard'; 
        container.innerHTML = `
            <div class="bg-white shadow-md rounded-lg p-6 dashboard-box mt-4">
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Active Fuel Stock</h3>
                <p class="text-gray-800">Fuel: <strong>${fuel_type}</strong></p>
                <p class="text-gray-800">Selling Price: <strong>PKR ${selling_price}</strong></p>
                <p class="text-gray-800">Remaining: <strong>${remaining_fuel} Liters</strong></p>
                <p class="text-gray-800">Stock ID: <strong>${stock_id}</strong></p>
            </div>
        `;
        document.getElementById('dashboard').appendChild(container);
    } catch (err) {
        console.error('Error fetching active stock', err);
    }
}

//this Function will show the remaining fuel in the fuel stock and on Dashboard section
async function fetchRemainingFuel() {
    try {
        const res = await axios.get('http://localhost:5000/fuel_stock/remaining_fuel');
        const value = res.data[0].Remaining_fuel + ' Liters';
        
        document.querySelectorAll('.remainingFuel').forEach(el => {
            el.textContent = value;
        });
    } catch (err) {
        console.error(err);
        document.querySelectorAll('.remainingFuel').forEach(el => {
            el.textContent = 'Error loading';
        });
    }
}

//Get the data from form 
document.addEventListener('DOMContentLoaded', () => {
document.getElementById('fuelForm').addEventListener('submit',async (e) => {

    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
// --- ADD THESE CONSOLE.LOGS ---
console.log('Raw form data from Object.fromEntries:', data);
// --- END OF RAW DATA LOG ---
    data.total_cost = (parseFloat(data.quantity) * parseFloat(data.cost_per_litre)).toFixed(2);
    data.created_by = 1; 
    const now = new Date();
    data.created_at = now.toISOString().slice(0, 19).replace('T', ' ');
    data.remaining_fuel = parseInt(data.quantity);
    data.fuel_sales = 0;
// --- ADD THIS CONSOLE.LOG ---
console.log('Final data object before sending to server:', data);
// --- END OF FINAL DATA LOG ---
    try {
        await axios.post('http://localhost:5000/fuel_stock/insert', data);
        alert('Fuel stock added successfully!');
        e.target.reset(); // Clear form
        fetchRemainingFuel(); // Refresh displayed stock
    } catch (err) {
        console.error("Error response:", err.response?.data || err.message);
    alert('Error adding fuel stock');
    }

});  

});

// Fetch stock list and populate dropdown
async function populateStockDropdown() {
    try {
        const res = await axios.get('http://localhost:5000/fuel_stock/all');
        const dropdown = document.getElementById('stockSelect');
        dropdown.innerHTML = '<option value="">-- Select Fuel Stock --</option>';

        res.data.forEach(stock => {
            const option = document.createElement('option');
            option.value = stock.stock_id;
            option.textContent = `Fuel: ${stock.fuel_type} | Qty: ${stock.quantity}L | Cost: ${stock.cost_per_litre} | Date: ${stock.purchase_date}`;
            dropdown.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load stock list:", err);
    }
}


//sales report
async function loadSalesReport() {
    try {
      const res = await axios.get('http://localhost:5000/sales_report');
      const data = res.data;
      const tableBody = document.getElementById('salesTableBody');
      tableBody.innerHTML = ''; // Clear previous rows
  
      let totalLiters = 0;
      let totalRevenue = 0;
  
      data.forEach(sale => {
        totalLiters += parseFloat(sale.liters_purchased);
        totalRevenue += parseFloat(sale.total_amount);
  
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2">${new Date(sale.sale_date).toLocaleString()}</td>
          <td class="px-4 py-2">${sale.fuel_type}</td>
          <td class="px-4 py-2">${sale.liters_purchased}</td>
          <td class="px-4 py-2">PKR ${sale.cost_per_litre}</td>
          <td class="px-4 py-2">PKR ${sale.total_amount}</td>
          <td class="px-4 py-2">${sale.payment_method}</td>
        `;
        tableBody.appendChild(row);
      });
  
      // Show summary
      document.getElementById('salesSummary').textContent =
        `Total Liters Sold: ${totalLiters} | Total Revenue: PKR ${totalRevenue.toFixed(2)}`;
  
    } catch (err) {
      console.error('Error loading sales report:', err);
    }
  }


  //Expenses

  async function loadExpenses() {
    try {
      const res = await axios.get('http://localhost:5000/expenses');
      const body = document.getElementById('expenseTableBody');
      body.innerHTML = '';
      res.data.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2">${exp.expense_date}</td>
          <td class="px-4 py-2">${exp.category}</td>
          <td class="px-4 py-2">PKR ${exp.amount}</td>
          <td class="px-4 py-2">${exp.notes || ''}</td>
        `;
        body.appendChild(row);
      });
    } catch (err) {
      console.error('Error loading expenses:', err);
    }
  }

  //Vendors

  async function loadVendors() {
    try {
      const res = await axios.get('http://localhost:5000/vendors');
      const body = document.getElementById('vendorTableBody');
      body.innerHTML = '';
      res.data.forEach(v => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2">${v.name}</td>
          <td class="px-4 py-2">${v.Phone_Number || '-'}</td>
          <td class="px-4 py-2">${v.email || '-'}</td>
        `;
        body.appendChild(row);
      });
    } catch (err) {
      console.error('Error loading vendors:', err);
    }
  }
  
  async function loadAlerts() {
    try {
      const res = await axios.get('http://localhost:5000/alerts');
      const container = document.getElementById('alertsContainer');
      container.innerHTML = '';
      res.data.forEach(alert => {
        const div = document.createElement('div');
        div.className = 'bg-yellow-100 p-4 rounded shadow';
        div.innerHTML = `
          <h3 class="font-semibold text-lg text-yellow-700">${alert.title}</h3>
          <p class="text-gray-800">${alert.message}</p>
          <p class="text-sm text-gray-500">${new Date(alert.created_at).toLocaleString()}</p>
        `;
        container.appendChild(div);
      });
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }
  //DOMCONTENTLOADED EVENT
document.addEventListener('DOMContentLoaded', () => {
    populateStockDropdown();
    showActiveStockOnDashboard();

    const stockSelect = document.getElementById('stockSelect');
    const priceInput = document.querySelector('input[name="selling_price"]');

    stockSelect.addEventListener('change', async () => {
        const stockId = stockSelect.value;
        if (!stockId) {
            priceInput.value = '';
            return;
        }

        try {
            const res = await axios.get(`http://localhost:5000/fuel_price/${stockId}`);
            priceInput.value = res.data.selling_price;
        } catch (err) {
            priceInput.value = '';
            console.log("No existing price found or error:", err.response?.data?.message || err.message);
        }
    });

    document.getElementById('priceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
    
        const setActive = document.getElementById('setActive').checked;
    
        try {
            await axios.post('http://localhost:5000/fuel_price/set', data);
            
            if (setActive) {
                await axios.post('http://localhost:5000/active_stock/set', { stock_id: data.stock_id });
            }
    
            alert('Price updated successfully!');
            e.target.reset();
            document.getElementById('setActive').checked = false;
    
        } catch (err) {
            console.error(err);
            alert('Error updating price or setting active stock');
        }
    });
    

    
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
      expenseForm.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.added_by = 1;
        try {
          await axios.post('http://localhost:5000/expenses', data);
          e.target.reset();
          loadExpenses();
        } catch (err) {
          alert('Failed to add expense');
          console.error(err);
        }
      });
    }

    
  document.getElementById('vendorForm').addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await axios.post('http://localhost:5000/vendors', data);
      e.target.reset();
      loadVendors();
    } catch (err) {
      alert('Failed to add vendor');
      console.error(err);
    }
  });
});
