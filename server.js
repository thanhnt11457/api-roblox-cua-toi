const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hybrid Scanner (Gamepass + Clothing) is Running!');
});

app.get('/api/gamepasses/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`\n========== BAT DAU QUET USER: ${userId} ==========`);
    
    let allItems = [];

    try {
        // --- PHẦN 1: QUÉT GAMEPASS (Trong các Game Public) ---
        console.log("1. Dang quet Gamepass...");
        try {
            const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
            const gamesResponse = await axios.get(gamesUrl);
            const games = gamesResponse.data.data || [];

            console.log(`   -> Tim thay ${games.length} game Public.`);

            const gamePromises = games.map(async (game) => {
                try {
                    // Lưu ý: Dùng game.id (Universe ID)
                    const passUrl = `https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100`;
                    const passResponse = await axios.get(passUrl);
                    const passes = passResponse.data.data || [];
                    
                    if (passes.length > 0) console.log(`      + Game [${game.name}] co ${passes.length} passes.`);
                    
                    return passes.map(p => ({
                        id: p.id,
                        name: "[PASS] " + p.name, // Đánh dấu đây là Gamepass
                        price: p.price,
                        imageId: p.id,
                        type: "Gamepass"
                    }));
                } catch (e) { return []; }
            });

            const gamepassResults = await Promise.all(gamePromises);
            gamepassResults.forEach(group => allItems = allItems.concat(group));

        } catch (err) {
            console.log("   ! Loi phan quet Gamepass: " + err.message);
        }

        // --- PHẦN 2: QUÉT QUẦN ÁO (T-Shirt, Shirt) ---
        // Đề phòng trường hợp bạn tạo nhầm Gamepass thành Áo, hoặc Gamepass bị ẩn
        console.log("2. Dang quet T-Shirt/Shirt tren Catalog...");
        try {
            // Tìm đồ do User tạo (Category 3 = Clothing)
            const clothingUrl = `https://catalog.roblox.com/v1/search/items?category=Clothing&creatorTargetId=${userId}&limit=100&sortType=RecentlyCreated`;
            const clothingResponse = await axios.get(clothingUrl);
            const clothes = clothingResponse.data.data || [];

            console.log(`   -> Tim thay ${clothes.length} mon do Clothing.`);

            const validClothes = clothes.map(c => ({
                id: c.id,
                name: "[ITEM] " + c.name, // Đánh dấu đây là Clothing
                price: c.price,
                imageId: c.id, // Với Clothing, ID sản phẩm dùng làm ảnh được luôn
                type: "Clothing" 
            }));

            allItems = allItems.concat(validClothes);

        } catch (err) {
            console.log("   ! Loi phan quet Clothing: " + err.message);
        }

        // --- TỔNG KẾT ---
        // Lọc những món có giá bán > 0
        const forSaleItems = allItems.filter(p => p.price && p.price > 0);
        
        console.log(`=> TONG KET: Tim thay tong cong ${forSaleItems.length} vat pham (Gamepass + Ao).`);

        res.json({ success: true, count: forSaleItems.length, data: forSaleItems });

    } catch (error) {
        console.error("LOI SERVER:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
