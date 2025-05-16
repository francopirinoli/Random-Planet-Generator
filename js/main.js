// js/main.js
// V11: Updated to populate planet name in visualization header.

import * as TerrestrialPlanet from './planet_types/terrestrial.js';
import * as GasGiantPlanet from './planet_types/gas_giant.js';
import * as LavaPlanet from './planet_types/lava_planet.js';
import * as DesertPlanet from './planet_types/desert_planet.js';
import * as OceanPlanet from './planet_types/ocean_planet.js';

import { generateAlienSpecies } from './alien_generator/alien_species.js';
// Ensure you are using alien_portrait.js V19 (or later) that returns a Data URL
import { generateAlienPortrait } from './alien_generator/alien_portrait.js'; 
import { constructSystemPrompt, sendQueryToLLM } from './alien_generator/alien_llm.js';

// --- DOM Element References ---
const visualizationContainer = document.getElementById('planet-visualization-container');
const visualizationPlanetNameSpan = document.getElementById('visualization-planet-name'); // Added for V11
const generatePlanetBtn = document.getElementById('generate-planet-btn');
const planetTypeSelect = document.getElementById('planet-type-select');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const pixelationSlider = document.getElementById('pixelation-slider');
const pixelationValueLabel = document.getElementById('pixelation-value-label');
const llmApiKeyInput = document.getElementById('llm-api-key');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const contactLifeBtn = document.getElementById('contact-life-btn');
const llmChatInterface = document.getElementById('llm-chat-interface');
const llmChatOutput = document.getElementById('llm-chat-output');
const llmChatInput = document.getElementById('llm-chat-input');
const llmSendBtn = document.getElementById('llm-send-btn');
const culturalInfoTab = document.getElementById('cultural-info-tab');
const alienPortraitDisplay = document.getElementById('alien-portrait-display');
const culturalInfoContentArea = document.getElementById('cultural-info-content-area');
const regeneratePortraitBtn = document.getElementById('regenerate-portrait-btn');

const alienCodexContent = document.getElementById('alien-codex-content');
const codexEmptyMessage = document.getElementById('codex-empty-message');
const saveStateBtn = document.getElementById('save-state-btn');
const loadStateBtn = document.getElementById('load-state-btn');
const clearSaveBtn = document.getElementById('clear-save-btn');
const saveLoadFeedback = document.getElementById('save-load-feedback');

// Info table cell references
const infoName = document.getElementById('info-name');
const infoType = document.getElementById('info-type');
const infoMass = document.getElementById('info-mass');
const infoRadius = document.getElementById('info-radius');
const infoDensity = document.getElementById('info-density');
const infoGravity = document.getElementById('info-gravity');
const infoRotation = document.getElementById('info-rotation');
const infoOrbit = document.getElementById('info-orbit');
const infoAxialTilt = document.getElementById('info-axial-tilt');
const infoAtmospherePresence = document.getElementById('info-atmosphere-presence');
const infoAtmospherePressure = document.getElementById('info-atmosphere-pressure');
const infoAtmosphereComposition = document.getElementById('info-atmosphere-composition');
const infoAtmosphereWeather = document.getElementById('info-atmosphere-weather');
const infoSurfaceTemp = document.getElementById('info-surface-temp');
const infoSurfaceLiquid = document.getElementById('info-surface-liquid');
const infoSurfaceTerrain = document.getElementById('info-surface-terrain');
const infoLifeProbability = document.getElementById('info-life-probability');
const infoLifeIntelligent = document.getElementById('info-life-intelligent');

// --- Three.js Variables ---
let scene, camera, renderer, planetMesh, cloudMesh, ringMesh, controls;
let atmosphericLayerMeshes = [];
let moonPivots = [];
let starField;
let directionalLight;
let lightPivot;
let composer;
let pixelPass;

// --- Application State ---
let currentPlanetData = null;
let currentAlienSpeciesData = null;
let revealedAlienInfoTags = new Set();
let contactAttemptedForCurrentPlanet = false;
let conversationHistory = [];
let currentLlmApiKey = '';
let isAlienNameRevealed = false;

let codexEntries = [];
const SAVE_DATA_KEY = 'randomPlanetGeneratorSaveData_v1.4'; 

const PLANET_MODULES = {
    terrestrial: TerrestrialPlanet,
    gas_giant: GasGiantPlanet,
    desert: DesertPlanet,
    ocean: OceanPlanet,
    lava: LavaPlanet,
};
const DEFAULT_PIXELATION_AMOUNT = 6.0;
let currentPixelationAmount = DEFAULT_PIXELATION_AMOUNT;


// --- Utility Functions ---
function getRandom(min, max) { return Math.random() * (max - min) + min; }

function getNestedValue(obj, path, defaultValue = '???') {
    if (!obj || typeof path !== 'string') return defaultValue;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else { return defaultValue; }
    }
    if (result && typeof result === 'object' && result.hasOwnProperty('value')) {
        return result.value !== undefined ? result.value : defaultValue;
    }
    return result !== undefined ? result : defaultValue;
}

function getNestedTag(obj, path, defaultValue = '') {
    if (!obj || typeof path !== 'string') return defaultValue;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else { return defaultValue; }
    }
    if (result && typeof result === 'object' && result.hasOwnProperty('tag')) {
        return result.tag !== undefined ? result.tag : defaultValue;
    }
    if (typeof result === 'string' && result.startsWith('[') && result.endsWith(']')) {
        return result;
    }
    return defaultValue;
}


