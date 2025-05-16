# Random Planet Generator 
Embark on a journey through the cosmos with the Random Planet Generator! This web application procedurally generates unique fictional planets, renders them in interactive 3D, and allows you to attempt contact with their potential intelligent inhabitants through a Large Language Model (LLM) integration.

## Features

* **Procedural Planet Generation**: Creates diverse celestial bodies with unique characteristics. Supported types include:
    * Terrestrial Planets
    * Gas Giants
    * Desert Planets
    * Ocean Worlds (Liquid or Frozen)
    * Lava Planets
* **Interactive 3D Visualization**:
    * View generated planets in a dynamic 3D scene powered by three.js.
    * **Rotate** the planet by dragging with your mouse.
    * **Zoom** in and out using your mouse scroll wheel.
    * Visuals include procedurally generated textures for surfaces, clouds (if present), atmospheric haze, rings (for Gas Giants), and orbiting moons.
    * The planet's name is displayed above the visualization.
* **Detailed Planet Information**: A comprehensive table displays key properties of the generated planet, categorized into:
    * General (Name, Type, Mass, Radius, Density, Gravity, Rotation, Orbit, Axial Tilt)
    * Atmosphere (Presence, Pressure, Composition, Weather Notes)
    * Surface (Avg. Temperature, Surface Liquid, Dominant Terrain)
    * Life (Probability of Life, Detected Intelligent Life)
    * Moons (Number of moons, if any)
* **Intelligent Life Interaction (LLM-Powered)**:
    * **Attempt Contact**: If a planet has a sufficient probability of life, you can attempt to establish communication.
    * **LLM Integration**: Connects to Google's Gemini API (requires user-provided API key) to simulate conversation with an alien persona.
    * **Dynamic Persona**: The LLM adopts a persona based on the generated alien species' unique physical traits, cultural aspects, and individual personality.
    * **Chat Interface**: Communicate with the alien through a text-based chat.
    * **Gradual Information Reveal**: Learn about the alien species, their culture, and their homeworld (both its human designation and its native name) as you converse. Information is revealed through tagged responses from the LLM.
* **Alien Species Profile & Portrait**:
    * As you interact, information about the alien species (e.g., physical traits, cultural aspects, individual details) populates a dedicated "Alien Species Profile" tab.
    * A unique, procedurally generated **pixel art portrait** of the contacted alien is displayed and can be regenerated.
* **Alien Codex**:
    * Encountered and successfully contacted alien species are added to an "Alien Codex".
    * The codex displays a card for each species, showing their portrait and key revealed information (name, homeworld, body type, tech level, etc.).
* **Settings & Customization**:
    * **LLM API Key**: Input and save your Google Gemini API Key (stored locally in your browser). **This is required for the "Contact Life" feature.**
    * **Visual Settings**: Adjust the pixelation amount of the 3D planet rendering for an artistic effect.
    * **Session Data**: Save your current progress (generated planet, contact status, revealed information, and codex entries) to your browser's local storage. Load your last saved state or clear all saved data.

## How to Use

1.  **Open the Application**: Simply open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge). Or use the web version: https://francopirinoli.github.io/Random-Planet-Generator/

2.  **Generate a Planet**:
    * Upon loading, a random planet is generated automatically.
    * Click the "**Generate New Planet**" button to create a new celestial body.
    * Use the dropdown menu next to the button to select a specific planet type (e.g., "Terrestrial," "Gas Giant") or choose "Random Type" for a surprise.

3.  **Explore the Planet**:
    * **3D View**:
        * Left-click and drag on the "Planet Visualization" canvas to rotate the planet.
        * Use your mouse scroll wheel to zoom in and out.
    * **Planet Information**:
        * Refer to the "Planet Information" table on the right-hand side (or bottom on smaller screens) to see the detailed characteristics of the currently displayed planet.

4.  **Contacting Intelligent Life**:
    * **API Key Setup (Crucial First Step for Contact)**:
        * Click the **Settings icon** (gear symbol) in the header.
        * In the modal, find the "LLM Settings" section.
        * Enter your **Google Gemini API Key** into the input field.
        * Click "**Save Key**". The key is stored locally in your browser and is necessary to use the contact feature.
    * **Attempting Contact**:
        * If the "Planet Information" table shows a "Probability of Life" greater than a minimal threshold, the "**Attempt Contact**" button (below the planet info/controls sections) will become active.
        * Click this button to try and establish communication.
    * **Chatting with Aliens**:
        * If contact is successful:
            * The "Contact Intelligent Life" section will expand to show a chat interface.
            * An initial message from the system will indicate a connection.
            * The "Alien Species Profile" tab will appear, initially with a placeholder portrait and minimal information.
            * Type your messages into the input field at the bottom of the chat and click "**Send**" or press Enter.
            * Converse with the alien. As the LLM responds, it will reveal information about its species, culture, and itself. This information will dynamically populate the "Alien Species Profile" tab.
            * The alien's pixel art portrait will be generated and displayed. You can click "**New Portrait**" to generate a different visual interpretation based on the same species data.
        * If contact fails, a message will indicate that no response was received.

5.  **Alien Codex**:
    * Located below the planet visualization and controls.
    * Each time you successfully contact a new species and reveal their name, they are added as a card to the codex.
    * The codex card shows the alien's portrait and a summary of key information you've discovered about them.

6.  **Adjusting Settings**:
    * Click the **Settings icon** (gear symbol) in the header.
    * **Pixelation Amount**: Adjust the slider to change the pixelation effect on the 3D planet.
    * **Session Data**:
        * "**Save State**": Saves the current planet, any active alien contact (including chat history and revealed info), and the entire codex to your browser's local storage.
        * "**Load Last Save**": Loads the previously saved state.
        * "**Clear Saved Data**": Removes all saved data from local storage.

## Technical Overview

* **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+ Modules)
* **3D Rendering**: three.js (including OrbitControls for interaction and post-processing for pixelation)
* **Planet Generation**: Modular JavaScript files (`js/planet_types/`) for each planet type, using procedural generation techniques and Simplex Noise.
* **Alien Generation**:
    * Species characteristics: `js/alien_generator/alien_species.js` using `js/alien_generator/alien_random_tables.js`.
    * Portraits: `js/alien_generator/alien_portrait.js` generates pixel art Data URLs.
* **LLM Interaction**:
    * Client-side calls to the Google Gemini API via `fetch`.
    * Prompt engineering: `js/alien_generator/alien_llm.js` constructs system prompts to guide the LLM's persona.
* **No Backend**: The application is entirely client-side. API keys and session data are stored in the browser's local storage.
