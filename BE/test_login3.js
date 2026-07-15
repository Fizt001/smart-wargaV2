fetch('http://localhost:8000/api/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: JSON.stringify({
        email: 'admin@sip.com',
        password: 'password123'
    })
}).then(r => r.text()).then(t => console.log(t));