// --- Three.js Initialization and Animation ---
function createStarfield() {
    const starCount = 12000; const starVertices = [];
    for (let i = 0; i < starCount; i++) { const r = THREE.MathUtils.randFloat(500, 1000); const phi = Math.random() * Math.PI * 2; const theta = Math.acos((Math.random() * 2) - 1); const x = r * Math.sin(theta) * Math.cos(phi); const y = r * Math.sin(theta) * Math.sin(phi); const z = r * Math.cos(theta); starVertices.push(x,y,z);}
    const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true, transparent: true, opacity: getRandom(0.5,0.85)});
    starField = new THREE.Points(starGeometry, starMaterial); scene.add(starField);
}
function initThreeJS() {
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x010103);
    const aspectRatio = visualizationContainer.clientWidth / visualizationContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 4000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(visualizationContainer.clientWidth, visualizationContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); visualizationContainer.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0x404050, 0.9); scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xfff0e0, 1.6); lightPivot = new THREE.Object3D();
    scene.add(lightPivot); lightPivot.add(directionalLight); directionalLight.position.set(35, 10, 0);
    const fillLight = new THREE.HemisphereLight(0x080815, 0x030308, 0.7); scene.add(fillLight);
    createStarfield();
    if (THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass && THREE.PixelShader) {
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera); composer.addPass(renderPass);
        pixelPass = new THREE.ShaderPass(THREE.PixelShader);
        pixelPass.uniforms["resolution"].value = new THREE.Vector2(visualizationContainer.clientWidth, visualizationContainer.clientHeight);
        pixelPass.uniforms["pixelSize"].value = currentPixelationAmount; composer.addPass(pixelPass);
    } else { composer = null; console.warn("Post-processing modules not fully loaded, pixelation disabled.");}
    try {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.03; controls.screenSpacePanning = false;
        controls.autoRotate = true; controls.autoRotateSpeed = 0.05; controls.target.set(0, 0, 0);
    } catch (e) { console.warn("THREE.OrbitControls not found."); }
    animate();
}
function clearCelestialBodies() {
    if (planetMesh) { scene.remove(planetMesh); planetMesh.geometry.dispose(); if (planetMesh.material.map) planetMesh.material.map.dispose(); planetMesh.material.dispose(); planetMesh = null; }
    if (cloudMesh) { scene.remove(cloudMesh); cloudMesh.geometry.dispose(); if (cloudMesh.material.map) cloudMesh.material.map.dispose(); if (cloudMesh.material.alphaMap) cloudMesh.material.alphaMap.dispose(); cloudMesh.material.dispose(); cloudMesh = null; }
    if (ringMesh) { scene.remove(ringMesh); ringMesh.geometry.dispose(); if (ringMesh.material.map) ringMesh.material.map.dispose(); ringMesh.material.dispose(); ringMesh = null; }
    atmosphericLayerMeshes.forEach(layer => { scene.remove(layer); layer.geometry.dispose(); if(layer.material.map) layer.material.map.dispose(); layer.material.dispose(); });
    atmosphericLayerMeshes = [];
    moonPivots.forEach(moonObj => { if (moonObj.pivot) scene.remove(moonObj.pivot); if (moonObj.mesh) { moonObj.mesh.geometry.dispose(); if (moonObj.mesh.material.map) moonObj.mesh.material.map.dispose(); moonObj.mesh.material.dispose(); } });
    moonPivots = [];
}
function displayCelestialBodies(visuals) {
    clearCelestialBodies();
    const planetRadius = visuals.radius || 1.5;
    if (visuals.type === "Gas Giant" && visuals.atmosphericLayers && visuals.atmosphericLayers.length > 0) {
        visuals.atmosphericLayers.forEach((layerData, index) => {
            if (!(layerData.textureCanvas instanceof HTMLCanvasElement)) { console.warn(`Gas giant layer ${index} texture is not a canvas.`); return; }
            const layerRadius = planetRadius * (layerData.altitudeFactor || 1.0);
            const layerGeometry = new THREE.SphereGeometry( layerRadius, index === 0 ? 96 : 80, index === 0 ? 48 : 40 );
            const layerTexture = new THREE.CanvasTexture(layerData.textureCanvas); layerTexture.needsUpdate = true; layerTexture.wrapS = THREE.RepeatWrapping; layerTexture.wrapT = THREE.RepeatWrapping;
            const layerMaterial = new THREE.MeshPhongMaterial({ map: layerTexture, transparent: true, opacity: layerData.opacity !== undefined ? layerData.opacity : (index === 0 ? 1.0 : 0.6), depthWrite: index === 0, blending: THREE.NormalBlending, shininess: visuals.shininess || 8, specular: new THREE.Color(0x020202) });
            const layerMesh = new THREE.Mesh(layerGeometry, layerMaterial);
            layerMesh.userData.uvSpeedX = layerData.uvSpeedX || 0; layerMesh.userData.uvSpeedY = layerData.uvSpeedY || 0; layerMesh.userData.layerData = layerData;
            atmosphericLayerMeshes.push(layerMesh); scene.add(layerMesh);
        });
        planetMesh = null;
    } else if (visuals.textureCanvasPlanet instanceof HTMLCanvasElement) {
        const planetGeometry = new THREE.SphereGeometry(planetRadius, 64, 32);
        const planetCanvasTexture = new THREE.CanvasTexture(visuals.textureCanvasPlanet); planetCanvasTexture.needsUpdate = true;
        let specularColor = 0x050505;
        if (visuals.type === "Ocean Planet" || visuals.type === "Ice World") { specularColor = 0x333355; }
        else if (visuals.type === "Lava") { specularColor = 0x221105; }
        const planetMaterial = new THREE.MeshPhongMaterial({ map: planetCanvasTexture, shininess: visuals.shininess || 15, specular: new THREE.Color(specularColor) });
        planetMesh = new THREE.Mesh(planetGeometry, planetMaterial); scene.add(planetMesh);
        if (visuals.textureCanvasCloud instanceof HTMLCanvasElement && visuals.type !== "Gas Giant") {
            const cloudAltitude = visuals.cloudAltitude || planetRadius * 0.02;
            const cloudGeometry = new THREE.SphereGeometry(planetRadius + cloudAltitude, 60, 60);
            const cloudCanvasTexture = new THREE.CanvasTexture(visuals.textureCanvasCloud); cloudCanvasTexture.needsUpdate = true;
            const cloudMaterial = new THREE.MeshPhongMaterial({ map: cloudCanvasTexture, alphaMap: cloudCanvasTexture, transparent: true, opacity: visuals.cloudOpacity !== undefined ? visuals.cloudOpacity : 0.7, depthWrite: false, blending: THREE.NormalBlending, shininess: 2, });
            cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial); scene.add(cloudMesh);
        }
    } else {
        console.warn("Planet texture canvas not found for type:", visuals.type, ". Displaying fallback wireframe.");
        const planetGeometry = new THREE.SphereGeometry(planetRadius, 64, 32);
        const planetMaterial = new THREE.MeshPhongMaterial({ color: 0xff00ff, wireframe: true });
        planetMesh = new THREE.Mesh(planetGeometry, planetMaterial); scene.add(planetMesh);
    }
    if (visuals.ringsData && visuals.ringsData.hasRings && visuals.ringsData.textureCanvasRing instanceof HTMLCanvasElement) {
        const rings = visuals.ringsData; const ringGeometry = new THREE.RingGeometry(rings.innerRadius, rings.outerRadius, 128, 16, 0, Math.PI * 2);
        const ringTexture = new THREE.CanvasTexture(rings.textureCanvasRing); ringTexture.needsUpdate = true;
        const ringMaterial = new THREE.MeshBasicMaterial({ map: ringTexture, transparent: true, opacity: rings.opacity !== undefined ? rings.opacity : 0.7, side: THREE.DoubleSide, depthWrite: false, });
        ringMesh = new THREE.Mesh(ringGeometry, ringMaterial); ringMesh.rotation.x = Math.PI / 2; ringMesh.rotation.z = (Math.random() - 0.5) * 0.2; scene.add(ringMesh);
    }
    if (visuals.moons && visuals.moons.length > 0) {
        visuals.moons.forEach(moonData => {
            if (!(moonData.textureCanvasMoon instanceof HTMLCanvasElement)) { console.warn("Moon texture for", moonData.name, "is not a canvas. Skipping."); return; }
            const moonGeometry = new THREE.SphereGeometry(moonData.radius, 32, 32);
            const moonCanvasTexture = new THREE.CanvasTexture(moonData.textureCanvasMoon); moonCanvasTexture.needsUpdate = true;
            const moonMaterial = new THREE.MeshPhongMaterial({ map: moonCanvasTexture, shininess: moonData.shininess || 5, });
            const moonMeshInstance = new THREE.Mesh(moonGeometry, moonMaterial); const moonPivot = new THREE.Object3D();
            moonPivot.rotation.z = moonData.inclination; moonPivot.rotation.y = moonData.initialAngle;
            moonMeshInstance.position.x = moonData.orbitalDistance;
            moonPivot.add(moonMeshInstance); scene.add(moonPivot);
            moonPivots.push({ pivot: moonPivot, mesh: moonMeshInstance, data: moonData });
        });
    }
    if (controls && camera) {
        let systemRadius = planetRadius;
        if (visuals.ringsData && visuals.ringsData.hasRings) { systemRadius = Math.max(systemRadius, visuals.ringsData.outerRadius); }
        if (visuals.moons && visuals.moons.length > 0) { visuals.moons.forEach(m => { systemRadius = Math.max(systemRadius, m.orbitalDistance + m.radius); }); }
        const paddingFactor = 1.25; const objectSizeToFit = systemRadius * 2 * paddingFactor;
        const fovInRadians = THREE.MathUtils.degToRad(camera.fov);
        let cameraDistance = (objectSizeToFit / 2) / Math.tan(fovInRadians / 2);
        cameraDistance = Math.max(cameraDistance, planetRadius * 2.8); cameraDistance = Math.min(cameraDistance, 700);
        camera.position.set(0, systemRadius * 0.15 + planetRadius * 0.6, cameraDistance);
        controls.target.set(0, 0, 0); controls.minDistance = planetRadius * 0.3; controls.maxDistance = cameraDistance * 2.8;
        controls.update();
    }
}
function animate() {
    requestAnimationFrame(animate); const deltaLightOrbit = 0.0003;
    if (controls && controls.update) controls.update(); if (lightPivot) { lightPivot.rotation.y += deltaLightOrbit; }
    atmosphericLayerMeshes.forEach(layerMesh => { if (layerMesh.material.map && layerMesh.userData) { if (layerMesh.userData.uvSpeedX) layerMesh.material.map.offset.x += layerMesh.userData.uvSpeedX; if (layerMesh.userData.uvSpeedY) layerMesh.material.map.offset.y += layerMesh.userData.uvSpeedY; layerMesh.material.map.wrapS = THREE.RepeatWrapping; layerMesh.material.map.wrapT = THREE.RepeatWrapping; } });
    if (cloudMesh && currentPlanetData?.visuals?.cloudRotationSpeed) { cloudMesh.rotation.y += currentPlanetData.visuals.cloudRotationSpeed; }
    moonPivots.forEach(moonObj => { if (moonObj.pivot && moonObj.data?.orbitalSpeed) { moonObj.pivot.rotation.y += moonObj.data.orbitalSpeed; } });
    if (composer) { composer.render(); } else { renderer.render(scene, camera); }
}
function onWindowResize() {
    if (camera && renderer && visualizationContainer) { const newWidth = visualizationContainer.clientWidth; const newHeight = visualizationContainer.clientHeight; camera.aspect = newWidth / newHeight; camera.updateProjectionMatrix(); renderer.setSize(newWidth, newHeight); if (composer) { composer.setSize(newWidth, newHeight); } if (pixelPass) { pixelPass.uniforms["resolution"].value.set(newWidth, newHeight); } }
}

