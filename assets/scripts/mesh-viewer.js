class MeshViewer {
    constructor(containerId, objPath, color) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.objPath = objPath;
        this.color = color;
        this.init();
    }

    init() {
        // Create container for the 3D viewer
        this.viewerContainer = document.createElement('div');
        this.viewerContainer.style.position = 'relative';
        this.viewerContainer.style.width = '100%';
        this.viewerContainer.style.height = '500px';
        this.container.appendChild(this.viewerContainer);

        // Initialize Three.js
        this.initThree();
        // Load OBJ mesh
        this.loadOBJMesh();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.viewerContainer.clientWidth / this.viewerContainer.clientHeight, 0.1, 1000);
        this.camera.position.z = 5;
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

    loadOBJMesh() {
        const loader = new THREE.OBJLoader();
        loader.load(this.objPath, (object) => {
            object.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({ color: this.color, side: THREE.DoubleSide });
                }
            });
            this.mesh = object;
            this.scene.add(this.mesh);
            this.centerMesh(this.mesh);
            this.animateMesh();
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
        this.renderer.render(this.scene, this.camera);
    }
}

// Example usage:
// const viewer = new MeshViewer('mesh-viewer-container', 'assets/figures/meshes/xyzrgb_statuette_DiF-Grid.obj', 0x2194ce); 
// const viewer = new MeshComparisonViewer('mesh-viewer-container'); 