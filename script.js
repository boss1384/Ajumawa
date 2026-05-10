// ================== API KEY ==================
const API_KEY = "da01d7158a60be461c607c6d31470b4e";
// ============================================

let allMatches = [];
let currentMatches = [];

async function loadMatches() {
    document.querySelectorAll('.section').forEach(sec => {
        sec.innerHTML = `<div class="loading">🔄 Loading matches...</div>`;
    });

    try {
        const today = new Date().toISOString().split('T')[0];

        const [liveRes, todayRes] = await Promise.all([
            fetch("https://v3.football.api-sports.io/fixtures?live=all", {
                headers: { "x-apisports-key": API_KEY }
            }),
            fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
                headers: { "x-apisports-key": API_KEY }
            })
        ]);

        const liveData = await liveRes.json();
        const todayData = await todayRes.json();

        const liveMatches = liveData.response || [];
        const todayMatches = todayData.response || [];

        allMatches = [...liveMatches, ...todayMatches];
        allMatches = allMatches.filter((match, index, self) => 
            index === self.findIndex(m => m.fixture.id === match.fixture.id)
        );

        currentMatches = allMatches;
        renderMatches(allMatches);

    } catch (e) {
        console.error(e);
        document.getElementById("europe").innerHTML = `<div class="loading">❌ Error loading data. Check internet.</div>`;
    }
}

function renderMatches(matches) {
    let eu = "", af = "", as = "", au = "";

    matches.forEach(m => {
        const status = m.fixture.status.short;
        const isLive = ["1H","HT","2H","ET","P"].includes(status);
        const elapsed = m.fixture.status.elapsed || 0;

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
                    <span>${isLive ? `⏱ ${elapsed}' • LIVE` : `🕒 ${m.fixture.status.long}`}</span>
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

function searchMatches() {
    const term = document.getElementById("searchInput").value.toLowerCase().trim();
    
    if (!term) {
        renderMatches(allMatches);
        return;
    }

    const filtered = allMatches.filter(m => 
        m.teams.home.name.toLowerCase().includes(term) ||
        m.teams.away.name.toLowerCase().includes(term) ||
        m.league.name.toLowerCase().includes(term)
    );
    
    renderMatches(filtered);
}

// ================== DETAILED STATS MODAL ==================
async function showMatchStats(fixtureId) {
    try {
        const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
            headers: { "x-apisports-key": API_KEY }
        });
        const data = await res.json();
        const match = data.response[0];

        if (!match) return;

        document.getElementById("modalMatchName").textContent = 
            `${match.teams.home.name} vs ${match.teams.away.name}`;

        document.getElementById("modalLeague").innerHTML = 
            `<strong>${match.league.name} • ${match.league.country}</strong>`;

        const stats = match.statistics || [];
        let statsHTML = "";

        const statMap = {
            "Ball Possession": "possession",
            "Total Shots": "total shots",
            "Shots on Goal": "shots on target",
            "Shots off Goal": "shots off target",
            "Blocked Shots": "blocked shots",
            "Corner Kicks": "corner kicks",
            "Offsides": "offsides",
            "Fouls": "fouls",
            "Yellow Cards": "yellow cards",
            "Red Cards": "red cards",
            "Goalkeeper Saves": "goalkeeper saves",
            "Total passes": "total passes"
        };

        Object.keys(statMap).forEach(key => {
            const homeStat = stats.find(s => s.type.toLowerCase() === statMap[key])?.home || 0;
            const awayStat = stats.find(s => s.type.toLowerCase() === statMap[key])?.away || 0;

            statsHTML += `
                <div class="stat-item">
                    <strong>${key}</strong>
                    <span>${homeStat} - ${awayStat}</span>
                </div>`;
        });

        document.getElementById("modalStats").innerHTML = statsHTML;
        document.getElementById("statsModal").style.display = "block";

        // Change video when opening stats
        changeVideo(`${match.teams.home.name} vs ${match.teams.away.name}`, match.league.name);

    } catch (e) {
        console.error(e);
        alert("Could not load detailed stats");
    }
}

function closeModal() {
    document.getElementById("statsModal").style.display = "none";
}

function changeVideo(matchName, league) {
    const query = encodeURIComponent(`${matchName} ${league} highlights OR live`);
    document.getElementById("mainVideo").src = `https://www.youtube.com/embed/results?search_query=${query}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetVideo() {
    document.getElementById("mainVideo").src = "https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1&mute=1";
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${id}'`));
    });
}

// Start App
loadMatches();
setInterval(loadMatches, 120000);   // Refresh every 2 minutes
