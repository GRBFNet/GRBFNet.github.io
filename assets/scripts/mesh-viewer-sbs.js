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
        this.init();
    }

    init() {
        this.viewerContainer = document.createElement('div');
        this.viewerContainer.style.position = 'relative';
        this.viewerContainer.style.width = '100%';
        this.viewerContainer.style.height = '500px';
        this.container.appendChild(this.viewerContainer);
        this.initThree();
        this.loadGLTFMesh();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.viewerContainer.clientWidth / this.viewerContainer.clientHeight, 0.1, 1000);
        this.camera.position.z = this.initialZoom;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
        this.viewerContainer.appendChild(this.renderer.domElement);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Add 2 opposite top corner lights
        const lightPositions = [
            [1, 1, 1],
            [-1, 1, -1],
        ];
        lightPositions.forEach(pos => {
            const light = new THREE.DirectionalLight(0xffffff, this.lightIntensity);
            light.position.set(...pos).multiplyScalar(5);
            this.scene.add(light);
        });

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        window.addEventListener('resize', () => {
            this.camera.aspect = this.viewerContainer.clientWidth / this.viewerContainer.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
        });
        this.animate();
    }

    loadGLTFMesh() {
        const loader = new THREE.GLTFLoader();
        loader.load(this.gltfPath, (gltf) => {
            const model = gltf.scene;
            // Apply initial rotation from argument
            model.rotation.x = this.initialRotation.x || 0;
            model.rotation.y = this.initialRotation.y || 0;
            model.rotation.z = this.initialRotation.z || 0;
            this.scene.add(model);
            this.centerMesh(model);
            this.mesh = model;
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
        }
        this.renderer.render(this.scene, this.camera);
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
        this.init(leftOptions, rightOptions, viewOptions);
    }

    init(leftOptions, rightOptions, viewOptions) {
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

        // Create GLTF mesh viewers
        this.leftViewer = new GLTFMeshViewer(leftViewerId, {
            ...leftOptions,
            initialRotation: viewOptions.initialRotation,
            initialZoom: viewOptions.initialZoom,
            rotationAxis: viewOptions.rotationAxis,
            rotationSpeed: viewOptions.rotationSpeed,
            lightIntensity: viewOptions.lightIntensity
        });
        this.rightViewer = new GLTFMeshViewer(rightViewerId, {
            ...rightOptions,
            initialRotation: viewOptions.initialRotation,
            initialZoom: viewOptions.initialZoom,
            rotationAxis: viewOptions.rotationAxis,
            rotationSpeed: viewOptions.rotationSpeed,
            lightIntensity: viewOptions.lightIntensity
        });

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