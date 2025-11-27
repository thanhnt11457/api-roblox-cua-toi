const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Roblox Proxy Server is Running! (Fixed ID Version)');
});

app.get('/api/gamepasses/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`--- BAT DAU TIM KIEM USER ID: ${userId} ---`);
    
    try {
        // 1. Lấy danh sách Game
        const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
        const gamesResponse = await axios.get(gamesUrl);
        const games = gamesResponse.data.data;

        if (!games || games.length === 0) {
            console.log("=> User nay khong co game Public nao.");
            return res.json({ success: true, count: 0, data: [], message: "No public games found" });
        }

        console.log(`=> Tim thay ${games.length} game. Bat dau quet...`);
        let allGamepasses = [];

        // 2. Duyệt từng Game
        const promises = games.map(async (game) => {
            try {
                // --- SỬA LỖI Ở ĐÂY ---
                // Dùng game.id (Universe ID) thay vì game.rootPlaceId
                const passUrl = `https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100`;
                
                const passResponse = await axios.get(passUrl);
                const passes = passResponse.data.data;
                
                if (passes.length > 0) {
                    console.log(`   > Game: ${game.name} - Tim thay ${passes.length} passes`);
                }

                return passes.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    imageId: p.id
                }));
            } catch (err) {
                return [];
            }
        });

        const results = await Promise.all(promises);
        
        results.forEach(group => {
            allGamepasses = allGamepasses.concat(group);
        });

        // 3. Lọc gamepass có giá bán
        const forSalePasses = allGamepasses.filter(p => p.price && p.price > 0);
        console.log(`=> KET QUA CUOI CUNG: Tim thay ${forSalePasses.length} gamepass.`);

        res.json({ success: true, count: forSalePasses.length, data: forSalePasses });

    } catch (error) {
        console.error("LOI SERVER:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
