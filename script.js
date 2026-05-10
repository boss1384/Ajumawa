
// ================== API KEY ==================
const API_KEY = "da01d7158a60be461c607c6d31470b4e";
// ============================================

let allMatches = [];

async function loadMatches() {
    document.querySelectorAll('.section').forEach(sec => {
        sec.innerHTML = `<div class="loading">🔄 Loading matches... Please wait</div>`;
    });

    try {
        const today = new Date().toISOString().split('T')[0];

        const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
            headers: { "x-apisports-key": API_KEY }
        });

        if (!res.ok) throw new Error("API Error");

        const data = await res.json();
        allMatches = data.response || [];

        if (allMatches.length === 0) {
            showNoMatches();
        } else {
            renderMatches(allMatches);
        }
    } catch (e) {
        console.error(e);
        document.getElementById("europe").innerHTML = `
            <div class="loading">
                ❌ Cannot load matches<br>
                <small>Check your internet or API key</small>
            </div>`;
    }
}

function renderMatches(matches) {
    let eu = "", af = "", as = "", au = "";

    matches.forEach(m => {
        const isLive = m.fixture.status.short === "1H" || m.fixture.status.short === "HT" || 
                      m.fixture.status.short === "2H" || m.fixture.status.short === "ET";

        const html = `
            <div class="match \( {isLive ? 'live' : ''}" onclick="showMatchStats( \){m.fixture.id})">
                <div class="league">
                    \( {m.league.logo ? `<img src=" \){m.league.logo}" alt="">` : ''}
                    ${m.league.name} • ${m.league.country}
                </div>
                <div class="teams">
                    <span>${m.teams.home.name}</span>
                    <span class="score">${m.goals.home ?? 0} - ${m.goals.away ?? 0}</span>
                    <span>${m.teams.away.name}</span>
                </div>
                <div class="info">
                    <span>${isLive ? `⏱ ${m.fixture.status.elapsed || 0}' LIVE` : m.fixture.status.long}</span>
                </div>
            </div>
        `;

        const country = (m.league.country || "").toLowerCase();
        const leagueName = (m.league.name || "").toLowerCase();

        if (["england","spain","italy","france","germany","portugal","netherlands"].some(c => country.includes(c))) {
            eu += html;
        } else if (["nigeria","egypt","morocco","ghana","south africa","algeria","tunisia","senegal"].some(c => country.includes(c)) || leagueName.includes("africa")) {
            af += html;
        } else if (["japan","china","saudi","korea","india","iran","uae"].some(c => country.includes(c))) {
            as += html;
        } else {
            au += html;
        }
    });

    document.getElementById("europe").innerHTML = eu || `<div class="loading">No European matches today</div>`;
    document.getElementById("africa").innerHTML = af || `<div class="loading">No African matches today</div>`;
    document.getElementById("asia").innerHTML = as || `<div class="loading">No Asian matches today</div>`;
    document.getElementById("aus").innerHTML = au || `<div class="loading">No other matches today</div>`;
}

function showNoMatches() {
    const msg = `<div class="loading">No matches found today.<br>Please try again later.</div>`;
    document.querySelectorAll('.section').forEach(sec => sec.innerHTML = msg);
}

// Simple Search
function searchMatches() {
    const term = document.getElementById("searchInput").value.toLowerCase();
    const filtered = allMatches.filter(m => 
        m.teams.home.name.toLowerCase().includes(term) || 
        m.teams.away.name.toLowerCase().includes(term)
    );
    renderMatches(filtered);
}

// Keep other functions (modal, video change) minimal for now
function showMatchStats() {
    alert("Match details coming soon...");
}

function changeVideo() {}
function resetVideo() {}
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Start
loadMatches();
setInterval(loadMatches, 120000);