// --- UI Update Functions ---
function updateInfoTable(data) {
    if (!data) {
        const fieldsToClear = [infoName, infoType, infoMass, infoRadius, infoDensity, infoGravity, infoRotation, infoOrbit, infoAxialTilt, infoAtmospherePresence, infoAtmospherePressure, infoAtmosphereComposition, infoAtmosphereWeather, infoSurfaceTemp, infoSurfaceLiquid, infoSurfaceTerrain, infoLifeProbability, infoLifeIntelligent]; 
        fieldsToClear.forEach(field => field.textContent = '-'); 
        if (visualizationPlanetNameSpan) visualizationPlanetNameSpan.textContent = ''; // Clear planet name in viz header
        let moonInfoRow = document.getElementById('info-moons-row'); 
        if (moonInfoRow) moonInfoRow.remove(); 
        contactLifeBtn.disabled = true; 
        return;
    }
    currentPlanetData = data;
    const formatNum = (num, dec = 2) => (typeof num === 'number' ? num.toFixed(dec) : 'N/A');
    const formatInt = (num) => (typeof num === 'number' ? num.toFixed(0) : 'N/A');

    const planetName = data.general?.name || 'N/A';
    infoName.textContent = planetName;
    if (visualizationPlanetNameSpan) { // V11: Update planet name in visualization header
        visualizationPlanetNameSpan.textContent = planetName;
    }

    infoType.textContent = data.general?.type || 'N/A';
    infoMass.textContent = `${formatNum(data.general?.mass, 3)} Earths`;
    infoRadius.textContent = `${formatNum(data.general?.radius, 3)} Earths`;
    infoDensity.textContent = `${formatNum(data.general?.density, 2)} g/cm³`;
    infoGravity.textContent = `${formatNum(data.general?.gravity, 2)} g`;
    infoRotation.textContent = `${formatNum(data.general?.rotationPeriod, 1)} hrs`;
    infoOrbit.textContent = `${formatInt(data.general?.orbitalPeriod)} days`;
    infoAxialTilt.textContent = `${formatNum(data.general?.axialTilt, 1)}°`;
    infoAtmospherePresence.textContent = data.atmosphere?.presence || 'N/A';
    infoAtmospherePressure.textContent = `${formatNum(data.atmosphere?.pressure, 3)} atm`;
    let atmCompText = 'N/A';
    if (data.atmosphere?.composition && Object.keys(data.atmosphere.composition).length > 0) {
        atmCompText = Object.entries(data.atmosphere.composition).filter(([gas, percent]) => percent > 0.001).map(([gas, percent]) => `${gas}: ${percent.toFixed(percent < 1 ? 2 : 1)}%`).join(', ') || 'Trace gases or N/A';
    }
    infoAtmosphereComposition.textContent = atmCompText;
    infoAtmosphereWeather.textContent = data.atmosphere?.weatherNotes || 'N/A';
    infoSurfaceTemp.textContent = `${formatNum(data.surface?.averageTemperature, 1)} °C`;
    infoSurfaceLiquid.textContent = data.surface?.surfaceLiquid || 'N/A';
    infoSurfaceTerrain.textContent = data.surface?.dominantTerrainFeatures || 'N/A';
    let lifeProbText = '0.0%';
    if (data.life && typeof data.life.probabilityOfLife === 'number') {
        lifeProbText = `${(data.life.probabilityOfLife * 100).toFixed(1)}%`;
    }
    infoLifeProbability.textContent = lifeProbText;
    infoLifeIntelligent.textContent = currentAlienSpeciesData ? 'Communication Established' : (data.life?.detectedIntelligentLife ? 'Yes (Prior Contact)' : 'No');
    contactLifeBtn.disabled = contactAttemptedForCurrentPlanet || !(data.life?.probabilityOfLife && data.life.probabilityOfLife > 0.0001);
    if (regeneratePortraitBtn) regeneratePortraitBtn.disabled = !currentAlienSpeciesData;

    const moonCount = data.visuals?.moons?.length || 0;
    let moonInfoRow = document.getElementById('info-moons-row');
    if (moonCount > 0) {
        if (!moonInfoRow) {
            const tbody = document.getElementById('planet-info-table').getElementsByTagName('tbody')[0];
            let insertBeforeRow = Array.from(tbody.children).find(row => row.cells.length === 2 && row.cells[0].textContent === "Atmosphere");
            if(!insertBeforeRow) insertBeforeRow = Array.from(tbody.children).find(row => row.cells.length === 2 && row.cells[0].textContent === "Life");
            moonInfoRow = tbody.insertRow(insertBeforeRow ? insertBeforeRow.rowIndex : tbody.rows.length -1);
            moonInfoRow.id = 'info-moons-row';
            const cell1 = moonInfoRow.insertCell(); const cell2 = moonInfoRow.insertCell();
            cell1.textContent = "Moons"; cell2.id = 'info-moons-count';
        }
        document.getElementById('info-moons-count').textContent = moonCount;
    } else if (moonInfoRow) { moonInfoRow.remove(); }
}

