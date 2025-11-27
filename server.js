const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('SERVER DEBUG MODE: EXTREME');
});

app.get('/api/gamepasses/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`\n\n[START] BAT DAU SOI USER ID: ${userId}`);
    
    let logs = []; // Lưu lại log để trả về cho client xem luôn

    function log(msg) {
        console.log(msg);
        logs.push(msg);
    }

    try {
        // BƯỚC 1: LẤY DANH SÁCH GAME
        // Mình bỏ filter Public đi để xem nó có tìm thấy game Private không
        const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?limit=50`; 
        log(`1. Goi API lay danh sach Game: ${gamesUrl}`);
        
        const gamesResponse = await axios.get(gamesUrl);
        const games = gamesResponse.data.data;

        if (!games || games.length === 0) {
            log("❌ KET QUA: Roblox bao User nay khong co game nao ca (Rong).");
            return res.json({ success: true, count: 0, logs: logs });
        }

        log(`✅ TIM THAY: ${games.length} Game.`);

        let allPasses = [];

        // BƯỚC 2: DUYỆT TỪNG GAME (BỎ TRY-CATCH ĐỂ HIỆN LỖI)
        for (const game of games) {
            log(`------------------------------------------------`);
            log(`➡️ DANG KIEM TRA GAME: [${game.name}] (UniverseID: ${game.id})`);
            
            // Link lấy Gamepass
            const passUrl = `https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100`;
            
            try {
                const passResponse = await axios.get(passUrl);
                const passes = passResponse.data.data;

                if (passes.length === 0) {
                    log(`   ⚠️ Game nay khong co Gamepass nao.`);
                } else {
                    log(`   ✅ Game nay co ${passes.length} Gamepass raw:`);
                    passes.forEach(p => {
                        log(`      - Ten: ${p.name} | Gia: ${p.price} | ID: ${p.id}`);
                    });
                }

                // Map dữ liệu
                const mapped = passes.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    imageId: p.id,
                    gameName: game.name
                }));
                allPasses = allPasses.concat(mapped);

            } catch (err) {
                // IN RA LỖI CỤ THỂ NẾU ROBLOX CHẶN
                log(`   ❌ LOI KHI GOI API GAMEPASS: ${err.message}`);
                if (err.response) {
                    log(`   status: ${err.response.status} - ${err.response.statusText}`);
                }
            }
        }

        // BƯỚC 3: KẾT QUẢ
        const validPasses = allPasses.filter(p => p.price && p.price > 0);
        log(`\n[KET THUC] Tong tim thay: ${validPasses.length} Gamepass ban duoc.`);

        res.json({ 
            success: true, 
            count: validPasses.length, 
            data: validPasses,
            debug_logs: logs 
        });

    } catch (error) {
        log("❌ LOI SERVER FATAL: " + error.message);
        res.json({ success: false, error: error.message, logs: logs });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
