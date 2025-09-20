// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'my_model/';

// Video
let video;
let flippedVideo;
// To store the classification
let label = "";

// Gestural Interface Controls
let gestureControls = {
    onOff: false,        // On/Off state based on material detection
    range: 0.5,         // Range value based on confidence level
    currentMaterial: '', // Currently detected material
    lastMaterial: '',   // Previously detected material
    confidence: 0,      // Detection confidence
    materialChangeThreshold: 0.3 // Threshold for material change detection
};

// MIDI Controller
let midiOutput = null;
let isMidiReady = false;

// Sound Mapping for different materials
let soundMapping = {
    'coral': { note: 72, channel: 1, cc: 1 },      // C5, Channel 1, CC1
    'stone': { note: 48, channel: 2, cc: 2 },      // C3, Channel 2, CC2  
    'wood': { note: 60, channel: 3, cc: 3 },       // C4, Channel 3, CC3
    'wood+coral+stone': { note: 84, channel: 4, cc: 4 } // C6, Channel 4, CC4
};

// Visual feedback
let visualFeedback = {
    currentMaterial: '',
    intensity: 0,
    color: [255, 255, 255]
};

// Load the model first
function preload() {
    // Check if ml5 is available before using it
    if (typeof ml5 !== 'undefined') {
        classifier = ml5.imageClassifier(imageModelURL + 'model.json');
    } else {
        console.error('ml5 is not available');
    }
}

function setup() {
    createCanvas(900, 675);
    // Create the video
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    // Initialize MIDI
    initMIDI();

    if (typeof ml5 !== 'undefined') {
        flippedVideo = ml5.flipImage(video);
        // Start classifying
        classifyVideo();
    } else {
        console.error('ml5 is not available in setup');
    }
}

// Initialize MIDI
async function initMIDI() {
    if (navigator.requestMIDIAccess) {
        try {
            const midiAccess = await navigator.requestMIDIAccess();
            const outputs = midiAccess.outputs;

            if (outputs.size > 0) {
                midiOutput = outputs.values().next().value;
                isMidiReady = true;
                console.log('MIDI initialized:', midiOutput.name);
            } else {
                console.log('No MIDI outputs found - using Web Audio API instead');
                initWebAudio();
            }
        } catch (error) {
            console.error('MIDI initialization failed:', error);
            console.log('Falling back to Web Audio API');
            initWebAudio();
        }
    } else {
        console.log('Web MIDI API not supported - using Web Audio API');
        initWebAudio();
    }
}

// Initialize Web Audio API as fallback
function initWebAudio() {
    try {
        // Create audio context
        window.audioContext = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        isMidiReady = true;
        console.log('Web Audio API initialized');
    } catch (error) {
        console.error('Web Audio API initialization failed:', error);
    }
}

function draw() {
    background(0);

    // Draw the video
    if (flippedVideo) {
        image(flippedVideo, 0, 0);
    } else if (video) {
        image(video, 0, 0);
    }

    // Update gesture controls
    updateGestureControls();

    // Draw visual feedback
    drawVisualFeedback();

    // Draw control information
    drawControlInfo();
}

// Update gesture controls based on material detection
function updateGestureControls() {
    // Update current material
    gestureControls.currentMaterial = label;

    // On/Off control based on material detection
    // Sound is ON when a valid material is detected
    gestureControls.onOff = (label !== '' && label !== 'unknown');

    // Range control based on confidence level (will be updated in gotResult)
    // This will be set based on the classification confidence

    // Check for material change
    if (gestureControls.currentMaterial !== gestureControls.lastMaterial) {
        console.log(`Material changed: ${gestureControls.lastMaterial} → ${gestureControls.currentMaterial}`);
        gestureControls.lastMaterial = gestureControls.currentMaterial;
    }
}

// Draw visual feedback
function drawVisualFeedback() {
    // Material-based color
    let materialColor = getMaterialColor(label);
    visualFeedback.color = materialColor;

    // Intensity based on confidence level
    visualFeedback.intensity = map(gestureControls.confidence, 0, 1, 0, 255);
    visualFeedback.intensity = constrain(visualFeedback.intensity, 0, 255);

    // Draw material detection circle
    if (label === 'wood+coral+stone') {
        // Special case: only stroke for wood+coral+stone
        noFill();
        stroke(255, 255, 255, visualFeedback.intensity);
        strokeWeight(1.5);
        ellipse(width - 130, 100, 80, 80);
    } else {
        // Regular fill for other materials
        fill(materialColor[0], materialColor[1], materialColor[2], visualFeedback.intensity);
        noStroke();
        ellipse(width - 130, 100, 80, 80);
    }

    // Draw confidence indicator
    let confidenceY = map(gestureControls.confidence, 0, 1, height - 100, 100);
    fill(255);
    ellipse(width - 80, confidenceY, 20, 20);
}

// Get material color
function getMaterialColor(material) {
    switch (material) {
        case 'coral': return [255, 255, 255];      // White
        case 'stone': return [150, 150, 150];      // Gray
        case 'wood': return [139, 69, 19];         // Brown
        case 'wood+coral+stone': return [255, 215, 0]; // Gold
        default: return [255, 255, 255];           // White
    }
}

