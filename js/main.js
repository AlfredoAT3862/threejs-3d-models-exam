import * as THREE from 'three';
import { OrbitControls } from '../jsm/controls/OrbitControls.js';
import { FBXLoader } from '../jsm/loaders/FBXLoader.js';
import { AmmoPhysics } from '../jsm/physics/AmmoPhysics.js'; 
//import * as CANNON from 




// Variables globales
let ammoPhysics;
//let scene, camera, renderer, orbitControls;
let character; // Variable para almacenar el modelo cargado
let mixer; // Mixer para controlar las animaciones
let walkingAction; // Acción de animación de caminar
let boxingAction; // Acción de animación de boxeo
let marteloAction; // Acción de animación de martelo
let chapaAction; // Acción de animación de Chapa-Giratoria
let gingaAction; // Acción de animación de Ginga
let capoeiraAction; // Acción de animación de Capoeira

// Estado para controlar la dirección del modelo
let currentDirection = new THREE.Vector3(0, 0, -1); // Dirección inicial del modelo
let isWalking = false; // Estado para verificar si el modelo está caminando
let isBoxing = false; // Estado para verificar si el modelo está boxeando
let isMartelo = false; // Estado para verificar si el modelo está haciendo Martelo
let isChapa = false; // Estado para verificar si el modelo está haciendo Chapa-Giratoria
let isGinga = false; // Estado para verificar si el modelo está haciendo Ginga
let isCapoeira = false; // Estado para verificar si el modelo está haciendo Capoeira




// Velocidad de movimiento y límites del escenario
const walkingSpeed = 0.01; // Velocidad de movimiento reducida
const sceneLimits = {
    minX: -100, maxX: 100, // Límites en el eje X del escenario
    minZ: -100, maxZ: 100 // Límites en el eje Z del escenario
};

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// Cámara
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);

// Renderizado
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controles de órbita
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.25;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// Luces
function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

addLights();

// Piso
function generateFloor() {
    // Crear el suelo
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Crear el cubo con físicas
    const rectGeometry = new THREE.BoxGeometry(1, 5, 0.5); // Ancho, alto, profundidad
    const rectMaterial = new THREE.MeshStandardMaterial({ color: 0xf3f5f2 });
    const rectMesh = new THREE.Mesh(rectGeometry, rectMaterial);
    rectMesh.position.set(0, 0.5, -1); // Posición inicial del cubo
    rectMesh.castShadow = true;
    scene.add(rectMesh);
/*
    // Configurar físicas para el cubo
    const physicsOptions = {
        shape: 'box', // Tipo de forma
        mass: 1, // Masa del cubo
        linearDamping: 0.9, // Amortiguación lineal
        angularDamping: 0.9, // Amortiguación angular
        friction: 0.5, // Fricción
        restitution: 0.6 // Restitución (rebote)
    };*/

    // Añadir el cubo a las físicas
    ammoPhysics.addMesh(rectMesh, physicsOptions);

    // Función para detectar colisiones con el cubo
    function checkCollisionWithCube() {
        if (character && rectMesh) {
            // Obtener las posiciones del personaje y del cubo
            const characterPosition = character.position;
            const cubePosition = rectMesh.position;

            // Calcular la distancia entre el personaje y el cubo
            const distance = characterPosition.distanceTo(cubePosition);

            // Si la distancia es menor a un valor dado, haremos que el cubo caiga
            // Por ejemplo, si el personaje está cerca del cubo
            if (distance < 1.5) { // Puedes ajustar este valor según el tamaño del cubo y tu escena
                // Eliminar el cubo de las físicas para que caiga
                ammoPhysics.removeMesh(rectMesh);

                // Hacer que el cubo caiga aplicando una fuerza o cambiando su posición
                // Por ejemplo, cambiar la posición en el eje Y
                rectMesh.position.y = 2; // Posición de caída

                // Volver a añadir el cubo a las físicas si deseas que sea dinámico después de caer
                // ammoPhysics.addMesh(rectMesh, physicsOptions);
            }
        }
    }

    // Llamar a la función de detección de colisiones en el ciclo de animación
    setInterval(checkCollisionWithCube, 100); // Llama cada 100ms para verificar la colisión
}


function setupScene() {
    

    //generateFloor();
}




