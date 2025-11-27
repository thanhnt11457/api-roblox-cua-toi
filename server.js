const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Roblox Proxy Server is Running!');
});

// API chính: Lấy Gamepass của một người dùng
app.get('/api/gamepasses/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        // BƯỚC 1: Lấy danh sách Game (Place) công khai của người đó
        const gamesResponse = await axios.get(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`);
        const games = gamesResponse.data.data;

        if (!games || games.length === 0) {
            return res.json({ success: true, data: [] }); // Không có game nào
        }

        let allGamepasses = [];

        // BƯỚC 2: Duyệt qua từng Game để lấy Gamepass
        // (Dùng Promise.all để chạy song song cho nhanh)
        const promises = games.map(async (game) => {
            try {
                const passUrl = `https://games.roblox.com/v1/games/${game.rootPlaceId}/game-passes?limit=100`;
                const passResponse = await axios.get(passUrl);
                const passes = passResponse.data.data;
                
                // Thêm tên Game vào thông tin Gamepass để dễ hiển thị
                return passes.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    description: p.description,
                    gameName: game.name,
                    imageId: p.id // Gamepass Icon ID thường trùng với ID pass
                }));
            } catch (err) {
                return []; // Nếu game này lỗi thì bỏ qua
            }
        });

        const results = await Promise.all(promises);
        
        // Gộp tất cả kết quả lại thành 1 danh sách
        results.forEach(group => {
            allGamepasses = allGamepasses.concat(group);
        });

        // Lọc bỏ những gamepass không bán (không có giá)
        const forSalePasses = allGamepasses.filter(p => p.price && p.price > 0);

        res.json({ success: true, count: forSalePasses.length, data: forSalePasses });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Loi khi lay du lieu tu Roblox' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
