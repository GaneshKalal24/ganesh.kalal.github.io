document.addEventListener('DOMContentLoaded', () => {
    if(typeof THREE === 'undefined' || typeof THREE.EffectComposer === 'undefined') {
        console.warn("Three.js not loaded. Skipping 3D.");
        return;
    }

    const canvas = document.getElementById('webgl-canvas');
    if(!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020308, 0.015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Use a limited pixel ratio so scrolling doesn't lag
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // Post-Processing (Active Theory Bloom & Glitch)
    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
    composer.addPass(bloomPass);

    const glitchPass = new THREE.GlitchPass();
    glitchPass.goWild = false;
    composer.addPass(glitchPass);

    // Global trigger for theme change
    window.triggerThemeGlitch = (theme) => {
        glitchPass.goWild = true;
        scene.fog.color.setHex(theme === 'light' ? 0xf8fafc : 0x020308);
        bloomPass.strength = theme === 'light' ? 0.3 : 1.0;
        setTimeout(() => { glitchPass.goWild = false; }, 300);
    };

    // 3D Morphing Data Nodes
    const geometries = [new THREE.TetrahedronGeometry(1.5), new THREE.OctahedronGeometry(2)];
    const matCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.3 });
    const matBlue = new THREE.MeshBasicMaterial({ color: 0x0088ff, wireframe: true, transparent: true, opacity: 0.2 });

    const nodes = [];
    const count = 75; // Low count for strict 60fps performance

    for(let i=0; i<count; i++) {
        const mesh = new THREE.Mesh(geometries[i%2], i%2===0 ? matCyan : matBlue);
        
        // Shape 1: Scattered (Hero)
        const s0 = new THREE.Vector3((Math.random()-0.5)*150, (Math.random()-0.5)*150, (Math.random()-0.5)*60 - 20);
        
        // Shape 2: Telecom Mast (About)
        const yMast = -40 + (i/count)*80;
        const rMast = 12 - ((yMast+40)/80)*10;
        const aMast = i * 2.4;
        const s1 = new THREE.Vector3(Math.cos(aMast)*rMast, yMast, Math.sin(aMast)*rMast);

        // Shape 3: Suspension Bridge (Projects/Career)
        let s2 = new THREE.Vector3();
        if(i < 30) { s2.set(-60 + (i/30)*120, -10, 0); } // Deck
        else if (i < 45) { s2.set(-30, -30 + ((i-30)/15)*50, 0); } // Pillar 1
        else if (i < 60) { s2.set(30, -30 + ((i-45)/15)*50, 0); } // Pillar 2
        else { const x = -60 + ((i-60)/15)*120; s2.set(x, (x*x)*0.015 - 15, 0); } // Cables

        mesh.position.copy(s0);
        mesh.userData = { t0: s0, t1: s1, t2: s2, rx: (Math.random()-0.5)*0.05, ry: (Math.random()-0.5)*0.05 };
        
        scene.add(mesh);
        nodes.push(mesh);
    }

    // Scroll Tracking for Morphing
    let scrollPercent = 0;
    window.addEventListener('scroll', () => {
        scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    });

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
        requestAnimationFrame(animate);
        
        const phase = scrollPercent * 2; // 0 to 2

        nodes.forEach(n => {
            n.rotation.x += n.userData.rx;
            n.rotation.y += n.userData.ry;

            let target = new THREE.Vector3();
            if(phase < 1) target.copy(n.userData.t0).lerp(n.userData.t1, phase);
            else target.copy(n.userData.t1).lerp(n.userData.t2, phase - 1);
            
            n.position.lerp(target, 0.05); // Smooth gliding
        });

        // Slow global rotation
        scene.rotation.y += 0.001;

        // Camera Parallax
        camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 10 - camera.position.y) * 0.05;
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
});