// Cargar el modelo FBX
const loader = new FBXLoader();
loader.load('models/fbx/walking.fbx', (object) => {
    character = object;

    // Escalar el modelo para ajustarlo
    character.scale.set(0.01, 0.01, 0.01); // Ajustar según el tamaño necesario

    character.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
        }
    });

    // Orientar el modelo hacia adelante
    character.rotateY(Math.PI); // Girar 180 grados para que mire hacia adelante inicialmente

    // Configurar animaciones si existen
    mixer = new THREE.AnimationMixer(character);
    const animations = character.animations;
    if (animations.length > 0) {
        walkingAction = mixer.clipAction(animations[0]);
        walkingAction.setLoop(THREE.LoopRepeat); // Repetir la animación
        walkingAction.clampWhenFinished = true; // Mantener la última posición al terminar
    }

    scene.add(character);

    // Iniciar el ciclo de animación después de cargar el modelo
    animate();

}, undefined, (error) => {
    console.error('Error al cargar el modelo:', error);
});

// Manejo del teclado
const keysPressed = {}; // Objeto para almacenar el estado de las teclas presionadas

document.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;

    // Actualizar la dirección del modelo según las teclas presionadas
    updateDirection();

    // Iniciar la animación de caminar hacia adelante o hacia atrás
    if (keysPressed['w'] || keysPressed['s']) {
        startWalking();
    }

    // Cargar animación de boxing al presionar 'r'
    if (keysPressed['r']) {
        loadBoxingAnimation();
    }

    // Cargar animación de Martelo al presionar 'e'
    if (keysPressed['e']) {
        loadMarteloAnimation();
    }

    // Cargar animación de Chapa-Giratoria al presionar 'u'
    if (keysPressed['u']) {
        loadChapaAnimation();
    }

    // Cargar animación de Ginga al presionar 'y'
    if (keysPressed['y']) {
        loadGingaAnimation();
    }

    // Cargar animación de Capoeira al presionar 't'
    if (keysPressed['t']) {
        loadCapoeiraAnimation();
    }

    // Limpiar el estado de las teclas presionadas después de 100ms
    setTimeout(() => {
        delete keysPressed[event.key.toLowerCase()];
        updateDirection(); // Actualizar la dirección una vez que se suelta la tecla
    }, 100);
});

document.addEventListener('keyup', (event) => {
    delete keysPressed[event.key.toLowerCase()];

    // Detener la animación y guardar la posición/orientación al soltar la tecla 'W' o 'S'
    if (event.key.toLowerCase() === 'w' || event.key.toLowerCase() === 's') {
        stopWalking();
    }
});

// Función para actualizar la dirección del modelo según las teclas 'A' y 'D'
function updateDirection() {
    if (keysPressed['a']) {
        // Girar 90 grados hacia la izquierda
        character.rotateY(Math.PI / 2);
        currentDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); // Actualizar dirección
    } else if (keysPressed['d']) {
        // Girar 90 grados hacia la derecha
        character.rotateY(-Math.PI / 2);
        currentDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2); // Actualizar dirección
    }
}

// Función para iniciar la animación de caminar
function startWalking() {
    if (character && !isWalking && !isBoxing && !isMartelo && !isChapa && !isGinga && !isCapoeira) {
        walkingAction.timeScale = keysPressed['s'] ? -1 : 1; // Velocidad normal o inversa según la dirección
        walkingAction.play();
        isWalking = true;
    }
}

// Función para detener la animación de caminar
function stopWalking() {
    if (character && isWalking) {
        walkingAction.timeScale = 0; // Pausar la animación
        walkingAction.stop(); // Detener la animación
        isWalking = false;
        // No restaurar lastPosition y lastQuaternion aquí
    }
}

// Cargar la animación de boxing al presionar 'r'
function loadBoxingAnimation() {
    if (character && !isBoxing) {
        stopAllAnimations(); // Detener todas las animaciones activas antes de cargar una nueva
        loader.load('models/fbx/boxing.fbx', (object) => {
            const newAnimation = object.animations[0];
            boxingAction = mixer.clipAction(newAnimation);
            boxingAction.setLoop(THREE.LoopRepeat); // Repetir la animación
            boxingAction.clampWhenFinished = true; // Mantener la última posición al terminar
            startBoxing();
        }, undefined, (error) => {
            console.error('Error al cargar la animación de boxing:', error);
        });
    }
}

