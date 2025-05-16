// js/planet_types/desert_planet.js

let noise3D; // Will be initialized by dynamic import in generate()

/** Helper function to get a random floating-point number in a specified range. */
function getRandomInRange(min, max) { return Math.random() * (max - min) + min; }
/** Helper function to get a random integer in a specified range. */
function getRandomIntInRange(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }

/** Generates a procedural, somewhat plausible name for a planet or moon. */
function generateCelestialName(isMoon = false, planetType = "Planet") {
    const prefixes = isMoon ? ["Luna", "Phobos", "Deimos", "Charon", "Nix", "Hydra", "Kerberos", "Styx"] :
                              ["Arrakis", "Tatooine", "Jakku", "Kharak", "Arakis", "Geidi", "Salusa", "Barsoom", "Helghan", "Klendathu", "Vulcan", "Osiris", "Korriban"];
    const midfixes = isMoon ? ["Minor", "Parva", "Rock", "Dust"] :
                              ["Secundus", "Prime", "Desolata", "Rubicon", "Cinder", "Crag", "Dune"];
    const suffixes = isMoon ? ["I", "II", "Shard", "Fragment", "Chip"] :
                              ["Major", "Minor", "Expanse", "Wastes", "Badlands", "Reach", "Outpost", "Point", "Inferno", "Drought"];
    const designation = isMoon ? [`${String.fromCharCode(65 + getRandomIntInRange(0, 25))}`] : [ `${String.fromCharCode(65 + getRandomIntInRange(0, 25))}${String.fromCharCode(65 + getRandomIntInRange(0, 25))}-${getRandomIntInRange(1000, 9999)}`, `Star ${getRandomIntInRange(100,999)} Outlier`, `Sector ${getRandomIntInRange(1,100)}/${planetType}`];
    
    let name = prefixes[getRandomIntInRange(0, prefixes.length - 1)];
    if (Math.random() < (isMoon ? 0.3 : 0.6)) { name += ` ${midfixes[getRandomIntInRange(0, midfixes.length - 1)]}`; }
    if (!isMoon || Math.random() < 0.5) { name += ` ${suffixes[getRandomIntInRange(0, suffixes.length - 1)]}`; }
    if (Math.random() < (isMoon ? 0.2 : 0.7)) { name += ` (${designation[getRandomIntInRange(0, designation.length-1)]})`;}
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
function generateMoonTexture(options = {}) { 
    if (!options.noise3D) return createErrorTexture("NoMoonNoise3D");
    const currentNoise3D = options.noise3D;
    try {
        const width = 512; const height = 256;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("MoonCtxFail");
        const baseGrey = getRandomIntInRange(50, 120); 
        const craterColorDark = Math.max(0, baseGrey - getRandomIntInRange(20, 40));
        const craterColorLight = Math.min(255, baseGrey + getRandomIntInRange(10, 25));
        const baseFreq = getRandomInRange(3.0, 7.0); 
        const craterFreq = getRandomInRange(8.0, 20.0); 
        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u = x_px / width; const v = y_px / height; const phi_loop = u * 2 * Math.PI; const theta_loop = v * Math.PI; 
                const nx = Math.sin(theta_loop) * Math.cos(phi_loop); const ny = Math.sin(theta_loop) * Math.sin(phi_loop); const nz = Math.cos(theta_loop);
                let surfaceNoise = (currentNoise3D(nx * baseFreq, ny * baseFreq, nz * baseFreq) + 1) / 2; 
                let craterNoise = (currentNoise3D(nx * craterFreq + 50, ny * craterFreq + 50, nz * craterFreq + 50) + 1) / 2;
                let color = baseGrey + (surfaceNoise - 0.5) * 30; 
                if (craterNoise > 0.75) { color = craterColorLight * (craterNoise - 0.75) * 4.0 + color * (1 - (craterNoise - 0.75) * 4.0) ; } 
                else if (craterNoise < 0.20 && craterNoise > 0.05) { color = craterColorDark * (0.20 - craterNoise) * 5.0 + color * (1- (0.20 - craterNoise) * 5.0); }
                color = Math.max(0, Math.min(255, color)); ctx.fillStyle = `rgb(${Math.floor(color)}, ${Math.floor(color)}, ${Math.floor(color)})`; ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        return canvas;
    } catch (error) { console.error("Error in generateMoonTexture:", error); return createErrorTexture("MoonTexFail"); }
}

/** Generates a thin, hazy/ashy cloud texture for lava planets (can be adapted for dust clouds). */
function generateLavaPlanetCloudTexture(options = {}) { 
    if (!options.noise3D) return createErrorTexture("NoDustCloudNoise");
    const currentNoise3D = options.noise3D;
    try {
        const width = 1024; const height = 512;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("DustCloudCtxFail");
        
        const dustBaseColor = hslToRgb(getRandomInRange(25,45)/360, getRandomInRange(0.3,0.6), getRandomInRange(0.5,0.7)); 
        const dustHighlight = hslToRgb(getRandomInRange(30,50)/360, getRandomInRange(0.4,0.7), getRandomInRange(0.6,0.8));

        const baseFreq = getRandomInRange(1.0, 2.5) / options.planetRadius; 
        const detailFreq = baseFreq * getRandomInRange(3, 6);
        const octaves = 3; const persistence = 0.5; const lacunarity = 2.0;
        const coverageThreshold = getRandomInRange(0.55, 0.75); 
        const densityPower = getRandomInRange(0.7, 1.3);

        const fBm = (x,y,z,f,o,p,l) => { let t=0,a=1,fr=f,mA=0; for(let i=0;i<o;i++){t+=currentNoise3D(x*fr,y*fr,z*fr)*a;mA+=a;a*=p;fr*=l;} return mA===0?0:t/mA;};

        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u = x_px / width; const v = y_px / height; const phi = u * 2 * Math.PI; const theta = v * Math.PI;
                const nx = Math.sin(theta) * Math.cos(phi); const ny = Math.sin(theta) * Math.sin(phi); const nz = Math.cos(theta);
                
                let mainNoise = (fBm(nx,ny,nz, baseFreq, octaves, persistence, lacunarity) + 1) / 2;
                let detailNoise = (fBm(nx,ny,nz, detailFreq, 2, 0.5, lacunarity) + 1) / 2;
                let combinedNoise = mainNoise * 0.75 + detailNoise * 0.25;

                let alpha = 0;
                if (combinedNoise > coverageThreshold) {
                    alpha = (combinedNoise - coverageThreshold) / (1.0 - coverageThreshold);
                    alpha = Math.pow(alpha, densityPower) * getRandomInRange(0.05, 0.25); 
                }

                if (alpha > 0.01) {
                    const highlightMix = Math.pow(detailNoise, 2.0) * 0.3; 
                    const r = dustBaseColor.r * (1-highlightMix) + dustHighlight.r * highlightMix;
                    const g = dustBaseColor.g * (1-highlightMix) + dustHighlight.g * highlightMix;
                    const b = dustBaseColor.b * (1-highlightMix) + dustHighlight.b * highlightMix;
                    ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha.toFixed(3)})`;
                    ctx.fillRect(x_px, y_px, 1, 1);
                }
            }
        }
        console.log(`Desert Planet Dust Cloud Texture Generated.`); return canvas;
    } catch (error) { console.error("Error in generateLavaPlanetCloudTexture (used for Dust):", error); return createErrorTexture("DustCloudFail");}
}


/**
 * Generates a procedural texture for a Desert Planet.
 * @param {object} options - Configuration options.
 * @returns {HTMLCanvasElement | null}
 */
function generateDesertPlanetTexture(options = {}) {
    if (!options.noise3D) return createErrorTexture("NoDesertNoise3D");
    const currentNoise3D = options.noise3D;
    const width = 1024; 
    const height = 512;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return createErrorTexture("DesertCtxFail", width, height);

        const desertPalettes = [
            { dunesHigh: hslToRgb(getRandomInRange(35,50)/360, getRandomInRange(0.6,0.9), getRandomInRange(0.6,0.75)), dunesLow: hslToRgb(getRandomInRange(25,40)/360, getRandomInRange(0.7,1.0), getRandomInRange(0.4,0.55)), rockyPlains: hslToRgb(getRandomInRange(20,40)/360, getRandomInRange(0.2,0.5), getRandomInRange(0.3,0.5)), canyons: hslToRgb(getRandomInRange(10,30)/360, getRandomInRange(0.4,0.7), getRandomInRange(0.2,0.4)), },
            { dunesHigh: hslToRgb(getRandomInRange(5,20)/360, getRandomInRange(0.7,0.9), getRandomInRange(0.55,0.7)), dunesLow: hslToRgb(getRandomInRange(0,15)/360, getRandomInRange(0.8,1.0), getRandomInRange(0.35,0.5)), rockyPlains: hslToRgb(getRandomInRange(0,15)/360, getRandomInRange(0.3,0.6), getRandomInRange(0.25,0.45)), canyons: hslToRgb(getRandomInRange(350,360)/360, getRandomInRange(0.5,0.8), getRandomInRange(0.15,0.35)), },
            { dunesHigh: hslToRgb(getRandomInRange(40,60)/360, getRandomInRange(0.5,0.8), getRandomInRange(0.65,0.8)), dunesLow: hslToRgb(getRandomInRange(30,50)/360, getRandomInRange(0.2,0.4), getRandomInRange(0.3,0.45)), rockyPlains: hslToRgb(getRandomInRange(0,360), getRandomInRange(0.05,0.15), getRandomInRange(0.2,0.4)), canyons: hslToRgb(getRandomInRange(0,360), getRandomInRange(0.1,0.2), getRandomInRange(0.1,0.25)), }
        ];
        const palette = desertPalettes[getRandomIntInRange(0, desertPalettes.length - 1)];
        const iceCapColor = { r: 200, g: 200, b: 220 }; 

        const baseFreq = getRandomInRange(0.8, 2.0) / options.planetRadius; 
        const duneFreq = baseFreq * getRandomInRange(5, 10);       
        const rockyFreq = baseFreq * getRandomInRange(3, 6);       
        const canyonFreq = baseFreq * getRandomInRange(0.5, 1.5);    
        const octaves = 4; 
        const persistence = 0.45;
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
                let pX = Math.sin(theta) * Math.cos(phi); let pY = Math.sin(theta) * Math.sin(phi); let pZ = Math.cos(theta); 
                let polarFactor = Math.pow(Math.sin(theta), 0.3); 
                let terrainTypeNoise = (fBm(pX, pY, pZ, baseFreq, 3, 0.6, lacunarity) + 1) / 2; 
                terrainTypeNoise = Math.pow(terrainTypeNoise, 1.2); 
                let r, g, b;
                if (terrainTypeNoise < 0.45) { 
                    let duneVal = (fBm(pX, pY, pZ, duneFreq, octaves, persistence, lacunarity) + 1) / 2;
                    let warpU = fBm(pX + 10, pY + 10, pZ + 10, duneFreq * 0.2, 2, 0.5, lacunarity) * 0.3; 
                    duneVal = (fBm(pX + warpU * pY, pY - warpU * pX, pZ, duneFreq, octaves, persistence, lacunarity) + 1) / 2; 
                    duneVal = Math.pow(duneVal, 1.5); 
                    const lerpFactor = duneVal;
                    r = palette.dunesLow.r * (1 - lerpFactor) + palette.dunesHigh.r * lerpFactor;
                    g = palette.dunesLow.g * (1 - lerpFactor) + palette.dunesHigh.g * lerpFactor;
                    b = palette.dunesLow.b * (1 - lerpFactor) + palette.dunesHigh.b * lerpFactor;
                } else if (terrainTypeNoise < 0.8) { 
                    let rockVal = (fBm(pX, pY, pZ, rockyFreq, octaves -1, persistence, lacunarity) + 1) / 2;
                    let rockDetail = (fBm(pX, pY, pZ, rockyFreq * 3, 2, 0.4, lacunarity) + 1) / 2;
                    rockVal = rockVal * 0.7 + rockDetail * 0.3;
                    const lerpFactor = rockVal;
                    let c1 = palette.rockyPlains; let c2 = {r: c1.r+20, g: c1.g+10, b:c1.b+5}; 
                    r = c1.r * (1 - lerpFactor) + c2.r * lerpFactor; g = c1.g * (1 - lerpFactor) + c2.g * lerpFactor; b = c1.b * (1 - lerpFactor) + c2.b * lerpFactor;
                } else { 
                    let canyonVal = (fBm(pX, pY, pZ, canyonFreq, 2, 0.7, lacunarity) + 1) / 2; 
                    let canyonDepth = Math.pow(canyonVal, 2.5); 
                    r = palette.canyons.r * canyonDepth + palette.rockyPlains.r * (1-canyonDepth) * 0.5; 
                    g = palette.canyons.g * canyonDepth + palette.rockyPlains.g * (1-canyonDepth) * 0.5;
                    b = palette.canyons.b * canyonDepth + palette.rockyPlains.b * (1-canyonDepth) * 0.5;
                }
                r = r * polarFactor + 128 * (1 - polarFactor); g = g * polarFactor + 128 * (1 - polarFactor); b = b * polarFactor + 128 * (1 - polarFactor);
                if (options.hasIceCaps && options.averageTemperature < -30) {
                    const poleProximity = Math.abs(pZ); 
                    let iceInfluence = Math.max(0, (poleProximity - 0.75) / 0.25); 
                    iceInfluence = Math.pow(iceInfluence, 2.0);
                    if (iceInfluence > 0) { r = r * (1 - iceInfluence) + iceCapColor.r * iceInfluence; g = g * (1 - iceInfluence) + iceCapColor.g * iceInfluence; b = b * (1 - iceInfluence) + iceCapColor.b * iceInfluence; }
                }
                ctx.fillStyle = `rgb(${Math.floor(Math.max(0,Math.min(255,r)))}, ${Math.floor(Math.max(0,Math.min(255,g)))}, ${Math.floor(Math.max(0,Math.min(255,b)))})`;
                ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        console.log(`Desert Planet Texture Generated.`);
        return canvas;
    } catch (error) {
        console.error(`Error in generateDesertPlanetTexture:`, error);
        return createErrorTexture("DesertTexFail", width, height);
    }
}


/** Main function to generate Desert Planet data. */
export async function generate() {
    if (!noise3D) {
        try {
            const SimplexNoiseModule = await import('https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js');
            noise3D = SimplexNoiseModule.createNoise3D();
            console.log("SimplexNoise 3D loaded successfully for Desert Planet.");
        } catch (e) {
            console.error("Failed to load SimplexNoise for Desert Planet:", e);
            noise3D = () => Math.random() * 2 - 1; 
            alert("Critical error: Failed to load noise library. Planet textures will be very basic or fail.");
        }
    }

    const radiusEarthUnits = getRandomInRange(0.6, 1.5); 
    const massEarthUnits = Math.max(0.15, getRandomInRange(Math.pow(radiusEarthUnits, 2) * 0.4, Math.pow(radiusEarthUnits, 3) * 1.1 ));
    const EARTH_RADIUS_KM = 6371; const EARTH_MASS_KG = 5.972e24; const GRAVITATIONAL_CONSTANT_M3_KG_S2 = 6.67430e-11; const EARTH_GRAVITY_MS2 = 9.80665;
    const radiusKm = radiusEarthUnits * EARTH_RADIUS_KM; const massKg = massEarthUnits * EARTH_MASS_KG; const radiusM = radiusKm * 1000;
    const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3); const densityKgM3 = massKg / volumeM3;
    const densityGcm3 = densityKgM3 / 1000;
    const surfaceGravityMs2 = (GRAVITATIONAL_CONSTANT_M3_KG_S2 * massKg) / Math.pow(radiusM, 2);
    const surfaceGravityG = surfaceGravityMs2 / EARTH_GRAVITY_MS2; 
    const rotationPeriodHours = getRandomInRange(18, 150); 
    const orbitalPeriodDays = getRandomInRange(80, 1000); 
    const axialTiltDegrees = getRandomInRange(0, 50); 
    
    const averageTemperatureC = getRandomInRange(0, 150); // Adjusted temp: can be cold enough for some ice, or very hot
    const hasIceCaps = averageTemperatureC < 5 || (Math.random() < 0.3 && averageTemperatureC < 30); // Ice if cold, or small chance if cool

    const atmosphereRoll = Math.random();
    let atmospherePresence = "None";
    let atmospherePressureAtm = 0; 
    let atmComposition = { N2: 0, CO2: 0, Ar: 0, O2: 0, Dust: 0 };
    let weatherNotes = "Surface is barren and dry.";

    if (atmosphereRoll < 0.25) { // Increased chance of no atmosphere
        atmospherePresence = "None";
    } else if (atmosphereRoll < 0.85) { 
        atmospherePresence = "Thin";
        atmospherePressureAtm = getRandomInRange(0.001, 0.1); // Generally thinner
        atmComposition.N2 = getRandomInRange(30, 70);
        atmComposition.CO2 = getRandomInRange(20, 60); // Can be CO2 rich
        atmComposition.Ar = getRandomInRange(1, 15);
        atmComposition.Dust = getRandomInRange(10, 30); 
        weatherNotes = `Thin, dusty atmosphere. Temperatures fluctuate wildly. Frequent global or regional dust storms.`;
    } else { 
        atmospherePresence = "Trace";
        atmospherePressureAtm = getRandomInRange(0.00001, 0.001);
        atmComposition.CO2 = getRandomInRange(60, 98); 
        atmComposition.N2 = getRandomInRange(1, 20);
        atmComposition.Dust = getRandomInRange(1,15);
        weatherNotes = `Extremely tenuous atmosphere, primarily CO2. Surface heavily irradiated.`;
    }
    if (atmospherePressureAtm > 0) {
        let totalComp = Object.values(atmComposition).reduce((s, v) => s + v, 0); 
        if (totalComp > 0) for (const gas in atmComposition) atmComposition[gas] = (atmComposition[gas] / totalComp) * 100;
    }

    // --- Life Probability (Adjusted for Desert Planets) ---
    let probabilityOfLife = 0.0; // **Initialize to 0.0**
    // Conditions for potential life (e.g., some atmosphere, not too extreme temperatures)
    if (atmospherePressureAtm > 0.001 && averageTemperatureC > -25 && averageTemperatureC < 75) {
        // If conditions met, generate a probability between 0% and 10%
        probabilityOfLife = getRandomInRange(0.0, 0.10); 
    }
    // Add a very small chance even in slightly harsher conditions if a trace atmosphere exists
    // and temperature is not utterly extreme.
    else if (atmospherePressureAtm > 0.00005 && averageTemperatureC > -40 && averageTemperatureC < 90) {
        probabilityOfLife = getRandomInRange(0.0, 0.025); // Max 2.5%
    }
    // Ensure it's clamped and a number (though getRandomInRange should already handle the number part)
    probabilityOfLife = Math.max(0.0, Math.min(0.1, probabilityOfLife));


    let moons = [];
    const maxPossibleMoons = 2; 
    let baseMoonChance = 0.05 + (massEarthUnits / 15); 
    for (let i = 0; i < maxPossibleMoons; i++) {
        if (Math.random() < baseMoonChance / (i + 1)) {
            const moonRadius = radiusEarthUnits * getRandomInRange(0.05, 0.20); 
            const moonOrbitalDistance = radiusEarthUnits * getRandomInRange(3.0, 7.0);
            const moonOrbitalSpeed = getRandomInRange(0.0003, 0.0012) / Math.sqrt(moonOrbitalDistance / radiusEarthUnits);
            const moonInitialAngle = Math.random() * 2 * Math.PI; const moonInclination = (Math.random() - 0.5) * Math.PI / 20; 
            const moonTexture = generateMoonTexture({ noise3D });
            if (moonTexture) { moons.push({ name: generateCelestialName(true, "Desert Moon"), radius: moonRadius, orbitalDistance: moonOrbitalDistance, orbitalSpeed: moonOrbitalSpeed, initialAngle: moonInitialAngle, inclination: moonInclination, textureCanvasMoon: moonTexture, shininess: getRandomIntInRange(2, 10) }); }
        } else { break; }
    }

    const planetData = {
        general: { name: generateCelestialName(false, "Desert Planet"), type: "Desert", mass: massEarthUnits, radius: radiusEarthUnits, density: densityGcm3, gravity: surfaceGravityG, rotationPeriod: rotationPeriodHours, orbitalPeriod: orbitalPeriodDays, axialTilt: axialTiltDegrees, },
        atmosphere: { presence: atmospherePresence, pressure: atmospherePressureAtm, composition: atmComposition, weatherNotes: weatherNotes, },
        surface: { averageTemperature: averageTemperatureC, surfaceLiquid: "None or trace (subsurface ice possible if cold)", dominantTerrainFeatures: "Vast dune seas, rocky plains, canyons, impact craters.", hasIceCaps: hasIceCaps },
        life: { probabilityOfLife: probabilityOfLife, detectedIntelligentLife: false, }, 
        visuals: {
            radius: radiusEarthUnits,
            textureCanvasPlanet: generateDesertPlanetTexture({ noise3D, planetRadius: radiusEarthUnits, averageTemperatureC, hasIceCaps }),
            textureCanvasCloud: (atmospherePressureAtm > 0.005 && atmComposition.Dust > 5) ? generateLavaPlanetCloudTexture({noise3D, planetRadius: radiusEarthUnits, atmosphereComposition: atmComposition}) : null, 
            cloudOpacity: getRandomInRange(0.03, 0.18), // Dust clouds are very, very thin
            cloudAltitude: radiusEarthUnits * getRandomInRange(0.005, 0.015), 
            cloudRotationSpeed: (Math.random() - 0.5) * 0.0006,
            ringsData: null, 
            moons: moons,
            shininess: getRandomIntInRange(5, 25), 
        }
    };
    return planetData;
}
