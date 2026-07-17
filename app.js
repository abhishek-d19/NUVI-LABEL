document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }
    // Wait for custom fonts to load so canvas text measures and renders correctly
    if (document.fonts) {
        document.fonts.ready.then(() => {
            initApp();
        });
    } else {
        setTimeout(initApp, 800);
    }
});
function initApp() {
    // ----------------------------------------------------
    // 1. THREE.JS INITIALIZATION
    // ----------------------------------------------------
    const container = document.getElementById('canvas-container');
    if (!container) return;
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);
    // Group to hold cylinders for overall rotation & parallax
    const cylinderGroup = new THREE.Group();
    scene.add(cylinderGroup);
    // ----------------------------------------------------
    // 2. DYNAMIC TEXT TEXTURE CREATION
    // ----------------------------------------------------
    // Measures text unit to ensure seamless wrapping without seams
    function createSeamlessTextTexture(text, styleType) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Define high-res font settings
        const fontHeight = 140;
        const fontSettings = `900 ${fontHeight}px "Syne", "Inter", sans-serif`;
        tempCtx.font = fontSettings;
        
        // Pad the text for visual separation
        const textUnit = text + "      ";
        const textMetrics = tempCtx.measureText(textUnit);
        const textWidth = textMetrics.width;
        
        // Set canvas to fit exactly a multiple of repetitions
        const repeats = 4;
        const canvasWidth = Math.ceil(textWidth * repeats);
        const canvasHeight = 256;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.font = fontSettings;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        
        // Render texture background (transparent)
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw the text segments side-by-side
        for (let i = 0; i < repeats; i++) {
            const x = i * textWidth;
            const y = canvasHeight / 2;
            
            if (styleType === 'solid') {
                ctx.fillStyle = '#ffffff';
                ctx.fillText(textUnit, x, y);
            } else if (styleType === 'outline') {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3.5;
                ctx.strokeText(textUnit, x, y);
            } else if (styleType === 'grey') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
                ctx.fillText(textUnit, x, y);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping; // Keep Y clamp
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return { texture, canvasWidth, canvasHeight };
    }
    const textString = "COMING SOON";
    const solidData = createSeamlessTextTexture(textString, 'solid');
    const outlineData = createSeamlessTextTexture(textString, 'outline');
    const greyData = createSeamlessTextTexture(textString, 'grey');
    // ----------------------------------------------------
    // 3. 3D CYLINDERS IMPLEMENTATION
    // ----------------------------------------------------
    // Cylinder dimensions
    const radius = 3.2;
    const height = 1.6;
    const radialSegments = 64;
    const heightSegments = 1;
    const openEnded = true;
    // Materials configured for double-sided transparent text overlay
    const matSolid = new THREE.MeshBasicMaterial({
        map: solidData.texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const matOutline = new THREE.MeshBasicMaterial({
        map: outlineData.texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const matGrey = new THREE.MeshBasicMaterial({
        map: greyData.texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    // Create Mesh elements with subtle variations in dimensions to prevent collision glitches
    const geomSolid = new THREE.CylinderGeometry(radius - 0.01, radius - 0.01, height, radialSegments, heightSegments, openEnded);
    const geomOutline = new THREE.CylinderGeometry(radius, radius, height, radialSegments, heightSegments, openEnded);
    const geomGrey = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, height, radialSegments, heightSegments, openEnded);
    const cylSolid = new THREE.Mesh(geomSolid, matSolid);
    const cylOutline = new THREE.Mesh(geomOutline, matOutline);
    const cylGrey = new THREE.Mesh(geomGrey, matGrey);
    // Position & Tilt Cylinders based on reference composition (spherical intersection)
    cylSolid.rotation.set(0.5, 0.4, -0.2);
    cylOutline.rotation.set(-0.6, -0.6, 0.4);
    cylGrey.rotation.set(0.2, -0.8, -0.7);
    cylinderGroup.add(cylSolid);
    cylinderGroup.add(cylOutline);
    cylinderGroup.add(cylGrey);
    // ----------------------------------------------------
    // 4. ATMOSPHERIC PARTICLE DUST
    // ----------------------------------------------------
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
        // Spread particles randomly in a 3D box
        positions[i * 3] = (Math.random() - 0.5) * 16;     // X
        positions[i * 3 + 1] = (Math.random() - 0.5) * 12; // Y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12; // Z
        
        speeds[i] = 0.003 + Math.random() * 0.006;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Circular particle texture generator
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.12,
        map: pTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.4
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    // ----------------------------------------------------
    // 5. INTERACTIVE EVENTS & CURSOR PARALLAX
    // ----------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    // Track mouse coordinates
    window.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth) - 0.5;
        targetMouseY = (e.clientY / window.innerHeight) - 0.5;
    });
    // Touch event parallax support
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            targetMouseX = (e.touches[0].clientX / window.innerWidth) - 0.5;
            targetMouseY = (e.touches[0].clientY / window.innerHeight) - 0.5;
        }
    });
    // Drag-to-spin interactivity
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let manualRotX = 0;
    let manualRotY = 0;
    window.addEventListener('mousedown', (e) => {
        if (e.target.closest('#canvas-container')) {
            isDragging = true;
            previousPointerX = e.clientX;
            previousPointerY = e.clientY;
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousPointerX;
            const deltaY = e.clientY - previousPointerY;
            manualRotY += deltaX * 0.005;
            manualRotX += deltaY * 0.005;
            previousPointerX = e.clientX;
            previousPointerY = e.clientY;
        }
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    
    // Touch support for drag
    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#canvas-container') && e.touches.length > 0) {
            isDragging = true;
            previousPointerX = e.touches[0].clientX;
            previousPointerY = e.touches[0].clientY;
        }
    });
    window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) {
            const deltaX = e.touches[0].clientX - previousPointerX;
            const deltaY = e.touches[0].clientY - previousPointerY;
            manualRotY += deltaX * 0.005;
            manualRotX += deltaY * 0.005;
            previousPointerX = e.touches[0].clientX;
            previousPointerY = e.touches[0].clientY;
        }
    });
    window.addEventListener('touchend', () => { isDragging = false; });
    // Responsive scaling logic
    function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Adjust camera distance depending on screen sizes for scaling responsiveness
        if (width < 768) {
            camera.position.z = 12; // Farther out for mobile layout
            cylinderGroup.scale.set(0.85, 0.85, 0.85);
        } else {
            camera.position.z = 9.5;
            cylinderGroup.scale.set(1, 1, 1);
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Trigger initially
    // ----------------------------------------------------
    // 6. ANIMATION LOOP
    // ----------------------------------------------------
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        
        // Spin cylinders on their local Y axis to wrap the text around continuously
        cylSolid.rotation.y += 0.005;
        cylOutline.rotation.y -= 0.003;
        cylGrey.rotation.y += 0.0015;
        // Apply smooth cursor parallax (lerp)
        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;
        // Apply manual rotations from drag + cursor tilt
        cylinderGroup.rotation.x = manualRotX + (mouseY * 0.4);
        cylinderGroup.rotation.y = manualRotY + (mouseX * 0.4);
        
        // Gently slow down manual drag rotation over time (damping)
        if (!isDragging) {
            manualRotX *= 0.95;
            manualRotY *= 0.95;
            
            // Add a very subtle idle sway when not dragging
            const time = clock.getElapsedTime();
            cylinderGroup.rotation.x += Math.sin(time * 0.5) * 0.0005;
            cylinderGroup.rotation.y += Math.cos(time * 0.5) * 0.0005;
        }
        // Animate atmospheric dust falling
        const posArray = particleGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3 + 1] -= speeds[i]; // Move Y coordinate downwards
            
            // Re-spawn particle at top if it moves off-screen
            if (posArray[i * 3 + 1] < -6) {
                posArray[i * 3 + 1] = 6;
                posArray[i * 3] = (Math.random() - 0.5) * 16;
            }
        }
        particleGeometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }
    animate();
    // ----------------------------------------------------
    // 7. LANDING PAGE CONTENT & INTERACTIVITY
    // ----------------------------------------------------
    
    // GSAP Intro Animations
    if (window.gsap) {
        const tl = gsap.timeline();
        
        // Reset element positions/opacities for animation
        gsap.set(['.grid-overlay', '.header', '.hero-branding', '.interactive-panel', '.footer'], { opacity: 0 });
        gsap.set('.glitch-title', { scale: 0.95 });
        
        tl.to('.grid-overlay', { opacity: 1, duration: 2, ease: 'power2.out' })
          .to('.header', { opacity: 1, duration: 1.2, ease: 'power2.out' }, '-=1.2')
          .to('.hero-branding', { opacity: 1, duration: 1.5, y: 0, ease: 'power3.out' }, '-=0.8')
          .to('.glitch-title', { scale: 1, duration: 1.5, ease: 'power3.out' }, '-=1.5')
          .to('.interactive-panel', { opacity: 1, duration: 1.2, y: 0, ease: 'power2.out' }, '-=0.8')
          .to('.footer', { opacity: 1, duration: 1.2, ease: 'power2.out' }, '-=1.2');
    }
    // Countdown Timer logic
    // Counts down to Oct 1st, 2026
    const targetDate = new Date('2026-10-01T00:00:00Z').getTime();
    function updateCountdown() {
        const now = new Date().getTime();
        const diff = targetDate - now;
        if (diff <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    setInterval(updateCountdown, 1000);
    updateCountdown(); // Execute immediately
    // Sidebar Menu Controls
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const sidebar = document.getElementById('sidebar-menu');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
    // Click outside sidebar to close it
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
    // Email Subscription Processing
    const subscribeForm = document.getElementById('subscribe-form');
    const emailInput = document.getElementById('email-input');
    const formFeedback = document.getElementById('form-feedback');
    const submitBtn = document.querySelector('.submit-btn');
    const subscriptionCard = document.querySelector('.subscription-card');
    // Helper: Display feedback
    function setFeedback(message, type) {
        formFeedback.textContent = message;
        formFeedback.className = 'form-feedback ' + type;
        
        // Clear message after 4 seconds if not success
        if (type !== 'success') {
            setTimeout(() => {
                formFeedback.textContent = '';
                formFeedback.className = 'form-feedback';
            }, 4000);
        }
    }
    // Check existing subscription
    if (localStorage.getItem('nuvi_subscribed') === 'true') {
        renderSubscribedState();
    }
    function renderSubscribedState() {
        if (subscriptionCard) {
            subscriptionCard.innerHTML = `
                <div style="text-align: center; padding: 10px 0;">
                    <i data-lucide="check-circle" style="color: #00ff66; width: 32px; height: 32px; margin-bottom: 12px;"></i>
                    <h3 class="card-title" style="color: #00ff66; margin-bottom: 5px;">ACCESS KEY REQUESTED</h3>
                    <p class="card-subtitle" style="margin-bottom: 0;">YOUR ACCOUNT IS CURRENTLY IN THE PRIORITIZED QUEUE FOR COLLECTION I.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    }
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailValue = emailInput.value.trim();
            if (!emailValue) {
                setFeedback('PLEASE ENTER A VALID EMAIL', 'error');
                return;
            }
            // Simple validation regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                setFeedback('INVALID EMAIL FORMAT', 'error');
                return;
            }
            // Processing state
            submitBtn.disabled = true;
            emailInput.disabled = true;
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = `<span class="btn-text">VERIFYING...</span>`;
            // Mock server request delay
            setTimeout(() => {
                localStorage.setItem('nuvi_subscribed', 'true');
                setFeedback('ACCESS GRANTED. VERIFICATION SENT.', 'success');
                
                // Animate to subscribed visual state
                if (window.gsap) {
                    gsap.to(subscriptionCard, {
                        opacity: 0,
                        y: -10,
                        duration: 0.4,
                        onComplete: () => {
                            renderSubscribedState();
                            gsap.to(subscriptionCard, { opacity: 1, y: 0, duration: 0.4 });
                        }
                    });
                } else {
                    renderSubscribedState();
                }
            }, 1500);
        });
    }
}