// Cargar la animación de Martelo al presionar 'e'
function loadMarteloAnimation() {
    if (character && !isMartelo) {
        stopAllAnimations(); // Detener todas las animaciones activas antes de cargar una nueva
       
        loader.load('models/fbx/Martelo 2.fbx', (object) => {
            const newAnimation = object.animations[0];
            marteloAction = mixer.clipAction(newAnimation);
            marteloAction.setLoop(THREE.LoopRepeat); // Repetir la animación
            marteloAction.clampWhenFinished = true; // Mantener la última posición al terminar
            startMartelo();
        }, undefined, (error) => {
            console.error('Error al cargar la animación de Martelo:', error);
        });
    }
}

// Cargar la animación de Chapa-Giratoria al presionar 'u'
function loadChapaAnimation() {
    if (character && !isChapa) {
        stopAllAnimations(); // Detener todas las animaciones activas antes de cargar una nueva
        loader.load('models/fbx/Chapa-Giratoria.fbx', (object) => {
            const newAnimation = object.animations[0];
            chapaAction = mixer.clipAction(newAnimation);
            chapaAction.setLoop(THREE.LoopRepeat); // Repetir la animación
            chapaAction.clampWhenFinished = true; // Mantener la última posición al terminar
            startChapa();
        }, undefined, (error) => {
            console.error('Error al cargar la animación de Chapa-Giratoria:', error);
        });
    }
}

// Cargar la animación de Ginga al presionar 'y'
function loadGingaAnimation() {
    if (character && !isGinga) {
        stopAllAnimations(); // Detener todas las animaciones activas antes de cargar una nueva
        loader.load('models/fbx/Ginga Sideways To Au.fbx', (object) => {
            const newAnimation = object.animations[0];
            gingaAction = mixer.clipAction(newAnimation);
            gingaAction.setLoop(THREE.LoopRepeat); // Repetir la animación
            gingaAction.clampWhenFinished = true; // Mantener la última posición al terminar
            startGinga();
        }, undefined, (error) => {
            console.error('Error al cargar la animación de Ginga:', error);
        });
    }
}

// Cargar la animación de Capoeira al presionar 't'
function loadCapoeiraAnimation() {
    if (character && !isCapoeira) {
        stopAllAnimations(); // Detener todas las animaciones activas antes de cargar una nueva
        loader.load('models/fbx/Capoeira.fbx', (object) => {
            const newAnimation = object.animations[0];
            capoeiraAction = mixer.clipAction(newAnimation);
            capoeiraAction.setLoop(THREE.LoopRepeat); // Repetir la animación
            capoeiraAction.clampWhenFinished = true; // Mantener la última posición al terminar
            startCapoeira();
        }, undefined, (error) => {
            console.error('Error al cargar la animación de Capoeira:', error);
        });
    }
}

// Función para detener todas las animaciones activas
function stopAllAnimations() {
    stopWalking();
    stopBoxing();
    stopMartelo();
    stopChapa();
    stopGinga();
    stopCapoeira();
}

// Función para iniciar la animación de boxeo
function startBoxing() {
    if (character && !isBoxing && boxingAction) {
        if (isWalking) {
            stopWalking();
        }
        boxingAction.timeScale = 1; // Velocidad normal de boxeo
        boxingAction.play();
        isBoxing = true;
    }
}

// Función para detener la animación de boxeo
function stopBoxing() {
    if (character && isBoxing) {
        boxingAction.timeScale = 0; // Pausar la animación
        boxingAction.stop(); // Detener la animación
        isBoxing = false;
        // No restaurar lastPosition y lastQuaternion aquí
    }
}

// Función para iniciar la animación de Martelo
function startMartelo() {
    if (character && !isMartelo && marteloAction) {
        if (isWalking) {
            stopWalking();
        }
        marteloAction.timeScale = 1; // Velocidad normal de Martelo
        marteloAction.play();
        isMartelo = true;
    }
}

// Función para detener la animación de Martelo
function stopMartelo() {
    if (character && isMartelo) {
        marteloAction.timeScale = 0; // Pausar la animación
        marteloAction.stop(); // Detener la animación
        isMartelo = false;
        // No restaurar lastPosition y lastQuaternion aquí
    }
}

