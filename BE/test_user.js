fetch('http://localhost:8000/api/user', {
    method: 'GET', 
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer 3|UO8vIOlklWqKExHlEq0m7IfqmyQkVgnH0I1PpALS92320d74'
    }
}).then(r=>r.text()).then(t=>console.log(t));
