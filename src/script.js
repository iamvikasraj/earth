import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Scene Setup
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

/**
 * Lighting
 */
const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.8)
scene.add(hemisphereLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0)
directionalLight.position.set(10, 0, 0)
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
scene.add(ambientLight)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const milkyWayTexture = textureLoader.load(
    '/8k_stars_milky_way.jpg',
    () => {
        // On load
        scene.background = milkyWayTexture
        console.log('✅ Milky Way background loaded and set')
    },
    undefined,
    (error) => {
        console.error('❌ Milky Way texture loading error:', error)
        // Fallback to black background
        scene.background = new THREE.Color(0x000000)
    }
)
milkyWayTexture.colorSpace = THREE.SRGBColorSpace
milkyWayTexture.mapping = THREE.EquirectangularReflectionMapping
// Set background immediately in case texture is already cached
scene.background = milkyWayTexture

// Debug: Log background status
console.log('Background texture:', milkyWayTexture)
console.log('Scene background:', scene.background)

const earthDayTexture = textureLoader.load('/2k_earth_daymap.jpg')
earthDayTexture.colorSpace = THREE.SRGBColorSpace
earthDayTexture.wrapS = THREE.ClampToEdgeWrapping
earthDayTexture.wrapT = THREE.ClampToEdgeWrapping
earthDayTexture.flipY = true // Flip Y to correct orientation
earthDayTexture.generateMipmaps = true
earthDayTexture.minFilter = THREE.LinearMipmapLinearFilter
earthDayTexture.magFilter = THREE.LinearFilter
earthDayTexture.anisotropy = 16

const earthCloudsTexture = textureLoader.load('/2k_earth_clouds.jpg')
earthCloudsTexture.colorSpace = THREE.SRGBColorSpace
earthCloudsTexture.wrapS = THREE.ClampToEdgeWrapping
earthCloudsTexture.wrapT = THREE.ClampToEdgeWrapping
earthCloudsTexture.flipY = true // Flip Y to correct orientation
earthCloudsTexture.generateMipmaps = true
earthCloudsTexture.minFilter = THREE.LinearMipmapLinearFilter
earthCloudsTexture.magFilter = THREE.LinearFilter
earthCloudsTexture.anisotropy = 16

/**
 * Earth
 */
const geometry = new THREE.SphereGeometry(1, 128, 64)
const material = new THREE.MeshStandardMaterial({
    map: earthDayTexture,
    roughness: 1.0, // Maximum roughness = completely matte
    metalness: 0.0, // No metalness
    envMapIntensity: 0.0, // Disable environment map reflections
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

/**
 * Clouds
 */
const cloudsGeometry = new THREE.SphereGeometry(1.01, 128, 64)
const cloudsMaterial = new THREE.MeshStandardMaterial({
    map: earthCloudsTexture,
    transparent: true,
    opacity: 0.35,
    alphaTest: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
})
const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
scene.add(cloudsMesh)

/**
 * Moon
 */
const moonTexture = textureLoader.load('/lroc_color_2k.jpg')
moonTexture.colorSpace = THREE.SRGBColorSpace
moonTexture.wrapS = THREE.ClampToEdgeWrapping
moonTexture.wrapT = THREE.ClampToEdgeWrapping
moonTexture.flipY = true
moonTexture.generateMipmaps = true
moonTexture.minFilter = THREE.LinearMipmapLinearFilter
moonTexture.magFilter = THREE.LinearFilter
moonTexture.anisotropy = 16

// Realistic Moon scale: Moon radius is ~27% of Earth's radius
// Real Earth radius: ~6,371 km, Moon radius: ~1,737 km
const moonGeometry = new THREE.SphereGeometry(0.2727, 64, 64) // 1,737 / 6,371 ≈ 0.2727
const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture,
    roughness: 0.9,
    metalness: 0.1,
})
const moon = new THREE.Mesh(moonGeometry, moonMaterial)
// Earth-Moon distance: Using a closer distance for better visualization
// Real distance is ~60.3 Earth radii, but we'll use 12 for better visibility
const MOON_DISTANCE = 12 // Earth-Moon distance in Earth radii (reduced for visibility)
moon.position.set(MOON_DISTANCE, 0, 0) // Start to the right of Earth
scene.add(moon)

/**
 * Camera
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Perspective camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 200)
camera.position.set(-3, 1.5, 2)
camera.lookAt(0, 0, 0)
scene.add(camera)

/**
 * Camera Animation
 */
let cameraAnimation = {
    isAnimating: false,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    targetTarget: new THREE.Vector3(),
    duration: 2000, // 2 seconds
    startTime: 0
}

const animateCamera = (targetPos, targetLookAt) => {
    cameraAnimation.isAnimating = true
    cameraAnimation.startPosition.copy(camera.position)
    cameraAnimation.startTarget.copy(controls.target)
    cameraAnimation.targetPosition.copy(targetPos)
    cameraAnimation.targetTarget.copy(targetLookAt)
    cameraAnimation.startTime = performance.now()
}

/**
 * Camera Presets
 */
