const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// =======================
// Simulated Doppler
// =======================
const generateBtn = document.getElementById('generate');
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
const velocityInput = document.getElementById('velocity');
const frequencyInput = document.getElementById('frequency');
const velocityValue = document.getElementById('velocityValue');
const frequencyValue = document.getElementById('frequencyValue');

let audioBuffer = null;
let source = null;
let simStartTime = 0;
let simPauseTime = 0;
let simIsPlaying = false;

// Slider updates
velocityInput.addEventListener('input', () => velocityValue.textContent = velocityInput.value);
frequencyInput.addEventListener('input', () => frequencyValue.textContent = frequencyInput.value);

// Generate Doppler sound
generateBtn.addEventListener('click', () => {
    const v = parseFloat(velocityInput.value);
    const f = parseFloat(frequencyInput.value);
    const vSound = 343;

    if (v >= 340) alert("Warning: Velocity is very high! Sound may not simulate correctly near speed of sound.");

    const duration = 5;
    const sampleRate = audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const fApproach = f * (vSound + v) / (vSound - v);
    const fRecede = f * (vSound - v) / (vSound + v);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        let currentFreq = fApproach - progress * (fApproach - fRecede);
        currentFreq = Math.max(20, Math.min(20000, currentFreq));
        const envelope = 1 - Math.abs(progress - 0.5) * 2;
        data[i] = envelope * Math.sin(2 * Math.PI * currentFreq * t);
    }

    audioBuffer = buffer;
    alert("Simulated sound generated!");
});

// Play Simulated sound
playBtn.addEventListener('click', () => {
    if (!audioBuffer) { alert("Generate sound first!"); return; }
    if (source) source.stop();

    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    const offset = simPauseTime;
    simStartTime = audioContext.currentTime - offset;

    source.start(0, offset);
    simIsPlaying = true;
});

// Pause Simulated sound
pauseBtn.addEventListener('click', () => {
    if (!source) return;
    simPauseTime = audioContext.currentTime - simStartTime;
    source.stop();
    source = null;
    simIsPlaying = false;
});

// =======================
// Real Audio Analysis
// =======================
const audioFileInput = document.getElementById('audioFile');
const analyzeBtn = document.getElementById('analyze');
const playFileBtn = document.getElementById('playFile');
const pauseFileBtn = document.getElementById('pauseFile');
const resultsDiv = document.getElementById('results');

let fileBuffer = null;
let fileSource = null;
let fileStartTime = 0;
let filePauseTime = 0;
let fileIsPlaying = false;

// Load audio file
audioFileInput.addEventListener('change', async () => {
    const file = audioFileInput.files[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = await audioContext.decodeAudioData(arrayBuffer);
    resultsDiv.textContent = "File loaded successfully.";
});

// Band-pass filter
function bandPassFilter(segment, sampleRate, lowHz = 100, highHz = 600) {
    const filtered = new Float32Array(segment.length);
    const RC_low = 1 / (2 * Math.PI * lowHz);
    const RC_high = 1 / (2 * Math.PI * highHz);
    const dt = 1 / sampleRate;
    let lowPrev = segment[0], highPrev = segment[0];

    for (let i = 0; i < segment.length; i++) {
        const alpha_low = dt / (RC_high + dt);
        const low = alpha_low * segment[i] + (1 - alpha_low) * lowPrev;
        lowPrev = low;

        const alpha_high = RC_low / (RC_low + dt);
        const high = alpha_high * (low - highPrev + highPrev);
        highPrev = high;

        filtered[i] = high;
    }
    return filtered;
}

// Autocorrelation frequency estimation
function estimateFrequency(segment, sampleRate) {
    const filteredSegment = bandPassFilter(segment, sampleRate);
    const size = filteredSegment.length;
    const minFreq = 100, maxFreq = 600;
    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.floor(sampleRate / minFreq);
    let maxCorr = 0, bestLag = -1;

    for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        for (let i = 0; i < size - lag; i++) {
            corr += filteredSegment[i] * filteredSegment[i + lag];
        }
        if (corr > maxCorr) { maxCorr = corr; bestLag = lag; }
    }
    if (bestLag === -1) return 0;
    return sampleRate / bestLag;
}

// Average frequency over segment
function averageFrequency(segment, sampleRate) {
    const windowSize = Math.floor(segment.length / 5);
    let freqs = [];
    for (let i = 0; i < segment.length; i += windowSize) {
        const subSegment = segment.slice(i, i + windowSize);
        const f = estimateFrequency(subSegment, sampleRate);
        if (f > 0) freqs.push(f);
    }
    return freqs.length ? freqs.reduce((a, b) => a + b, 0) / freqs.length : 0;
}

