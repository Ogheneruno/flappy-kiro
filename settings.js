// Settings Panel Controller
// Connects sliders to CONFIG values for live tuning

const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');

// Toggle panel visibility
settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
});

// Slider definitions: [sliderId, valueDisplayId, configKey, transform]
const sliders = [
    { id: 'gravitySlider', display: 'gravityVal', key: 'gravity', transform: v => parseFloat(v) },
    { id: 'jumpForceSlider', display: 'jumpForceVal', key: 'jumpForce', transform: v => -parseFloat(v) },
    { id: 'pipeGapSlider', display: 'pipeGapVal', key: 'pipeGap', transform: v => parseInt(v) },
    { id: 'pipeSpeedSlider', display: 'pipeSpeedVal', key: 'pipeSpeed', transform: v => parseFloat(v) },
    { id: 'pipeWidthSlider', display: 'pipeWidthVal', key: 'pipeWidth', transform: v => parseInt(v) },
    { id: 'spawnIntervalSlider', display: 'spawnIntervalVal', key: 'pipeSpawnInterval', transform: v => parseInt(v) },
    { id: 'ghostySizeSlider', display: 'ghostySizeVal', key: 'ghostySize', transform: v => parseInt(v) },
    { id: 'hitboxInsetSlider', display: 'hitboxInsetVal', key: 'hitboxInset', transform: v => parseInt(v) },
];

// Attach event listeners to all sliders and initialize display values
sliders.forEach(({ id, display, key, transform }) => {
    const slider = document.getElementById(id);
    const valueEl = document.getElementById(display);

    // Initialize display value from current slider value
    valueEl.textContent = slider.value;

    slider.addEventListener('input', () => {
        const rawValue = slider.value;
        valueEl.textContent = rawValue;
        CONFIG[key] = transform(rawValue);

        // Update ghosty size immediately if changed
        if (key === 'ghostySize') {
            ghosty.width = CONFIG.ghostySize;
            ghosty.height = CONFIG.ghostySize;
        }
    });
});

// Reset to defaults
const defaults = { ...CONFIG };

document.getElementById('resetDefaults').addEventListener('click', () => {
    Object.assign(CONFIG, defaults);

    // Update all sliders to reflect defaults
    document.getElementById('gravitySlider').value = defaults.gravity;
    document.getElementById('gravityVal').textContent = defaults.gravity;

    document.getElementById('jumpForceSlider').value = Math.abs(defaults.jumpForce);
    document.getElementById('jumpForceVal').textContent = Math.abs(defaults.jumpForce);

    document.getElementById('pipeGapSlider').value = defaults.pipeGap;
    document.getElementById('pipeGapVal').textContent = defaults.pipeGap;

    document.getElementById('pipeSpeedSlider').value = defaults.pipeSpeed;
    document.getElementById('pipeSpeedVal').textContent = defaults.pipeSpeed;

    document.getElementById('pipeWidthSlider').value = defaults.pipeWidth;
    document.getElementById('pipeWidthVal').textContent = defaults.pipeWidth;

    document.getElementById('spawnIntervalSlider').value = defaults.pipeSpawnInterval;
    document.getElementById('spawnIntervalVal').textContent = defaults.pipeSpawnInterval;

    document.getElementById('ghostySizeSlider').value = defaults.ghostySize;
    document.getElementById('ghostySizeVal').textContent = defaults.ghostySize;

    document.getElementById('hitboxInsetSlider').value = defaults.hitboxInset;
    document.getElementById('hitboxInsetVal').textContent = defaults.hitboxInset;

    // Reset ghosty dimensions
    ghosty.width = defaults.ghostySize;
    ghosty.height = defaults.ghostySize;
});