function resetAlienContactUI() {
    if (llmChatInterface) llmChatInterface.classList.add('hidden');
    if (llmChatOutput) llmChatOutput.innerHTML = '';
    if (llmChatInput) llmChatInput.value = '';
    if (culturalInfoTab) {
        culturalInfoTab.classList.add('hidden');
        if (culturalInfoContentArea) {
            culturalInfoContentArea.innerHTML = '<p class="text-gray-400 italic">Information about this species will be revealed through conversation.</p>';
        }
    }
    if (alienPortraitDisplay) alienPortraitDisplay.innerHTML = '<p class="text-xs text-gray-500 text-center">Visual data pending...</p>';
    if (infoLifeIntelligent) infoLifeIntelligent.textContent = 'No';

    currentAlienSpeciesData = null;
    contactAttemptedForCurrentPlanet = false;
    revealedAlienInfoTags.clear();
    conversationHistory = [];
    isAlienNameRevealed = false;

    if(contactLifeBtn) contactLifeBtn.textContent = "Attempt Contact";
    if(regeneratePortraitBtn) regeneratePortraitBtn.disabled = true;
}

// --- Planet Generation ---
async function generateNewPlanet() {
    const selectedType = planetTypeSelect.value; let planetGeneratorModule;
    generatePlanetBtn.disabled = true; generatePlanetBtn.textContent = 'Generating...';
    resetAlienContactUI();

    if (selectedType === 'random') {
        const availableTypes = Object.keys(PLANET_MODULES);
        if (availableTypes.length === 0) { updateInfoTable(null); displayCelestialBodies({type:"Error"}); generatePlanetBtn.disabled = false; generatePlanetBtn.textContent = 'Generate New Planet'; return; }
        const randomTypeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        planetGeneratorModule = PLANET_MODULES[randomTypeKey]; planetTypeSelect.value = randomTypeKey;
    } else if (PLANET_MODULES[selectedType]) { planetGeneratorModule = PLANET_MODULES[selectedType];
    } else { updateInfoTable(null); displayCelestialBodies({type:"Error"}); generatePlanetBtn.disabled = false; generatePlanetBtn.textContent = 'Generate New Planet'; return; }

    if (!planetGeneratorModule || typeof planetGeneratorModule.generate !== 'function') { updateInfoTable(null); displayCelestialBodies({type:"Error"}); generatePlanetBtn.disabled = false; generatePlanetBtn.textContent = 'Generate New Planet'; return; }

    try {
        const newPlanetData = await planetGeneratorModule.generate();
        currentPlanetData = newPlanetData;
        updateInfoTable(currentPlanetData); // This will now also update the visualization header
        const visualParams = currentPlanetData.visuals || { radius: 1.5, shininess: 30 };
        visualParams.type = currentPlanetData.general.type;
        displayCelestialBodies(visualParams);
    } catch (error) { console.error("Error generating planet:", error.message, error.stack); updateInfoTable(null); displayCelestialBodies({type:"Error"});
    } finally { generatePlanetBtn.disabled = false; generatePlanetBtn.textContent = 'Generate New Planet'; }
}

// --- Alien Portrait Handling (Refactored for Data URL) ---
/**
 * Generates and displays an alien portrait using a Data URL.
 * @param {object} speciesData - The full alien species data object.
 * @param {object} planetData - The planet data for context.
 * @param {HTMLElement} targetDisplayElement - The DOM element to display the portrait in.
 * @param {object} [codexCacheEntry=null] - Optional. The codex entry object to cache the portrait Data URL on.
 */
function displayAlienPortrait(speciesData, planetData, targetDisplayElement, codexCacheEntry = null) {
    if (!speciesData || !planetData || !targetDisplayElement) {
        console.error("[displayAlienPortrait] Missing required data or target element.");
        if (targetDisplayElement) targetDisplayElement.innerHTML = '<p class="text-xs text-red-400 text-center">Portrait Error: Missing Data</p>';
        return;
    }

    const speciesNameForLog = getNestedValue(speciesData, 'name.value', 'Unknown Species');
    console.log(`[displayAlienPortrait] Attempting to generate portrait for: ${speciesNameForLog}`);

    try {
        // generateAlienPortrait is expected to return a Data URL string
        const portraitDataURL = generateAlienPortrait(speciesData, planetData); 

        targetDisplayElement.innerHTML = ''; // Clear previous content

        if (typeof portraitDataURL === 'string' && portraitDataURL.startsWith('data:image/png;base64,')) {
            console.log(`[displayAlienPortrait] Received valid Data URL for ${speciesNameForLog}. Creating <img>.`);
            const img = document.createElement('img');
            img.src = portraitDataURL;
            // Apply styles for pixelated rendering, consistent with canvas approach
            img.style.width = '100%'; 
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.imageRendering = 'pixelated';
            img.style.imageRendering = '-moz-crisp-edges'; // Firefox
            img.style.imageRendering = 'crisp-edges';    // Other browsers
            img.alt = `Portrait of ${speciesNameForLog}`;
            
            targetDisplayElement.appendChild(img);

            if (codexCacheEntry) {
                console.log(`[displayAlienPortrait] Caching new portrait Data URL for codex entry: ${speciesNameForLog}`);
                codexCacheEntry.currentPortraitDataURL = portraitDataURL; // Store the Data URL
            }
        } else {
            console.error(`[displayAlienPortrait] generateAlienPortrait for ${speciesNameForLog} did NOT return a valid Data URL. Received:`, portraitDataURL);
            targetDisplayElement.innerHTML = '<p class="text-xs text-red-500 text-center">Visual Sensor Error (Invalid Data)</p>';
        }
    } catch (e) {
        console.error(`[displayAlienPortrait] EXCEPTION during portrait generation/display for ${speciesNameForLog}:`, e);
        targetDisplayElement.innerHTML = '<p class="text-xs text-red-600 text-center">Visual Sensor Malfunction</p>';
    }
}

