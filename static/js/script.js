let allChannels = [], channelNames = [];
let individualPlayback = {};
let overlayInterval = null;
let channelConfigs = {};
let activePlotsRegistry = [];

const colorPalette = ['#38bdf8', '#fb7185', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#818cf8'];

// 1. معالجة الرفع (ECG Upload)
document.getElementById("fileInput").addEventListener("change", async e => {
    const files = e.target.files;
    if (files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('file', files[i]);

    const sigType = document.getElementById("signalType") ? document.getElementById("signalType").value : "ecg";
    formData.append('signal_type', sigType);

    document.getElementById('aiStatus').innerText = "Status: Uploading & Analyzing...";
    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.error) {
            alert("Error: " + data.error);
            document.getElementById('aiStatus').innerText = "Status: Error";
            return;
        }

        document.getElementById('aiStatus').innerText = "Status: Data Ready";

        const select = document.getElementById("channel1Select");
        select.innerHTML = "";
        data.channel_names.forEach((n, i) => select.add(new Option(n, i)));

        // 🟢 الجديد: ملء قوائم الـ X والـ Y الخاصة بالـ 2D Map
        const selectX = document.getElementById("xChannelSelect");
        const selectY = document.getElementById("yChannelSelect");
        if(selectX && selectY) {
            selectX.innerHTML = "";
            selectY.innerHTML = "";
            data.channel_names.forEach((n, i) => {
                selectX.add(new Option(n, i));
                selectY.add(new Option(n, i));
            });
            // نخليهم يختاروا قناتين مختلفتين كبداية
            if(data.channel_names.length > 1) selectY.selectedIndex = 1;
        }

        const r = await fetch('/get_all_channels');
        const d = await r.json();
        allChannels = d.channels;
        channelNames = d.names;

        const slider = document.getElementById("timeSlider");
        slider.max = allChannels[0].length;
        slider.value = Math.min(1000, slider.max);
        document.getElementById("rangeVal").innerText = slider.value;

    } catch (err) {
        console.error("Upload Error:", err);
    }
});

// 2. تحليل AI
async function runAiAnalysis() {
    if (allChannels.length === 0) return alert("Please upload a file first!");

    document.getElementById('aiResult').innerText = "Analyzing...";
    document.getElementById('classicResult').innerText = "Analyzing...";

    try {
        const response = await fetch('/analyze_signal_ai', { method: 'POST' });
        const data = await response.json();
        if (data.status === "Success") {
            document.getElementById('aiResult').innerText = data.ai_prediction;
            document.getElementById('classicResult').innerText = data.classic_result;
            const isNormal = data.ai_prediction.toLowerCase().includes("normal");
            document.getElementById('aiResult').style.color = isNormal ? "#4ade80" : "#f87171";
        }
    } catch (e) { console.error("AI Analysis Error:", e); }
}

// 3. التحكم في خصائص القنوات
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
        row.style = `margin-bottom: 10px; padding: 10px; background: #0f172a; border-radius: 8px; border-left: 5px solid ${channelConfigs[idx].color};`;
        row.innerHTML = `
            <div style="font-size: 13px; color: white; margin-bottom: 8px;"><b>${opt.text}</b></div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="color" value="${channelConfigs[idx].color}" onchange="updateConfig(${idx}, 'color', this.value)" style="width:25px; height:25px; border:none; cursor:pointer;">
                <input type="number" value="${channelConfigs[idx].width}" step="0.5" style="width:45px; background:#1e293b; color:white; border:1px solid #334155;" onchange="updateConfig(${idx}, 'width', this.value)">
                <label style="color:#94a3b8; font-size:11px;"><input type="checkbox" ${channelConfigs[idx].isMoving ? 'checked' : ''} onchange="updateConfig(${idx}, 'isMoving', this.checked)"> Anim</label>
            </div>
        `;
        listContainer.appendChild(row);
    });
});

