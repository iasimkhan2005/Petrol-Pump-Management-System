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
        const value = res.data[0].cost_per_litre ;
        return value;
    } catch (error) {
        console.error(err);
    }


}

  function handlePurchase(e) {
    e.preventDefault();
    const liters = document.getElementById("liters").value;
    const price = fetchCurrentLitrePrice(); // show the current rate per litre
    const total = (liters * price).toFixed(2);

    document.getElementById("invoice").classList.remove("hidden");
    document.getElementById("invoice-details").innerHTML = `
      <p><strong>Fuel Type:</strong> Petrol</p>
      <p><strong>Liters:</strong> ${liters}</p>
      <p><strong>Rate per Liter:</strong> PKR ${price}</p>
      <p><strong>Total Paid:</strong> PKR ${total}</p>
      <p class="text-green-600 mt-2">✅ Nozzle Unlocked. You may refuel now.</p>
    `;
  }