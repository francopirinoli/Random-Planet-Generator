// js/planet_types/ocean_planet.js

let noise3D; // Will be initialized by dynamic import in generate()

/** Helper function to get a random floating-point number in a specified range. */
function getRandomInRange(min, max) { return Math.random() * (max - min) + min; }
/** Helper function to get a random integer in a specified range. */
function getRandomIntInRange(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }

/** Generates a procedural, somewhat plausible name for a planet or moon. */
function generateCelestialName(isMoon = false, planetType = "Planet") {
    const prefixes = isMoon ? ["Thalassa", "Coralia", "Aqua", "Glacies", "Rime"] :
                              ["Oceanus", "Poseidon", "Aegir", "Thalassa", "Pacifica", "Atlantis", "Aqua", "Hydros", "Pelagia", "Neptunus", "Tethys", "Glacion"];
    const midfixes = isMoon ? ["Minor", "Parva", "Deep", "Icy"] :
                              ["Major", "Profundus", "Azureus", "Glacialis", "Marinus", "Abyss"];
    const suffixes = isMoon ? ["I", "II", "Drop", "Shard", "Floe"] :
                              ["Prime", "Deep", "Ocean", "Sea", "Abyss", "Mare", "Glacier", "Expanse", "World", "Sphere"];
    const designation = isMoon ? [`${String.fromCharCode(65 + getRandomIntInRange(0, 25))}`] : [ `${String.fromCharCode(65 + getRandomIntInRange(0, 25))}${String.fromCharCode(65 + getRandomIntInRange(0, 25))}-${getRandomIntInRange(1000, 9999)}`, `Star ${getRandomIntInRange(100,999)} Waterworld`, `Sector ${getRandomIntInRange(1,100)}/${planetType}`];
    
    let name = prefixes[getRandomIntInRange(0, prefixes.length - 1)];
    if (Math.random() < (isMoon ? 0.3 : 0.65)) { name += ` ${midfixes[getRandomIntInRange(0, midfixes.length - 1)]}`; }
    if (!isMoon || Math.random() < 0.55) { name += ` ${suffixes[getRandomIntInRange(0, suffixes.length - 1)]}`; }
    if (Math.random() < (isMoon ? 0.25 : 0.75)) { name += ` (${designation[getRandomIntInRange(0, designation.length-1)]})`;}
    return name;
}

