const getId = async ()=>{
    const result = await axios.get('http://localhost:5000/')

    document.getElementById('litres').innerHTML = result.data[0].ID
}

getId()
