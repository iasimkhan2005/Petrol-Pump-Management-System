fetchRemainingFuel();
//This function will the show the content of the selected section on the left navbar and hide the others 
function showsection(id){
    const sections = document.querySelectorAll('main .section');
    sections.forEach(section => section.classList.add('hidden'));

    const target = document.getElementById(id);
    if(target){
        target.classList.remove('hidden');
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