/** HSL to RGB color conversion helper */
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; } 
    else {
        const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/** Helper to create an error texture */
function createErrorTexture(message = "ERR", width = 64, height = 32) {
    console.warn(`createErrorTexture called: ${message}`);
    const c = document.createElement('canvas'); c.width = width; c.height = height;
    const ctx = c.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = 'magenta'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'black'; ctx.font = `${Math.min(height / 3, 10)}px Arial`; ctx.textAlign = 'center';
    ctx.fillText('TEX ERR', c.width/2, c.height/2 - height/6); ctx.fillText(message.substring(0,10), c.width/2, c.height/2 + height/6);
    return c;
}

/** Generates a procedural moon texture. */
function generateMoonTexture(options = {}) { /* ... (same as previous versions) ... */ 
    if (!options.noise3D) return createErrorTexture("NoMoonNoise3D");
    const currentNoise3D = options.noise3D;
    try {
        const width = 512; const height = 256;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("MoonCtxFail");
        const baseGrey = getRandomIntInRange(70, 160); 
        const craterColorDark = Math.max(0, baseGrey - getRandomIntInRange(40, 70));
        const craterColorLight = Math.min(255, baseGrey + getRandomIntInRange(20, 40));
        const baseFreq = getRandomInRange(2.5, 6.0); 
        const craterFreq = getRandomIntInRange(7.0, 18.0); 
        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u = x_px / width; const v = y_px / height; const phi_loop = u * 2 * Math.PI; const theta_loop = v * Math.PI; 
                const nx = Math.sin(theta_loop) * Math.cos(phi_loop); const ny = Math.sin(theta_loop) * Math.sin(phi_loop); const nz = Math.cos(theta_loop);
                let surfaceNoise = (currentNoise3D(nx * baseFreq, ny * baseFreq, nz * baseFreq) + 1) / 2; 
                let craterNoise = (currentNoise3D(nx * craterFreq + 50, ny * craterFreq + 50, nz * craterFreq + 50) + 1) / 2;
                let color = baseGrey + (surfaceNoise - 0.5) * 50; 
                if (craterNoise > 0.70) { color = craterColorLight * (craterNoise - 0.70) * 3.33 + color * (1 - (craterNoise - 0.70) * 3.33) ; } 
                else if (craterNoise < 0.30 && craterNoise > 0.05) { color = craterColorDark * (0.30 - craterNoise) * 4.0 + color * (1- (0.30 - craterNoise) * 4.0); }
                color = Math.max(0, Math.min(255, color)); ctx.fillStyle = `rgb(${Math.floor(color)}, ${Math.floor(color)}, ${Math.floor(color)})`; ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        return canvas;
    } catch (error) { console.error("Error in generateMoonTexture:", error); return createErrorTexture("MoonTexFail"); }
}

/** Generates a cloud texture (can be reused from terrestrial or adapted). */
function generateCloudTexture(options = {}) {
    if (!options.noise3D) return createErrorTexture("NoCloudNoise");
    const currentNoise3D = options.noise3D;
    try {
        const width = 1024; const height = 512;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("CloudCtxFail");
        let cloudBaseR = getRandomIntInRange(210, 250); let cloudBaseG = getRandomIntInRange(210, 250); let cloudBaseB = getRandomIntInRange(220, 255);
        // Subtle tinting based on atmospheric composition (optional)
        if (options.atmosphereComposition) {
            if (options.atmosphereComposition.CH4 > 3) { cloudBaseR = Math.min(255, cloudBaseR + 5); cloudBaseG = Math.min(255, cloudBaseG + 2); cloudBaseB = Math.max(0, cloudBaseB - 8); }
        }
        const baseCloudFrequency = getRandomInRange(1.8, 3.5); const detailCloudFrequency = getRandomInRange(6.0, 12.0);
        const octaves = getRandomIntInRange(4, 5); const persistence = getRandomInRange(0.48, 0.58); const lacunarity = 2.0;
        const cloudCoverageThreshold = getRandomInRange(0.48, 0.62); const cloudDensityPower = getRandomInRange(1.2, 2.2);
        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u = x_px / width; const v = y_px / height; const phi = u * 2 * Math.PI; const theta = v * Math.PI;
                const nx = Math.sin(theta) * Math.cos(phi); const ny = Math.sin(theta) * Math.sin(phi); const nz = Math.cos(theta);
                let noiseValBase = 0; let ampBase = 1.0; let freqBase = baseCloudFrequency; let maxAmpBase = 0;
                for (let i = 0; i < octaves; i++) { noiseValBase += currentNoise3D(nx * freqBase, ny * freqBase, nz * freqBase) * ampBase; maxAmpBase += ampBase; ampBase *= persistence; freqBase *= lacunarity; }
                if (maxAmpBase === 0) maxAmpBase = 1; noiseValBase = (noiseValBase / maxAmpBase + 1) / 2;
                let noiseValDetail = 0; let ampDetail = 0.6; let freqDetail = detailCloudFrequency; let maxAmpDetail = 0;
                for (let i = 0; i < octaves -1 ; i++) { noiseValDetail += currentNoise3D(nx * freqDetail + 10, ny * freqDetail + 20, nz * freqDetail + 30) * ampDetail; maxAmpDetail += ampDetail; ampDetail *= persistence; freqDetail *= lacunarity; }
                if (maxAmpDetail === 0) maxAmpDetail = 1; noiseValDetail = (noiseValDetail / maxAmpDetail + 1) / 2;
                let combinedNoise = noiseValBase * 0.65 + noiseValDetail * 0.35; combinedNoise = Math.max(0, Math.min(1, combinedNoise));
                let alpha = 0;
                if (combinedNoise > cloudCoverageThreshold) { alpha = (combinedNoise - cloudCoverageThreshold) / (1.0 - cloudCoverageThreshold); alpha = Math.pow(alpha, cloudDensityPower); alpha = Math.min(alpha * getRandomInRange(0.5, 0.9), 0.85); }
                if (alpha > 0.015) { const variation = (currentNoise3D(nx * freqDetail * 1.5, ny * freqDetail * 1.5, nz * freqDetail * 1.5) + 1) * 0.5 * 10; ctx.fillStyle = `rgba(${Math.floor(Math.min(255,cloudBaseR + variation))}, ${Math.floor(Math.min(255,cloudBaseG + variation))}, ${Math.floor(Math.min(255,cloudBaseB + variation))}, ${alpha.toFixed(3)})`; ctx.fillRect(x_px, y_px, 1, 1); }
            }
        }
        console.log(`Cloud Texture Generated for Ocean Planet.`); return canvas;
    } catch (error) { console.error("Error within generateCloudTexture:", error); return createErrorTexture("CloudGenFailOcean"); }
}


