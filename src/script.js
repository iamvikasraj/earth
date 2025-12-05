import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// Add dat.GUI
import * as dat from 'dat.gui';

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000); // Pure black space background

// Enhanced Lighting Setup
// Hemisphere Light - provides ambient sky and ground lighting
const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.6); // Sky blue, dark blue ground
scene.add(hemisphereLight);

// Directional Light - represents the Sun
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 3, 5);
directionalLight.castShadow = false; // Can enable shadows if needed
scene.add(directionalLight);

// Ambient Light - provides base illumination
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);
/**
 * Textures
 */
const loadingManager = new THREE.LoadingManager()
loadingManager.onStart = () =>
{
    console.log('loadingManager: loading started')
}
loadingManager.onLoad = () =>
{
    console.log('loadingManager: loading finished')
}
loadingManager.onProgress = () =>
{
    console.log('loadingManager: loading progressing')
}
loadingManager.onError = () =>
{
    console.log('loadingManager: loading error')
}

const textureLoader = new THREE.TextureLoader(loadingManager)

// const colorTexture = textureLoader.load('/textures/checkerboard-1024x1024.png')
// const colorTexture = textureLoader.load('/textures/checkerboard-2x2.png')
const colorTexture = textureLoader.load(
    '/textures/12.jpeg',
    () =>
    {
        console.log('textureLoader: loading finished')
    },
    () =>
    {
        console.log('textureLoader: loading progressing')
    },
    () =>
    {
        console.log('textureLoader: loading error')
    }
)
colorTexture.colorSpace = THREE.SRGBColorSpace
colorTexture.wrapS = THREE.MirroredRepeatWrapping
colorTexture.wrapT = THREE.MirroredRepeatWrapping
// colorTexture.repeat.x = 2
// colorTexture.repeat.y = 3
// colorTexture.offset.x = 0.5
// colorTexture.offset.y = 0.5
// colorTexture.rotation = Math.PI * 0.25
colorTexture.center.x = 0
colorTexture.center.y = 0
colorTexture.generateMipmaps = true
colorTexture.minFilter = THREE.LinearMipmapLinearFilter
colorTexture.magFilter = THREE.LinearFilter

const alphaTexture = textureLoader.load('/textures/checkboard-8x8.png')
const heightTexture = textureLoader.load('/textures/door/height.jpg')
const normalTexture = textureLoader.load('/textures/door/normal.jpg')
const ambientOcclusionTexture = textureLoader.load('/textures/door/ambientOcclusion.jpg')
const metalnessTexture = textureLoader.load('/textures/door/metalness.jpg')
const roughnessTexture = textureLoader.load('/textures/door/roughness.jpg')

/**
 * Earth Object
 */
const geometry = new THREE.SphereGeometry(1, 64, 64)
console.log(geometry.attributes)

// Enhanced Material - MeshStandardMaterial for realistic lighting
const material = new THREE.MeshStandardMaterial({ 
    map: colorTexture,
    roughness: 0.8,
    metalness: 0.1,
    // Optional: Add normal map for surface detail if available
    // normalMap: normalTexture,
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 2
camera.position.x = 2
camera.position.y = 2
camera.lookAt(mesh.position);

// Set the controls target to the center of the mesh
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = Math.PI ;
controls.enableZoom = true;

// Set the limits for zoom distance
controls.minDistance = 1.10; // Minimum zoom distance
controls.maxDistance = 20; // Maximum zoom distance




const gui = new dat.GUI();
gui.add(controls, 'autoRotate').name('Auto Rotate'); // Add autoRotate control to GUI
gui.add(controls, 'enableZoom').name('Enable Zoom'); // Add enableZoom control to GUI
gui.add(mesh.material, 'wireframe').name('Wireframe');
gui.add(controls, 'autoRotateSpeed', 0, 10).step(0.1).name('Rotation Speed');

// Lighting controls
const lightingFolder = gui.addFolder('Lighting');
lightingFolder.add(hemisphereLight, 'intensity', 0, 2).step(0.1).name('Hemisphere Intensity');
lightingFolder.add(directionalLight, 'intensity', 0, 3).step(0.1).name('Sun Intensity');
lightingFolder.add(ambientLight, 'intensity', 0, 1).step(0.1).name('Ambient Intensity');

// Material controls
const materialFolder = gui.addFolder('Material');
materialFolder.add(mesh.material, 'roughness', 0, 1).step(0.1).name('Roughness');
materialFolder.add(mesh.material, 'metalness', 0, 1).step(0.1).name('Metalness');

// Rotation controls
const rotationParams = { speedMultiplier: 0.0 }; // Default: no rotation
const rotationFolder = gui.addFolder('Rotation');
rotationFolder.add(rotationParams, 'speedMultiplier', 0, 5).step(0.1).name('Speed Multiplier');

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2



/**
 * Animate
 */
const clock = new THREE.Clock()

// Realistic Earth rotation settings
// Real Earth: 1 rotation per 24 hours (86400 seconds) = 2π radians per 86400 seconds
const EARTH_ROTATION_PERIOD = 86400; // seconds for one full rotation (24 hours)
const EARTH_ROTATION_SPEED = (2 * Math.PI) / EARTH_ROTATION_PERIOD; // radians per second

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Realistic Earth rotation (west to east, counter-clockwise when viewed from North Pole)
    // Rotates around Y-axis (vertical axis) at realistic speed
    mesh.rotation.y = elapsedTime * EARTH_ROTATION_SPEED * rotationParams.speedMultiplier
    
    // Optional: Rotate the sun light position for day/night cycle effect
    // directionalLight.position.x = Math.cos(elapsedTime * 0.1) * 5
    // directionalLight.position.z = Math.sin(elapsedTime * 0.1) * 5


    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

