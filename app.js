async function init() {
    try {
        const res = await fetch('./content.json');
        const data = await res.json();

        // Populate Hero
        document.getElementById('kicker').innerText = data.kicker;
        document.getElementById('heroTitle').innerText = data.heroTitle;
        document.getElementById('heroSubtitle').innerText = data.heroSubtitle;

        // Load Stats
        const statsDiv = document.getElementById('stats');
        data.stats.forEach(s => {
            const div = document.createElement('div');
            div.className = 'stat';
            div.innerHTML = `<strong>${s.value}</strong><span>${s.label}</span>`;
            statsDiv.appendChild(div);
        });

        // Load Projects
        const projectsGrid = document.getElementById('projectsGrid');
        data.projects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'card reveal';
            card.innerHTML = `<h3>${proj.title}</h3><p>${proj.preview}</p>`;
            card.onclick = () => openModal(proj);
            projectsGrid.appendChild(card);
        });

        // Load Timeline
        const timelineList = document.getElementById('timelineList');
        data.timeline.forEach(item => {
            const div = document.createElement('div');
            div.className = 'time-item reveal';
            div.innerHTML = `<h4>${item.roleCompany}</h4><div class="when">${item.dates}</div><p>📍 ${item.location}</p>`;
            timelineList.appendChild(div);
        });

        initInteractivity();
    } catch (e) { console.error("Data load failed", e); }
}

function openModal(item) {
    document.getElementById('modalTitle').innerText = item.title;
    document.getElementById('modalText').innerText = item.fullText || item.preview;
    document.getElementById('modalList').innerHTML = item.bullets.map(b => `<li>${b}</li>`).join('');
    document.getElementById('modal').setAttribute('aria-hidden', 'false');
}

document.getElementById('closeModalBtn').onclick = () => document.getElementById('modal').setAttribute('aria-hidden', 'true');

function initInteractivity() {
    // Scroll Reveal
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    
    // Scroll Progress
    window.onscroll = () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        document.getElementById('scrollBar').style.width = (winScroll / height) * 100 + "%";
    };
}

init();
