// Add at the beginning of the file, before any class definitions
const globalHintManager = {
    hintOverlays: [],
    addHintOverlay(overlay) {
        this.hintOverlays.push(overlay);
    },
    removeAllHints() {
        // Remove all hint overlays
        this.hintOverlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 500);
            }
        });
        this.hintOverlays = [];

        // Remove all interaction hints
        document.querySelectorAll('.mesh-viewer-container').forEach(container => {
            const hint = container.querySelector('.interaction-hint');
            if (hint) {
                hint.style.display = 'none';
            }
        });
    }
};

class ExampleMeshViewer {
    constructor(containerId, color) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.color = color;
        this.init();
    }

    init() {
        this.viewerContainer = document.createElement('div');
        this.viewerContainer.style.position = 'relative';
        this.viewerContainer.style.width = '100%';
        this.viewerContainer.style.height = '500px';
        this.container.appendChild(this.viewerContainer);
        this.initThree();
        this.createExampleMesh();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xE0E0E0);  // Light gray background
        this.camera = new THREE.PerspectiveCamera(75, this.viewerContainer.clientWidth / this.viewerContainer.clientHeight, 0.1, 1000);
        this.camera.position.z = 2.5;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
        this.viewerContainer.appendChild(this.renderer.domElement);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        const light1 = new THREE.DirectionalLight(0xffffff, 1);
        light1.position.set(1, 1, 1);
        this.scene.add(light1);
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        window.addEventListener('resize', () => {
            this.camera.aspect = this.viewerContainer.clientWidth / this.viewerContainer.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
        });
        this.animate();
    }

    createExampleMesh() {
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshPhongMaterial({ color: this.color, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        this.centerMesh(this.mesh);
        this.animateMesh();
    }

    centerMesh(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        mesh.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        mesh.scale.multiplyScalar(scale);
    }

    animateMesh() {
        if (this.mesh) {
            this.mesh.rotation.x += 0.005;
            this.mesh.rotation.y += 0.005;
        }
        requestAnimationFrame(() => this.animateMesh());
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        if (this.mesh) {
            this.mesh.rotation.z += 0.003;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// Add GLTFMeshViewer class for GLTF file support
class GLTFMeshViewer {
    constructor(containerId, options) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.gltfPath = options.gltfPath;
        this.initialRotation = options.initialRotation || {x: Math.PI/2, y: 0, z: 0};
        this.initialZoom = options.initialZoom !== undefined ? options.initialZoom : 2.5;
        this.rotationAxis = options.rotationAxis || {x: 0, y: 0, z: 1};
        this.rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : 0.003;
        this.lightIntensity = options.lightIntensity !== undefined ? options.lightIntensity : 0.6;
        this.breathingAnimation = options.breathingAnimation || { enabled: false };
        this.originalScale = new THREE.Vector3(1, 1, 1);
        this.breathingTime = 0;
        this.onHintCreated = options.onHintCreated || (() => {});
        this.onInteraction = options.onInteraction || (() => {});
        this.lights = []; // Store references to lights
        this.materials = []; // Store references to materials
        this.isLoading = true;
        this.init();
    }

    init() {
        this.viewerContainer = document.createElement('div');
        this.viewerContainer.style.position = 'relative';
        this.viewerContainer.style.width = '100%';
        this.viewerContainer.style.height = '500px';
        this.container.appendChild(this.viewerContainer);
        this.initThree();
        this.addLoadingAnimation();
        this.loadGLTFMesh();
        this.addInteractionHint();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xE0E0E0);  // Light gray background
        this.camera = new THREE.PerspectiveCamera(75, this.viewerContainer.clientWidth / this.viewerContainer.clientHeight, 0.1, 1000);
        this.camera.position.z = this.initialZoom;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
        this.viewerContainer.appendChild(this.renderer.domElement);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Create three main lights for balanced illumination
        const lightPositions = [
            [1, 1, 1],     // Main front light
            [-1, 0.5, 0],  // Fill light from left
            [0, -1, -1]    // Back light
        ];

        // Add directional lights
        lightPositions.forEach(pos => {
            const light = new THREE.DirectionalLight(0xffffff, this.lightIntensity * 0.6); // Increased intensity per light
            light.position.set(...pos).normalize().multiplyScalar(100);
            this.scene.add(light);
            this.lights.push(light);
        });

        // Add subtle ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        window.addEventListener('resize', () => {
            this.camera.aspect = this.viewerContainer.clientWidth / this.viewerContainer.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
        });
        this.animate();
    }

    addLoadingAnimation() {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.style.position = 'absolute';
        loadingOverlay.style.top = '0';
        loadingOverlay.style.left = '0';
        loadingOverlay.style.width = '100%';
        loadingOverlay.style.height = '100%';
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.alignItems = 'center';
        loadingOverlay.style.justifyContent = 'center';
        loadingOverlay.style.pointerEvents = 'none';
        loadingOverlay.style.zIndex = '1000';
        loadingOverlay.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';

        // Create loading container
        const loadingContainer = document.createElement('div');
        loadingContainer.style.position = 'relative';
        loadingContainer.style.display = 'flex';
        loadingContainer.style.flexDirection = 'column';
        loadingContainer.style.alignItems = 'center';
        loadingContainer.style.gap = '15px';

        // Create loading spinner
        const spinner = document.createElement('div');
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.border = '3px solid rgba(255, 255, 255, 0.3)';
        spinner.style.borderRadius = '50%';
        spinner.style.borderTopColor = 'white';
        spinner.style.animation = 'spin 1s linear infinite';

        // Add loading text
        const loadingText = document.createElement('div');
        loadingText.style.color = 'white';
        loadingText.style.fontFamily = 'Arial, sans-serif';
        loadingText.style.fontSize = '14px';
        loadingText.textContent = 'Loading model...';

        // Add styles for spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        loadingContainer.appendChild(spinner);
        loadingContainer.appendChild(loadingText);
        loadingOverlay.appendChild(loadingContainer);
        this.viewerContainer.appendChild(loadingOverlay);
        this.loadingOverlay = loadingOverlay;
    }

    loadGLTFMesh() {
        const loader = new THREE.GLTFLoader();
        loader.load(this.gltfPath, (gltf) => {
            const model = gltf.scene;
            // Apply initial rotation from argument
            model.rotation.x = this.initialRotation.x || 0;
            model.rotation.y = this.initialRotation.y || 0;
            model.rotation.z = this.initialRotation.z || 0;
            
            // Set unified color for all materials
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.color.set('#E0E0E0'); // Light gray color
                }
            });

            this.scene.add(model);
            this.centerMesh(model);
            this.mesh = model;
            this.originalScale.copy(model.scale);
            
            // Remove loading animation
            if (this.loadingOverlay && this.loadingOverlay.parentNode) {
                this.loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (this.loadingOverlay.parentNode) {
                        this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
                    }
                }, 500);
            }
            this.isLoading = false;
        });
    }

    centerMesh(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        mesh.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        mesh.scale.multiplyScalar(scale);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        if (this.mesh) {
            // Apply constant rotation around the specified axis
            if (this.rotationAxis.x) this.mesh.rotation.x += this.rotationAxis.x * this.rotationSpeed;
            if (this.rotationAxis.y) this.mesh.rotation.y += this.rotationAxis.y * this.rotationSpeed;
            if (this.rotationAxis.z) this.mesh.rotation.z += this.rotationAxis.z * this.rotationSpeed;

            // Apply breathing animation if enabled
            if (this.breathingAnimation.enabled && !this.controls.enabled) {
                this.breathingTime += 0.01;
                const scale = 1 + (Math.sin(this.breathingTime) * 0.05); // 5% scale variation
                this.mesh.scale.set(
                    this.originalScale.x * scale,
                    this.originalScale.y * scale,
                    this.originalScale.z * scale
                );
            }
        }
        this.renderer.render(this.scene, this.camera);
    }

    addInteractionHint() {
        // Create hint overlay
        const hintOverlay = document.createElement('div');
        hintOverlay.style.position = 'absolute';
        hintOverlay.style.top = '0';
        hintOverlay.style.left = '0';
        hintOverlay.style.width = '100%';
        hintOverlay.style.height = '100%';
        hintOverlay.style.display = 'flex';
        hintOverlay.style.alignItems = 'center';
        hintOverlay.style.justifyContent = 'center';
        hintOverlay.style.pointerEvents = 'none';
        hintOverlay.style.zIndex = '1000';
        hintOverlay.style.opacity = '0.9';
        hintOverlay.style.transition = 'opacity 0.5s ease-out';
        hintOverlay.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';

        // Add text hint
        const textHint = document.createElement('div');
        textHint.style.position = 'absolute';
        textHint.style.bottom = '20px';
        textHint.style.left = '50%';
        textHint.style.transform = 'translateX(-50%)';
        textHint.style.color = 'white';
        textHint.style.fontFamily = 'Arial, sans-serif';
        textHint.style.fontSize = '14px';
        textHint.style.textAlign = 'center';
        textHint.style.textShadow = '0 0 4px rgba(0,0,0,0.5)';
        textHint.textContent = 'Drag to rotate • Scroll to zoom';
        hintOverlay.appendChild(textHint);

        // Remove hint on first interaction
        let isRemoving = false;
        const removeHint = () => {
            if (isRemoving) return;
            isRemoving = true;
            this.onInteraction();
            globalHintManager.removeAllHints();
        };

        // Add event listeners
        this.viewerContainer.addEventListener('mousedown', removeHint);
        this.viewerContainer.addEventListener('touchstart', removeHint);
        this.viewerContainer.addEventListener('wheel', removeHint);
        this.viewerContainer.addEventListener('pointerdown', removeHint);

        // Also remove hint if user interacts with controls
        if (this.controls) {
            this.controls.addEventListener('start', removeHint);
        }

        // Notify parent about hint creation
        this.onHintCreated(hintOverlay);
        this.viewerContainer.appendChild(hintOverlay);
    }

    updateLighting(intensity) {
        this.lights.forEach(light => {
            if (light instanceof THREE.DirectionalLight) {
                // Scale the intensity for directional lights
                light.intensity = intensity * 0.6; // Each directional light gets 60% of the total intensity
            } else if (light instanceof THREE.AmbientLight) {
                // Keep ambient light subtle
                light.intensity = intensity * 0.2;
            }
        });
    }

    updateColor(color) {
        this.materials.forEach(material => {
            if (material.color) {
                material.color.set(color);
            }
        });
    }
}