/**
 * Generates a procedural texture for an Ocean Planet.
 * @param {object} options - Configuration options.
 * @param {function} options.noise3D - The 3D Simplex noise function.
 * @param {number} options.averageTemperature - Average surface temperature (determines ice).
 * @param {boolean} options.isFrozenWorld - If true, surface is mostly ice.
 * @returns {HTMLCanvasElement | null}
 */
function generateOceanPlanetTexture(options = {}) {
    if (!options.noise3D) return createErrorTexture("NoOceanNoise3D");
    const currentNoise3D = options.noise3D;

    try {
        const width = 1024; 
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return createErrorTexture("OceanCtxFail", width, height);

        // --- Color Palette for Ocean/Ice Worlds ---
        const oceanHue = getRandomInRange(180, 260); // Blues, cyans, teals, occasional purples
        const oceanSaturation = getRandomInRange(60, 100);
        
        const deepColorLightness = getRandomInRange(15, 35);
        const shallowColorLightness = getRandomInRange(40, 65);
        const waveHighlightLightness = getRandomInRange(70, 90);

        const deepColor = hslToRgb(oceanHue/360, oceanSaturation/100, deepColorLightness/100);
        const shallowColor = hslToRgb((oceanHue + getRandomInRange(-15, 15))/360, oceanSaturation/100, shallowColorLightness/100);
        const waveHighlightColor = hslToRgb((oceanHue + getRandomInRange(-10, 10))/360, oceanSaturation * 0.8 / 100, waveHighlightLightness/100);

        const iceBaseColor = hslToRgb(getRandomInRange(180,240)/360, getRandomInRange(5,25)/100, getRandomInRange(85,98)/100); // Whitish-blue ice
        const iceCrackColor = {r: iceBaseColor.r - 40, g: iceBaseColor.g - 30, b: iceBaseColor.b - 20};

        // --- Noise Parameters ---
        const baseFreq = getRandomInRange(1.0, 2.5) / options.planetRadius; // For large currents or ice sheet variations
        const waveFreq = baseFreq * getRandomInRange(8, 15);       // For wave patterns or ice texture
        const crackFreq = baseFreq * getRandomInRange(3, 7);       // For ice cracks
        const octaves = 4;
        const persistence = 0.5;
        const lacunarity = 2.0;

        const fBm = (x, y, z, initialFreq, oct, pers, lac) => {
            let t = 0; let a = 1.0; let f = initialFreq; let maxA = 0;
            for (let i = 0; i < oct; i++) { t += currentNoise3D(x * f, y * f, z * f) * a; maxA += a; a *= pers; f *= lac; }
            return maxA === 0 ? 0 : t / maxA;
        };

        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u_norm = x_px / width; const v_norm = y_px / height; 
                const phi = u_norm * 2 * Math.PI; const theta = v_norm * Math.PI; 

                let pX = Math.sin(theta) * Math.cos(phi); 
                let pY = Math.sin(theta) * Math.sin(phi);
                let pZ = Math.cos(theta); 

                let r, g, b;

                if (options.isFrozenWorld) { // --- ICE WORLD ---
                    let iceVal = (fBm(pX, pY, pZ, baseFreq, octaves, persistence, lacunarity) + 1) / 2; // Base ice variation
                    let crackVal = (fBm(pX, pY, pZ, crackFreq, 3, 0.6, lacunarity) + 1) / 2; // For cracks
                    
                    r = iceBaseColor.r + (iceVal - 0.5) * 20;
                    g = iceBaseColor.g + (iceVal - 0.5) * 20;
                    b = iceBaseColor.b + (iceVal - 0.5) * 30;

                    // Add cracks
                    if (crackVal < 0.15) { // Threshold for cracks
                        const crackIntensity = (0.15 - crackVal) / 0.15;
                        r = r * (1 - crackIntensity) + iceCrackColor.r * crackIntensity;
                        g = g * (1 - crackIntensity) + iceCrackColor.g * crackIntensity;
                        b = b * (1 - crackIntensity) + iceCrackColor.b * crackIntensity;
                    }

                } else { // --- LIQUID OCEAN WORLD ---
                    // Domain warping for currents
                    const warpX = fBm(pX + 10, pY + 20, pZ + 30, baseFreq * 0.5, 3, 0.5, lacunarity) * 0.15 * options.planetRadius;
                    const warpY = fBm(pX + 40, pY + 50, pZ + 60, baseFreq * 0.5, 3, 0.5, lacunarity) * 0.15 * options.planetRadius;
                    
                    let depthVal = (fBm(pX + warpX, pY + warpY, pZ, baseFreq, octaves, persistence, lacunarity) + 1) / 2; // 0 (deep) to 1 (shallow)
                    let waveVal = (fBm(pX + warpX, pY + warpY, pZ, waveFreq, 3, 0.4, lacunarity) + 1) / 2; // For wave highlights

                    // Blend deep and shallow colors based on depth
                    const depthLerp = Math.pow(depthVal, 1.5);
                    r = deepColor.r * (1 - depthLerp) + shallowColor.r * depthLerp;
                    g = deepColor.g * (1 - depthLerp) + shallowColor.g * depthLerp;
                    b = deepColor.b * (1 - depthLerp) + shallowColor.b * depthLerp;

                    // Add wave highlights
                    const highlightFactor = Math.pow(waveVal, 5.0) * 0.6; // Make highlights sharper and less common
                    if (waveVal > 0.8) {
                        r = r * (1 - highlightFactor) + waveHighlightColor.r * highlightFactor;
                        g = g * (1 - highlightFactor) + waveHighlightColor.g * highlightFactor;
                        b = b * (1 - highlightFactor) + waveHighlightColor.b * highlightFactor;
                    }
                }
                
                // Polar Ice Caps (can exist on liquid ocean worlds too)
                if (options.averageTemperature < 5) { // Threshold for caps on liquid worlds
                    const poleProximity = Math.abs(pZ); 
                    let iceInfluence = Math.max(0, (poleProximity - 0.65) / 0.35); 
                    iceInfluence = Math.pow(iceInfluence, 1.5);
                    if (iceInfluence > 0) {
                        r = r * (1 - iceInfluence) + iceBaseColor.r * iceInfluence;
                        g = g * (1 - iceInfluence) + iceBaseColor.g * iceInfluence;
                        b = b * (1 - iceInfluence) + iceBaseColor.b * iceInfluence;
                    }
                }
                
                ctx.fillStyle = `rgb(${Math.floor(Math.max(0,Math.min(255,r)))}, ${Math.floor(Math.max(0,Math.min(255,g)))}, ${Math.floor(Math.max(0,Math.min(255,b)))})`;
                ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        console.log(`Ocean Planet Texture Generated (Frozen: ${options.isFrozenWorld}).`);
        return canvas;
    } catch (error) {
        console.error(`Error in generateOceanPlanetTexture:`, error);
        return createErrorTexture("OceanTexFail", width, height);
    }
}