// Función para iniciar la animación de Chapa-Giratoria
function startChapa() {
    if (character && !isChapa && chapaAction) {
        if (isWalking) {
            stopWalking();
        }
        chapaAction.timeScale = 1; // Velocidad normal de Chapa-Giratoria
        chapaAction.play();
        isChapa = true;
    }
}

// Función para detener la animación de Chapa-Giratoria
function stopChapa() {
    if (character && isChapa) {
        chapaAction.timeScale = 0; // Pausar la animación
        chapaAction.stop(); // Detener la animación
        isChapa = false;
        // No restaurar lastPosition y lastQuaternion aquí
    }
}

// Función para iniciar la animación de Ginga
function startGinga() {
    if (character && !isGinga && gingaAction) {
        if (isWalking) {
            stopWalking();
        }
        gingaAction.timeScale = 1; // Velocidad normal de Ginga
        gingaAction.play();
        isGinga = true;
    }
}

// Función para detener la animación de Ginga
function stopGinga() {
    if (character && isGinga) {
        gingaAction.timeScale = 0; // Pausar la animación
        gingaAction.stop(); // Detener la animación
        isGinga = false;
        // No restaurar lastPosition y lastQuaternion aquí
    }
}

// Función para iniciar la animación de Capoeira
function startCapoeira() {
    if (character && !isCapoeira && capoeiraAction) {
        if (isWalking) {
            stopWalking();
        }
        capoeiraAction.timeScale = 1; // Velocidad normal de Capoeira
        capoeiraAction.play();
        isCapoeira = true;
    }
}

// Función para detener la animación de Capoeira
function stopCapoeira() {
    if (character && isCapoeira) {
        capoeiraAction.timeScale = 0; // Pausar la animación
        capoeiraAction.stop(); // Detener la animación
        isCapoeira = false;
        // No restaurar lastPosition y lastQuaternion aquí
    }
}

// ANIMATE
function animate() {
    orbitControls.update();
    if (mixer) {
        mixer.update(0.01); // Actualizar la animación
    }
    
    // Actualizar la posición del personaje en función de la dirección y la velocidad
    if (isWalking) {
        const delta = walkingSpeed * (keysPressed['s'] ? -1 : 1);
        character.position.addScaledVector(currentDirection, delta);

        // Limitar la posición del personaje dentro de los límites del escenario
        constrainCharacterPosition();
    }
    // Actualizar lastPosition y lastQuaternion con la posición y orientación actuales del modelo
    // Esto se hace automáticamente en las funciones de detención de animaciones específicas

     // Actualizar las físicas
     if (ammoPhysics && typeof ammoPhysics.update === 'function') {
        ammoPhysics.update();
    } else {
        console.error('Error: ammoPhysics no está inicializado correctamente o no tiene el método update.');
    }

    // Renderizar la escena y continuar el ciclo de animación
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Función para limitar la posición del personaje dentro de los límites del escenario
function constrainCharacterPosition() {
    if (character) {
        character.position.x = THREE.MathUtils.clamp(character.position.x, sceneLimits.minX, sceneLimits.maxX);
        character.position.z = THREE.MathUtils.clamp(character.position.z, sceneLimits.minZ, sceneLimits.maxZ);
    }
}

// Llamar a la función de animación cada segundo para actualizar constantemente la posición
setInterval(() => {
    if (character) {
        // No necesitas hacer nada aquí si estás actualizando lastPosition y lastQuaternion en las funciones de detención de animaciones
    }
}, 1000);

// Iniciar la aplicación
function init() {
    const dirLight = new THREE.DirectionalLight(0x00913f, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100;
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    
    const dirLight2 = new THREE.DirectionalLight( 0x6b7003, 3 );
    dirLight2.position.set( - 1, - 1, - 1 );
    scene.add( dirLight2 );
    // Aquí podrías inicializar cualquier cosa adicional antes de cargar el modelo
 
const physics = AmmoPhysics();
 ammoPhysics = physics;
    generateFloor();
}

init(); // Llamar a la función de inicialización al inicio

// Exportar funciones para su uso en otros archivos si es necesario
export {
    startWalking,
    stopWalking,
    startBoxing,
    stopBoxing,
    startMartelo,
    stopMartelo,
    startChapa,
    stopChapa,
    startGinga,
    stopGinga,
    startCapoeira,
    stopCapoeira
};

