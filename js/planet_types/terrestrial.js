// js/planet_types/terrestrial.js

let noise3D; // Will be initialized by dynamic import in generate()

/** Helper function to get a random floating-point number in a specified range. */
function getRandomInRange(min, max) { return Math.random() * (max - min) + min; }
/** Helper function to get a random integer in a specified range. */
function getRandomIntInRange(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }

/** Generates a procedural, somewhat plausible name for a planet or moon. */
function generateCelestialName(isMoon = false, planetType = "Planet") {
    const prefixes = isMoon ? ["Luna", "Phobos", "Deimos", "Charon", "Nix", "Hydra"] :
                              ["Terra", "Kepler", "Nova", "Solara", "Gliese", "Xylos", "Zeta", "Aria", "Orion", "Cygnus", "Helios", "Rhea", "Baal", "Kryptos", "Seraph", "Typhon", "Argos", "Zephyr", "Panthea", "Chronos", "Gaia", "Tellus"];
    const midfixes = isMoon ? ["Minor", "Parva", "Rock"] :
                              ["Major", "Prime", "Secundus", "Proxima", "Centauri", "Draconis", "Sigma", "Ultima", "Nova", "Veridia", "Aquaria"];
    const suffixes = isMoon ? ["I", "II", "Shard", "Fragment"] :
                              ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Colony", "Prospect", "Haven", "Reach", "Expanse", "Station", "Orbital", "Prime", "IV", "VII", "IX", "Point", "Landing", "World", "Garden"];
    const designation = isMoon ? [`${String.fromCharCode(65 + getRandomIntInRange(0, 25))}`] : [ `${String.fromCharCode(65 + getRandomIntInRange(0, 25))}${String.fromCharCode(65 + getRandomIntInRange(0, 25))}-${getRandomIntInRange(1000, 9999)}`, `Star ${getRandomIntInRange(100,999)} Terra`, `Sector ${getRandomIntInRange(1,100)}/${planetType}`];
    
    let name = prefixes[getRandomIntInRange(0, prefixes.length - 1)];
    if (Math.random() < (isMoon ? 0.3 : 0.7)) { name += ` ${midfixes[getRandomIntInRange(0, midfixes.length - 1)]}`; }
    if (!isMoon || Math.random() < 0.6) { name += ` ${suffixes[getRandomIntInRange(0, suffixes.length - 1)]}`; }
    if (Math.random() < (isMoon ? 0.25 : 0.8)) { name += ` (${designation[getRandomIntInRange(0, designation.length-1)]})`;}
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

/** Generates a cloud texture */
function generateCloudTexture(options = {}) {
    if (!options.noise3D) return createErrorTexture("NoCloudNoise");
    const currentNoise3D = options.noise3D;
    try {
        const width = 1024; const height = 512;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("CloudCtxFail");
        let cloudBaseR = getRandomIntInRange(220, 255); let cloudBaseG = getRandomIntInRange(220, 255); let cloudBaseB = getRandomIntInRange(220, 255);
        if (options.atmosphereComposition) { if (options.atmosphereComposition.CH4 > 5) { cloudBaseR = Math.min(255, cloudBaseR + 10); cloudBaseG = Math.min(255, cloudBaseG + 5); cloudBaseB = Math.max(0, cloudBaseB - 10); } }
        const baseCloudFrequency = getRandomInRange(1.5, 3.0); const detailCloudFrequency = getRandomInRange(5.0, 10.0);
        const octaves = getRandomIntInRange(4, 6); const persistence = getRandomInRange(0.45, 0.55); const lacunarity = 2.0;
        const cloudCoverageThreshold = getRandomInRange(0.45, 0.6); const cloudDensityPower = getRandomInRange(1.0, 2.0);
        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u = x_px / width; const v = y_px / height; const phi = u * 2 * Math.PI; const theta = v * Math.PI;
                const nx = Math.sin(theta) * Math.cos(phi); const ny = Math.sin(theta) * Math.sin(phi); const nz = Math.cos(theta);
                let noiseValBase = 0; let ampBase = 1.0; let freqBase = baseCloudFrequency; let maxAmpBase = 0;
                for (let i = 0; i < octaves; i++) { noiseValBase += currentNoise3D(nx * freqBase, ny * freqBase, nz * freqBase) * ampBase; maxAmpBase += ampBase; ampBase *= persistence; freqBase *= lacunarity; }
                if (maxAmpBase === 0) maxAmpBase = 1; noiseValBase = (noiseValBase / maxAmpBase + 1) / 2;
                let noiseValDetail = 0; let ampDetail = 0.5; let freqDetail = detailCloudFrequency; let maxAmpDetail = 0;
                for (let i = 0; i < octaves -1 ; i++) { noiseValDetail += currentNoise3D(nx * freqDetail + 10, ny * freqDetail + 20, nz * freqDetail + 30) * ampDetail; maxAmpDetail += ampDetail; ampDetail *= persistence; freqDetail *= lacunarity; }
                if (maxAmpDetail === 0) maxAmpDetail = 1; noiseValDetail = (noiseValDetail / maxAmpDetail + 1) / 2;
                let combinedNoise = noiseValBase * 0.7 + noiseValDetail * 0.3; combinedNoise = Math.max(0, Math.min(1, combinedNoise));
                let alpha = 0;
                if (combinedNoise > cloudCoverageThreshold) { alpha = (combinedNoise - cloudCoverageThreshold) / (1.0 - cloudCoverageThreshold); alpha = Math.pow(alpha, cloudDensityPower); alpha = Math.min(alpha * getRandomInRange(0.6, 0.95), 0.9); }
                if (alpha > 0.01) { const variation = (currentNoise3D(nx * freqDetail * 2, ny * freqDetail * 2, nz * freqDetail * 2) + 1) * 0.5 * 15; ctx.fillStyle = `rgba(${Math.floor(Math.min(255,cloudBaseR + variation))}, ${Math.floor(Math.min(255,cloudBaseG + variation))}, ${Math.floor(Math.min(255,cloudBaseB + variation))}, ${alpha.toFixed(3)})`; ctx.fillRect(x_px, y_px, 1, 1); }
            }
        }
        console.log(`Cloud Texture Generated for Terrestrial Planet.`); return canvas;
    } catch (error) { console.error("Error within generateCloudTexture:", error); return createErrorTexture("CloudGenFailTerran");}
}


