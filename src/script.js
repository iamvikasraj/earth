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
 * Loading Manager and Loader UI
 */
const loadingManager = new THREE.LoadingManager()

// Create loading overlay with modern design
const loaderOverlay = document.createElement('div')
loaderOverlay.id = 'loader-overlay'
loaderOverlay.style.position = 'fixed'
loaderOverlay.style.top = '0'
loaderOverlay.style.left = '0'
loaderOverlay.style.width = '100%'
loaderOverlay.style.height = '100%'
loaderOverlay.style.backgroundColor = '#0a0a0a'
loaderOverlay.style.display = 'flex'
loaderOverlay.style.flexDirection = 'column'
loaderOverlay.style.justifyContent = 'center'
loaderOverlay.style.alignItems = 'center'
loaderOverlay.style.zIndex = '10000'
loaderOverlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

// Add loader styles
const style = document.createElement('style')
style.textContent = `
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .loader-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ffffff;
        display: inline-block;
        margin: 0 4px;
        animation: pulse 1.4s ease-in-out infinite;
    }
    .loader-dot:nth-child(1) { animation-delay: 0s; }
    .loader-dot:nth-child(2) { animation-delay: 0.2s; }
    .loader-dot:nth-child(3) { animation-delay: 0.4s; }
`
document.head.appendChild(style)

const loaderContainer = document.createElement('div')
loaderContainer.style.textAlign = 'center'
loaderContainer.style.animation = 'fadeIn 0.5s ease-out'

const loaderDots = document.createElement('div')
loaderDots.style.marginBottom = '24px'
loaderDots.innerHTML = `
    <span class="loader-dot"></span>
    <span class="loader-dot"></span>
    <span class="loader-dot"></span>
`

const loaderText = document.createElement('div')
loaderText.id = 'loader-text'
loaderText.textContent = 'Loading Earth'
loaderText.style.fontSize = '16px'
loaderText.style.fontWeight = '300'
loaderText.style.color = '#ffffff'
loaderText.style.letterSpacing = '2px'
loaderText.style.marginBottom = '16px'
loaderText.style.textTransform = 'uppercase'

const loaderProgress = document.createElement('div')
loaderProgress.id = 'loader-progress'
loaderProgress.style.fontSize = '12px'
loaderProgress.style.color = '#888888'
loaderProgress.style.fontWeight = '300'
loaderProgress.style.letterSpacing = '1px'
loaderProgress.textContent = '0%'

loaderContainer.appendChild(loaderDots)
loaderContainer.appendChild(loaderText)
loaderContainer.appendChild(loaderProgress)
loaderOverlay.appendChild(loaderContainer)
document.body.appendChild(loaderOverlay)

// Loading manager callbacks
let loadedItems = 0
let totalItems = 0

loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
    totalItems = itemsTotal
    loaderText.textContent = 'Loading textures...'
    loaderProgress.textContent = `0% (0/${itemsTotal})`
}

// Track scene readiness
let sceneReady = false

loadingManager.onLoad = () => {
    // Wait a bit to ensure everything is initialized
    setTimeout(() => {
        // Check if scene is ready
        const checkSceneReady = () => {
            // Verify essential components are ready
            const texturesReady = loadedItems >= totalItems && totalItems > 0
            
            // Check if renderer exists (will be defined later in code)
            let rendererReady = false
            try {
                rendererReady = typeof renderer !== 'undefined' && renderer && renderer.domElement
            } catch (e) {
                rendererReady = false
            }
            
            // Check if camera exists (will be defined later in code)
            let cameraReady = false
            try {
                cameraReady = typeof camera !== 'undefined' && camera && camera.position
            } catch (e) {
                cameraReady = false
            }
            
            // Check if scene has objects
            const sceneHasObjects = scene && scene.children.length > 0
            
            if (texturesReady && rendererReady && cameraReady && sceneHasObjects) {
                sceneReady = true // Set the global flag
                loaderText.textContent = 'Ready!'
                loaderProgress.textContent = '100%'
                
                // Hide loader with fade out
                setTimeout(() => {
                    loaderOverlay.style.transition = 'opacity 0.5s ease-out'
                    loaderOverlay.style.opacity = '0'
                    setTimeout(() => {
                        loaderOverlay.style.display = 'none'
                    }, 500)
                }, 300)
            } else {
                // Retry after a short delay
                setTimeout(checkSceneReady, 100)
            }
        }
        
        checkSceneReady()
    }, 200)
}

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    loadedItems = itemsLoaded
    totalItems = itemsTotal
    const percent = Math.round((itemsLoaded / itemsTotal) * 100)
    loaderProgress.textContent = `${percent}% (${itemsLoaded}/${itemsTotal})`
    
    // Update text based on what's loading
    if (url.includes('milky_way') || url.includes('stars')) {
        loaderText.textContent = 'Loading starfield...'
    } else if (url.includes('earth_daymap') || url.includes('earth')) {
        loaderText.textContent = 'Loading Earth textures...'
    } else if (url.includes('clouds')) {
        loaderText.textContent = 'Loading cloud layer...'
    } else if (url.includes('lroc') || url.includes('moon')) {
        loaderText.textContent = 'Loading Moon...'
    }
}