// --- Alien Contact and LLM Interaction ---
async function attemptAlienContact() {
    if (!currentPlanetData || contactAttemptedForCurrentPlanet) {
        if (contactAttemptedForCurrentPlanet && !currentAlienSpeciesData) appendMessageToChat("Previous contact attempts with this planet were unsuccessful.", "system-error");
        else if (contactAttemptedForCurrentPlanet && currentAlienSpeciesData) appendMessageToChat("Communication channel already open.", "system");
        if (regeneratePortraitBtn) regeneratePortraitBtn.disabled = !currentAlienSpeciesData;
        return;
    }

    contactLifeBtn.disabled = true; contactLifeBtn.textContent = "Contacting...";
    contactAttemptedForCurrentPlanet = true; isAlienNameRevealed = false;
    await new Promise(resolve => setTimeout(resolve, 1500));
    const lifeProbability = currentPlanetData.life?.probabilityOfLife || 0;
    const contactSuccess = Math.random() < lifeProbability;

    if (llmChatInterface) llmChatInterface.classList.remove('hidden');
    if (llmChatOutput) llmChatOutput.innerHTML = '';

    if (contactSuccess) {
        let newSpeciesData;
        try {
            newSpeciesData = await generateAlienSpecies(currentPlanetData);
            if (!newSpeciesData || !newSpeciesData.individualPersona) throw new Error("Alien species/persona data generation failed.");
        } catch (e) {
            appendMessageToChat("Error characterizing life signal.", "system-error");
            contactLifeBtn.textContent = "Contact Failed"; infoLifeIntelligent.textContent = 'Error';
            if (regeneratePortraitBtn) regeneratePortraitBtn.disabled = true;
            return;
        }

        currentAlienSpeciesData = newSpeciesData;
        const speciesNameKey = getNestedValue(currentAlienSpeciesData, 'name.value', null);
        let activeCodexEntry = codexEntries.find(entry => getNestedValue(entry.speciesDataFull, 'name.value', '') === speciesNameKey);

        if (activeCodexEntry) {
            console.log("Re-contacted known species from Codex:", speciesNameKey);
            revealedAlienInfoTags = new Set(activeCodexEntry.revealedTagsInChat || []);
            activeCodexEntry.currentPortraitDataURL = null; // Force regeneration for re-contact
        } else {
            activeCodexEntry = {
                speciesDataFull: JSON.parse(JSON.stringify(currentAlienSpeciesData)),
                planetDataForSpecies: JSON.parse(JSON.stringify(currentPlanetData)),
                revealedSummary: { speciesName: "???", homeworldName: "???", bodyType: "???", techLevel: "???" },
                revealedTagsInChat: [],
                currentPortraitDataURL: null // Will be set by displayAlienPortrait
            };
            codexEntries.push(activeCodexEntry);
            revealedAlienInfoTags.clear();
        }
        
        displayAlienPortrait(currentAlienSpeciesData, currentPlanetData, alienPortraitDisplay, activeCodexEntry);
        renderCodex(); 

        infoLifeIntelligent.textContent = "Communication Established";
        if (culturalInfoTab) culturalInfoTab.classList.remove('hidden');
        if (regeneratePortraitBtn) regeneratePortraitBtn.disabled = false;

        const planetNameForChat = getNestedValue(currentAlienSpeciesData, 'nativePlanetName', "this world");
        appendMessageToChat(`Connection established with Unknown Being of ${planetNameForChat}.`, "system");
        conversationHistory = [];
        const systemPromptText = constructSystemPrompt(currentPlanetData, currentAlienSpeciesData);
        if (systemPromptText.startsWith("Error:")) { appendMessageToChat(systemPromptText, "system-error"); return; }
        conversationHistory.push({ role: "system", parts: [{ text: systemPromptText }] });
    } else {
        appendMessageToChat("No intelligent life forms responded...", "system-error");
        currentAlienSpeciesData = null; infoLifeIntelligent.textContent = 'No Response';
        contactLifeBtn.textContent = "Contact Failed"; if (regeneratePortraitBtn) regeneratePortraitBtn.disabled = true;
    }
}

function appendMessageToChat(message, senderRole) {
    if (!llmChatOutput) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('p-2', 'px-3', 'rounded-lg', 'mb-2', 'max-w-[85%]', 'sm:max-w-[75%]', 'break-words', 'shadow');
    let prefix = "";
    switch (senderRole) {
        case 'user': prefix = "You: "; messageDiv.classList.add('bg-blue-600', 'text-white', 'self-end', 'ml-auto'); break;
        case 'alien': const alienName = isAlienNameRevealed && currentAlienSpeciesData?.individualPersona?.name?.value ? currentAlienSpeciesData.individualPersona.name.value : "???"; prefix = `${alienName}: `; messageDiv.classList.add('bg-gray-700', 'text-gray-100', 'self-start', 'mr-auto'); break;
        case 'system': prefix = "System: "; messageDiv.classList.add('bg-purple-800', 'text-purple-100', 'self-center', 'text-xs', 'italic', 'text-center', 'w-full', 'max-w-md', 'mx-auto', 'py-1', 'opacity-90'); break;
        case 'system-error': prefix = "System Error: "; messageDiv.classList.add('bg-red-800', 'text-red-100', 'self-center', 'text-xs', 'font-semibold', 'text-center', 'w-full', 'max-w-md', 'mx-auto', 'py-1'); break;
        default: messageDiv.classList.add('bg-gray-500', 'text-white', 'self-start', 'mr-auto');
    }
    messageDiv.textContent = prefix + message;
    llmChatOutput.appendChild(messageDiv);
    llmChatOutput.scrollTop = llmChatOutput.scrollHeight;
}

async function sendChatMessage() {
    if (!llmChatInput || !llmChatOutput || !currentAlienSpeciesData) { if (!currentAlienSpeciesData && llmChatInput.value.trim()) appendMessageToChat("No active communication channel.", "system-error"); return; }
    const userMessage = llmChatInput.value.trim(); if (!userMessage) return;
    appendMessageToChat(userMessage, 'user'); conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });
    llmChatInput.value = ''; llmSendBtn.disabled = true; llmChatInput.disabled = true;
    if (!currentLlmApiKey) { appendMessageToChat("API Key not found.", "system-error"); llmSendBtn.disabled = false; llmChatInput.disabled = false; return; }

    const llmResponseTextWithTags = await sendQueryToLLM(currentLlmApiKey, conversationHistory);
    if (llmResponseTextWithTags.startsWith("Error:")) { appendMessageToChat(llmResponseTextWithTags, 'system-error');
    } else {
        let cleanedText = llmResponseTextWithTags.replace(/\s*\[[A-Z0-9_]+_TAG\]\s*/g, ' ').replace(/\s\s+/g, ' ').replace(/\s+([,.!?:;])/g, '$1').trim();
        appendMessageToChat(cleanedText, 'alien');
        conversationHistory.push({ role: "model", parts: [{ text: llmResponseTextWithTags }] });
        parseAndDisplayAlienInfo(llmResponseTextWithTags);
    }
    llmSendBtn.disabled = false; llmChatInput.disabled = false; if(llmChatInput) llmChatInput.focus();
}

