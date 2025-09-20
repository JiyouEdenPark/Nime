# Nime

A gestural interactive sound instrument using p5.js, ml5.js, and Teachable Machine.

## Features

- **Real-time Material Recognition**: Uses Teachable Machine to classify coral, stone, wood, and wood+coral+stone
- **Gestural Interface**: Sound activation based on material detection
- **Multiple Sound Mappings**: Each material produces unique sounds
- **Web Audio & MIDI Support**: Fallback to Web Audio API when MIDI is unavailable
- **Visual Feedback**: Material-based colors and confidence indicators

## Materials & Sounds

- **Coral**: White circle, high-pitched sine wave (C5)
- **Stone**: Gray circle, low-pitched sawtooth wave (C3)
- **Wood**: Brown circle, warm triangle wave (C4)
- **Wood+Coral+Stone**: White stroke circle, harmonious 4-beat chord progression

## Usage

1. Open `gestural-instrument/index.html` in a web browser
2. Allow camera access when prompted
3. Show different materials to the camera to trigger sounds
4. Click anywhere to enable audio if needed

## Technical Stack

- **p5.js**: Creative coding and visualization
- **ml5.js**: Machine learning integration
- **Teachable Machine**: Custom image classification model
- **Web Audio API**: Sound synthesis
- **Web MIDI API**: MIDI output (optional)

## Project Structure

```
gestural-instrument/
├── index.html          # Main webpage
├── sketch.js           # p5.js application
├── style.css           # Basic styling
└── my_model/           # Teachable Machine model
    ├── model.json
    ├── metadata.json
    └── weights.bin
```