loadingManager.onError = (url) => {
    console.error('Error loading:', url)
    loaderText.textContent = 'Error loading resources'
    loaderText.style.color = '#ff6b6b'
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader(loadingManager)

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
 * Clouds - Realistic cloud layer
 */
const cloudsGeometry = new THREE.SphereGeometry(1.005, 128, 64) // Slightly closer to Earth surface
const cloudsMaterial = new THREE.MeshStandardMaterial({
    map: earthCloudsTexture,
    transparent: true,
    opacity: 0.6, // Increased opacity for more visible clouds
    alphaTest: 0.02, // Lower threshold for smoother edges
    depthWrite: false, // Important for proper transparency
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending, // Natural blending
    // Add subtle emissive properties to make clouds catch sunlight
    emissive: 0xffffff,
    emissiveMap: earthCloudsTexture,
    emissiveIntensity: 0.15, // Subtle glow on sunlit side
    // Make clouds respond to lighting naturally
    roughness: 0.9,
    metalness: 0.0,
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
// Position Moon in upper left to match the image layout
moon.position.set(-MOON_DISTANCE * 0.7, MOON_DISTANCE * 0.5, MOON_DISTANCE * 0.3) // Upper left position
scene.add(moon)

/**
 * Camera
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Perspective camera - positioned to show half Earth diameter (side view)
// FOV adjusted to show half Earth diameter (Earth radius = 1, so half diameter = 1 unit visible)
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 200) // Reduced FOV for tighter framing
camera.position.set(3, 0, 0) // To the right, directly facing Earth's side (half view)
camera.lookAt(0, 0, 0) // Look at Earth center
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
        // Reset to default view - showing half Earth diameter (side view)
        const targetPos = new THREE.Vector3(3, 0, 0)
        const lookAtPoint = new THREE.Vector3(0, 0, 0)
        animateCamera(targetPos, lookAtPoint)
    }
}

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minDistance = 1.10 // Minimum zoom (closest to Earth)
controls.maxDistance = 20 // Maximum zoom (farthest from Earth)
controls.target.set(0, 0, 0)

// Enable touch/pinch zoom for mobile devices
// ONE finger: rotate, TWO fingers: pinch to zoom and pan
controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN // Pinch to zoom, pan with two fingers
}

// Enhanced touch controls
controls.enablePan = true
controls.enableZoom = true
controls.enableRotate = true

// Smooth zoom settings optimized for touch
controls.zoomSpeed = 1.2
controls.panSpeed = 0.8
controls.rotateSpeed = 0.5

// Prevent default touch behaviors that might interfere
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault() // Prevent page zoom on pinch
    }
}, { passive: false })

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault() // Prevent page scroll on pinch
    }
}, { passive: false })

controls.update()

/**
 * Camera Switching
 */
let currentCameraMode = 'free' // 'free', 'earthFacingMoon', 'moonFacingEarth'

// Keyboard controls for camera switching, time speed, and Earth rotation
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
    } else if (event.key === '+' || event.key === '=') {
        timeSpeedMultiplier = Math.min(timeSpeedMultiplier * 1.5, 100)
        event.preventDefault()
    } else if (event.key === '-' || event.key === '_') {
        timeSpeedMultiplier = Math.max(timeSpeedMultiplier / 1.5, 0.01)
        event.preventDefault()
    } else if (event.key === 'r' || event.key === 'R') {
        timeSpeedMultiplier = 1.0 // Reset to real-time
    } else if (event.key === 'ArrowUp') {
        // Alt+Arrow: Reset rotation
        if (event.altKey) {
            earthTargetRotationX = 0
            earthTargetRotationY = 0
        } else {
            // Shift/Ctrl/Cmd+Arrow: Fast rotation, normal Arrow: Regular rotation
            const rotationSpeed = event.shiftKey || event.ctrlKey || event.metaKey 
                ? EARTH_ROTATION_SPEED_FAST 
                : EARTH_ROTATION_SPEED_MANUAL
            earthTargetRotationX += rotationSpeed // Rotate Earth up (update target)
        }
        event.preventDefault()
    } else if (event.key === 'ArrowDown') {
        if (event.altKey) {
            earthTargetRotationX = 0
            earthTargetRotationY = 0
        } else {
            const rotationSpeed = event.shiftKey || event.ctrlKey || event.metaKey 
                ? EARTH_ROTATION_SPEED_FAST 
                : EARTH_ROTATION_SPEED_MANUAL
            earthTargetRotationX -= rotationSpeed // Rotate Earth down (update target)
        }
        event.preventDefault()
    } else if (event.key === 'ArrowLeft') {
        if (event.altKey) {
            earthTargetRotationX = 0
            earthTargetRotationY = 0
        } else {
            const rotationSpeed = event.shiftKey || event.ctrlKey || event.metaKey 
                ? EARTH_ROTATION_SPEED_FAST 
                : EARTH_ROTATION_SPEED_MANUAL
            earthTargetRotationY -= rotationSpeed // Rotate Earth left (update target)
        }
        event.preventDefault()
    } else if (event.key === 'ArrowRight') {
        if (event.altKey) {
            earthTargetRotationX = 0
            earthTargetRotationY = 0
        } else {
            const rotationSpeed = event.shiftKey || event.ctrlKey || event.metaKey 
                ? EARTH_ROTATION_SPEED_FAST 
                : EARTH_ROTATION_SPEED_MANUAL
            earthTargetRotationY += rotationSpeed // Rotate Earth right (update target)
        }
        event.preventDefault()
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
 * Interactive Elements - Time Controls
 */
let timeSpeedMultiplier = 1.0 // 1.0 = real-time, 2.0 = 2x speed, etc.

/**
 * Raycaster for Click Detection
 */
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Click handler
canvas.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera)
    
    // Check intersections
    const intersects = raycaster.intersectObjects([mesh, moon])
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object
        
        if (clickedObject === mesh) {
            // Clicked Earth - focus on Earth
            const targetPos = camera.position.clone().normalize().multiplyScalar(3)
            targetPos.y += 1
            animateCamera(targetPos, new THREE.Vector3(0, 0, 0))
            currentCameraMode = 'free'
        } else if (clickedObject === moon) {
            // Clicked Moon - focus on Moon
            const moonPos = moon.position.clone()
            const direction = moonPos.clone().normalize()
            const targetPos = moonPos.clone().add(direction.multiplyScalar(-2))
            animateCamera(targetPos, moonPos)
            currentCameraMode = 'free'
        }
    }
})