// Draw control information
function drawControlInfo() {
    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT);

    text(`Material: ${label}`, 10, height - 120);
    text(`Confidence: ${gestureControls.confidence.toFixed(2)}`, 10, height - 100);
    text(`Sound: ${gestureControls.onOff ? 'ON' : 'OFF'}`, 10, height - 80);
    text(`Audio: ${isMidiReady ? (midiOutput ? 'MIDI' : 'Web Audio') : 'Not Ready'}`, 10, height - 60);

    // Draw instructions
    textSize(12);
    text(`Show coral, stone, wood, or wood+coral+stone to camera`, 10, height - 40);
    text(`Click anywhere to enable audio if needed`, 10, height - 20);
}

// Get a prediction for the current video frame
function classifyVideo() {
    if (typeof ml5 !== 'undefined' && classifier) {
        flippedVideo = ml5.flipImage(video);
        classifier.classify(flippedVideo, gotResult);
        flippedVideo.remove();
    }
}

// When we get a result
function gotResult(error, results) {
    // If there is an error
    if (error) {
        console.error(error);
        return;
    }
    // The results are in an array ordered by confidence.
    // console.log(results[0]);
    label = results[0].label;
    gestureControls.confidence = results[0].confidence;

    // Update range control based on confidence
    gestureControls.range = gestureControls.confidence;

    // Send MIDI messages based on classification and gestures
    sendMIDIMessages();

    // Classifiy again!
    classifyVideo();
}

// Send MIDI messages or generate Web Audio based on material and gestures
function sendMIDIMessages() {
    if (!isMidiReady) return;

    let material = soundMapping[label];
    if (!material) return;

    // Try MIDI first, fallback to Web Audio
    if (midiOutput) {
        // Send MIDI messages
        if (gestureControls.onOff) {
            // Note On
            let velocity = Math.floor(gestureControls.range * 127);
            midiOutput.send([0x90 + (material.channel - 1), material.note, velocity]);

            // Send CC for modulation
            let ccValue = Math.floor(gestureControls.range * 127);
            midiOutput.send([0xB0 + (material.channel - 1), material.cc, ccValue]);
        } else {
            // Note Off
            midiOutput.send([0x80 + (material.channel - 1), material.note, 0]);
        }
    } else {
        // Use Web Audio API
        generateWebAudioSound(material);
    }
}

// Generate sound using Web Audio API
function generateWebAudioSound(material) {
    if (!window.audioContext) return;

    if (gestureControls.onOff) {
        // Special sound for wood+coral+stone
        if (material.note === 84) {
            generateSpecialComplexSound(material);
        } else {
            // Regular sound for other materials
            let oscillator = window.audioContext.createOscillator();
            let gainNode = window.audioContext.createGain();

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(window.audioContext.destination);

            // Set frequency based on material
            let frequency = getMaterialFrequency(material);
            oscillator.frequency.setValueAtTime(frequency, window.audioContext.currentTime);

            // Set oscillator type based on material
            oscillator.type = getMaterialWaveType(material);

            // Set volume based on confidence
            let volume = gestureControls.range * 0.3; // Max 30% volume
            gainNode.gain.setValueAtTime(volume, window.audioContext.currentTime);

            // Start and stop oscillator
            oscillator.start(window.audioContext.currentTime);
            oscillator.stop(window.audioContext.currentTime + 0.1);
        }
    }
}

// Generate special complex sound for wood+coral+stone
function generateSpecialComplexSound(material) {
    let volume = gestureControls.range * 0.1;

    // Create harmonious chord progression
    let baseFreq = 261.63; // C4 (wood)

    // Harmonious frequencies (C major chord)
    let frequencies = [
        baseFreq,           // C4 (wood - root)
        baseFreq * 1.25,    // E4 (coral - major third) 
        baseFreq * 1.5,     // G4 (stone - perfect fifth)
        baseFreq * 2        // C5 (octave)
    ];

    // Softer wave types for harmony
    let waveTypes = ['triangle', 'sine', 'triangle', 'sine'];

    // Create rhythmic pattern
    let currentTime = window.audioContext.currentTime;
    let beatDuration = 0.2; // 200ms per beat

    // Create 4-beat pattern
    for (let beat = 0; beat < 4; beat++) {
        let beatTime = currentTime + (beat * beatDuration);

        // Different notes for each beat (arpeggio pattern)
        let noteIndex = beat % frequencies.length;
        let oscillator = window.audioContext.createOscillator();
        let gainNode = window.audioContext.createGain();

        oscillator.frequency.setValueAtTime(frequencies[noteIndex], beatTime);
        oscillator.type = waveTypes[noteIndex];

        // Envelope for each note
        let noteVolume = volume * (0.8 - beat * 0.1); // Decreasing volume
        gainNode.gain.setValueAtTime(0, beatTime);
        gainNode.gain.linearRampToValueAtTime(noteVolume, beatTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, beatTime + beatDuration * 0.8);

        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);

        oscillator.start(beatTime);
        oscillator.stop(beatTime + beatDuration * 0.8);
    }
}

// Get frequency for material
function getMaterialFrequency(material) {
    switch (material.note) {
        case 72: return 523.25; // C5 - coral
        case 48: return 130.81; // C3 - stone  
        case 60: return 261.63; // C4 - wood
        case 84: return 1046.50; // C6 - wood+coral+stone
        default: return 440; // A4
    }
}

// Get wave type for material
function getMaterialWaveType(material) {
    switch (material.note) {
        case 72: return 'sine';    // coral - smooth
        case 48: return 'sawtooth'; // stone - harsh
        case 60: return 'triangle'; // wood - warm
        case 84: return 'square';   // wood+coral+stone - complex
        default: return 'sine';
    }
}

// Enable audio context on user interaction
function mousePressed() {
    if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
}