const cameraPresets = {
    earthFacingMoon: () => {
        // Camera positioned above Earth, looking at Moon while keeping Earth's horizon visible
        const moonPos = moon.position.clone()
        const earthPos = new THREE.Vector3(0, 0, 0)
        const direction = moonPos.clone().sub(earthPos).normalize()
        // Position camera above Earth (elevated) and slightly offset to see both planets
        const cameraOffset = direction.multiplyScalar(-8) // Further back to see more
        cameraOffset.y += 3 // Elevate camera to see horizon and Moon
        const targetPos = earthPos.clone().add(cameraOffset)
        // Look at a point between Earth and Moon to see both
        const lookAtPoint = earthPos.clone().add(moonPos).multiplyScalar(0.3)
        animateCamera(targetPos, lookAtPoint)
    },
    moonFacingEarth: () => {
        // Camera positioned above Moon, looking at Earth while keeping Moon's horizon visible
        const moonPos = moon.position.clone()
        const earthPos = new THREE.Vector3(0, 0, 0)
        const direction = earthPos.clone().sub(moonPos).normalize()
        // Position camera above Moon (elevated) and slightly offset to see both planets
        const cameraOffset = direction.multiplyScalar(-3) // Behind Moon
        cameraOffset.y += 1 // Elevate camera to see horizon and Earth
        const targetPos = moonPos.clone().add(cameraOffset)
        // Look at a point between Moon and Earth to see both
        const lookAtPoint = moonPos.clone().add(earthPos).multiplyScalar(0.3)
        animateCamera(targetPos, lookAtPoint)
    },
    free: () => {
        // Reset to default view
        const targetPos = new THREE.Vector3(-3, 1.5, 2)
        const lookAtPoint = new THREE.Vector3(0, 0, 0)
        animateCamera(targetPos, lookAtPoint)
    }
}

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minDistance = 1.10
controls.maxDistance = 100 // Increased for Moon distance
controls.target.set(0, 0, 0)
controls.update()

/**
 * Camera Switching
 */
let currentCameraMode = 'free' // 'free', 'earthFacingMoon', 'moonFacingEarth'

// Keyboard controls for camera switching
window.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        currentCameraMode = 'earthFacingMoon'
        cameraPresets.earthFacingMoon()
    } else if (event.key === '2') {
        currentCameraMode = 'moonFacingEarth'
        cameraPresets.moonFacingEarth()
    } else if (event.key === '0') {
        currentCameraMode = 'free'
        cameraPresets.free()
    }
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: "high-performance"
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2

/**
 * Animation
 */
const clock = new THREE.Clock()
const EARTH_ROTATION_SPEED = (2 * Math.PI) / 86400 // One rotation per 24 hours

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const currentTime = performance.now()
    
    // Camera animation
    if (cameraAnimation.isAnimating) {
        const elapsed = currentTime - cameraAnimation.startTime
        const progress = Math.min(elapsed / cameraAnimation.duration, 1)
        
        // Smooth easing function (ease-in-out)
        const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
        
        // Interpolate camera position
        camera.position.lerpVectors(
            cameraAnimation.startPosition,
            cameraAnimation.targetPosition,
            easeProgress
        )
        
        // Interpolate camera target
        controls.target.lerpVectors(
            cameraAnimation.startTarget,
            cameraAnimation.targetTarget,
            easeProgress
        )
        
        camera.lookAt(controls.target)
        controls.update()
        
        // End animation
        if (progress >= 1) {
            cameraAnimation.isAnimating = false
        }
    } else {
        controls.update()
    }
    
    // Earth rotation
    mesh.rotation.y = elapsedTime * EARTH_ROTATION_SPEED
    cloudsMesh.rotation.y = elapsedTime * EARTH_ROTATION_SPEED * 1.1
    
    // Realistic Moon orbit: ~27.3 days = 2,358,720 seconds for one orbit
    const MOON_ORBIT_PERIOD = 2358720 // seconds (27.3 days)
    const MOON_ORBIT_SPEED = (2 * Math.PI) / MOON_ORBIT_PERIOD
    const moonOrbitAngle = elapsedTime * MOON_ORBIT_SPEED
    // Use realistic Earth-Moon distance (defined above)
    moon.position.x = Math.cos(moonOrbitAngle) * MOON_DISTANCE
    moon.position.z = Math.sin(moonOrbitAngle) * MOON_DISTANCE
    // Moon's orbit is slightly inclined (~5 degrees), but we'll keep it simple
    moon.position.y = Math.sin(moonOrbitAngle * 0.5) * 2 // Slight vertical variation
    
    // Update camera presets if in preset mode (camera follows Moon/Earth)
    // Only update if not animating
    if (!cameraAnimation.isAnimating) {
        if (currentCameraMode === 'earthFacingMoon') {
            cameraPresets.earthFacingMoon()
        } else if (currentCameraMode === 'moonFacingEarth') {
            cameraPresets.moonFacingEarth()
        }
    }
    
    // Sun rotation (simple orbit)
    const sunAngle = elapsedTime * EARTH_ROTATION_SPEED
    directionalLight.position.x = Math.cos(sunAngle) * 10
    directionalLight.position.z = Math.sin(sunAngle) * 10
    
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()

/**
 * Resize
 */
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    
    // Update perspective camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