// Update SyncedMeshViewers to use GLTFMeshViewer
class SyncedMeshViewers {
    constructor(containerId, leftOptions, rightOptions, viewOptions = {}) {
        this.container = document.getElementById(containerId);
        this.leftViewer = null;
        this.rightViewer = null;
        this.syncing = false;
        this.leftOptions = leftOptions;
        this.rightOptions = rightOptions;
        this.viewOptions = viewOptions;
        this.title = viewOptions.title || '';  // Add title parameter
        this.init(leftOptions, rightOptions, viewOptions);
    }

    // Update method to update lighting for all viewers
    updateLighting(intensity) {
        // Update lighting for both viewers in this instance
        if (this.leftViewer) {
            this.leftViewer.updateLighting(intensity);
        }
        if (this.rightViewer) {
            this.rightViewer.updateLighting(intensity);
        }

        // Update lighting for all other synced viewers on the page
        document.querySelectorAll('.mesh-viewer-container').forEach(container => {
            const viewer = container.__viewer;
            if (viewer && viewer !== this.leftViewer && viewer !== this.rightViewer) {
                viewer.updateLighting(intensity);
            }
        });
    }

    init(leftOptions, rightOptions, viewOptions) {
        // Add title if provided
        if (this.title) {
            const titleElement = document.createElement('div');
            titleElement.style.textAlign = 'center';
            titleElement.style.marginBottom = '20px';
            titleElement.style.fontFamily = 'Poppins, sans-serif';
            titleElement.style.fontSize = '1.2em';
            titleElement.style.fontWeight = '500';
            titleElement.textContent = this.title;
            this.container.appendChild(titleElement);
        }

        // Create side-by-side containers
        this.leftDiv = document.createElement('div');
        this.rightDiv = document.createElement('div');
        this.leftDiv.style.width = '49%';
        this.leftDiv.style.display = 'inline-block';
        this.leftDiv.style.verticalAlign = 'top';
        this.rightDiv.style.width = '49%';
        this.rightDiv.style.display = 'inline-block';
        this.rightDiv.style.verticalAlign = 'top';
        this.container.appendChild(this.leftDiv);
        this.container.appendChild(this.rightDiv);

        // Create unique IDs for viewer containers
        const leftViewerId = 'mesh-viewer-left-' + Math.random().toString(36).substr(2, 9);
        const rightViewerId = 'mesh-viewer-right-' + Math.random().toString(36).substr(2, 9);
        const leftViewerContainer = document.createElement('div');
        leftViewerContainer.id = leftViewerId;
        this.leftDiv.appendChild(leftViewerContainer);
        const rightViewerContainer = document.createElement('div');
        rightViewerContainer.id = rightViewerId;
        this.rightDiv.appendChild(rightViewerContainer);

        // Add event listeners to remove all hints when any viewer is interacted with
        const removeAllHintsOnInteraction = () => {
            document.querySelectorAll('.mesh-viewer-container').forEach(container => {
                const hint = container.querySelector('.interaction-hint');
                if (hint) {
                    hint.style.display = 'none';
                }
            });
        };

        // Add event listeners to both containers
        [leftViewerContainer, rightViewerContainer].forEach(container => {
            container.addEventListener('mousedown', removeAllHintsOnInteraction);
            container.addEventListener('touchstart', removeAllHintsOnInteraction);
            container.addEventListener('wheel', removeAllHintsOnInteraction);
            container.addEventListener('pointerdown', removeAllHintsOnInteraction);
        });

        // Create controls container
        const createControlsContainer = () => {
            const controlsContainer = document.createElement('div');
            controlsContainer.style.position = 'absolute';
            controlsContainer.style.top = '20px';
            controlsContainer.style.left = '50%';
            controlsContainer.style.transform = 'translateX(-50%)';
            controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            controlsContainer.style.padding = '10px 15px';
            controlsContainer.style.borderRadius = '20px';
            controlsContainer.style.zIndex = '1000';
            controlsContainer.style.display = 'flex';
            controlsContainer.style.alignItems = 'center';
            controlsContainer.style.gap = '10px';
            controlsContainer.style.fontFamily = 'Arial, sans-serif';
            controlsContainer.style.color = 'white';
            controlsContainer.style.pointerEvents = 'auto';

            // Create lighting controls
            const lightingControls = document.createElement('div');
            lightingControls.style.display = 'flex';
            lightingControls.style.alignItems = 'center';
            lightingControls.style.gap = '10px';

            // Create light label
            const lightLabel = document.createElement('div');
            lightLabel.textContent = 'Light';
            lightLabel.style.fontSize = '14px';
            lightLabel.style.whiteSpace = 'nowrap';
            lightingControls.appendChild(lightLabel);

            // Create light slider
            const lightSlider = document.createElement('input');
            lightSlider.type = 'range';
            lightSlider.min = '0';
            lightSlider.max = '1.5';
            lightSlider.step = '0.1';
            lightSlider.value = viewOptions.lightIntensity || 0.6;
            lightSlider.style.width = '100px';
            lightSlider.style.margin = '0';
            lightSlider.style.accentColor = '#ffffff';

            // Create light value display
            const lightValueDisplay = document.createElement('span');
            lightValueDisplay.textContent = lightSlider.value;
            lightValueDisplay.style.fontSize = '14px';
            lightValueDisplay.style.minWidth = '30px';
            lightValueDisplay.style.textAlign = 'right';

            // Add light slider event listener
            lightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                lightValueDisplay.textContent = value.toFixed(1);
                this.updateLighting(value);
            });

