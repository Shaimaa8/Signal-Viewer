let allChannels = [], channelNames = [];
let individualPlayback = {};
let overlayInterval = null;
let channelConfigs = {}; // تخزين إعدادات القنوات (لون، سمك، حركة)

const colorPalette = ['#38bdf8', '#fb7185', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#818cf8'];

// 1. معالجة رفع الملفات
document.getElementById("fileInput").addEventListener("change", e => {
    const files = e.target.files;
    if (files.length === 0) return;
    const category = document.getElementById("signalCategory").value;
    const formData = new FormData();
    formData.append('category', category);
    for (let i = 0; i < files.length; i++) { formData.append('file', files[i]); }

    document.getElementById('aiStatus').innerText = "Analyzing Signal...";

    fetch('/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.error) { alert(data.error); return; }
            document.getElementById('aiStatus').innerHTML = `AI Diagnosis: <b>${data.ai_status}</b> (${data.ai_diagnosis})`;
            const select = document.getElementById("channel1Select");
            select.innerHTML = "";
            data.channel_names.forEach((n, i) => select.add(new Option(n, i)));

            fetch('/get_all_channels').then(r => r.json()).then(d => {
                allChannels = d.channels;
                channelNames = d.names;
                const slider = document.getElementById("timeSlider");
                slider.max = allChannels[0].length;
                slider.value = Math.min(1000, slider.max);
                document.getElementById("rangeVal").innerText = slider.value;
            });
        });
});

// 2. تحديث قائمة الإعدادات عند اختيار القنوات
document.getElementById("channel1Select").addEventListener("change", function() {
    const selectedOptions = Array.from(this.selectedOptions);
    const listContainer = document.getElementById("channelsConfigList");
    listContainer.innerHTML = "";

    selectedOptions.forEach(opt => {
        const idx = opt.value;
        if (!channelConfigs[idx]) {
            channelConfigs[idx] = { color: colorPalette[idx % colorPalette.length], width: 1.5, isMoving: true };
        }
        const row = document.createElement("div");
        row.style = "margin-bottom: 10px; padding: 5px; background: #0f172a; border-radius: 4px; border-left: 3px solid " + channelConfigs[idx].color;
        row.innerHTML = `
            <div style="font-size: 9px; color: white; margin-bottom: 3px;">${opt.text}</div>
            <div style="display: flex; gap: 5px; align-items: center;">
                <input type="color" value="${channelConfigs[idx].color}" onchange="updateConfig(${idx}, 'color', this.value)" style="width:15px; height:15px; border:none; background:none;">
                <input type="number" value="${channelConfigs[idx].width}" step="0.5" style="width:35px; font-size:9px;" onchange="updateConfig(${idx}, 'width', this.value)">
                <label style="font-size: 8px; color:#94a3b8;"><input type="checkbox" ${channelConfigs[idx].isMoving ? 'checked' : ''} onchange="updateConfig(${idx}, 'isMoving', this.checked)"> Play</label>
            </div>
        `;
        listContainer.appendChild(row);
    });
});

function updateConfig(idx, key, val) {
    if (key === 'width') val = parseFloat(val);
    channelConfigs[idx][key] = val;
}

// 3. دوال الرسم والتحكم
function plotNow() {
    const selected = Array.from(document.getElementById("channel1Select").selectedOptions).map(o => parseInt(o.value));
    const layoutStyle = document.getElementById("layoutStyle").value;
    const grid = document.getElementById("chartGrid");
    const win = parseInt(document.getElementById("timeSlider").value);

    if (allChannels.length === 0 || selected.length === 0) return alert("Select data and channels!");
    stopAllTimers(); grid.innerHTML = "";

    if (layoutStyle === "overlay") {
        const card = document.createElement("div");
        card.className = "chart-card full-width";
        card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:#1e293b; border-radius:8px 8px 0 0;">
                <span style="color:#38bdf8; font-size:12px;">Overlay View</span>
                <button onclick="toggleOverlayPlay()" style="background:#38bdf8; border:none; border-radius:4px; padding:2px 10px; cursor:pointer;">▶</button>
            </div><div id="mainPlot" style="height:350px; width:100%;"></div>`;
        grid.appendChild(card);
        renderOverlayFrame(selected, 0, win);
    } else {
        selected.forEach((idx, i) => {
            const card = document.createElement("div");
            card.className = (selected.length === 1) ? "chart-card full-width" : "chart-card";
            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:#1e293b; border-radius:8px 8px 0 0;">
                    <span style="color:#38bdf8; font-size:12px;">${channelNames[idx]}</span>
                    <button onclick="toggleIndividualPlay(${idx})" style="background:#38bdf8; border:none; border-radius:4px; padding:2px 10px; cursor:pointer;">▶</button>
                </div><div id="plot_${idx}" style="height:250px; width:100%;"></div>`;
            grid.appendChild(card);
            renderSingleFrame(idx, 0, win, i);
        });
    }
}