// Analyze real audio file
analyzeBtn.addEventListener('click', () => {
    if (!fileBuffer) { resultsDiv.textContent = "Load a file first."; return; }
    const data = fileBuffer.getChannelData(0);
    const sampleRate = fileBuffer.sampleRate;
    const segmentDuration = 1;

    const startSegment = data.slice(0, segmentDuration * sampleRate);
    const endSegment = data.slice(data.length - segmentDuration * sampleRate, data.length);

    const fStart = averageFrequency(startSegment, sampleRate);
    const fEnd = averageFrequency(endSegment, sampleRate);

    const vSound = 343;
    const vEstimated = vSound * (fStart - fEnd) / (fStart + fEnd);

    resultsDiv.innerHTML = `
        <strong>Estimated Frequency (Approach):</strong> ${fStart.toFixed(1)} Hz<br>
        <strong>Estimated Frequency (Recede):</strong> ${fEnd.toFixed(1)} Hz<br>
        <strong>Estimated Velocity:</strong> ${Math.abs(vEstimated).toFixed(2)} m/s
    `;
});

// Play Real file
playFileBtn.addEventListener('click', () => {
    if (!fileBuffer) { alert("Load a file first!"); return; }
    if (fileSource) fileSource.stop();

    fileSource = audioContext.createBufferSource();
    fileSource.buffer = fileBuffer;
    fileSource.connect(audioContext.destination);

    const offset = filePauseTime;
    fileStartTime = audioContext.currentTime - offset;

    fileSource.start(0, offset);
    fileIsPlaying = true;
});

// Pause Real file
pauseFileBtn.addEventListener('click', () => {
    if (!fileSource) return;
    filePauseTime = audioContext.currentTime - fileStartTime;
    fileSource.stop();
    fileSource = null;
    fileIsPlaying = false;
});

// =======================
// Drone Detection (Classic Algorithm)
// =======================
// ================= Classic Drone Detection =================
const droneTargetInput = document.getElementById('droneTarget'); // مش لازم يظهر للويب
const testFileInput = document.getElementById('testFile');
const detectDroneBtn = document.getElementById('detectDrone');
const droneResultsDiv = document.getElementById('droneResults');

let droneFreqRange = [50, 500]; // نطاق الترددات المتوقعة للدرون

// Band-pass filter
function bandPassFilterClassic(segment, sampleRate, fLow = 50, fHigh = 500) {
    const filtered = new Float32Array(segment.length);
    const RC_low = 1 / (2 * Math.PI * fLow);
    const RC_high = 1 / (2 * Math.PI * fHigh);
    const dt = 1 / sampleRate;
    let lowPrev = segment[0], highPrev = segment[0];
    for (let i = 0; i < segment.length; i++) {
        const alpha_low = dt / (RC_high + dt);
        const low = alpha_low * segment[i] + (1 - alpha_low) * lowPrev;
        lowPrev = low;
        const alpha_high = RC_low / (RC_low + dt);
        const high = alpha_high * (low - highPrev + highPrev);
        highPrev = high;
        filtered[i] = high;
    }
    return filtered;
}

// Autocorrelation frequency estimation
function estimateFrequencyClassic(segment, sampleRate, minFreq = 50, maxFreq = 500) {
    const filtered = bandPassFilterClassic(segment, sampleRate, minFreq, maxFreq);
    const size = filtered.length;
    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.floor(sampleRate / minFreq);
    let maxCorr = 0, bestLag = -1;
    for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        for (let i = 0; i < size - lag; i++) {
            corr += filtered[i] * filtered[i + lag];
        }
        if (corr > maxCorr) { maxCorr = corr; bestLag = lag; }
    }
    if (bestLag === -1) return 0;
    return sampleRate / bestLag;
}

// متوسط التردد عبر كل الصوت
function averageFrequencyClassic(data, sampleRate, windowSizeMs = 100) {
    const windowSize = Math.floor(sampleRate * windowSizeMs / 1000);
    let freqs = [];
    for (let start = 0; start < data.length - windowSize; start += windowSize) {
        const segment = data.slice(start, start + windowSize);
        const f = estimateFrequencyClassic(segment, sampleRate, droneFreqRange[0], droneFreqRange[1]);
        if (f > 0) freqs.push(f);
    }
    if (freqs.length === 0) return 0;
    return freqs.reduce((a, b) => a + b, 0) / freqs.length;
}

// Detect Drone Sound
detectDroneBtn.addEventListener('click', async () => {
    const testFile = testFileInput.files[0];
    if (!testFile) {
        droneResultsDiv.textContent = "Upload test file first.";
        return;
    }

    const arrayBuffer = await testFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    const avgFreq = averageFrequencyClassic(data, sampleRate, 100); // 100ms window

    // عتبة 50 Hz للنطاق
    const isDrone = avgFreq >= droneFreqRange[0] && avgFreq <= droneFreqRange[1];
    droneResultsDiv.textContent = `Result: ${isDrone ? 'Drone Sound Detected!' : 'Not a Drone Sound'}. Average Frequency: ${avgFreq.toFixed(1)} Hz`;
});