/**
 * Generates a procedural texture for a terrestrial planet using 3D Simplex noise.
 * V3: Enhanced color variety for land and water.
 * @param {object} options - Configuration options.
 * @returns {HTMLCanvasElement | null}
 */
function generateTerrestrialTexture(options = {}) {
    if (!options.noise3D) {
        console.error("generateTerrestrialTexture: 3D Noise function not provided!");
        return createErrorTexture("NoTerranNoise3D");
    }
    const currentNoise3D = options.noise3D;

    const width = 1024; 
    const height = 512;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return createErrorTexture("TerranCtxFail", width, height);

        // --- Enhanced Color Palette ---
        // Water Colors
        const waterHue = getRandomInRange(160, 270); // Blues (200-260), Teals (160-200), slight Purples (250-270)
        const waterSaturation = getRandomInRange(0.5, 0.9);
        const waterDeepL = getRandomInRange(0.15, 0.35);
        const waterShallowL = getRandomInRange(0.35, 0.6);
        const waterDeepColor = hslToRgb(waterHue/360, waterSaturation, waterDeepL);
        const waterShallowColor = hslToRgb((waterHue + getRandomInRange(-10, 10))/360, waterSaturation * getRandomInRange(0.8, 1.0), waterShallowL);
        
        // Land Color Themes
        let landLowColor, landHighColor, mountainPeakColor;
        const landThemeRoll = Math.random();

        if (landThemeRoll < 0.4) { // Earth-like Verdant
            landLowColor = hslToRgb(getRandomInRange(70,130)/360, getRandomInRange(0.3,0.6), getRandomInRange(0.25,0.4)); // Greens, dark greens, some browns
            landHighColor = hslToRgb(getRandomInRange(30,70)/360, getRandomInRange(0.2,0.5), getRandomInRange(0.4,0.6));  // Lighter browns, yellows, greys
            mountainPeakColor = hslToRgb(getRandomInRange(30,70)/360, getRandomInRange(0.05,0.2), getRandomInRange(0.65,0.85)); // Grey/Brownish peaks, or snowy
        } else if (landThemeRoll < 0.7) { // Arid/Ochre
            landLowColor = hslToRgb(getRandomInRange(20,50)/360, getRandomInRange(0.5,0.8), getRandomInRange(0.3,0.5)); // Oranges, browns
            landHighColor = hslToRgb(getRandomInRange(30,60)/360, getRandomInRange(0.4,0.7), getRandomInRange(0.5,0.7));  // Lighter oranges, yellows
            mountainPeakColor = hslToRgb(getRandomInRange(25,55)/360, getRandomInRange(0.2,0.4), getRandomInRange(0.6,0.8)); // Sandy/Light rock peaks
        } else if (landThemeRoll < 0.9) { // Rocky/Barren Grey
            landLowColor = hslToRgb(getRandomInRange(0,360), getRandomInRange(0.0,0.15), getRandomInRange(0.2,0.4)); // Greys, dark greys
            landHighColor = hslToRgb(getRandomInRange(0,360), getRandomInRange(0.0,0.1), getRandomInRange(0.4,0.6));  // Lighter greys
            mountainPeakColor = hslToRgb(getRandomInRange(0,360), getRandomInRange(0.0,0.05), getRandomInRange(0.7,0.9)); // Very light grey/white peaks
        } else { // Exotic (e.g., purplish, reddish, unusual greens)
            const exoticHue = getRandomInRange(0,360);
            landLowColor = hslToRgb(exoticHue/360, getRandomInRange(0.3,0.6), getRandomInRange(0.25,0.4));
            landHighColor = hslToRgb((exoticHue + getRandomInRange(-20,20))/360, getRandomInRange(0.2,0.5), getRandomInRange(0.45,0.65));
            mountainPeakColor = hslToRgb((exoticHue + getRandomInRange(-10,10))/360, getRandomInRange(0.1,0.3), getRandomInRange(0.65,0.85));
        }
        
        const iceCapColor = { r: 235, g: 240, b: 250 }; // Slightly bluer ice for better contrast

        // --- Noise Parameters (kept for larger continents) ---
        const baseFrequency = getRandomInRange(0.6, 1.2) / options.planetRadius; 
        const detailFrequency = baseFrequency * getRandomInRange(4, 7);
        const mountainFrequency = baseFrequency * getRandomInRange(2, 4);
        
        const octaves = getRandomIntInRange(4, 5); 
        const persistence = getRandomInRange(0.45, 0.52); 
        const lacunarity = 2.0;
        
        const landThreshold = 0.5 + (0.5 - (options.landBias || 0.55)) * 0.3; 
        const landPower = getRandomInRange(1.2, 2.0); 

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

                let polarFactor = Math.pow(Math.sin(theta), 0.25); 

                let elevationNoise = (fBm(pX, pY, pZ, baseFrequency, octaves, persistence, lacunarity) + 1) / 2; 
                elevationNoise = Math.pow(elevationNoise, landPower); 

                let r, g, b;

                if (elevationNoise > landThreshold) { // Land
                    let landHeight = (elevationNoise - landThreshold) / (1.0 - landThreshold); 
                    let mountainVal = (fBm(pX,pY,pZ, mountainFrequency, 3, 0.55, lacunarity) + 1) / 2;
                    mountainVal = Math.pow(mountainVal, 1.8) * polarFactor; 
                    let mountainMix = Math.min(1, landHeight * 1.5 + mountainVal * 0.8); 

                    r = landLowColor.r * (1 - mountainMix) + landHighColor.r * mountainMix;
                    g = landLowColor.g * (1 - mountainMix) + landHighColor.g * mountainMix;
                    b = landLowColor.b * (1 - mountainMix) + landHighColor.b * mountainMix;

                    if (mountainMix > 0.7 && landHeight > 0.6) { 
                        const peakMix = Math.min(1, (mountainMix - 0.7) / 0.3);
                        r = r * (1-peakMix) + mountainPeakColor.r * peakMix;
                        g = g * (1-peakMix) + mountainPeakColor.g * peakMix;
                        b = b * (1-peakMix) + mountainPeakColor.b * peakMix;
                    }
                    let landDetail = (fBm(pX,pY,pZ, detailFrequency, 2, 0.4, lacunarity)) * 20 * polarFactor;
                    r += landDetail; g += landDetail; b += landDetail;

                } else { // Water
                    let waterDepth = (landThreshold - elevationNoise) / landThreshold; 
                    waterDepth = Math.pow(waterDepth, 0.8); 
                    
                    r = waterShallowColor.r * (1 - waterDepth) + waterDeepColor.r * waterDepth;
                    g = waterShallowColor.g * (1 - waterDepth) + waterDeepColor.g * waterDepth;
                    b = waterShallowColor.b * (1 - waterDepth) + waterDeepColor.b * waterDepth;
                }
                
                if (options.hasIceCaps && options.averageTemperature < 0) {
                    const poleProximity = Math.abs(pZ); 
                    let iceInfluence = Math.max(0, (poleProximity - 0.7) / 0.3); 
                    iceInfluence = Math.pow(iceInfluence, 1.8);
                    if (iceInfluence > 0) {
                        r = r * (1 - iceInfluence) + iceCapColor.r * iceInfluence;
                        g = g * (1 - iceInfluence) + iceCapColor.g * iceInfluence;
                        b = b * (1 - iceInfluence) + iceCapColor.b * iceInfluence;
                    }
                }
                
                ctx.fillStyle = `rgb(${Math.floor(Math.max(0,Math.min(255,r)))}, ${Math.floor(Math.max(0,Math.min(255,g)))}, ${Math.floor(Math.max(0,Math.min(255,b)))})`;
                ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        console.log(`Terrestrial Texture (V3 Color Variety) Generated.`);
        return canvas;
    } catch (error) {
        console.error(`Error in generateTerrestrialTexture:`, error);
        return createErrorTexture("TerranTexFail", width, height);
    }
}


