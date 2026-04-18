import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYA_Y3SpzdwQNklKFoa3HZiJPT8kxqjO8",
    authDomain: "multiplayer-cf14f.firebaseapp.com",
    projectId: "multiplayer-cf14f",
    storageBucket: "multiplayer-cf14f.firebasestorage.app",
    messagingSenderId: "1042297372152",
    appId: "1:1042297372152:web:8d9907215d13682ed52a0d",
    measurementId: "G-2MC5YTDWKY"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let myId = Math.random().toString(36).substring(7);
let myData = null;

window.startGame = () => {
    const name = document.getElementById('username').value || "Hráč";
    const role = document.getElementById('role').value;

    myData = {
        id: myId,
        name: name,
        role: role,
        x: Math.floor(Math.random() * (window.innerWidth - 100)),
        y: Math.floor(Math.random() * (window.innerHeight - 100)),
        isRolling: false,
        isSick: false
    };

    console.log("Hra spuštěna pro:", myData);

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('status').innerText = `Hraješ jako: ${name} (${role})`;
    
    if(role.includes('panda')) {
        document.getElementById('roll-btn').style.display = 'block';
    }

    const playerRef = ref(db, 'players/' + myId);
    set(playerRef, myData);
    onDisconnect(playerRef).remove();

    setupControls();
    setupGameSync();
};

function setupControls() {
    window.addEventListener('keydown', (e) => {
        if (!myData) return;
        const step = 20;
        let moved = false;

        if (e.key === "ArrowLeft")  { myData.x -= step; moved = true; }
        if (e.key === "ArrowRight") { myData.x += step; moved = true; }
        if (e.key === "ArrowUp")    { myData.y -= step; moved = true; }
        if (e.key === "ArrowDown")  { myData.y += step; moved = true; }

        if (moved) {
            update(ref(db, 'players/' + myId), { x: myData.x, y: myData.y });
        }
    });
}

function setupGameSync() {
    onValue(ref(db, 'players'), (snapshot) => {
        const players = snapshot.val() || {};
        const world = document.getElementById('game-world');
        world.innerHTML = ''; // Vyčistit scénu
        
        Object.values(players).forEach(p => {
            const div = document.createElement('div');
            div.className = `player ${p.isRolling ? 'roll' : ''}`;
            div.style.left = p.x + 'px';
            div.style.top = p.y + 'px';
            
            // Styl podle role (když nejdou obrázky)
            let color = "white";
            if(p.role === 'panda_normal') color = "black";
            if(p.role === 'panda_rare') color = "brown";
            if(p.role === 'chovatel') color = "blue";
            
            div.style.backgroundColor = color;
            div.style.borderRadius = p.role === 'chovatel' ? '0' : '50%';
            div.style.border = "2px solid white";

            div.innerHTML = `<div style="position:absolute; top:-25px; width:100px; left:-25px; font-weight:bold; color:black; text-shadow: 1px 1px white;">${p.name} ${p.isSick ? '🤒' : ''}</div>`;
            
            if(myData && myData.role === 'chovatel' && p.role.includes('panda') && p.isSick) {
                div.style.cursor = "pointer";
                div.onclick = () => update(ref(db, 'players/' + p.id), { isSick: false });
            }

            world.appendChild(div);
        });
    });
}

window.triggerRoll = () => {
    update(ref(db, 'players/' + myId), { isRolling: true });
    setTimeout(() => update(ref(db, 'players/' + myId), { isRolling: false }), 800);
};
