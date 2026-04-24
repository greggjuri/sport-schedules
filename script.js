const API_ENDPOINT = 'https://api.jurigregg.com/api/sports';

const FAVORITE_TEAMS = [
    'Detroit Lions',
    'Tampa Bay Buccaneers',
    'Tampa Bay Lightning',
    'Michigan Wolverines',
    'Michigan',
    'Michigan State Spartans',
    'Michigan State',
    'Detroit Tigers',
    'Tampa Bay Rays'
];

const SPORT_LOGOS = {
    nfl: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
    nhl: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
    cfb: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-football-college.png&w=100&h=100',
    mlb: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
    pga: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-golf.png&w=100&h=100'
};

// ─── STATE ─────────────────────────────────────────
const state = {
    data: null,
    sport: localStorage.getItem('ss_sport') || 'all',
    favOnly: localStorage.getItem('ss_favOnly') !== 'false'   // default: true
};

// ─── HELPERS ───────────────────────────────────────
const isFavorite = (name) =>
    FAVORITE_TEAMS.some(f =>
        name.toLowerCase().includes(f.toLowerCase()) ||
        f.toLowerCase().includes(name.toLowerCase())
    );

// Pick a team color that works on dark bg. Filter out near-white / near-black.
const safeTeamColor = (hex) => {
    if (!hex || typeof hex !== 'string') return null;
    const clean = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
    const r = parseInt(clean.slice(0,2), 16);
    const g = parseInt(clean.slice(2,4), 16);
    const b = parseInt(clean.slice(4,6), 16);
    // Skip near-white and near-black (low contrast on our bg)
    const lum = 0.299*r + 0.587*g + 0.114*b;
    if (lum > 235 || lum < 20) return null;
    return '#' + clean;
};

const cardAccent = (home, away) => {
    return safeTeamColor(home?.team?.color)
        || safeTeamColor(away?.team?.color)
        || safeTeamColor(home?.team?.alternateColor)
        || null;
};

const fmtRecord = (summary) => {
    if (!summary) return '';
    const parts = summary.split('-');
    return parts.length === 2 ? `${summary}-0` : summary;
};

// ─── FETCH ─────────────────────────────────────────
async function fetchData() {
    try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        state.data = await res.json();
        render();
    } catch (err) {
        console.error(err);
        document.getElementById('sportsContent').innerHTML =
            `<div class="error">Failed to load sports data: ${err.message}</div>`;
    }
}

// ─── CARD BUILDERS ─────────────────────────────────
function buildMatchupText(away, home, sport) {
    let awayName = away?.team?.displayName || 'TBD';
    let homeName = home?.team?.displayName || 'TBD';
    let awayNote = '';
    let homeNote = '';

    if (sport === 'nfl') {
        const aRec = away?.records?.find(r => r.type === 'total' || r.name === 'overall');
        const hRec = home?.records?.find(r => r.type === 'total' || r.name === 'overall');
        if (aRec?.summary) awayNote = fmtRecord(aRec.summary);
        if (hRec?.summary) homeNote = fmtRecord(hRec.summary);
    }
    if (sport === 'cfb') {
        if (away?.curatedRank?.current && away.curatedRank.current <= 25) awayNote = `#${away.curatedRank.current}`;
        if (home?.curatedRank?.current && home.curatedRank.current <= 25) homeNote = `#${home.curatedRank.current}`;
    }
    return { awayName, homeName, awayNote, homeNote };
}

function buildNflUrl(event, away, home, weekNumber) {
    if (!weekNumber || !away || !home) return '';
    const a = away.team?.name || away.team?.displayName || '';
    const h = home.team?.name || home.team?.displayName || '';
    if (!a || !h) return '';
    const aSlug = a.toLowerCase().replace(/\s+/g, '-');
    const hSlug = h.toLowerCase().replace(/\s+/g, '-');
    const year = new Date(event.date).getFullYear();
    return `https://www.nfl.com/games/${aSlug}-at-${hSlug}-${year}-reg-${weekNumber}?tab=overview`;
}

