async function init() {
    // 1. Fetch deep knowledge from content.json
    const res = await fetch('./content.json');
    const data = await res.json();

    // 2. Render Profile Stats
    const statsDiv = document.getElementById('stats');
    data.stats.forEach(s => {
        const div = document.createElement('div');
        div.className = 'stat';
        div.innerHTML = `<strong>${s.value}</strong><span>${s.label}</span>`;
        statsDiv.appendChild(div);
    });

    // 3. Render Interactive Project Cards
    const projectsGrid = document.getElementById('projectsGrid');
    data.projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card reveal';
        card.innerHTML = `<h3>${p.title}</h3><p>${p.preview}</p>`;
        card.onclick = () => openModal(p);
        projectsGrid.appendChild(card);
    });

    // 4. Render Visual Timeline Nodes
    const timeline = document.getElementById('timelineList');
    data.timeline.forEach(t => {
        const item = document.createElement('div');
        item.className = 'time-item reveal';
        item.innerHTML = `<h4>${t.roleCompany}</h4><div class="when">${t.dates}</div><p>📍 ${t.location}</p>`;
        timeline.appendChild(item);
    });

    // 5. Initialize Scroll Reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 6. Scroll Progress Logic
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        document.getElementById('scrollBar').style.width = scrolled + '%';
    });
}

function openModal(item) {
    document.getElementById('modalTitle').innerText = item.title;
    document.getElementById('modalText').innerText = item.fullText;
    const list = document.getElementById('modalList');
    list.innerHTML = item.bullets.map(b => `<li>${b}</li>`).join('');
    document.getElementById('modal').setAttribute('aria-hidden', 'false');
}

document.getElementById('closeModalBtn').onclick = () => {
    document.getElementById('modal').setAttribute('aria-hidden', 'true');
};

init();
