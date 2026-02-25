document.addEventListener('DOMContentLoaded', async () => {
    let siteData = {};

    // --- CURSOR LOGIC ---
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');
    
    // Only init custom cursor on non-touch devices
    if(window.matchMedia("(pointer: fine)").matches && cursorDot && cursorRing) {
        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Instantly move the dot
            gsap.set(cursorDot, { x: mouseX, y: mouseY });
        });

        // Smoothly trail the ring using GSAP ticker
        gsap.ticker.add(() => {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            gsap.set(cursorRing, { x: ringX, y: ringY });
        });

        // Add hover states
        const interactiveElements = document.querySelectorAll('a, button, .bento-tile, .timeline-item, .magnetic');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
        });
    }

    // --- MAGNETIC BUTTONS LOGIC ---
    function initMagnetic() {
        const magnetics = document.querySelectorAll('.magnetic');
        magnetics.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const strength = btn.dataset.strength || 20;
                // Calculate distance from center
                const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
                const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
                gsap.to(btn, { x: x, y: y, duration: 0.5, ease: "power2.out" });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
            });
        });
    }

    // --- DATA LOADING & RENDER ---
    async function init() {
        initTheme();
        await loadData();
        if (siteData.name) {
            populateHero();
            populateAbout();
            populateCareer();
            initProjectFilters();
            populateProjects('all');
            initCharts();
            populateAchievements();
            populateContact();
            
            // Init GSAP interactions after DOM is built
            setTimeout(() => {
                initGSAPScroll();
                initMagnetic();
                init3DTilt();
                lucide.createIcons();
            }, 100);
        }
    }

    async function loadData() {
        try {
            const res = await fetch('./content.json');
            if(res.ok) siteData = await res.json();
        } catch (e) { console.error("Data load failed", e); }
    }

    function initTheme() {
        const saved = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', saved);
        if(document.getElementById('themeIcon')) document.getElementById('themeIcon').setAttribute('data-lucide', saved === 'dark' ? 'sun' : 'moon');

        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = document.body.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            document.getElementById('themeIcon').setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
            lucide.createIcons();
            initCharts(); 
        });
    }

    // --- POPULATORS ---
    function populateHero() {
        document.getElementById('heroPositioning').textContent = siteData.kicker;
        document.getElementById('heroName').textContent = siteData.name.split(' (')[0]; 
        document.getElementById('heroTitle').textContent = siteData.role;
        document.getElementById('heroTagline').textContent = siteData.heroSubtitle;
    }

    function populateAbout() {
        document.getElementById('aboutLead').innerHTML = `<strong>${siteData.aboutLead}</strong><br><br>${siteData.aboutStory}`;
        const ul = document.getElementById('aboutBullets');
        siteData.knownFor.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item}</span>`;
            ul.appendChild(li);
        });

        const statsGrid = document.getElementById('statsGrid');
        siteData.stats.forEach(stat => {
            const div = document.createElement('div');
            div.className = 'stat-box glass-panel tilt-card';
            div.innerHTML = `<div class="stat-val">${stat.value}</div><div class="stat-lbl">${stat.label}</div>`;
            statsGrid.appendChild(div);
        });
    }

    function populateCareer() {
        const timeline = document.getElementById('careerTimeline');
        siteData.timeline.forEach((job, index) => {
            const parts = job.roleCompany.split(',');
            const role = parts[0].trim();
            const company = parts.length > 1 ? parts.slice(1).join(',').trim() : "";
            
            const kw1 = job.bullets[0] ? job.bullets[0].split(' ')[0] : "Engineering";
            const kw2 = job.bullets[1] ? job.bullets[1].split(' ')[0] : "Management";

            const card = document.createElement('div');
            card.className = 'timeline-item glass-panel gsap-stagger-item';
            if(index === 0) card.classList.add('expanded');
            
            card.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-header">
                    <div class="role-info">
                        <h3>${role}</h3>
                        <h4>${company}</h4>
                        <div class="role-tags">
                            <span class="role-tag">${kw1.replace(/[^a-zA-Z]/g, '')}</span>
                            <span class="role-tag">${kw2.replace(/[^a-zA-Z]/g, '')}</span>
                            <span class="role-tag"><i data-lucide="map-pin" style="width:10px;height:10px;display:inline;"></i> ${job.location}</span>
                        </div>
                    </div>
                    <div class="role-dates">${job.dates}</div>
                </div>
                <div class="timeline-details">
                    <ul>${job.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
                </div>
            `;

            card.addEventListener('click', () => {
                const isExp = card.classList.contains('expanded');
                document.querySelectorAll('.timeline-item').forEach(c => c.classList.remove('expanded'));
                if (!isExp) card.classList.add('expanded');
            });
            timeline.appendChild(card);
        });
    }

    function initProjectFilters() {
        const container = document.getElementById('projectFilters');
        const filters = ['All', 'Civil', 'Industrial', 'Telecom'];
        filters.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `filter-chip magnetic ${cat === 'All' ? 'active' : ''}`;
            btn.dataset.strength = "10";
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                populateProjects(cat === 'All' ? 'all' : cat);
            });
            container.appendChild(btn);
        });
    }

    function populateProjects(filter) {
        const grid = document.getElementById('projectsBento');
        grid.innerHTML = '';
        
        let filtered = siteData.projects;
        if(filter !== 'all') {
            filtered = siteData.projects.filter(p => p.tags && p.tags.some(t => t.toLowerCase().includes(filter.toLowerCase())));
        }

        filtered.forEach((p, index) => {
            const tile = document.createElement('div');
            let sizeClass = index === 0 ? 'large' : (index === 3 ? 'medium' : '');
            tile.className = `bento-tile glass-panel tilt-card gsap-stagger-item ${sizeClass}`;
            
            const hues = [195, 260, 220, 160];
            const h = hues[index % hues.length];
            tile.style.background = `linear-gradient(135deg, hsla(${h}, 80%, 15%, 0.4), var(--glass-bg))`;

            tile.innerHTML = `
                <div class="bento-content">
                    <div class="bento-tags">
                        ${p.tags ? p.tags.slice(0,3).map(t => `<span class="bento-tag">${t}</span>`).join('') : ''}
                    </div>
                    <h3 class="bento-title">${p.title}</h3>
                    <div class="bento-overlay-text">
                        <span>View Case Study</span> <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
                    </div>
                </div>
            `;
            
            tile.addEventListener('click', () => openModal(p));
            grid.appendChild(tile);
        });
        
        // Re-init GSAP tilts for new elements
        if(typeof gsap !== 'undefined') init3DTilt();
        lucide.createIcons();
    }

    // --- MODAL ---
    function openModal(project) {
        document.getElementById('modalTitle').textContent = project.title;
        document.getElementById('modalTags').innerHTML = project.tags ? project.tags.map(t => `<span>${t}</span>`).join('') : '';

        let location = "Location N/A", date = "Date N/A", value = "Confidential";
        if(project.meta) {
            const parts = project.meta.split('|');
            location = parts[0] || location;
            date = parts[1] || date;
            value = parts[2] || value;
        }

        document.getElementById('modalMetrics').innerHTML = `
            <div class="modal-metric"><i data-lucide="map-pin"></i> ${location.trim()}</div>
            <div class="modal-metric"><i data-lucide="calendar"></i> ${date.trim()}</div>
            <div class="modal-metric"><i data-lucide="circle-dollar-sign"></i> ${value.trim()}</div>
        `;

        const b = project.bullets || [];
        const mid = Math.ceil(b.length / 2);
        
        document.getElementById('modalScope').innerHTML = `<li>${project.preview || ''}</li>` + b.slice(0, mid).map(item => `<li>${item}</li>`).join('');
        document.getElementById('modalRole').innerHTML = `<li>${project.fullText || ''}</li>`;
        document.getElementById('modalConstraints').innerHTML = "<li>Managed structural interfaces and strict compliance tracking.</li><li>Ensured zero environmental impact.</li>";
        document.getElementById('modalOutcomes').innerHTML = b.slice(mid).map(item => `<li>${item}</li>`).join('');

        const modal = document.getElementById('projectModal');
        modal.setAttribute('aria-hidden', 'false');
        
        // GSAP Modal Open Animation
        gsap.to(modal, {autoAlpha: 1, duration: 0.3});
        gsap.fromTo(modal.querySelector('.modal-content'), 
            {y: 50, scale: 0.95}, 
            {y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2, 0.8)"}
        );
        document.body.style.overflow = 'hidden';
        lucide.createIcons();
    }

    window.closeModal = () => {
        const modal = document.getElementById('projectModal');
        // GSAP Modal Close Animation
        gsap.to(modal.querySelector('.modal-content'), {y: 30, scale: 0.95, duration: 0.3, ease: "power2.in"});
        gsap.to(modal, {autoAlpha: 0, duration: 0.3, onComplete: () => {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }});
    };

    // --- CHARTS ---
    function initCharts() {
        if(typeof Chart === 'undefined') return;
        const isLight = document.body.getAttribute('data-theme') === 'light';
        const tColor = isLight ? '#475569' : '#94a3b8';
        const gColor = isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)';
        const accent = isLight ? '#0284c7' : '#06b6d4';

        Chart.defaults.color = tColor;
        Chart.defaults.font.family = "'Inter', sans-serif";

        if(window.chart1) window.chart1.destroy();
        if(window.chart2) window.chart2.destroy();

        const ctxPortfolio = document.getElementById('budgetChart');
        if(ctxPortfolio) {
            window.chart1 = new Chart(ctxPortfolio.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Rio Tinto', 'ExxonMobil', 'Telecom 5G', 'West Gate'],
                    datasets: [{
                        label: 'Project Value ($M)',
                        data: [300, 65, 50, 15], 
                        backgroundColor: accent,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { color: gColor } }, x: { grid: { display: false } } }
                }
            });
        }

        const ctxType = document.getElementById('typeChart');
        if(ctxType) {
            window.chart2 = new Chart(ctxType.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Industrial Demolition', 'Telecom 5G', 'Civil/Transport'],
                    datasets: [{
                        data: [45, 35, 20],
                        backgroundColor: [accent, '#6366f1', '#1e293b'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: tColor } } } }
            });
        }
    }

    function populateAchievements() {
        const scroll = document.getElementById('achievementsScroll');
        if(!siteData.achievements) return;
        siteData.achievements.forEach(ach => {
            const card = document.createElement('div');
            card.className = 'ach-card glass-panel tilt-card';
            card.innerHTML = `<div class="ach-icon"><i data-lucide="${ach.icon}"></i></div><div class="ach-text">${ach.text}</div>`;
            scroll.appendChild(card);
        });
    }

    function populateContact() {
        if(siteData.contact) {
            const links = document.getElementById('socialLinks');
            if(links) {
                links.innerHTML = `
                    <a href="${siteData.contact.linkedin}" target="_blank" class="glass-panel magnetic"><i data-lucide="linkedin"></i> LinkedIn</a>
                    <a href="mailto:${siteData.contact.email}" class="glass-panel magnetic"><i data-lucide="mail"></i> Email</a>
                `;
            }
            document.getElementById('footerText').innerHTML = `&copy; ${new Date().getFullYear()} ${siteData.name.split(' ')[0]}. Engineered for Precision.`;
        }
    }

    // --- GSAP ANIMATIONS ---
    function initGSAPScroll() {
        if(typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        // Fade Up Elements
        gsap.utils.toArray('.gsap-fade-up').forEach(elem => {
            gsap.fromTo(elem, 
                { y: 50, autoAlpha: 0 },
                {
                    y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out",
                    scrollTrigger: { trigger: elem, start: "top 85%", toggleActions: "play none none none" }
                }
            );
        });

        // Staggered Grids (Bento, Timeline)
        gsap.utils.toArray('.bento-grid, .timeline, .dashboard-grid').forEach(container => {
            const items = container.querySelectorAll('.gsap-stagger-item, .bento-tile, .chart-card');
            if(items.length > 0) {
                gsap.fromTo(items, 
                    { y: 50, autoAlpha: 0 },
                    {
                        y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power2.out",
                        scrollTrigger: { trigger: container, start: "top 85%" }
                    }
                );
            }
        });

        // Hero Intro Animation
        gsap.fromTo(".hero-name", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
        gsap.fromTo(".hero-title", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.1, ease: "power3.out" });
        gsap.fromTo(".hero-tagline", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.2, ease: "power3.out" });
        gsap.fromTo(".hero-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power3.out" });
    }

    // --- 3D TILT EFFECT ---
    function init3DTilt() {
        if(!window.matchMedia("(pointer: fine)").matches) return; // Skip on mobile
        
        const tiltCards = document.querySelectorAll('.tilt-card, .bento-tile');
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element
                const y = e.clientY - rect.top;  // y position within the element
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation (max 10 degrees)
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                gsap.to(card, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    transformPerspective: 1000,
                    ease: "power1.out",
                    duration: 0.4
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    ease: "elastic.out(1, 0.3)",
                    duration: 1
                });
            });
        });
    }

    init();
});
