/* Label NUVI - 3D Engine & Interactive Logic */
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
    function createSeamlessTextTexture(text, styleType) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        const fontHeight = 140;
        const fontSettings = `900 ${fontHeight}px "Syne", "Inter", sans-serif`;
        tempCtx.font = fontSettings;
        
        const textUnit = text + "      ";
        const textMetrics = tempCtx.measureText(textUnit);
        const textWidth = textMetrics.width;
        
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
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
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
        texture.wrapT = THREE.ClampToEdgeWrapping;
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
    const radius = 3.2;
    const height = 1.6;
    const radialSegments = 64;
    const heightSegments = 1;
    const openEnded = true;
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
    const geomSolid = new THREE.CylinderGeometry(radius - 0.01, radius - 0.01, height, radialSegments, heightSegments, openEnded);
    const geomOutline = new THREE.CylinderGeometry(radius, radius, height, radialSegments, heightSegments, openEnded);
    const geomGrey = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, height, radialSegments, heightSegments, openEnded);
    const cylSolid = new THREE.Mesh(geomSolid, matSolid);
    const cylOutline = new THREE.Mesh(geomOutline, matOutline);
    const cylGrey = new THREE.Mesh(geomGrey, matGrey);
    cylSolid.rotation.set(0.5, 0.4, -0.2);
    cylOutline.rotation.set(-0.6, -0.6, 0.4);
    cylGrey.rotation.set(0.2, -0.8, -0.7);
    cylinderGroup.add(cylSolid);
    cylinderGroup.add(cylOutline);
    cylinderGroup.add(cylGrey);
    // ----------------------------------------------------
    // 4. ATMOSPHERIC PARTICLE DUST
    // ----------------------------------------------------
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
        
        speeds[i] = 0.003 + Math.random() * 0.006;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
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
        opacity: 0.35
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    // ----------------------------------------------------
    // 5. INTERACTIVE COORDINATES (MOUSE & TOUCH)
    // ----------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    
    // Custom Cursor tracking positions
    let cursorX = 0;
    let cursorY = 0;
    let targetCursorX = 0;
    let targetCursorY = 0;
    const customCursor = document.getElementById('custom-cursor');
    const cursorText = customCursor ? customCursor.querySelector('.cursor-text') : null;
    // Track mouse coordinates
    window.addEventListener('mousemove', (e) => {
        // WebGL Parallax target
        targetMouseX = (e.clientX / window.innerWidth) - 0.5;
        targetMouseY = (e.clientY / window.innerHeight) - 0.5;
        // Custom cursor target
        targetCursorX = e.clientX;
        targetCursorY = e.clientY;
        // Show cursor on first move
        if (customCursor) {
            customCursor.style.opacity = '1';
        }
    });
    // Drag-to-spin WebGL scene logic
    let isDraggingCanvas = false;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let manualRotX = 0;
    let manualRotY = 0;
    window.addEventListener('mousedown', (e) => {
        if (e.target.closest('#canvas-container')) {
            isDraggingCanvas = true;
            previousPointerX = e.clientX;
            previousPointerY = e.clientY;
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (isDraggingCanvas) {
            const deltaX = e.clientX - previousPointerX;
            const deltaY = e.clientY - previousPointerY;
            manualRotY += deltaX * 0.005;
            manualRotX += deltaY * 0.005;
            previousPointerX = e.clientX;
            previousPointerY = e.clientY;
        }
    });
    window.addEventListener('mouseup', () => { isDraggingCanvas = false; });
    // Responsive scaling logic
    function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (width < 1025) {
            camera.position.z = 11;
            cylinderGroup.scale.set(0.78, 0.78, 0.78);
        } else {
            camera.position.z = 9.5;
            cylinderGroup.scale.set(0.95, 0.95, 0.95);
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
    // ----------------------------------------------------
    // 6. ANIMATION & RENDERING LOOP
    // ----------------------------------------------------
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        
        // Spin cylinders
        cylSolid.rotation.y += 0.005;
        cylOutline.rotation.y -= 0.003;
        cylGrey.rotation.y += 0.0015;
        // Smooth camera tilt
        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;
        cylinderGroup.rotation.x = manualRotX + (mouseY * 0.45);
        cylinderGroup.rotation.y = manualRotY + (mouseX * 0.45);
        
        if (!isDraggingCanvas) {
            manualRotX *= 0.95;
            manualRotY *= 0.95;
            const time = clock.getElapsedTime();
            cylinderGroup.rotation.x += Math.sin(time * 0.4) * 0.0004;
            cylinderGroup.rotation.y += Math.cos(time * 0.4) * 0.0004;
        }
        // Floating particles
        const posArray = particleGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3 + 1] -= speeds[i];
            if (posArray[i * 3 + 1] < -6) {
                posArray[i * 3 + 1] = 6;
                posArray[i * 3] = (Math.random() - 0.5) * 16;
            }
        }
        particleGeometry.attributes.position.needsUpdate = true;
        // Custom Cursor LERP
        if (customCursor) {
            cursorX += (targetCursorX - cursorX) * 0.15;
            cursorY += (targetCursorY - cursorY) * 0.15;
            customCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
        }
        renderer.render(scene, camera);
    }
    animate();
    // ----------------------------------------------------
    // 7. DRAGGABLE POLAROID CARDS LOGIC
    // ----------------------------------------------------
    const cards = document.querySelectorAll('.draggable-card');
    let highestZIndex = 30;
    cards.forEach(card => {
        let isDragging = false;
        let startX, startY;
        let cardStartX, cardStartY;
        let lastMoveX = 0; // Track movement for rotation skew
        const dragStart = (e) => {
            isDragging = true;
            card.classList.add('dragging');
            
            // Set highest z-index to bring current card to front
            highestZIndex++;
            card.style.zIndex = highestZIndex;
            // Get pointer starting coordinates
            const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;
            // Get card current coordinates
            const rect = card.getBoundingClientRect();
            cardStartX = rect.left;
            cardStartY = rect.top;
            // Update custom cursor text
            if (customCursor) {
                customCursor.classList.add('hovering-card');
                if (cursorText) cursorText.textContent = 'HOLDING';
            }
        };
        const dragMove = (e) => {
            if (!isDragging) return;
            const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;
            // Drag velocity skew calculation
            const currentMoveX = clientX;
            const speed = currentMoveX - lastMoveX;
            lastMoveX = currentMoveX;
            const rotationSkew = Math.max(Math.min(speed * 0.8, 12), -12);
            // Compute positions
            const newLeft = cardStartX + dx;
            const newTop = cardStartY + dy;
            card.style.left = `${newLeft}px`;
            card.style.top = `${newTop}px`;
            card.style.transform = `rotate(${rotationSkew}deg) scale(1.02)`;
        };
        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            card.classList.remove('dragging');
            // Settle card to standard subtle random rotation angle
            const randomRotation = (Math.random() * 8) - 4; // between -4deg and 4deg
            card.style.transform = `rotate(${randomRotation}deg) scale(1)`;
            if (customCursor) {
                // Return to normal drag hover text
                const rect = card.getBoundingClientRect();
                const mouseOver = (targetCursorX >= rect.left && targetCursorX <= rect.right &&
                                   targetCursorY >= rect.top && targetCursorY <= rect.bottom);
                if (mouseOver) {
                    if (cursorText) cursorText.textContent = 'DRAG';
                } else {
                    customCursor.classList.remove('hovering-card');
                    if (cursorText) cursorText.textContent = 'EXPLORE';
                }
            }
        };
        // Attach listeners
        card.addEventListener('mousedown', dragStart);
        window.addEventListener('mousemove', dragMove);
        window.addEventListener('mouseup', dragEnd);
        // Mobile touch support
        card.addEventListener('touchstart', dragStart, { passive: true });
        window.addEventListener('touchmove', dragMove, { passive: false });
        window.addEventListener('touchend', dragEnd);
        // Hover events for custom cursor styling
        card.addEventListener('mouseenter', () => {
            if (!isDragging && customCursor) {
                customCursor.classList.add('hovering-card');
                if (cursorText) cursorText.textContent = 'DRAG';
            }
        });
        card.addEventListener('mouseleave', () => {
            if (!isDragging && customCursor) {
                customCursor.classList.remove('hovering-card');
                if (cursorText) cursorText.textContent = 'EXPLORE';
            }
        });
    });
    // ----------------------------------------------------
    // 8. CUSTOM CURSOR INTERACTIVE HOVERS
    // ----------------------------------------------------
    const interactiveElements = document.querySelectorAll('a, button, input, .menu-toggle');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (customCursor) {
                customCursor.classList.add('hovering-link');
                if (cursorText) cursorText.opacity = '0';
            }
        });
        el.addEventListener('mouseleave', () => {
            if (customCursor) {
                customCursor.classList.remove('hovering-link');
                if (cursorText) cursorText.opacity = '1';
            }
        });
    });
    // ----------------------------------------------------
    // 9. INTRO ANIMATIONS (GSAP)
    // ----------------------------------------------------
    if (window.gsap) {
        const tl = gsap.timeline();
        
        // Hide/set visual starting states
        gsap.set(['.grid-overlay', '.header', '.hero-branding', '.control-center', '.footer', '.marquee'], { opacity: 0 });
        gsap.set('.glitch-title', { scale: 0.93 });
        gsap.set('#card-1', { x: -400, y: -100, rotation: -30, opacity: 0 });
        gsap.set('#card-2', { x: 400, y: 100, rotation: 30, opacity: 0 });
        
        tl.to('.grid-overlay', { opacity: 1, duration: 1.8, ease: 'power2.out' })
          .to('.header', { opacity: 1, duration: 1, ease: 'power2.out' }, '-=1')
          .to('.hero-branding', { opacity: 1, duration: 1.2, y: 0, ease: 'power3.out' }, '-=0.6')
          .to('.glitch-title', { scale: 1, duration: 1.2, ease: 'power3.out' }, '-=1.2')
          // Cards slide in with elastic bounce
          .to('#card-1', { x: 0, y: 0, rotation: -6, opacity: 1, duration: 1.5, ease: 'power4.out' }, '-=0.8')
          .to('#card-2', { x: 0, y: 0, rotation: 4, opacity: 1, duration: 1.5, ease: 'power4.out' }, '-=1.3')
          .to('.control-center', { opacity: 1, duration: 1, y: 0, ease: 'power2.out' }, '-=1.2')
          .to('.footer', { opacity: 1, duration: 1, ease: 'power2.out' }, '-=1')
          .to('.marquee', { opacity: 1, duration: 1.5, ease: 'power2.out' }, '-=1.2');
    }
    // ----------------------------------------------------
    // 10. COUNTDOWN TIMER & SUBMISSION
    // ----------------------------------------------------
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
    updateCountdown();
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
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
    // Subscription Form Submission
    const subscribeForm = document.getElementById('subscribe-form');
    const emailInput = document.getElementById('email-input');
    const formFeedback = document.getElementById('form-feedback');
    const submitBtn = document.querySelector('.submit-btn');
    const subscriptionCard = document.querySelector('.subscription-card');
    function setFeedback(message, type) {
        formFeedback.textContent = message;
        formFeedback.className = 'form-feedback ' + type;
        
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
                    <i data-lucide="check-circle" style="color: #00ff66; width: 30px; height: 30px; margin-bottom: 12px; display: inline-block;"></i>
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
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                setFeedback('INVALID EMAIL FORMAT', 'error');
                return;
            }
            submitBtn.disabled = true;
            emailInput.disabled = true;
            submitBtn.innerHTML = `<span class="btn-text">VERIFYING</span>`;
            setTimeout(() => {
                localStorage.setItem('nuvi_subscribed', 'true');
                setFeedback('ACCESS GRANTED. VERIFICATION SENT.', 'success');
                
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
