function recommendFuel() {
    const vehicle = document.getElementById("vehicle-type").value;
    const recommendation = document.getElementById("fuel-recommendation");

    if (vehicle === "car") recommendation.innerText = "Recommended: Petrol";
    else if (vehicle === "motorbike") recommendation.innerText = "Recommended: Petrol (Regular)";
    else if (vehicle === "truck") recommendation.innerText = "Recommended: Diesel";
    else recommendation.innerText = "Please select a vehicle type.";
  }


async function fetchCurrentLitrePrice(){
    try {
        const res = await axios.get('http://localhost:5000/fuel_stock/rate_per_litre');
        const value = res.data.cost_per_litre ;
        return value;
    } catch (error) {
        console.error(err);
    }


}

async function handlePurchase(e) {
  e.preventDefault();
  const liters = parseFloat(document.getElementById("liters").value);
  const paymentMethod = "cash";

  try {
    const res = await axios.get('http://localhost:5000/active_stock/current');
    const { selling_price, fuel_type, fuel_id } = res.data;

    const total = (liters * selling_price).toFixed(2);

    // Show invoice
    document.getElementById("invoice").classList.remove("hidden");
    document.getElementById("invoice-details").innerHTML = `
      <p><strong>Fuel Type:</strong> ${fuel_type}</p>
      <p><strong>Liters:</strong> ${liters}</p>
      <p><strong>Rate per Liter:</strong> PKR ${selling_price}</p>
      <p><strong>Total Paid:</strong> PKR ${total}</p>
      <p class="text-green-600 mt-2">✅ Nozzle Unlocked. You may refuel now.</p>
    `;

    // Save sale in database
    await axios.post('http://localhost:5000/fuel_sales', {
      fuel_id,
      liters_purchased: liters,
      cost_per_litre: selling_price,
      total_amount: total,
      payment_method: paymentMethod
    });

  } catch (err) {
    console.error("Purchase failed:", err);
    alert("Could not complete purchase. Please try again.");
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  const rateElement = document.getElementById("current-rate");
  try {
    const price = await fetchCurrentLitrePrice();
    if (price) {
      rateElement.textContent = `PKR ${price}`;
    } else {
      rateElement.textContent = "Not Available";
    }
  } catch (err) {
    rateElement.textContent = "Error loading";
  }
});
