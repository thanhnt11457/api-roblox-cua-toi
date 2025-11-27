const express = require('express');
const axios = require('axios'); // Gọi thư viện axios
const app = express();
const port = process.env.PORT || 3000;

// Trang chủ để test server sống hay chết
app.get('/', (req, res) => {
    res.send('Roblox Proxy Server is Running! (Updated Version)');
});

// API chính để lấy Gamepass
app.get('/api/gamepasses/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`--- BAT DAU TIM KIEM USER ID: ${userId} ---`);
    
    try {
        // BƯỚC 1: Lấy danh sách Game (Place) công khai
        // API này lấy các game mà user tạo và để Public
        const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
        const gamesResponse = await axios.get(gamesUrl);
        const games = gamesResponse.data.data;

        if (!games || games.length === 0) {
            console.log("=> User nay khong co game Public nao.");
            return res.json({ success: true, count: 0, data: [], message: "No public games found" });
        }

        console.log(`=> Tim thay ${games.length} game. Bat dau quet tung game...`);
        let allGamepasses = [];

        // BƯỚC 2: Duyệt qua từng Game để lấy Gamepass bên trong
        const promises = games.map(async (game) => {
            try {
                const passUrl = `https://games.roblox.com/v1/games/${game.rootPlaceId}/game-passes?limit=100`;
                const passResponse = await axios.get(passUrl);
                const passes = passResponse.data.data;
                
                // Trả về danh sách gamepass kèm theo ID ảnh
                return passes.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    imageId: p.id // ID ảnh gamepass thường trùng với ID gamepass
                }));
            } catch (err) {
                return []; // Nếu game lỗi thì bỏ qua
            }
        });

        // Chờ tất cả các game quét xong
        const results = await Promise.all(promises);
        
        // Gộp kết quả lại
        results.forEach(group => {
            allGamepasses = allGamepasses.concat(group);
        });

        // BƯỚC 3: Chỉ lấy những gamepass ĐANG BÁN (có giá tiền > 0)
        const forSalePasses = allGamepasses.filter(p => p.price && p.price > 0);
        console.log(`=> KET QUA: Tim thay ${forSalePasses.length} gamepass ban duoc.`);

        // Trả kết quả về cho Roblox
        res.json({ success: true, count: forSalePasses.length, data: forSalePasses });

    } catch (error) {
        console.error("LOI SERVER:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