/** Main function to generate Terrestrial Planet data. */
export async function generate() {
    if (!noise3D) {
        try {
            const SimplexNoiseModule = await import('https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js');
            noise3D = SimplexNoiseModule.createNoise3D();
            console.log("SimplexNoise 3D loaded successfully for Terrestrial Planet.");
        } catch (e) {
            console.error("Failed to load SimplexNoise for Terrestrial Planet:", e);
            noise3D = () => Math.random() * 2 - 1; 
            alert("Critical error: Failed to load noise library. Planet textures will be very basic or fail.");
        }
    }

    const radiusEarthUnits = getRandomInRange(0.7, 1.8); 
    const massEarthUnits = Math.max(0.3, getRandomInRange(Math.pow(radiusEarthUnits, 2) * 0.4, Math.pow(radiusEarthUnits, 3) * 1.2 ));
    const EARTH_RADIUS_KM = 6371; const EARTH_MASS_KG = 5.972e24; const GRAVITATIONAL_CONSTANT_M3_KG_S2 = 6.67430e-11; const EARTH_GRAVITY_MS2 = 9.80665;
    const radiusKm = radiusEarthUnits * EARTH_RADIUS_KM; const massKg = massEarthUnits * EARTH_MASS_KG; const radiusM = radiusKm * 1000;
    const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3); const densityKgM3 = massKg / volumeM3;
    const densityGcm3 = densityKgM3 / 1000;
    const surfaceGravityMs2 = (GRAVITATIONAL_CONSTANT_M3_KG_S2 * massKg) / Math.pow(radiusM, 2);
    const surfaceGravityG = surfaceGravityMs2 / EARTH_GRAVITY_MS2; 
    const rotationPeriodHours = getRandomInRange(10, 72); 
    const orbitalPeriodDays = getRandomInRange(150, 1200); 
    const axialTiltDegrees = getRandomInRange(0, 60); 
    
    const averageTemperatureC = getRandomInRange(-50, 60); 
    const hasLiquidWater = averageTemperatureC > -10 && averageTemperatureC < 90; 
    const landBiasForTexture = getRandomInRange(0.45, 0.65); 
    const hasIceCaps = averageTemperatureC < -15;


    const hasAtmosphere = Math.random() > 0.05; 
    let atmospherePresence = "None";
    let atmospherePressureAtm = 0; 
    let atmComposition = { N2: 0, O2: 0, CO2: 0, Ar: 0, CH4:0, H2O:0, Other: 0 };
    let weatherNotes = "No significant weather patterns.";

    if (hasAtmosphere) {
        atmospherePressureAtm = getRandomInRange(0.01, 3.0); 
        if (atmospherePressureAtm < 0.1) atmospherePresence = "Trace";
        else if (atmospherePressureAtm < 0.5) atmospherePresence = "Thin";
        else atmospherePresence = "Moderate";
        if (atmospherePressureAtm > 2.0) atmospherePresence = "Dense";


        atmComposition = { N2: getRandomInRange(50, 90), CO2: getRandomInRange(1, 30), Ar: getRandomInRange(0.1, 5), CH4: getRandomInRange(0, 5), H2O: getRandomInRange(0, 5), Other: getRandomInRange(0.1, 2) };
        if (hasLiquidWater && averageTemperatureC > 0 && averageTemperatureC < 50 && atmospherePressureAtm > 0.5) { atmComposition.O2 = getRandomInRange(0, 25); } 
        else { atmComposition.O2 = getRandomInRange(0, 1); }
        
        let totalComposition = Object.values(atmComposition).reduce((sum, val) => sum + val, 0);
        if (totalComposition > 0) { for (const gas in atmComposition) { atmComposition[gas] = (atmComposition[gas] / totalComposition) * 100; if (atmComposition[gas] < 0.01 && atmComposition[gas] > 0) atmComposition[gas] = 0.01; } }
        weatherNotes = `Avg Temp: ${averageTemperatureC.toFixed(0)}°C. Atmos: ${atmospherePresence}. ` + (atmospherePressureAtm > 1.5 ? "Frequent dynamic weather systems. " : atmospherePressureAtm > 0.5 ? "Moderate weather activity. " : "Calm, thin atmosphere. ") + (hasLiquidWater ? "Possible clouds and precipitation. " : "Likely dry conditions.");
    }

    let probabilityOfLife = 0.0;
    if (hasAtmosphere && atmospherePressureAtm > 0.2) { if (hasLiquidWater) probabilityOfLife += 0.4; if (averageTemperatureC > -20 && averageTemperatureC < 55) probabilityOfLife += 0.3; if (atmComposition.O2 > 1) probabilityOfLife += 0.1; if (atmComposition.CH4 > 0.5 && atmComposition.O2 < 1) probabilityOfLife += 0.05; }
    probabilityOfLife = Math.min(1.0, probabilityOfLife * getRandomInRange(0.7, 1.3)); 

    let moons = [];
    const maxPossibleMoons = 3; 
    let baseMoonChance = 0.1 + (massEarthUnits / 10); 
    for (let i = 0; i < maxPossibleMoons; i++) {
        if (Math.random() < baseMoonChance / (i + 1)) {
            const moonRadius = radiusEarthUnits * getRandomInRange(0.08, 0.25); 
            const cloudAltitude = radiusEarthUnits * 0.03; 
            const moonOrbitalDistance = radiusEarthUnits * getRandomInRange(3.5, 8.0) + cloudAltitude + moonRadius;
            const moonOrbitalSpeed = getRandomInRange(0.0002, 0.001) / Math.sqrt(moonOrbitalDistance / radiusEarthUnits);
            const moonInitialAngle = Math.random() * 2 * Math.PI; const moonInclination = (Math.random() - 0.5) * Math.PI / 18; 
            const moonTexture = generateMoonTexture({ noise3D });
            if (moonTexture) { moons.push({ name: generateCelestialName(true, "Terrestrial Moon"), radius: moonRadius, orbitalDistance: moonOrbitalDistance, orbitalSpeed: moonOrbitalSpeed, initialAngle: moonInitialAngle, inclination: moonInclination, textureCanvasMoon: moonTexture, shininess: getRandomIntInRange(2, 15) }); }
        } else { break; }
    }

    const planetData = {
        general: { name: generateCelestialName(false, "Terrestrial"), type: "Terrestrial", mass: massEarthUnits, radius: radiusEarthUnits, density: densityGcm3, gravity: surfaceGravityG, rotationPeriod: rotationPeriodHours, orbitalPeriod: orbitalPeriodDays, axialTilt: axialTiltDegrees, },
        atmosphere: { presence: atmospherePresence, pressure: atmospherePressureAtm, composition: atmComposition, weatherNotes: weatherNotes, },
        surface: { averageTemperature: averageTemperatureC, surfaceLiquid: hasLiquidWater ? (averageTemperatureC > 0 ? "Water (Liquid/Ice)" : "Ice") : "None/Trace", dominantTerrainFeatures: `Varied terrain including continents, islands, plains, and mountain ranges. ${hasLiquidWater ? "Oceans and lakes likely. " : "Surface likely dry or frozen. "}`, hasIceCaps: hasIceCaps },
        life: { probabilityOfLife: probabilityOfLife, detectedIntelligentLife: false, }, 
        visuals: {
            radius: radiusEarthUnits,
            textureCanvasPlanet: generateTerrestrialTexture({ noise3D, planetRadius: radiusEarthUnits, averageTemperatureC, landBias: landBiasForTexture, hasIceCaps }),
            textureCanvasCloud: (hasAtmosphere && atmospherePressureAtm > 0.05) ? generateCloudTexture({noise3D, atmosphereComposition: atmComposition}) : null,
            cloudOpacity: getRandomInRange(0.5, 0.85),
            cloudAltitude: radiusEarthUnits * getRandomInRange(0.015, 0.03),
            cloudRotationSpeed: (Math.random() - 0.5) * 0.001, 
            ringsData: null, 
            moons: moons,
            shininess: getRandomIntInRange(5, 40), 
        }
    };
    return planetData;
}