function parseAndDisplayAlienInfo(responseText) {
    if (!currentAlienSpeciesData || !culturalInfoContentArea) return;
    if (responseText.includes(getNestedTag(currentAlienSpeciesData, 'individualPersona.name'))) isAlienNameRevealed = true;

    const tagRegex = /\[([A-Z0-9_]+_TAG)\]/g;
    let match;
    let infoUpdatedForCodexThisTurn = false;
    const allRevealableDataForCulturalTab = {};

    function flattenDataForCulturalTab(obj, path = '', category = '') {
        if (!obj || typeof obj !== 'object') return;
        if (obj.tag && obj.value !== undefined) { allRevealableDataForCulturalTab[obj.tag] = { value: String(obj.value), path: path || category, label: category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), category: category }; return; }
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            const currentPath = (path ? path + '.' : '') + key; let currentCategory = category;
            if (path === '') { if (['name', 'planetOfOriginName', 'nativePlanetName'].includes(key)) currentCategory = "Species Info"; else if (key === 'physical') currentCategory = "Physical Traits"; else if (key === 'culturalAspects') currentCategory = "Cultural Aspects"; else if (key === 'interactionProfile') currentCategory = "Interaction Profile"; else if (key === 'specialCharacteristics') currentCategory = "Special Characteristics"; else if (key === 'individualPersona') currentCategory = "Individual Details"; else currentCategory = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); }
            const value = obj[key];
            if (value && typeof value === 'object') {
                if (value.tag && value.value !== undefined) { allRevealableDataForCulturalTab[value.tag] = { value: String(value.value), path: currentPath, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), category: currentCategory };
                } else if (Array.isArray(value)) { value.forEach((item, index) => { if (item && typeof item === 'object' && item.tag && item.characteristic) { allRevealableDataForCulturalTab[item.tag] = { value: `${item.characteristic}: ${item.details || 'No further details.'}`, path: `${currentPath}[${index}]`, label: item.characteristic, category: currentCategory }; } else { flattenDataForCulturalTab(item, `${currentPath}[${index}]`, currentCategory); } });
                } else { flattenDataForCulturalTab(value, currentPath, currentCategory); }
            }
        }
    }
    flattenDataForCulturalTab(currentAlienSpeciesData);

    if (culturalInfoContentArea.firstChild && culturalInfoContentArea.firstChild.nodeName === 'P' && culturalInfoContentArea.firstChild.textContent.startsWith("Information about this species")) {
        culturalInfoContentArea.innerHTML = '';
        const definedCategories = { "Species Info": true, "Individual Details": true, "Physical Traits": true, "Cultural Aspects": true, "Interaction Profile": true, "Special Characteristics": true };
        for (const categoryTitle of Object.keys(definedCategories)) {
            const catDiv = document.createElement('div'); catDiv.id = `category-${categoryTitle.toLowerCase().replace(/\s+/g, '-')}`; catDiv.classList.add('cultural-info-category', 'mb-4');
            catDiv.innerHTML = `<h5 class="text-md font-semibold mt-3 mb-1 text-gray-200 border-b border-gray-600 pb-1">${categoryTitle}</h5>`;
            if (categoryTitle === "Special Characteristics") { const ul = document.createElement('ul'); ul.id = `category-specialCharacteristics-list`; ul.classList.add('list-disc', 'list-inside', 'ml-4', 'text-sm', 'space-y-1'); catDiv.appendChild(ul); }
            culturalInfoContentArea.appendChild(catDiv);
        }
    }

    const currentSpeciesNameForLookup = getNestedValue(currentAlienSpeciesData, 'name.value', null);
    let activeCodexEntry = null;
    if (currentSpeciesNameForLookup) {
        activeCodexEntry = codexEntries.find(entry => getNestedValue(entry.speciesDataFull, 'name.value', '') === currentSpeciesNameForLookup);
    }

    while ((match = tagRegex.exec(responseText)) !== null) {
        const tag = match[0]; 
        if (allRevealableDataForCulturalTab[tag] && !revealedAlienInfoTags.has(tag)) {
            revealedAlienInfoTags.add(tag); 
            const infoData = allRevealableDataForCulturalTab[tag]; let categoryKey = infoData.category; if (!categoryKey) { if (infoData.path.startsWith('individualPersona')) categoryKey = "Individual Details"; else if (infoData.path.startsWith('physical')) categoryKey = "Physical Traits"; else categoryKey = "General Information"; }
            const categoryDivId = `category-${categoryKey.toLowerCase().replace(/\s+/g, '-')}`; let categoryContainer = document.getElementById(categoryDivId);
            if (!categoryContainer && culturalInfoContentArea.firstChild) { /* create if needed */ }
            if(categoryContainer) {
                const p = document.createElement('p'); p.classList.add('text-gray-300', 'text-sm', 'py-0.5');
                const labelText = infoData.label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); const cleanedValue = infoData.value.replace(tagRegex, '').trim();
                p.innerHTML = `<strong class="text-gray-100 font-medium">${labelText}:</strong> ${cleanedValue}`;
                if (categoryKey === "Special Characteristics") { const list = categoryContainer.querySelector("#category-specialCharacteristics-list"); if(list) {const li = document.createElement('li'); li.innerHTML = `<strong class="text-gray-100 font-medium">${infoData.label}:</strong> ${cleanedValue}`; list.appendChild(li);} else {categoryContainer.appendChild(p);}}
                else { categoryContainer.appendChild(p); }
            }
        }

        if (activeCodexEntry) {
            if (!activeCodexEntry.revealedTagsInChat.includes(tag)) {
                activeCodexEntry.revealedTagsInChat.push(tag);
                infoUpdatedForCodexThisTurn = true; 
            }
            if (tag === getNestedTag(currentAlienSpeciesData, 'name')) { activeCodexEntry.revealedSummary.speciesName = getNestedValue(currentAlienSpeciesData, 'name'); infoUpdatedForCodexThisTurn = true; }
            else if (tag === getNestedTag(currentAlienSpeciesData, 'nativePlanetName')) { activeCodexEntry.revealedSummary.homeworldName = getNestedValue(currentAlienSpeciesData, 'nativePlanetName'); infoUpdatedForCodexThisTurn = true; }
            else if (tag === getNestedTag(currentAlienSpeciesData, 'physical.bodyType')) { activeCodexEntry.revealedSummary.bodyType = getNestedValue(currentAlienSpeciesData, 'physical.bodyType'); infoUpdatedForCodexThisTurn = true; }
            else if (tag === getNestedTag(currentAlienSpeciesData, 'culturalAspects.technologyLevel')) { activeCodexEntry.revealedSummary.techLevel = getNestedValue(currentAlienSpeciesData, 'culturalAspects.technologyLevel'); infoUpdatedForCodexThisTurn = true; }
        }
    }
    if (infoUpdatedForCodexThisTurn && activeCodexEntry) renderCodex();
}