            lightingControls.appendChild(lightSlider);
            lightingControls.appendChild(lightValueDisplay);
            controlsContainer.appendChild(lightingControls);
            return controlsContainer;
        };

        // Add the controls to both viewer containers
        leftViewerContainer.style.position = 'relative';
        rightViewerContainer.style.position = 'relative';
        leftViewerContainer.appendChild(createControlsContainer());
        rightViewerContainer.appendChild(createControlsContainer());

        // Create GLTF mesh viewers
        this.leftViewer = new GLTFMeshViewer(leftViewerId, {
            ...leftOptions,
            initialRotation: viewOptions.initialRotation,
            initialZoom: viewOptions.initialZoom,
            rotationAxis: viewOptions.rotationAxis,
            rotationSpeed: viewOptions.rotationSpeed,
            lightIntensity: viewOptions.lightIntensity,
            onHintCreated: (overlay) => globalHintManager.addHintOverlay(overlay),
            onInteraction: () => globalHintManager.removeAllHints()
        });
        this.rightViewer = new GLTFMeshViewer(rightViewerId, {
            ...rightOptions,
            initialRotation: viewOptions.initialRotation,
            initialZoom: viewOptions.initialZoom,
            rotationAxis: viewOptions.rotationAxis,
            rotationSpeed: viewOptions.rotationSpeed,
            lightIntensity: viewOptions.lightIntensity,
            onHintCreated: (overlay) => globalHintManager.addHintOverlay(overlay),
            onInteraction: () => globalHintManager.removeAllHints()
        });

        // Store references to viewers for global access
        leftViewerContainer.__viewer = this.leftViewer;
        rightViewerContainer.__viewer = this.rightViewer;

        // Add titles under each mesh preview
        if (leftOptions.title) {
            const titleElem = document.createElement('div');
            titleElem.style.textAlign = 'center';
            titleElem.style.marginTop = '8px';
            titleElem.style.fontFamily = 'Poppins, sans-serif';
            titleElem.style.fontSize = '1em';
            titleElem.style.fontWeight = '500';
            titleElem.textContent = leftOptions.title;
            this.leftDiv.appendChild(titleElem);
        }
        if (rightOptions.title) {
            const titleElem = document.createElement('div');
            titleElem.style.textAlign = 'center';
            titleElem.style.marginTop = '8px';
            titleElem.style.fontFamily = 'Poppins, sans-serif';
            titleElem.style.fontSize = '1em';
            titleElem.style.fontWeight = '500';
            titleElem.textContent = rightOptions.title;
            this.rightDiv.appendChild(titleElem);
        }

        // Sync controls
        this.syncControls(this.leftViewer, this.rightViewer);
        this.syncControls(this.rightViewer, this.leftViewer);
    }

    syncControls(sourceViewer, targetViewer) {
        sourceViewer.controls.addEventListener('change', () => {
            if (this.syncing) return;
            this.syncing = true;
            targetViewer.camera.position.copy(sourceViewer.camera.position);
            targetViewer.camera.rotation.copy(sourceViewer.camera.rotation);
            targetViewer.controls.target.copy(sourceViewer.controls.target);
            targetViewer.controls.update();
            this.syncing = false;
        });
    }
} 