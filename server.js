const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Server Running: T-Shirt Scanner ONLY');
});

// API chỉ tìm kiếm T-Shirt/Clothing (ít bị chặn nhất)
app.get('/api/gamepasses/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`\n========== BAT DAU QUET T-SHIRT CHO USER: ${userId} ==========`);
    
    try {
        // Goi API Catalog de tim quan ao duoc tao boi User ID nay
        // category=3 la Clothing, sortType=5 la moi nhat
        const clothingUrl = `https://catalog.roblox.com/v1/search/items?category=3&creatorTargetId=${userId}&limit=100&sortType=5`;
        
        const clothingResponse = await axios.get(clothingUrl);
        const clothes = clothingResponse.data.data || [];

        // Chuyen doi ket qua
        const forSaleItems = clothes
            .filter(c => c.price && c.price > 0) // Loc nhung mon dang ban
            .map(c => ({
                id: c.id,
                name: "[ITEM] " + c.name, // Danh dau la Item
                price: c.price,
                imageId: c.id,
                type: "Clothing" // Loai de Client biet cach mua
            }));

        console.log(`=> KET QUA: Tim thay tong cong ${forSaleItems.length} vat pham. `);

        res.json({ success: true, count: forSaleItems.length, data: forSaleItems });

    } catch (error) {
        console.error("LOI API CATALOG:", error.message);
        // Tra ve ket qua 0 neu gap loi
        res.status(200).json({ success: true, count: 0, data: [] });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
