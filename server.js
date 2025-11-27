const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('API dang chay ngon lanh!');
});

app.get('/api/hello', (req, res) => {
    res.json({ 
        message: 'Ket noi thanh cong!', 
        status: 'OK' 
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});