/**
 * Animation
 */
const clock = new THREE.Clock()
const EARTH_ROTATION_SPEED = (2 * Math.PI) / 86400 // One rotation per 24 hours

// Manual Earth rotation offsets (controlled by arrow keys) with easing
let earthManualRotationX = 0 // Current rotation X (pitch)
let earthManualRotationY = 0 // Current rotation Y (yaw)
let earthTargetRotationX = 0 // Target rotation X
let earthTargetRotationY = 0 // Target rotation Y
const EARTH_ROTATION_SPEED_MANUAL = 0.02 // Speed of manual rotation per key press
const EARTH_ROTATION_SPEED_FAST = 0.05 // Faster rotation speed for modifier combinations
const EARTH_ROTATION_EASE_SPEED = 0.1 // Easing speed (0-1, higher = faster)

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
    
    // Apply time speed multiplier
    const adjustedTime = elapsedTime * timeSpeedMultiplier
    
    // Smooth easing for manual Earth rotation
    earthManualRotationX += (earthTargetRotationX - earthManualRotationX) * EARTH_ROTATION_EASE_SPEED
    earthManualRotationY += (earthTargetRotationY - earthManualRotationY) * EARTH_ROTATION_EASE_SPEED
    
    // Earth rotation (automatic + manual with easing)
    mesh.rotation.x = earthManualRotationX // Manual pitch rotation (up/down arrows)
    mesh.rotation.y = adjustedTime * EARTH_ROTATION_SPEED + earthManualRotationY // Automatic + manual yaw rotation (left/right arrows)
    // Apply same rotations to clouds
    cloudsMesh.rotation.x = earthManualRotationX
    cloudsMesh.rotation.y = adjustedTime * EARTH_ROTATION_SPEED * 1.1 + earthManualRotationY
    
    // Realistic Moon orbit: ~27.3 days = 2,358,720 seconds for one orbit
    const MOON_ORBIT_PERIOD = 2358720 // seconds (27.3 days)
    const MOON_ORBIT_SPEED = (2 * Math.PI) / MOON_ORBIT_PERIOD
    const moonOrbitAngle = adjustedTime * MOON_ORBIT_SPEED
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
    const sunAngle = adjustedTime * EARTH_ROTATION_SPEED
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

