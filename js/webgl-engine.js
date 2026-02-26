document.addEventListener('DOMContentLoaded', () => {
    if(typeof THREE === 'undefined' || typeof THREE.EffectComposer === 'undefined') {
        console.warn("Three.js not loaded. Skipping 3D.");
        return;
    }

    const canvas = document.getElementById('webgl-canvas');
    if(!canvas) return;

    // --- 1. SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020308, 0.005);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 60; 

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // --- 2. POST-PROCESSING (Cinematic Bloom) ---
    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    
    // Increased bloom radius and strength for a bold, glowing neon look
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2.0, 0.6, 0.85);
    composer.addPass(bloomPass);

    // --- 3. BOLD GEOMETRIES & MATERIALS ---
    const geometries = [new THREE.TetrahedronGeometry(4), new THREE.OctahedronGeometry(5)];
    
    // Solid dark core
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x010515, transparent: true, opacity: 0.8 });
    
    // 100% opacity wireframes wrapping the core
    const wireMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 1.0 });
    const wireMatBlue = new THREE.MeshBasicMaterial({ color: 0x0088ff, wireframe: true, transparent: true, opacity: 1.0 });

    const nodes = [];
    const count = 50; 

    for(let i=0; i<count; i++) {
        const group = new THREE.Group();
        const geo = geometries[i%2];
        
        const core = new THREE.Mesh(geo, coreMat);
        const wire = new THREE.Mesh(geo, i%2===0 ? wireMatCyan : wireMatBlue);
        wire.scale.set(1.05, 1.05, 1.05); // Wireframe sits just outside
        
        group.add(core);
        group.add(wire);
        
        // Scattered initially
        const s0 = new THREE.Vector3((Math.random()-0.5)*200, (Math.random()-0.5)*200, (Math.random()-0.5)*80 - 10);
        
        // Morphing Targets
        const yMast = -60 + (i/count)*120;
        const rMast = 18 - ((yMast+60)/120)*15;
        const aMast = i * 2.4;
        const s1 = new THREE.Vector3(Math.cos(aMast)*rMast, yMast, Math.sin(aMast)*rMast);

        let s2 = new THREE.Vector3();
        if(i < 20) { s2.set(-80 + (i/20)*160, -15, 0); } 
        else if (i < 30) { s2.set(-40, -40 + ((i-20)/10)*60, 0); } 
        else if (i < 40) { s2.set(40, -40 + ((i-30)/10)*60, 0); } 
        else { const x = -80 + ((i-40)/10)*160; s2.set(x, (x*x)*0.012 - 20, 0); } 

        group.position.copy(s0);
        
        group.userData = { 
            t0: s0, t1: s1, t2: s2, 
            rx: (Math.random()-0.5)*0.03, 
            ry: (Math.random()-0.5)*0.03,
            velocity: new THREE.Vector3(0,0,0),
            originalPos: new THREE.Vector3()
        };
        
        scene.add(group);
        nodes.push(group);
    }

    // --- 4. INTERACTIVE PHYSICS ---
    let scrollPercent = 0;
    window.addEventListener('scroll', () => {
        scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    });

    const mouse = new THREE.Vector2(-999, -999);
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // The Click Explosion Effect
    window.addEventListener('click', () => {
        nodes.forEach(n => {
            const blast = new THREE.Vector3(
                (Math.random() - 0.5) * 60, 
                (Math.random() - 0.5) * 60, 
                (Math.random() - 0.5) * 30
            );
            n.userData.velocity.add(blast);
            n.userData.rx *= 3; 
            n.userData.ry *= 3;
        });
    });

    // --- 5. RENDER LOOP ---
    function animate() {
        requestAnimationFrame(animate);
        
        const phase = scrollPercent * 2; 

        nodes.forEach(n => {
            n.rotation.x += n.userData.rx;
            n.rotation.y += n.userData.ry;

            if(Math.abs(n.userData.rx) > 0.03) n.userData.rx *= 0.98;
            if(Math.abs(n.userData.ry) > 0.03) n.userData.ry *= 0.98;

            let targetPos = new THREE.Vector3();
            if(phase < 1) targetPos.copy(n.userData.t0).lerp(n.userData.t1, phase);
            else targetPos.copy(n.userData.t1).lerp(n.userData.t2, phase - 1);
            
            n.userData.originalPos.copy(targetPos);

            // MOUSE REPULSION
            const screenPos = n.position.clone().project(camera);
            const dx = mouse.x - screenPos.x;
            const dy = mouse.y - screenPos.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if(distance < 0.3) {
                n.userData.velocity.x -= dx * 10;
                n.userData.velocity.y -= dy * 10;
            }

            n.position.add(n.userData.velocity);
            n.userData.velocity.multiplyScalar(0.90); // Friction
            
            const springForce = n.userData.originalPos.clone().sub(n.position).multiplyScalar(0.08);
            n.userData.velocity.add(springForce);
        });

        camera.position.x += (mouse.x * 25 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 25 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        composer.render();
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    const updateColors = () => {
        const isLight = document.body.getAttribute('data-theme') === 'light';
        scene.fog.color.setHex(isLight ? 0xf8fafc : 0x020308);
        coreMat.color.setHex(isLight ? 0xffffff : 0x010515);
        wireMatCyan.color.setHex(isLight ? 0x0284c7 : 0x00f0ff);
        wireMatBlue.color.setHex(isLight ? 0x0369a1 : 0x0088ff);
        bloomPass.strength = isLight ? 0.4 : 2.0; 
    };
    
    document.getElementById('themeToggle')?.addEventListener('click', () => setTimeout(updateColors, 50));
    document.getElementById('themeToggleMobile')?.addEventListener('click', () => setTimeout(updateColors, 50));
});