function updateConfig(idx, key, val) {
    if (key === 'width') val = parseFloat(val);
    channelConfigs[idx][key] = val;
    refreshVisiblePlots();
}

// 4. منطق الرسم
function plotNow() {
    const selected = Array.from(document.getElementById("channel1Select").selectedOptions).map(o => parseInt(o.value));
    const layoutStyle = document.getElementById("layoutStyle").value;
    const grid = document.getElementById("chartGrid");
    const win = parseInt(document.getElementById("timeSlider").value);
    const mode = document.getElementById("modeSelect").value;
    const currentType = document.getElementById("plotType").value;

    if (allChannels.length === 0) return alert("Select channels!");

    if (mode === "multi") {
        stopAllTimers();
        grid.innerHTML = "";
        activePlotsRegistry = [];
    }

    if (layoutStyle === "overlay") {
        const plotId = mode === "single" ? `overlay_${Date.now()}` : "mainPlot";
        createPlotContainer(grid, plotId, "Overlay View", true, selected, currentType);
        renderOverlayFrame(selected, 0, win, plotId, currentType);
    } else {
        selected.forEach((idx) => {
            const plotId = mode === "single" ? `plot_${idx}_${Date.now()}` : `plot_${idx}`;
            createPlotContainer(grid, plotId, channelNames[idx], false, idx, currentType);
            renderSingleFrame(idx, 0, win, 0, plotId, currentType);
        });
    }
}

