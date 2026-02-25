const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// =======================
// الجزء الأول: Doppler Simulation (محاكاة)
// =======================
const velocityInput = document.getElementById('velocity');
const frequencyInput = document.getElementById('frequency');
const velocityValue = document.getElementById('velocityValue');
const frequencyValue = document.getElementById('frequencyValue');

if (velocityInput) velocityInput.addEventListener('input', () => velocityValue.textContent = velocityInput.value);
if (frequencyInput) frequencyInput.addEventListener('input', () => frequencyValue.textContent = frequencyInput.value);

let audioBuffer = null;
let source = null;
let simStartTime = 0;
let simPauseTime = 0;

document.getElementById('generate').addEventListener('click', () => {
    const v = parseFloat(velocityInput.value);
    const f = parseFloat(frequencyInput.value);
    const vSound = 343;
    const duration = 5;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    const fApproach = f * (vSound + v) / (vSound - v);
    const fRecede = f * (vSound - v) / (vSound + v);

    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        let currentFreq = fApproach - progress * (fApproach - fRecede);
        const envelope = 1 - Math.abs(progress - 0.5) * 2;
        data[i] = envelope * Math.sin(2 * Math.PI * currentFreq * t);
    }
    audioBuffer = buffer;
    alert("Simulated sound generated!");
});

document.getElementById('play').addEventListener('click', () => {
    if (!audioBuffer) return;
    if (source) source.stop();
    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0, simPauseTime);
    simStartTime = audioContext.currentTime - simPauseTime;
});

document.getElementById('pause').addEventListener('click', () => {
    if (!source) return;
    simPauseTime = audioContext.currentTime - simStartTime;
    source.stop();
    source = null;
});
// =======================
// دالة مساعدة لتحويل AudioBuffer إلى ملف WAV
// =======================
function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let offset = 0;

    // كتابة بيانات الـ WAV Header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * numOfChan * 2, true);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
            let sample = Math.max(-1, Math.min(1, channels[channel][i])); // تحديد القيم
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF; // تحويل لـ 16-bit
            view.setInt16(offset, sample, true);
            offset += 2;
        }
    }

    return new Blob([bufferArray], { type: 'audio/wav' });

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

// =======================
// تفعيل زر التحميل (Download)
// =======================
document.getElementById('download').addEventListener('click', () => {
    if (!audioBuffer) {
        alert("Please generate a sound first!");
        return;
    }

    // 1. تحويل الصوت لملف WAV
    const wavBlob = audioBufferToWav(audioBuffer);

    // 2. إنشاء رابط وهمي للتحميل
    const downloadUrl = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;

    // 3. تحديد اسم الملف (ممكن تخليه يتغير حسب التردد والسرعة)
    const v = document.getElementById('velocity').value;
    const f = document.getElementById('frequency').value;
    a.download = `Doppler_Simulation_${f}Hz_${v}ms.wav`;

    // 4. محاكاة الضغط على الرابط لبدء التحميل
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 5. تنظيف الذاكرة
    URL.revokeObjectURL(downloadUrl);
});
// =======================
// الجزء الثاني: Real Audio (حساب سرعة السيارة وعرض الترددات بحجم أكبر)
// =======================
let fileBuffer = null;
let fileSource = null;
let fileStartTime = 0;
let filePauseTime = 0;

document.getElementById('audioFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = await audioContext.decodeAudioData(arrayBuffer);
        document.getElementById('results').textContent = "File loaded successfully.";
    } catch (err) {
        document.getElementById('results').textContent = "Error loading file.";
    }
});

function bandPassFilter(segment, sampleRate, lowHz, highHz) {
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

// تعديل الدالة عشان تقبل تشغيل أو إيقاف الفلتر
function estimateFrequency(segment, sampleRate, minF = 100, maxF = 800, applyFilter = true) {
    // لو الفلتر شغال هنعدي الإشارة عليه، لو مقفول هناخد الإشارة زي ما هي
    const dataToAnalyze = applyFilter ? bandPassFilter(segment, sampleRate, minF, maxF) : segment;

    const size = dataToAnalyze.length;
    const minLag = Math.floor(sampleRate / maxF);
    const maxLag = Math.floor(sampleRate / minF);
    let maxCorr = 0, bestLag = -1;

    for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        for (let i = 0; i < size - lag; i++) {
            corr += dataToAnalyze[i] * dataToAnalyze[i + lag];
        }
        if (corr > maxCorr) { maxCorr = corr; bestLag = lag; }
    }
    return bestLag === -1 ? 0 : sampleRate / bestLag;
}

