// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'my_model/';

// Video
let video;
let flippedVideo;
// To store the classification
let label = "";

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
    createCanvas(320, 260);
    // Create the video
    video = createCapture(VIDEO);
    video.size(320, 240);
    video.hide();

    if (typeof ml5 !== 'undefined') {
        flippedVideo = ml5.flipImage(video);
        // Start classifying
        classifyVideo();
    } else {
        console.error('ml5 is not available in setup');
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

    // Draw the label
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text(label, width / 2, height - 4);
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
    // Classifiy again!
    classifyVideo();
}