function regenerateAlienPortrait() {
    if (!currentAlienSpeciesData || !currentPlanetData) {
        if (regeneratePortraitBtn) regeneratePortraitBtn.disabled = true;
        console.warn("[regenerateAlienPortrait] Called without currentAlienSpeciesData or currentPlanetData.");
        return;
    }
    if (!alienPortraitDisplay) {
        console.error("[regenerateAlienPortrait] alienPortraitDisplay element not found.");
        return;
    }
    if (regeneratePortraitBtn) regeneratePortraitBtn.disabled = false;

    const speciesNameKey = getNestedValue(currentAlienSpeciesData, 'name.value', null);
    let activeCodexEntry = null;
    if (speciesNameKey) {
        activeCodexEntry = codexEntries.find(entry => getNestedValue(entry.speciesDataFull, 'name.value', '') === speciesNameKey);
    }
    
    displayAlienPortrait(currentAlienSpeciesData, currentPlanetData, alienPortraitDisplay, activeCodexEntry);
    
    if (activeCodexEntry) { // If the entry was found and its Data URL potentially updated by displayAlienPortrait
        renderCodex(); // Re-render codex to show the new portrait in the card
    }
}

// --- Settings and API Key Management ---
function saveApiKey() {
    const apiKey = llmApiKeyInput.value.trim();
    if (apiKey) { localStorage.setItem('llmApiKey', apiKey); currentLlmApiKey = apiKey; showUserFeedback(saveApiKeyBtn, 'Saved!', 1500); }
    else { appendMessageToChat('API Key cannot be empty.', 'system-error'); }
}
function loadSettings() {
    const savedKey = localStorage.getItem('llmApiKey');
    if (savedKey) { llmApiKeyInput.value = savedKey; currentLlmApiKey = savedKey; }
}

// --- Codex Functions ---
function renderCodex() {
    if (!alienCodexContent || !codexEmptyMessage) return;
    alienCodexContent.innerHTML = '';
    if (codexEntries.length === 0) {
        codexEmptyMessage.classList.remove('hidden'); alienCodexContent.appendChild(codexEmptyMessage);
    } else {
        codexEmptyMessage.classList.add('hidden');
        codexEntries.forEach(entry => { const card = createCodexCard(entry); if (card) alienCodexContent.appendChild(card); });
    }
}

function createCodexCard(codexEntryData) {
    if (!codexEntryData || !codexEntryData.speciesDataFull || !codexEntryData.planetDataForSpecies) {
        console.error("[createCodexCard] Invalid codexEntryData provided.");
        return null;
    }
    const card = document.createElement('div'); card.classList.add('codex-card');
    const portraitContainer = document.createElement('div'); portraitContainer.classList.add('codex-card-portrait');

    // Use cached Data URL if available, otherwise generate and cache.
    if (codexEntryData.currentPortraitDataURL && typeof codexEntryData.currentPortraitDataURL === 'string' && codexEntryData.currentPortraitDataURL.startsWith('data:image/png;base64,')) {
        console.log(`[createCodexCard] Using cached Data URL for ${getNestedValue(codexEntryData.speciesDataFull, 'name.value', 'Unknown')}`);
        const img = document.createElement('img');
        img.src = codexEntryData.currentPortraitDataURL;
        img.style.width = '100%'; img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.imageRendering = 'pixelated';
        img.style.imageRendering = '-moz-crisp-edges';
        img.style.imageRendering = 'crisp-edges';
        img.alt = `Portrait of ${getNestedValue(codexEntryData.speciesDataFull, 'name.value', 'Unknown')}`;
        portraitContainer.appendChild(img);
    } else {
        console.log(`[createCodexCard] No cached Data URL for ${getNestedValue(codexEntryData.speciesDataFull, 'name.value', 'Unknown')}. Generating new one.`);
        // displayAlienPortrait will generate, display in portraitContainer, and cache the Data URL on codexEntryData
        displayAlienPortrait(codexEntryData.speciesDataFull, codexEntryData.planetDataForSpecies, portraitContainer, codexEntryData);
    }
    
    card.appendChild(portraitContainer);

    const createCardTextElement = (label, value) => {
        const p = document.createElement('p');
        p.classList.add('text-xs'); 
        p.innerHTML = `<strong class="font-medium text-gray-400">${label}:</strong> <span class="text-gray-300">${value}</span>`;
        return p;
    };

    const speciesNameTag = getNestedTag(codexEntryData.speciesDataFull, 'name');
    const speciesName = codexEntryData.revealedTagsInChat.includes(speciesNameTag) ? getNestedValue(codexEntryData.speciesDataFull, 'name') : '???';
    const speciesNameEl = document.createElement('h4');
    speciesNameEl.classList.add('text-sm', 'font-semibold', 'text-center', 'mb-1'); 
    speciesNameEl.textContent = speciesName;
    card.appendChild(speciesNameEl);

    card.appendChild(createCardTextElement('Homeworld', codexEntryData.revealedTagsInChat.includes(getNestedTag(codexEntryData.speciesDataFull, 'nativePlanetName')) ? getNestedValue(codexEntryData.speciesDataFull, 'nativePlanetName') : '???'));
    card.appendChild(createCardTextElement('Body Type', codexEntryData.revealedTagsInChat.includes(getNestedTag(codexEntryData.speciesDataFull, 'physical.bodyType')) ? getNestedValue(codexEntryData.speciesDataFull, 'physical.bodyType') : '???'));
    card.appendChild(createCardTextElement('Tech Level', codexEntryData.revealedTagsInChat.includes(getNestedTag(codexEntryData.speciesDataFull, 'culturalAspects.technologyLevel')) ? getNestedValue(codexEntryData.speciesDataFull, 'culturalAspects.technologyLevel') : '???'));
    card.appendChild(createCardTextElement('Government', codexEntryData.revealedTagsInChat.includes(getNestedTag(codexEntryData.speciesDataFull, 'culturalAspects.government.type')) ? getNestedValue(codexEntryData.speciesDataFull, 'culturalAspects.government.type') : '???'));
    card.appendChild(createCardTextElement('Social Structure', codexEntryData.revealedTagsInChat.includes(getNestedTag(codexEntryData.speciesDataFull, 'culturalAspects.socialStructure')) ? getNestedValue(codexEntryData.speciesDataFull, 'culturalAspects.socialStructure') : '???'));

    const specialCharsArray = getNestedValue(codexEntryData.speciesDataFull, 'specialCharacteristics', []);
    if (Array.isArray(specialCharsArray) && specialCharsArray.length > 0) {
        let displayedCharsCount = 0;
        const traitsContainer = document.createElement('div');
        traitsContainer.classList.add('mt-1', 'pt-1', 'border-t', 'border-gray-600'); 
        const traitsHeader = document.createElement('p');
        traitsHeader.innerHTML = `<strong class="font-medium text-gray-400">Traits:</strong>`;
        traitsContainer.appendChild(traitsHeader);

        const traitsList = document.createElement('ul');
        traitsList.classList.add('list-disc', 'list-inside', 'ml-2', 'text-gray-300');

        for (let i = 0; i < specialCharsArray.length && displayedCharsCount < 2; i++) {
            const charItem = specialCharsArray[i];
            if (charItem && charItem.tag && codexEntryData.revealedTagsInChat.includes(charItem.tag)) {
                const li = document.createElement('li');
                li.textContent = charItem.characteristic || 'Unknown Trait';
                traitsList.appendChild(li);
                displayedCharsCount++;
            }
        }
        if (displayedCharsCount > 0) {
            traitsContainer.appendChild(traitsList);
            card.appendChild(traitsContainer);
        } else if (specialCharsArray.length > 0) { 
            traitsHeader.innerHTML += ` <span class="text-gray-300">???</span>`;
            card.appendChild(traitsHeader); 
        }
    }
    return card;
}