function createPlotContainer(parent, id, name, isOverlay, refData, type) {
    if (document.getElementById(id)) return;

    const card = document.createElement("div");
    card.style = `
        position: relative; background: #1e293b; border-radius: 12px; padding: 20px; 
        border: 1px solid #334155; box-sizing: border-box; display: flex;
        flex-direction: column; min-width: 0;
    `;

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="color: #38bdf8; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">${name.toUpperCase()}</span>
            <button onclick="removePlot('${id}')" style="background:#ef4444; border:none; color:white; border-radius:4px; padding:4px 10px; cursor:pointer; font-weight:bold;">✕</button>
        </div>
        <div id="${id}" style="height:500px; width:100%;"></div> 
    `;

    parent.appendChild(card);
    activePlotsRegistry.push({ id, type, isOverlay, [isOverlay ? 'channels' : 'channelIdx']: refData });

    setTimeout(() => {
        const gd = document.getElementById(id);
        if (gd) Plotly.Plots.resize(gd);
    }, 150);
}

function removePlot(id) {
    const el = document.getElementById(id);
    if(el) el.parentElement.remove();
    activePlotsRegistry = activePlotsRegistry.filter(p => p.id !== id);
}

// 5. محركات الرسم
function renderSingleFrame(idx, start, win, colorIdx, targetId, targetType) {
    const config = channelConfigs[idx] || { color: colorPalette[idx % colorPalette.length], width: 1.5 };
    const sig = allChannels[idx].slice(start, start + win);
    const trace = createTrace(sig, targetType, channelNames[idx], config.color, config.width);
    Plotly.react(targetId, trace, createLayout(`${channelNames[idx]} (${targetType})`, targetType), {responsive: true});
}

function renderOverlayFrame(indices, currentPos, win, targetId, targetType) {
    const polarMode = document.getElementById("polarMode") ? document.getElementById("polarMode").value : "overlay";
    let traces = [];
    let annotations = [];

    // 🟢 اللمسة السحرية: 2D Intensity Map بتقرأ من الـ Dropdowns الخاصة بيها
    if (targetType === "recurrence") {
        const colorMap = document.getElementById("colorMapSelect") ? document.getElementById("colorMapSelect").value : "Hot";

        // هنا الكود بياخد قيم الـ X والـ Y صراحةً من اختيارات المستخدم
        const v1_idx = parseInt(document.getElementById("xChannelSelect").value);
        const v2_idx = parseInt(document.getElementById("yChannelSelect").value);

        const x_data = allChannels[v1_idx].slice(currentPos, currentPos + win);
        const y_data = allChannels[v2_idx].slice(currentPos, currentPos + win);

        traces = [
            {
                type: 'histogram2dcontour',
                x: x_data, y: y_data,
                colorscale: colorMap,
                showscale: true,
                contours: { coloring: 'heatmap' },
                name: 'Density'
            },
            {
                type: 'scatter',
                x: x_data, y: y_data,
                mode: 'markers',
                marker: { size: 2, color: 'rgba(255,255,255,0.4)' },
                showlegend: false
            }
        ];

        annotations = [{
            xref: 'paper', yref: 'paper', x: 0.5, y: 1.15,
            text: `<b style="color:#38bdf8">X:</b> ${channelNames[v1_idx]} | <b style="color:#fb7185">Y:</b> ${channelNames[v2_idx]}`,
            showarrow: false, font: { size: 14, color: '#cbd5e1' },
            bgcolor: 'rgba(15, 23, 42, 0.8)', bordercolor: '#38bdf8', borderwidth: 1, padding: 8
        }];
    }
    else if (targetType === "polar" && polarMode.startsWith("ratio") && indices.length === 2) {
        const v1_idx = indices[0], v2_idx = indices[1];
        const v1_data = allChannels[v1_idx].slice(currentPos, currentPos + win);
        const v2_data = allChannels[v2_idx].slice(currentPos, currentPos + win);

        let ratioData = polarMode === "ratio_1_2"
            ? v1_data.map((v, i) => v / (v2_data[i] || 1))
            : v2_data.map((v, i) => v / (v1_data[i] || 1));

        traces = [{
            type: 'scatterpolar', r: ratioData, theta: ratioData.map((_, i) => (i / ratioData.length) * 360),
            mode: 'lines', name: `Ratio Curve`, line: { color: '#38bdf8', width: 2.5 }
        }];

        annotations = [{
            xref: 'paper', yref: 'paper', x: 0.5, y: 1.15,
            text: `<b style="color:#fb7185">V1:</b> ${channelNames[v1_idx]} | <b style="color:#34d399">V2:</b> ${channelNames[v2_idx]}`,
            showarrow: false, font: { size: 14, color: '#cbd5e1' },
            bgcolor: 'rgba(15, 23, 42, 0.8)', bordercolor: '#38bdf8', borderwidth: 1, padding: 8
        }];
    } else {
        traces = indices.map(idx => {
            const config = channelConfigs[idx] || { color: colorPalette[idx % colorPalette.length], width: 1.5, isMoving: true };
            const start = config.isMoving ? currentPos : 0;
            const sig = allChannels[idx].slice(start, start + win);
            return createTrace(sig, targetType, channelNames[idx], config.color, config.width)[0];
        });
    }

    const titleMap = {
        "polar": polarMode.startsWith("ratio") ? "Polar Ratio Analysis" : "Overlay View",
        "recurrence": "2D Cumulative Scatter Map"
    };

    const layout = createLayout(titleMap[targetType] || "Overlay View", targetType);
    layout.annotations = annotations;
    layout.margin = { t: 100, b: 40, l: 50, r: 50 };
    Plotly.react(targetId, traces, layout, {responsive: true});
}

function createTrace(sig, type, name, color, width) {
    if (type === "signal") return [{ y: sig, name: name, mode: 'lines', line: { width, color } }];
    if (type === "polar") {
        const theta = sig.map((_, i) => (i / sig.length) * 360);
        return [{ type: 'scatterpolar', r: sig, theta, mode: 'lines', name, line: { color, width } }];
    }
    if (type === "recurrence") return [{ x: sig.slice(0, -1), y: sig.slice(1), mode: 'markers', marker: { size: 3, color }, name }];
    if (type === "xor") {
        const half = Math.floor(sig.length / 2);
        const res = sig.slice(0, half).map((v, i) => Math.abs(v - (sig[half + i] || 0)));
        return [{ y: res, mode: 'lines', fill: 'tozeroy', line: { color, width }, name: `XOR_${name}`, fillcolor: color + '44' }];
    }
    return [];
}

function createLayout(title, type) {
    let layout = {
        autosize: true,
        title: { text: title, font: { color: 'white', size: 16 } },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'rgba(15,23,42,0.5)',
        font: { color: '#cbd5e1' },
        margin: { t: 60, b: 50, l: 50, r: 30 },
        xaxis: { gridcolor: '#334155', zerolinecolor: '#475569' },
        yaxis: { gridcolor: '#334155', zerolinecolor: '#475569' },
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 }
    };
    if (type === "polar") {
        layout.polar = { bgcolor: 'rgba(15, 23, 42, 0.5)', radialaxis: { gridcolor: '#334155', showticklabels: false } };
    }
    return layout;
}

// 6. التحكم في الحركة
function startPlayback() {
    const isOverlay = document.getElementById("layoutStyle").value === "overlay";
    if (isOverlay) toggleOverlayPlay();
    else activePlotsRegistry.forEach(p => { if(!p.isOverlay) toggleIndividualPlay(p.channelIdx); });
}

function toggleIndividualPlay(idx) {
    if (individualPlayback[idx]) { clearInterval(individualPlayback[idx].interval); delete individualPlayback[idx]; }
    else {
        individualPlayback[idx] = { currentPos: 0, interval: setInterval(() => {
            const speed = parseInt(document.getElementById("speedSlider").value);
            const win = parseInt(document.getElementById("timeSlider").value);
            individualPlayback[idx].currentPos += (10 * speed);
            if (individualPlayback[idx].currentPos + win >= allChannels[idx].length) individualPlayback[idx].currentPos = 0;
            activePlotsRegistry.filter(p => p.channelIdx === idx).forEach(plot => renderSingleFrame(idx, individualPlayback[idx].currentPos, win, 0, plot.id, plot.type));
        }, 50)};
    }
}

function toggleOverlayPlay() {
    if (overlayInterval) { clearInterval(overlayInterval); overlayInterval = null; }
    else {
        let pos = 0;
        overlayInterval = setInterval(() => {
            const speed = parseInt(document.getElementById("speedSlider").value);
            const win = parseInt(document.getElementById("timeSlider").value);
            pos += (10 * speed);
            if (pos + win >= allChannels[0].length) pos = 0;
            activePlotsRegistry.filter(p => p.isOverlay).forEach(p => renderOverlayFrame(p.channels, pos, win, p.id, p.type));
        }, 50);
    }
}

function stopAllTimers() {
    Object.values(individualPlayback).forEach(p => clearInterval(p.interval));
    individualPlayback = {};
    if (overlayInterval) { clearInterval(overlayInterval); overlayInterval = null; }
}

function refreshVisiblePlots() {
    const win = parseInt(document.getElementById("timeSlider").value);
    activePlotsRegistry.forEach(plot => {
        if (plot.isOverlay) renderOverlayFrame(plot.channels, 0, win, plot.id, plot.type);
        else renderSingleFrame(plot.channelIdx, 0, win, 0, plot.id, plot.type);
    });
}

function clearPlots() {
    stopAllTimers();
    document.getElementById("chartGrid").innerHTML = "";
    activePlotsRegistry = [];
}

// 7. تفعيل الوظائف والأحداث
window.plotNow = plotNow;
window.startPlayback = startPlayback;
window.stopPlayback = stopAllTimers;
window.runAiAnalysis = runAiAnalysis;
window.removePlot = removePlot;
window.clearPlots = clearPlots;
window.updateConfig = updateConfig;
window.refreshVisiblePlots = refreshVisiblePlots;

window.addEventListener('resize', () => {
    activePlotsRegistry.forEach(plot => {
        const gd = document.getElementById(plot.id);
        if (gd) Plotly.Plots.resize(gd);
    });
});