function renderSingleFrame(idx, start, win, colorIdx = 0) {
    const config = channelConfigs[idx] || { color: colorPalette[colorIdx % colorPalette.length], width: 1.5 };
    const sig = allChannels[idx].slice(start, start + win);
    const type = document.getElementById("plotType").value;
    const trace = createTrace(sig, type, channelNames[idx], config.color, config.width);
    Plotly.react(`plot_${idx}`, trace, createLayout(channelNames[idx], type), {responsive: true});
}

function renderOverlayFrame(indices, currentPos, win) {
    const type = document.getElementById("plotType").value;
    const traces = indices.map((idx) => {
        const config = channelConfigs[idx] || { color: '#38bdf8', width: 1.5, isMoving: true };
        const start = config.isMoving ? currentPos : 0;
        const sig = allChannels[idx].slice(start, start + win);
        return createTrace(sig, type, channelNames[idx], config.color, config.width)[0];
    });
    Plotly.react("mainPlot", traces, createLayout("Overlay View", type), {responsive: true});
}

function createTrace(sig, type, name, color, width) {
    if (type === "signal") return [{ y: sig, name: name, mode: 'lines', line: {width: width, color: color} }];
    if (type === "polar") {
        const theta = sig.map((_, i) => (i / sig.length) * 360);
        return [{ type: 'scatterpolar', r: sig, theta: theta, mode: 'lines', name: name, line: { color: color, width: width } }];
    }
    if (type === "recurrence") return [{ x: sig.slice(0, -1), y: sig.slice(1), mode: 'markers', marker: { size: 3, color: color }, name: name }];
    if (type === "xor") {
        const h = Math.floor(sig.length / 2);
        const res = sig.slice(0, h).map((v, i) => Math.abs(v - (sig[h + i] || 0)));
        return [{ y: res, mode: 'lines', fill: 'tozeroy', line: {color: color, width: width}, name: name }];
    }
}

function createLayout(title, type) {
    let l = {
        title: { text: title, font: { color: 'white', size: 12 } },
        paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(30,41,59,0.3)',
        font: { color: 'white' }, margin: { t: 40, b: 30, l: 40, r: 20 },
        xaxis: { gridcolor: '#334155' }, yaxis: { gridcolor: '#334155' }
    };
    if (type === "polar") {
        l.polar = { bgcolor: 'rgba(15, 23, 42, 0.8)', radialaxis: { visible: true, gridcolor: '#334155', showticklabels: true } };
    }
    return l;
}

// 4. Playback Logic
function toggleIndividualPlay(idx) {
    if (individualPlayback[idx]) { clearInterval(individualPlayback[idx].interval); delete individualPlayback[idx]; }
    else {
        individualPlayback[idx] = { currentPos: 0, interval: setInterval(() => {
            const speed = parseInt(document.getElementById("speedSlider").value);
            const win = parseInt(document.getElementById("timeSlider").value);
            individualPlayback[idx].currentPos += (10 * speed);
            if (individualPlayback[idx].currentPos + win >= allChannels[idx].length) individualPlayback[idx].currentPos = 0;
            renderSingleFrame(idx, individualPlayback[idx].currentPos, win);
        }, 50)};
    }
}

function toggleOverlayPlay() {
    const selected = Array.from(document.getElementById("channel1Select").selectedOptions).map(o => parseInt(o.value));
    if (overlayInterval) { clearInterval(overlayInterval); overlayInterval = null; }
    else {
        let pos = 0;
        overlayInterval = setInterval(() => {
            const speed = parseInt(document.getElementById("speedSlider").value);
            const win = parseInt(document.getElementById("timeSlider").value);
            pos += (10 * speed);
            if (pos + win >= allChannels[0].length) pos = 0;
            renderOverlayFrame(selected, pos, win);
        }, 50);
    }
}

function stopAllTimers() {
    Object.keys(individualPlayback).forEach(idx => clearInterval(individualPlayback[idx].interval));
    individualPlayback = {}; if (overlayInterval) { clearInterval(overlayInterval); overlayInterval = null; }
}

function clearPlots() { stopAllTimers(); document.getElementById("chartGrid").innerHTML = ""; }
function startPlayback() {
    if (document.getElementById("layoutStyle").value === "overlay") toggleOverlayPlay();
    else Array.from(document.getElementById("channel1Select").selectedOptions).forEach(o => toggleIndividualPlay(o.value));
}

document.getElementById("timeSlider").addEventListener("input", e => document.getElementById("rangeVal").innerText = e.target.value);

window.plotNow = plotNow; window.clearPlots = clearPlots; window.startPlayback = startPlayback;
window.stopPlayback = () => stopAllTimers(); window.toggleOverlayPlay = toggleOverlayPlay; window.toggleIndividualPlay = toggleIndividualPlay;