// تعديل زرار التحليل عشان يقفل ويفتح الفلتر
document.getElementById('analyze').addEventListener('click', () => {
    if (!fileBuffer) return;
    const data = fileBuffer.getChannelData(0);
    const sampleRate = fileBuffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.5);

    // قراءة حالة الـ Checkbox من الواجهة
    const applyNoiseFilter = document.getElementById('useFilter').checked;

    let freqs = [];
    for (let i = 0; i < data.length - windowSize; i += windowSize) {
        // نبعت حالة الفلتر للدالة
        const f = estimateFrequency(data.slice(i, i + windowSize), sampleRate, 100, 800, applyNoiseFilter);
        if (f > 100) freqs.push(f);
    }

    if (freqs.length < 2) {
        document.getElementById('results').textContent = "Low signal quality. Try toggling the noise filter.";
        return;
    }

    const fStart = freqs[0];
    const fEnd = freqs[freqs.length - 1];
    const vEstimated = 343 * (fStart - fEnd) / (fStart + fEnd);

    document.getElementById('results').innerHTML = `
        <div style="margin-bottom: 12px; font-size: 1.1em;">
            <strong>Velocity:</strong> <span style="color: #ffffff;">${Math.abs(vEstimated).toFixed(2)} m/s </span> 
            <span style="color: #38bdf8;">(${ (Math.abs(vEstimated) * 3.6).toFixed(1) } km/h)</span>
        </div>
        <div style="color: #38bdf8; font-size: 16px; font-weight: bold; display: flex; gap: 30px; background: rgba(56, 189, 248, 0.1); padding: 10px; border-radius: 6px; border-left: 4px solid #38bdf8;">
            <span>Approach Freq: <span style="color: white;">${fStart.toFixed(1)} Hz</span></span>
            <span>Receding Freq: <span style="color: white;">${fEnd.toFixed(1)} Hz</span></span>
        </div>
    `;
});

document.getElementById('analyze').addEventListener('click', () => {
    if (!fileBuffer) return;
    const data = fileBuffer.getChannelData(0);
    const sampleRate = fileBuffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.5);

    let freqs = [];
    for (let i = 0; i < data.length - windowSize; i += windowSize) {
        const f = estimateFrequency(data.slice(i, i + windowSize), sampleRate);
        if (f > 150) freqs.push(f);
    }

    if (freqs.length < 2) {
        document.getElementById('results').textContent = "Low signal quality.";
        return;
    }

    const fStart = freqs[0];
    const fEnd = freqs[freqs.length - 1];
    const vEstimated = 343 * (fStart - fEnd) / (fStart + fEnd);

    // تم تكبير الخط وتحسين التنسيق هنا
    document.getElementById('results').innerHTML = `
        <div style="margin-bottom: 12px; font-size: 1.1em;">
            <strong>Velocity:</strong> <span style="color: #ffffff;">${Math.abs(vEstimated).toFixed(2)} m/s </span> 
            <span style="color: #38bdf8;">(${ (Math.abs(vEstimated) * 3.6).toFixed(1) } km/h)</span>
        </div>
        <div style="color: #38bdf8; font-size: 16px; font-weight: bold; display: flex; gap: 30px; background: rgba(56, 189, 248, 0.1); padding: 10px; border-radius: 6px; border-left: 4px solid #38bdf8;">
            <span>Approach Freq: <span style="color: white;">${fStart.toFixed(1)} Hz</span></span>
            <span>Receding Freq: <span style="color: white;">${fEnd.toFixed(1)} Hz</span></span>
        </div>
    `;
});

// =======================
// الجزء الثالث: Drone Detection (الخوارزمية الكلاسيكية)
// =======================
document.getElementById('detectDrone').addEventListener('click', async () => {
    const fileInput = document.getElementById('testFile');
    const resultDiv = document.getElementById('droneResults');
    const status = document.getElementById('aiStatus');

    if (!fileInput.files[0]) {
        alert("Upload file first.");
        return;
    }

    status.textContent = "⏳ Processing (Browser Engine)...";

    try {
        const arrayBuffer = await fileInput.files[0].arrayBuffer();
        const droneBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const data = droneBuffer.getChannelData(0);
        const sampleRate = droneBuffer.sampleRate;

        let droneFreqs = [];
        const win = Math.floor(sampleRate * 0.2);
        for (let i = 0; i < data.length - win; i += win) {
            const f = estimateFrequency(data.slice(i, i + win), sampleRate, 100, 1000);
            if (f > 0) droneFreqs.push(f);
        }

        const avgFreq = droneFreqs.length ? droneFreqs.reduce((a,b)=>a+b)/droneFreqs.length : 0;
        const isDrone = avgFreq >= 150 && avgFreq <= 800;

        status.textContent = "✅ Analysis Complete";
        if (isDrone) {
            resultDiv.innerHTML = `<div style="color:#ef4444; font-size:24px; font-weight:bold;">⚠️ DRONE DETECTED!</div>
                                   <div style="color:#94a3b8;">Avg Frequency: ${avgFreq.toFixed(1)} Hz</div>`;
        } else {
            resultDiv.innerHTML = `<div style="color:#22c55e; font-size:24px; font-weight:bold;">✅ No Drone Detected</div>
                                   <div style="color:#94a3b8;">Avg Frequency: ${avgFreq.toFixed(1)} Hz</div>`;
        }

    } catch (err) {
        console.error(err);
        status.textContent = "❌ Error analyzing file.";
        resultDiv.textContent = "Could not decode audio (Check file format).";
    }
});

// Playback (للملف الحقيقي)
document.getElementById('playFile').addEventListener('click', () => {
    if (!fileBuffer) return;
    if (fileSource) fileSource.stop();
    fileSource = audioContext.createBufferSource();
    fileSource.buffer = fileBuffer;
    fileSource.connect(audioContext.destination);
    fileSource.start(0, filePauseTime);
    fileStartTime = audioContext.currentTime - filePauseTime;
});