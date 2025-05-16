// js/planet_types/lava_planet.js

let noise3D; // Will be initialized by dynamic import in generate()

/** Helper function to get a random floating-point number in a specified range. */
function getRandomInRange(min, max) { return Math.random() * (max - min) + min; }
/** Helper function to get a random integer in a specified range. */
function getRandomIntInRange(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }

/** Generates a procedural, somewhat plausible name for a planet or moon. */
function generateCelestialName(isMoon = false, planetType = "Planet") {
    const prefixes = isMoon ? ["Charon", "Styx", "Nix", "Hydra", "Kerberos", "Surtur", "Hephaestus"] :
                              ["Mustafar", "Sullust", "Char", "Crematoria", "Inferno", "Pyros", "Vulcanus", "Magmar", "Obsidia", "Helios Prime", "Forge", "Cinder"];
    const midfixes = isMoon ? ["Minor", "Parva", "Rock", "Ash", "Ember"] :
                              ["Secundus", "Prime", "Infernalis", "Volcanis", "Magmaticus", "Obsidian", "Furnace"];
    const suffixes = isMoon ? ["I", "II", "Shard", "Fragment", "Cinderling"] :
                              ["Major", "Minor", "Expanse", "Wastes", "Caldera", "Reach", "Outpost", "Point", "Inferno", "Forge", "Heart", "Core"];
    const designation = isMoon ? [`${String.fromCharCode(65 + getRandomIntInRange(0, 25))}`] : [ `${String.fromCharCode(65 + getRandomIntInRange(0, 25))}${String.fromCharCode(65 + getRandomIntInRange(0, 25))}-${getRandomIntInRange(1000, 9999)}`, `Star ${getRandomIntInRange(100,999)} Volcanic`, `Sector ${getRandomIntInRange(1,100)}/${planetType}`];
    
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
        const baseGrey = getRandomIntInRange(50, 120); // Darker moons for lava planets
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

/** Generates a thin, hazy/ashy cloud texture for lava planets. */
function generateLavaPlanetCloudTexture(options = {}) {
    if (!options.noise3D) return createErrorTexture("NoLavaCloudNoise");
    const currentNoise3D = options.noise3D;
    try {
        const width = 1024; const height = 512;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("LavaCloudCtxFail");
        
        const baseAshColor = { r: getRandomIntInRange(40, 80), g: getRandomIntInRange(35, 70), b: getRandomIntInRange(30, 60) };
        const glowTint = hslToRgb(getRandomInRange(15,45)/360, 0.8, 0.55); // Orange/Yellow glow from surface

        const baseFreq = getRandomInRange(1.5, 3.0) / options.planetRadius;
        const detailFreq = baseFreq * getRandomInRange(4, 8);
        const octaves = 3; const persistence = 0.45; const lacunarity = 2.0;
        const coverageThreshold = getRandomInRange(0.5, 0.65);
        const densityPower = getRandomInRange(0.8, 1.5);

        const fBm = (x,y,z,f,o,p,l) => { let t=0,a=1,fr=f,mA=0; for(let i=0;i<o;i++){t+=currentNoise3D(x*fr,y*fr,z*fr)*a;mA+=a;a*=p;fr*=l;} return mA===0?0:t/mA;};

        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u = x_px / width; const v = y_px / height; const phi = u * 2 * Math.PI; const theta = v * Math.PI;
                const nx = Math.sin(theta) * Math.cos(phi); const ny = Math.sin(theta) * Math.sin(phi); const nz = Math.cos(theta);
                
                let mainNoise = (fBm(nx,ny,nz, baseFreq, octaves, persistence, lacunarity) + 1) / 2;
                let detailNoise = (fBm(nx,ny,nz, detailFreq, 2, 0.5, lacunarity) + 1) / 2;
                let combinedNoise = mainNoise * 0.7 + detailNoise * 0.3;

                let alpha = 0;
                if (combinedNoise > coverageThreshold) {
                    alpha = (combinedNoise - coverageThreshold) / (1.0 - coverageThreshold);
                    alpha = Math.pow(alpha, densityPower) * getRandomInRange(0.1, 0.35); // Very thin clouds/haze
                }

                if (alpha > 0.01) {
                    // Blend ash color with a hint of glow from below
                    const glowMix = Math.pow(combinedNoise, 2.0) * 0.2; // Stronger glow where haze is denser
                    const r = baseAshColor.r * (1-glowMix) + glowTint.r * glowMix;
                    const g = baseAshColor.g * (1-glowMix) + glowTint.g * glowMix;
                    const b = baseAshColor.b * (1-glowMix) + glowTint.b * glowMix;
                    ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha.toFixed(3)})`;
                    ctx.fillRect(x_px, y_px, 1, 1);
                }
            }
        }
        console.log(`Lava Planet Cloud/Haze Texture Generated.`); return canvas;
    } catch (error) { console.error("Error in generateLavaPlanetCloudTexture:", error); return createErrorTexture("LavaCloudFail");}
}


/**
 * Generates a procedural texture for a Lava Planet.
 * @param {object} options - Configuration options.
 * @returns {HTMLCanvasElement | null}
 */
function generateLavaPlanetTexture(options = {}) {
    if (!options.noise3D) return createErrorTexture("NoLavaNoise3D");
    const currentNoise3D = options.noise3D;

    try {
        const width = 1024; 
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return createErrorTexture("LavaCtxFail", width, height);

        // --- Color Palette for Lava Worlds ---
        const cooledRockColor = hslToRgb(getRandomInRange(0,30)/360, getRandomInRange(0.05,0.2), getRandomInRange(0.05,0.15)); // Dark greys, browns
        const coolingLavaColor = hslToRgb(getRandomInRange(0,30)/360, getRandomInRange(0.6,0.9), getRandomInRange(0.2,0.4)); // Dull reds, oranges
        const hotLavaColor = hslToRgb(getRandomInRange(25,50)/360, getRandomInRange(0.9,1.0), getRandomInRange(0.5,0.7));    // Bright oranges, yellows
        const superHotColor = hslToRgb(getRandomInRange(45,60)/360, 1.0, getRandomInRange(0.75,0.9)); // Brightest yellows, near white

        // --- Noise Parameters ---
        const baseFlowFreq = getRandomInRange(0.5, 1.2) / options.planetRadius; // Large scale lava flows / cooled regions
        const lavaDetailFreq = baseFlowFreq * getRandomInRange(3, 6);      // Details within lava flows
        const crackFreq = baseFlowFreq * getRandomInRange(8, 15);        // For glowing cracks
        const octaves = 4; 
        const persistence = 0.48;
        const lacunarity = 2.1;

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

                let polarFactor = Math.pow(Math.sin(theta), 0.2); // Less attenuation at poles for lava

                // --- Domain Warping for Lava Flow ---
                const warpStrength = 0.3 * options.planetRadius * polarFactor;
                const warpX = fBm(pX + 10, pY + 20, pZ + 30, baseFlowFreq * 0.5, 2, 0.5, lacunarity) * warpStrength;
                const warpY = fBm(pX + 40, pY + 50, pZ + 60, baseFlowFreq * 0.5, 2, 0.5, lacunarity) * warpStrength;
                
                const warpedPx = pX + warpX;
                const warpedPy = pY + warpY;

                // --- Determine Lava Temperature/State ---
                let lavaHeatVal = (fBm(warpedPx, warpedPy, pZ, baseFlowFreq, octaves, persistence, lacunarity) + 1) / 2; // 0 (cool) to 1 (hot)
                lavaHeatVal = Math.pow(lavaHeatVal, 1.8); // Increase contrast for hotter areas

                let r, g, b;

                if (lavaHeatVal < 0.3) { // Cooled Rock
                    r = cooledRockColor.r; g = cooledRockColor.g; b = cooledRockColor.b;
                } else if (lavaHeatVal < 0.65) { // Cooling Lava
                    const t = (lavaHeatVal - 0.3) / 0.35;
                    r = cooledRockColor.r * (1 - t) + coolingLavaColor.r * t;
                    g = cooledRockColor.g * (1 - t) + coolingLavaColor.g * t;
                    b = cooledRockColor.b * (1 - t) + coolingLavaColor.b * t;
                } else if (lavaHeatVal < 0.9) { // Hot Lava
                    const t = (lavaHeatVal - 0.65) / 0.25;
                    r = coolingLavaColor.r * (1 - t) + hotLavaColor.r * t;
                    g = coolingLavaColor.g * (1 - t) + hotLavaColor.g * t;
                    b = coolingLavaColor.b * (1 - t) + hotLavaColor.b * t;
                } else { // Super Hot Lava / Fissures
                    const t = (lavaHeatVal - 0.9) / 0.1;
                    r = hotLavaColor.r * (1 - t) + superHotColor.r * t;
                    g = hotLavaColor.g * (1 - t) + superHotColor.g * t;
                    b = hotLavaColor.b * (1 - t) + superHotColor.b * t;
                }
                
                // Add some texture/detail within lava flows
                let lavaDetailVal = (fBm(warpedPx, warpedPy, pZ, lavaDetailFreq, 3, 0.4, lacunarity) + 1) / 2;
                const detailMod = (lavaDetailVal - 0.5) * 40 * (lavaHeatVal > 0.5 ? 1 : 0.3); // More detail on hotter parts
                r += detailMod; g += detailMod; b += detailMod * 0.8;

                // Glowing Cracks (superimposed, more intense on cooler areas where contrast is higher)
                let crackVal = (fBm(pX, pY, pZ, crackFreq, 2, 0.6, lacunarity) + 1) / 2;
                crackVal = 1.0 - Math.abs(crackVal - 0.5) * 2.0; // Creates thin lines from noise ridges
                crackVal = Math.pow(crackVal, 8.0); // Make cracks very sharp and sparse
                
                if (crackVal > 0.3) {
                    const crackIntensity = (crackVal - 0.3) / 0.7 * (1.0 - lavaHeatVal * 0.8); // Cracks more visible on cooler rock
                    r = r * (1 - crackIntensity) + superHotColor.r * crackIntensity * 1.2; // Cracks are super hot
                    g = g * (1 - crackIntensity) + superHotColor.g * crackIntensity * 1.2;
                    b = b * (1 - crackIntensity) + superHotColor.b * crackIntensity * 0.8; // Less blue in cracks
                }
                
                ctx.fillStyle = `rgb(${Math.floor(Math.max(0,Math.min(255,r)))}, ${Math.floor(Math.max(0,Math.min(255,g)))}, ${Math.floor(Math.max(0,Math.min(255,b)))})`;
                ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        console.log(`Lava Planet Texture Generated.`);
        return canvas;
    } catch (error) {
        console.error(`Error in generateLavaPlanetTexture:`, error);
        return createErrorTexture("LavaTexFail", width, height);
    }
}


/** Main function to generate Lava Planet data. */
export async function generate() {
    if (!noise3D) {
        try {
            const SimplexNoiseModule = await import('https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js');
            noise3D = SimplexNoiseModule.createNoise3D();
            console.log("SimplexNoise 3D loaded successfully for Lava Planet.");
        } catch (e) {
            console.error("Failed to load SimplexNoise for Lava Planet:", e);
            noise3D = () => Math.random() * 2 - 1; 
            alert("Critical error: Failed to load noise library. Planet textures will be very basic or fail.");
        }
    }

    const radiusEarthUnits = getRandomInRange(0.5, 1.8); 
    const massEarthUnits = Math.max(0.1, getRandomInRange(Math.pow(radiusEarthUnits, 2) * 0.6, Math.pow(radiusEarthUnits, 3) * 1.5 )); // Can be dense
    const EARTH_RADIUS_KM = 6371; const EARTH_MASS_KG = 5.972e24; const GRAVITATIONAL_CONSTANT_M3_KG_S2 = 6.67430e-11; const EARTH_GRAVITY_MS2 = 9.80665;
    const radiusKm = radiusEarthUnits * EARTH_RADIUS_KM; const massKg = massEarthUnits * EARTH_MASS_KG; const radiusM = radiusKm * 1000;
    const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3); const densityKgM3 = massKg / volumeM3;
    const densityGcm3 = densityKgM3 / 1000;
    const surfaceGravityMs2 = (GRAVITATIONAL_CONSTANT_M3_KG_S2 * massKg) / Math.pow(radiusM, 2);
    const surfaceGravityG = surfaceGravityMs2 / EARTH_GRAVITY_MS2; 
    const rotationPeriodHours = getRandomInRange(20, 200); // Can be slow or fast due to tidal forces or formation
    const orbitalPeriodDays = getRandomInRange(10, 500); // Often close to their star
    const axialTiltDegrees = getRandomInRange(0, 20); // Often low tilt if tidally locked or young
    
    const averageTemperatureC = getRandomInRange(700, 2500); // Extremely hot

    // --- Atmosphere ---
    const atmosphereRoll = Math.random();
    let atmospherePresence = "None";
    let atmospherePressureAtm = 0; 
    let atmComposition = { SO2: 0, CO2: 0, N2: 0, OtherVolatiles: 0 }; // Sulfur dioxide, Carbon dioxide
    let weatherNotes = "Extreme surface temperatures, constant volcanic activity.";

    if (atmosphereRoll < 0.4) { // Often thin or no atmosphere if small and hot
        atmospherePresence = "None";
    } else if (atmosphereRoll < 0.9) { 
        atmospherePresence = "Thin";
        atmospherePressureAtm = getRandomInRange(0.001, 0.5);
        atmComposition.SO2 = getRandomInRange(30, 70);
        atmComposition.CO2 = getRandomInRange(20, 50);
        atmComposition.N2 = getRandomInRange(5, 20);
        atmComposition.OtherVolatiles = getRandomInRange(1, 10);
        weatherNotes += ` Thin, toxic atmosphere dominated by volcanic outgassing. Possible sulfurous haze.`;
    } else { 
        atmospherePresence = "Trace";
        atmospherePressureAtm = getRandomInRange(0.00001, 0.001);
        atmComposition.SO2 = getRandomInRange(50, 80);
        atmComposition.CO2 = getRandomInRange(10, 30);
        weatherNotes += ` Extremely tenuous atmosphere of volcanic gases.`;
    }
    if (atmospherePressureAtm > 0) {
        let totalComp = Object.values(atmComposition).reduce((s, v) => s + v, 0); 
        if (totalComp > 0) for (const gas in atmComposition) atmComposition[gas] = (atmComposition[gas] / totalComp) * 100;
    }

    // --- Life Probability (practically zero for lava worlds as we know life) ---
    const probabilityOfLife = getRandomInRange(0.000001, 0.0001); 

    // --- Moons Generation (less likely, often captured asteroids or debris) ---
    let moons = [];
    const maxPossibleMoons = 1; 
    let baseMoonChance = 0.02 + (massEarthUnits / 20); 
    if (Math.random() < baseMoonChance) {
        const moonRadius = radiusEarthUnits * getRandomInRange(0.03, 0.15); 
        const moonOrbitalDistance = radiusEarthUnits * getRandomInRange(2.5, 6.0);
        const moonOrbitalSpeed = getRandomInRange(0.0004, 0.0015) / Math.sqrt(moonOrbitalDistance / radiusEarthUnits);
        const moonInitialAngle = Math.random() * 2 * Math.PI; const moonInclination = (Math.random() - 0.5) * Math.PI / 25; 
        const moonTexture = generateMoonTexture({ noise3D }); // Moons would likely be barren rock
        if (moonTexture) { moons.push({ name: generateCelestialName(true, "Lava Moon"), radius: moonRadius, orbitalDistance: moonOrbitalDistance, orbitalSpeed: moonOrbitalSpeed, initialAngle: moonInitialAngle, inclination: moonInclination, textureCanvasMoon: moonTexture, shininess: getRandomIntInRange(1, 8) }); }
    }

    const planetData = {
        general: { name: generateCelestialName(false, "Lava Planet"), type: "Lava", mass: massEarthUnits, radius: radiusEarthUnits, density: densityGcm3, gravity: surfaceGravityG, rotationPeriod: rotationPeriodHours, orbitalPeriod: orbitalPeriodDays, axialTilt: axialTiltDegrees, },
        atmosphere: { presence: atmospherePresence, pressure: atmospherePressureAtm, composition: atmComposition, weatherNotes: weatherNotes, },
        surface: { averageTemperature: averageTemperatureC, surfaceLiquid: "Molten Rock/Metal", dominantTerrainFeatures: "Vast lava plains, active volcanoes, fissure eruptions, cooling rock formations.", isFrozen: false }, // isFrozen is not applicable
        life: { probabilityOfLife: probabilityOfLife, detectedIntelligentLife: false, }, 
        visuals: {
            radius: radiusEarthUnits,
            textureCanvasPlanet: generateLavaPlanetTexture({ noise3D, planetRadius: radiusEarthUnits }),
            textureCanvasCloud: (atmospherePressureAtm > 0.01) ? generateLavaPlanetCloudTexture({noise3D, planetRadius: radiusEarthUnits, atmosphereComposition: atmComposition}) : null,
            cloudOpacity: getRandomInRange(0.1, 0.4), // Hazy clouds are thin
            cloudAltitude: radiusEarthUnits * getRandomInRange(0.005, 0.015), // Low lying haze/smog
            cloudRotationSpeed: (Math.random() - 0.5) * 0.0005,
            ringsData: null, 
            moons: moons,
            shininess: getRandomInRange(10, 40), // Molten areas can be shiny, cooled rock less so
            // Potentially add emissive properties later if we use a material that supports it
        }
    };
    return planetData;
}