/** Main function to generate Ocean Planet data. */
export async function generate() {
    if (!noise3D) {
        try {
            const SimplexNoiseModule = await import('https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js');
            noise3D = SimplexNoiseModule.createNoise3D();
            console.log("SimplexNoise 3D loaded successfully for Ocean Planet.");
        } catch (e) {
            console.error("Failed to load SimplexNoise for Ocean Planet:", e);
            noise3D = () => Math.random() * 2 - 1; // Fallback
            alert("Critical error: Failed to load noise library. Planet textures will be very basic or fail.");
        }
    }

    const radiusEarthUnits = getRandomInRange(0.8, 2.0); 
    const massEarthUnits = Math.max(0.3, getRandomInRange(Math.pow(radiusEarthUnits, 2) * 0.5, Math.pow(radiusEarthUnits, 3) * 1.4 )); // Can be denser if mostly water/ice
    const EARTH_RADIUS_KM = 6371; const EARTH_MASS_KG = 5.972e24; const GRAVITATIONAL_CONSTANT_M3_KG_S2 = 6.67430e-11; const EARTH_GRAVITY_MS2 = 9.80665;
    const radiusKm = radiusEarthUnits * EARTH_RADIUS_KM; const massKg = massEarthUnits * EARTH_MASS_KG; const radiusM = radiusKm * 1000;
    const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3); const densityKgM3 = massKg / volumeM3;
    const densityGcm3 = densityKgM3 / 1000;
    const surfaceGravityMs2 = (GRAVITATIONAL_CONSTANT_M3_KG_S2 * massKg) / Math.pow(radiusM, 2);
    const surfaceGravityG = surfaceGravityMs2 / EARTH_GRAVITY_MS2; 
    const rotationPeriodHours = getRandomInRange(15, 60); 
    const orbitalPeriodDays = getRandomInRange(150, 1200); 
    const axialTiltDegrees = getRandomInRange(0, 40); 
    
    const averageTemperatureC = getRandomInRange(-100, 50); // Wide range, determining if frozen or liquid
    const isFrozenWorld = averageTemperatureC < getRandomInRange(-15, 0); // Threshold for being mostly ice
    const surfaceLiquidType = isFrozenWorld ? "Global Ice Sheet" : (averageTemperatureC > -5 ? "Liquid Water" : "Brine/Slush or Subsurface Ocean");

    // --- Atmosphere ---
    const atmosphereRoll = Math.random();
    let atmospherePresence = "None";
    let atmospherePressureAtm = 0; 
    let atmComposition = { N2: 0, O2: 0, H2O: 0, CO2: 0, Ar: 0, CH4: 0 };
    let weatherNotes = isFrozenWorld ? "Surface is a vast, frozen expanse." : "Global ocean dominates the climate.";

    if (isFrozenWorld && averageTemperatureC < -50 && Math.random() < 0.7) { // Very cold ice worlds might have tenuous or no atmosphere
        atmospherePresence = Math.random() < 0.5 ? "None" : "Trace";
        if (atmospherePresence === "Trace") atmospherePressureAtm = getRandomInRange(0.00001, 0.001);
    } else if (atmosphereRoll < 0.15 && !isFrozenWorld) { // Rare: No atmosphere on a liquid ocean world (unstable)
        atmospherePresence = "None";
    } else if (atmosphereRoll < 0.6) { // Thin to Moderate Atmosphere
        atmospherePresence = Math.random() < 0.5 ? "Thin" : "Moderate";
        atmospherePressureAtm = getRandomInRange(0.1, 1.5);
        atmComposition.N2 = getRandomInRange(60, 90);
        atmComposition.O2 = getRandomInRange(5, 25); // Possible if life evolved
        atmComposition.H2O = getRandomInRange(1, 10); // Water vapor
        atmComposition.Ar = getRandomInRange(0.5, 3);
        weatherNotes += ` ${atmospherePresence} atmosphere with significant water vapor, leading to global cloud cover and precipitation.`;
    } else { // Dense Atmosphere (less common for typical ocean worlds, more like a "water giant")
        atmospherePresence = "Dense";
        atmospherePressureAtm = getRandomInRange(1.5, 10);
        atmComposition.N2 = getRandomInRange(40, 70);
        atmComposition.H2O = getRandomInRange(5, 20);
        atmComposition.CO2 = getRandomInRange(5, 30);
        atmComposition.CH4 = getRandomInRange(1, 10); // Could give greenish/exotic hues
        weatherNotes += ` Dense, humid atmosphere with thick cloud layers and potentially extreme weather.`;
    }
    if (atmospherePressureAtm > 0) {
        let totalComp = Object.values(atmComposition).reduce((s, v) => s + v, 0); 
        if (totalComp > 0) for (const gas in atmComposition) atmComposition[gas] = (atmComposition[gas] / totalComp) * 100;
    }

    // --- Life Probability ---
    let probabilityOfLife = 0.0;
    if (!isFrozenWorld && atmospherePressureAtm > 0.05 && averageTemperatureC > -10 && averageTemperatureC < 60) {
        probabilityOfLife = getRandomInRange(0.3, 0.8); // Higher chance in liquid oceans
        if (atmComposition.O2 > 5) probabilityOfLife += 0.15;
    } else if (isFrozenWorld && averageTemperatureC > -80 && atmospherePressureAtm > 0.001) { // Life under ice?
        probabilityOfLife = getRandomInRange(0.01, 0.15);
    }

    // --- Moons Generation ---
    let moons = [];
    const maxPossibleMoons = 3; 
    let baseMoonChance = 0.15 + (massEarthUnits / 8); 
    for (let i = 0; i < maxPossibleMoons; i++) {
        if (Math.random() < baseMoonChance / (i + 1)) {
            const moonRadius = radiusEarthUnits * getRandomInRange(0.06, 0.22); 
            const moonOrbitalDistance = radiusEarthUnits * getRandomInRange(3.2, 7.5);
            const moonOrbitalSpeed = getRandomInRange(0.00025, 0.0011) / Math.sqrt(moonOrbitalDistance / radiusEarthUnits);
            const moonInitialAngle = Math.random() * 2 * Math.PI; const moonInclination = (Math.random() - 0.5) * Math.PI / 18; 
            const moonTexture = generateMoonTexture({ noise3D });
            if (moonTexture) { moons.push({ name: generateCelestialName(true, "Ocean Moon"), radius: moonRadius, orbitalDistance: moonOrbitalDistance, orbitalSpeed: moonOrbitalSpeed, initialAngle: moonInitialAngle, inclination: moonInclination, textureCanvasMoon: moonTexture, shininess: getRandomIntInRange(3, 15) }); }
        } else { break; }
    }

    const planetData = {
        general: { name: generateCelestialName(false, isFrozenWorld ? "Ice World" : "Ocean Planet"), type: isFrozenWorld ? "Ice World" : "Ocean Planet", mass: massEarthUnits, radius: radiusEarthUnits, density: densityGcm3, gravity: surfaceGravityG, rotationPeriod: rotationPeriodHours, orbitalPeriod: orbitalPeriodDays, axialTilt: axialTiltDegrees, },
        atmosphere: { presence: atmospherePresence, pressure: atmospherePressureAtm, composition: atmComposition, weatherNotes: weatherNotes, },
        surface: { averageTemperature: averageTemperatureC, surfaceLiquid: surfaceLiquidType, dominantTerrainFeatures: isFrozenWorld ? "Global ice sheets, possibly cracked or refrozen, minimal to no exposed land." : "Global ocean, possibly with scattered volcanic islands or archipelagos if any land exists.", isFrozen: isFrozenWorld },
        life: { probabilityOfLife: Math.min(1.0, probabilityOfLife), detectedIntelligentLife: false, }, 
        visuals: {
            radius: radiusEarthUnits,
            textureCanvasPlanet: generateOceanPlanetTexture({ noise3D, planetRadius: radiusEarthUnits, averageTemperatureC, isFrozenWorld }),
            textureCanvasCloud: (atmospherePressureAtm > 0.05 && !isFrozenWorld) ? generateCloudTexture({noise3D, atmosphereComposition: atmComposition}) : null,
            cloudOpacity: getRandomInRange(0.4, 0.75),
            cloudAltitude: radiusEarthUnits * getRandomInRange(0.01, 0.025),
            cloudRotationSpeed: (Math.random() - 0.5) * 0.0008,
            ringsData: null, 
            moons: moons,
            shininess: isFrozenWorld ? getRandomIntInRange(30, 80) : getRandomInRange(50, 120), // Ice is shiny, water too
        }
    };
    return planetData;
}