// --- Save/Load State Functions ---
function showUserFeedback(element, message, duration = 2000, isError = false) {
    const originalText = element?.textContent;
    if (element && element.tagName === 'BUTTON') { element.textContent = message; element.disabled = true; }
    else if (saveLoadFeedback) { saveLoadFeedback.textContent = message; saveLoadFeedback.className = `text-xs mt-1 h-4 ${isError ? 'text-red-400' : 'text-green-400'}`; }
    setTimeout(() => {
        if (element && element.tagName === 'BUTTON') { element.textContent = originalText; element.disabled = false; }
        else if (saveLoadFeedback) { saveLoadFeedback.textContent = ''; }
    }, duration);
}

function saveState() {
    if (typeof localStorage === 'undefined') { showUserFeedback(null,"LocalStorage not available.", 3000, true); return; }
    try {
        const codexToSave = codexEntries.map(entry => {
            // Exclude the live Data URL from saving to avoid large localStorage items
            // Portraits will be regenerated on load.
            const { currentPortraitDataURL, ...restOfEntry } = entry; 
            return restOfEntry;
        });
        const stateToSave = {
            codexEntries: JSON.parse(JSON.stringify(codexToSave)), // Ensure deep copy for saving
            userSettings: { pixelationAmount: currentPixelationAmount },
            saveFormatVersion: SAVE_DATA_KEY.split('_v')[1] // Get version from key
        };
        localStorage.setItem(SAVE_DATA_KEY, JSON.stringify(stateToSave));
        showUserFeedback(saveStateBtn, "State Saved!", 2000);
        console.log("Game state (Codex & Settings) saved.");
    } catch (error) { console.error("Error saving state:", error); showUserFeedback(saveStateBtn, "Error Saving!", 3000, true); }
}

function loadState() {
    if (typeof localStorage === 'undefined') { showUserFeedback(null,"LocalStorage not available.", 3000, true); return false; }
    try {
        const savedStateString = localStorage.getItem(SAVE_DATA_KEY);
        if (!savedStateString) { showUserFeedback(loadStateBtn, "No save data found.", 2000); return false; }
        const savedState = JSON.parse(savedStateString);

        // Basic version check (can be expanded)
        if (savedState.saveFormatVersion !== SAVE_DATA_KEY.split('_v')[1]) {
            console.warn(`Loading save data from a different version (${savedState.saveFormatVersion}). Current app version is ${SAVE_DATA_KEY.split('_v')[1]}. Some data might be reset or default if structures are incompatible.`);
            // Add migration logic here if needed in the future
        }

        codexEntries = savedState.codexEntries || [];
        codexEntries.forEach(entry => {
            entry.currentPortraitDataURL = null; // Always regenerate portraits on load
            if (!entry.revealedSummary) entry.revealedSummary = { speciesName: "???", homeworldName: "???", bodyType: "???", techLevel: "???" };
            if (!entry.revealedTagsInChat) entry.revealedTagsInChat = [];
        });

        if (savedState.userSettings) {
            currentPixelationAmount = savedState.userSettings.pixelationAmount !== undefined ? savedState.userSettings.pixelationAmount : DEFAULT_PIXELATION_AMOUNT;
            if (pixelationSlider) pixelationSlider.value = currentPixelationAmount;
            if (pixelationValueLabel) pixelationValueLabel.textContent = currentPixelationAmount;
            if (pixelPass && pixelPass.uniforms["pixelSize"]) pixelPass.uniforms["pixelSize"].value = currentPixelationAmount;
        }
        showUserFeedback(loadStateBtn, "Codex Loaded!", 2000);
        console.log("Game state (Codex & Settings) loaded.");
        return true;
    } catch (error) { console.error("Error loading state:", error); showUserFeedback(loadStateBtn, "Error Loading!", 3000, true); localStorage.removeItem(SAVE_DATA_KEY); return false; }
}

function clearState() {
    if (typeof localStorage === 'undefined') { showUserFeedback(null,"LocalStorage not available.", 3000, true); return; }
    if (confirm("Are you sure you want to clear all saved data (Codex & Settings)? This cannot be undone.")) {
        localStorage.removeItem(SAVE_DATA_KEY);
        codexEntries = [];
        renderCodex();
        showUserFeedback(clearSaveBtn, "Saved Data Cleared!", 2000);
        console.log("Saved data cleared.");
    }
}

// --- Event Listeners ---
window.addEventListener('resize', onWindowResize, false);
generatePlanetBtn.addEventListener('click', generateNewPlanet);
if(saveApiKeyBtn) saveApiKeyBtn.addEventListener('click', saveApiKey);
if(contactLifeBtn) contactLifeBtn.addEventListener('click', attemptAlienContact);
if(llmSendBtn) llmSendBtn.addEventListener('click', sendChatMessage);
if(llmChatInput) llmChatInput.addEventListener('keypress', (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChatMessage(); } });
if (regeneratePortraitBtn) { regeneratePortraitBtn.addEventListener('click', regenerateAlienPortrait); regeneratePortraitBtn.disabled = true; }
if (settingsBtn && settingsModal && closeSettingsBtn) { settingsBtn.addEventListener('click', () => { settingsModal.classList.add('active'); }); closeSettingsBtn.addEventListener('click', () => { settingsModal.classList.remove('active'); }); settingsModal.addEventListener('click', (event) => { if (event.target === settingsModal) { settingsModal.classList.remove('active'); } }); }
if (pixelationSlider && pixelationValueLabel) { pixelationSlider.addEventListener('input', (event) => { currentPixelationAmount = parseFloat(event.target.value); pixelationValueLabel.textContent = currentPixelationAmount; if (pixelPass && pixelPass.uniforms["pixelSize"]) { pixelPass.uniforms["pixelSize"].value = currentPixelationAmount; } }); }
if (saveStateBtn) saveStateBtn.addEventListener('click', saveState);
if (loadStateBtn) loadStateBtn.addEventListener('click', () => { if (loadState()) { renderCodex(); resetAlienContactUI(); if (!currentPlanetData) generateNewPlanet(); settingsModal.classList.remove('active'); } });
if (clearSaveBtn) clearSaveBtn.addEventListener('click', () => { clearState(); resetAlienContactUI(); if (!currentPlanetData) generateNewPlanet(); settingsModal.classList.remove('active'); });

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE.EffectComposer === 'undefined' || typeof THREE.RenderPass === 'undefined' || typeof THREE.ShaderPass === 'undefined' || typeof THREE.PixelShader === 'undefined') { console.error('Post-processing modules not loaded! Pixelation disabled.'); }
    if (typeof THREE.OrbitControls === 'undefined') { console.warn('THREE.OrbitControls not loaded.'); }
    loadSettings(); initThreeJS();
    if (loadState()) { renderCodex(); }
    else { renderCodex(); }
    generateNewPlanet();
});
