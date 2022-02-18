import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'

/**
 * Debug
 */
const gui = new dat.GUI()

const parameters = {
    materialColor: '#009999'
}

gui
    .addColor(parameters, 'materialColor')
    .onChange(() =>{
        material.color.set(parameters.materialColor)
        particalsMaterial.color.set(parameters.materialColor)
    })
/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * objects
 */

/**
 * Textures 
 */
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load('textures/gradients/5.jpg')
const particleTexture = textureLoader.load('textures/gradients/disc5.png')
gradientTexture.magFilter = THREE.NearestFilter

// the objects give off a cartoonish reflection 
const material = new THREE.MeshToonMaterial({ 
    color: parameters.materialColor, 
    gradientMap: gradientTexture
})

/**
 * Meshes 
 */
const objectsDistance = 4
const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.6, 0.3, 12, 60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 1.2, 20),
    material
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16),
    material
)

mesh1.position.y = - objectsDistance * 0
mesh2.position.y = - objectsDistance * 1
mesh3.position.y = - objectsDistance * 2

mesh1.position.x = 1
mesh2.position.x = - 1
mesh3.position.x = 1

scene.add(mesh1,mesh2,mesh3)

const sectionMeshes = [mesh1, mesh2, mesh3]

/**
 * Particles
 */
const particlCount = 2000
const positions = new Float32Array(particlCount * 3)

for(let i = 0; i < particlCount; i++){
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10 // x
    positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 // z
}

const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))


// Material
const particalsMaterial = new THREE.PointsMaterial({

    color: parameters.materialColor, 
    sizeAttenuation: true, // particles farther away get smaller
    size: 0.03
})

// this is the mapping of the textureLoader using the disc icon from the file
particalsMaterial.transparent = true
particalsMaterial.alphaMap = particleTexture
// particalsMaterial.alphaTest = 0.001
// particalsMaterial.depthTest = false
particalsMaterial.depthWrite = false
// particalsMaterial.blending = THREE.AdditiveBlending 
// this one makes everything a bit transparent - this can drop framerates 

//Points 
const particles = new THREE.Points(particlesGeometry, particalsMaterial)
scene.add(particles)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff')
directionalLight.position.set(1,1,0)
scene.add(directionalLight)

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
//Group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true // this makes the background transparent
})

renderer.setClearAlpha(0) // this gets rid of the background on the elastic over scroll 
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */
let scrollY = window.scrollY
let currentSeciton = 0

window.addEventListener('scroll', () =>{

    scrollY = window.scrollY
    const newSection = Math.round(scrollY / sizes.height)
// this is having the object perform an animation when the screen 'sees' that section 
    // if(newSection != currentSeciton){
    //     currentSeciton = newSection

    //     gsap.to(
    //         sectionMeshes[currentSeciton].rotation,
    //         {
    //             duration: 4.5,
    //             ease: 'power2.inOut',
    //             x: '+=1',
    //             y: '+=1',
    //             // z: '+=1.6'
    //         }
    //     )

    // }
})

/**
 * Cursor
 */
const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove',(event) =>{
    cursor.x = event.clientX / sizes.width - 0.5  // normalize the values and set range from [-0.5, 0.5]
    cursor.y = event.clientY / sizes.height - 0.5 
})
/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Amimate camera on scroll
    camera.position.y = - scrollY / sizes.height * 4

    const parallaxX = cursor.x * 0.2
    const parallaxY = - cursor.y * 0.2
    // this makes a lerp so that the object transitions smoothly from one position to another
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime

    // animate particles
    // particlesGeometry.attributes.position.y.rotation = 0.2 // this part dosen't work, look at galaxy code
particlesGeometry.attributes.position.needsUpdate = true

    // Animate meshes
    for(const mesh of sectionMeshes)
    {
        mesh.rotation.x += deltaTime * 0.1
        mesh.rotation.y += deltaTime * 0.13
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()