function buildLeaders(team) {
    if (!team?.leaders) return '';
    const getLeader = (n) => team.leaders.find(l => l.name === n)?.leaders?.[0];
    const pass = getLeader('passingLeader');
    const rush = getLeader('rushingLeader');
    const rec  = getLeader('receivingLeader');

    const row = (tag, l) => l ? `
        <div class="stat-line">
            <span class="stat-tag">${tag}</span>
            <span class="stat-player">${l.athlete.shortName}</span>
            <span class="stat-val">${l.displayValue}</span>
        </div>` : '';

    const content = row('PASS', pass) + row('RUSH', rush) + row('REC', rec);
    if (!content) return '';

    return `
        <div>
            <div class="leader-block-title">${team.team.shortDisplayName || team.team.displayName}</div>
            ${content}
        </div>
    `;
}

function buildCard(event, sport, weekNumber) {
    try {
        const comp = event.competitions?.[0];
        if (!comp) return '';
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        const away = comp.competitors?.find(c => c.homeAway === 'away');

        const { awayName, homeName, awayNote, homeNote } = buildMatchupText(away, home, sport);

        const isFav = isFavorite(awayName) || isFavorite(homeName);
        if (state.favOnly && !isFav && sport !== 'pga') return null; // null = filtered

        const date = new Date(event.date);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
        const isoDate = date.toISOString().slice(0, 10);
        const isoDateTime = date.toISOString();

        const bcasts = comp.broadcasts || [];
        const tv = bcasts[0]?.names?.join(', ') || '';

        const accent = cardAccent(home, away);
        const accentStyle = accent ? `style="--team-color: ${accent};"` : '';

        let nflUrl = '';
        if (sport === 'nfl') nflUrl = buildNflUrl(event, away, home, weekNumber);

        const leadersHtml = sport === 'nfl'
            ? `<div class="leaders">${buildLeaders(away)}${buildLeaders(home)}</div>`
            : '';
        const hasLeaders = leadersHtml.includes('stat-line');

        const awayHtml = `<span class="team"><span class="team-name">${awayName}</span>${awayNote ? `<span class="team-note">${awayNote}</span>` : ''}</span>`;
        const homeHtml = `<span class="team"><span class="team-name">${homeName}</span>${homeNote ? `<span class="team-note">${homeNote}</span>` : ''}</span>`;

        return `
            <article class="card ${isFav ? 'favorite' : ''} ${nflUrl ? 'clickable' : ''}"
                 ${accentStyle}
                 ${nflUrl ? `data-nfl-url="${nflUrl}" title="View on NFL.com"` : ''}>
                <div class="matchup">
                    ${awayHtml}
                    <span class="at">@</span>
                    ${homeHtml}
                    ${isFav ? '<span class="fav-badge">★ Fav</span>' : ''}
                </div>
                <div class="meta">
                    <span class="meta-item"><span class="meta-label">Date</span> <time datetime="${isoDate}">${dateStr}</time></span>
                    <span class="meta-item"><span class="meta-label">Time</span> <time datetime="${isoDateTime}">${timeStr}</time></span>
                    ${tv ? `<span class="meta-item"><span class="tv">${tv}</span></span>` : ''}
                </div>
                ${hasLeaders ? leadersHtml : ''}
            </article>
        `;
    } catch (err) {
        console.error('card error', err);
        return '';
    }
}

// ─── SECTION BUILDERS ──────────────────────────────
function buildSection(sportKey, title, subtitle, events, weekNumber) {
    const cards = (events || []).map(e => buildCard(e, sportKey, weekNumber)).filter(c => c !== null);
    const visible = cards.filter(c => c !== '').length;

    let body;
    if (!events || events.length === 0) {
        body = `<div class="empty">No games scheduled</div>`;
    } else if (visible === 0) {
        body = `<div class="empty">
            No favorite games
            <span class="sub">Toggle "Favorites Only" off to see all matchups</span>
        </div>`;
    } else {
        body = cards.join('');
    }

    return `
        <section class="section" data-sport="${sportKey}">
            <header class="section-header">
                <img src="${SPORT_LOGOS[sportKey]}" alt="${title}" class="section-logo">
                <div>
                    <div class="section-title">${title}</div>
                    <div class="section-sub">${subtitle}</div>
                </div>
                <div class="section-count">${visible}</div>
            </header>
            <div class="section-body">${body}</div>
        </section>
    `;
}

function buildTournament(tournament) {
    if (!tournament) return `
        <section class="section" data-sport="pga">
            <header class="section-header">
                <img src="${SPORT_LOGOS.pga}" alt="PGA" class="section-logo">
                <div>
                    <div class="section-title">PGA Tour</div>
                    <div class="section-sub">Featured Event</div>
                </div>
            </header>
            <div class="section-body"><div class="empty">No upcoming tournament</div></div>
        </section>`;

    return `
        <section class="section" data-sport="pga">
            <header class="section-header">
                <img src="${SPORT_LOGOS.pga}" alt="PGA" class="section-logo">
                <div>
                    <div class="section-title">PGA Tour</div>
                    <div class="section-sub">Featured Event</div>
                </div>
            </header>
            <div class="section-body">
                <div class="tournament">
                    <div class="tournament-name">${tournament.name || 'Tournament TBD'}</div>
                    <div class="meta">
                        <span class="meta-item"><span class="meta-label">Venue</span> ${tournament.location || 'TBD'}</span>
                        <span class="meta-item"><span class="meta-label">Dates</span> ${tournament.dates || 'TBD'}</span>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ─── RENDER ────────────────────────────────────────
function render() {
    const c = document.getElementById('sportsContent');
    if (!state.data) return;

    const d = state.data;
    const weekNumber = d.nfl?.week?.number || null;
    const weekLabel = weekNumber ? `Week ${weekNumber}` : 'This Week';

    const sections = {
        nfl: d.nfl?.events ? buildSection('nfl', 'NFL', weekLabel, d.nfl.events, weekNumber) : '',
        cfb: d.cfb?.events ? buildSection('cfb', 'College Football', 'Top 25 + Michigan', d.cfb.events) : '',
        nhl: d.nhl?.events ? buildSection('nhl', 'NHL', 'Next 5 Days', d.nhl.events) : '',
        mlb: d.mlb?.events ? buildSection('mlb', 'MLB', 'Next 3 Days', d.mlb.events) : '',
        pga: buildTournament(d.pga)
    };

    let html;
    if (state.sport === 'all') {
        // two-column layout
        html = `
            <div class="grid">
                <div class="col">${sections.nfl}${sections.cfb}</div>
                <div class="col">${sections.nhl}${sections.mlb}${sections.pga}</div>
            </div>`;
    } else {
        html = `<div class="grid single"><div class="col">${sections[state.sport]}</div></div>`;
    }

    c.innerHTML = html;

    // Wire up NFL click-throughs
    document.querySelectorAll('.card[data-nfl-url]').forEach(card => {
        card.addEventListener('click', () => {
            window.open(card.getAttribute('data-nfl-url'), '_blank');
        });
    });

    // Update meta date
    const now = new Date();
    document.getElementById('metaDate').textContent =
        now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
}

// ─── EVENT WIRING ──────────────────────────────────
function initPills() {
    document.querySelectorAll('.pill').forEach(p => {
        const isActive = p.dataset.sport === state.sport;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-selected', isActive);

        p.addEventListener('click', () => {
            state.sport = p.dataset.sport;
            localStorage.setItem('ss_sport', state.sport);
            document.querySelectorAll('.pill').forEach(x => {
                const a = x === p;
                x.classList.toggle('active', a);
                x.setAttribute('aria-selected', a);
            });
            render();
        });
    });
}

function initFavToggle() {
    const sw = document.getElementById('favSwitch');
    const wrap = document.getElementById('favToggleWrap');
    const label = document.getElementById('favLabel');

    const paint = () => {
        sw.classList.toggle('on', state.favOnly);
        sw.setAttribute('aria-checked', state.favOnly);
        wrap.classList.toggle('active', state.favOnly);
        label.textContent = state.favOnly ? 'Favorites Only' : 'All Games';
    };
    paint();

    const flip = () => {
        state.favOnly = !state.favOnly;
        localStorage.setItem('ss_favOnly', state.favOnly);
        paint();
        render();
    };

    sw.addEventListener('click', flip);
    wrap.addEventListener('click', (e) => {
        if (e.target.tagName !== 'SPAN' || e.target.id === 'favLabel') flip();
    });
    sw.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    });
}

// ─── INIT ──────────────────────────────────────────
initPills();
initFavToggle();
fetchData();
setInterval(fetchData, 12 * 60 * 60 * 1000);
