// static/js/main.js

let currentCategory = 'stock';
let currentAsset = 'AAPL';
let currentViewer = 'standard';
let chartData = null;
let animationInterval = null;

// Initialize on page load
window.onload = function() {
    console.log('Page loaded, loading assets...');
    loadAssets('stock');
    // عرض رسالة ترحيب في مكان الرسم
    showWelcomeMessage();
};

// عرض رسالة ترحيب في مكان الرسم
function showWelcomeMessage() {
    const chartDiv = document.getElementById('main-chart');
    chartDiv.innerHTML = `
        <div class="no-data-message">
            <div>📊</div>
            <h3>No Signal Displayed</h3>
            <p>Select an asset and click <strong>DISPLAY SIGNAL</strong> to view data</p>
            <p style="font-size: 14px; margin-top: 20px;">Choose from list or upload your own CSV file</p>
        </div>
    `;
    
    // مسح المينى فيو
    document.getElementById('mini-standard').innerHTML = '';
    document.getElementById('mini-xor').innerHTML = '';
}

// عرض الإشارة (الوظيفة الرئيسية الجديدة)
function displaySignal() {
    if (!chartData) {
        alert('Please load data first using LOAD FROM LIST or LOAD UPLOADED');
        return;
    }
    
    console.log('Displaying signal:', chartData.symbol);
    renderChart(currentViewer);
    updateInfo(chartData);
    
    // رسالة نجاح
    showNotification(`Displaying ${chartData.symbol}`, 'success');
}

// إظهار إشعار
function showNotification(message, type = 'info') {
    // ممكن نضيف toast notification بعدين
    console.log(`[${type}] ${message}`);
}

// Load assets for category
function loadAssets(category) {
    fetch(`/api/assets/${category}`)
        .then(response => response.json())
        .then(assets => {
            console.log('Assets loaded:', assets);
            const select = document.getElementById('asset-select');
            select.innerHTML = '';
            
            assets.forEach(asset => {
                const option = document.createElement('option');
                option.value = asset.symbol;
                option.textContent = asset.symbol;
                select.appendChild(option);
            });
            
            // مجرد تحميل الأسماء، مش عرض البيانات
            currentAsset = assets[0]?.symbol || 'AAPL';
        })
        .catch(error => {
            console.error('Error loading assets:', error);
        });
}

// عند تغيير الأصل في القائمة
function onAssetChange() {
    const select = document.getElementById('asset-select');
    currentAsset = select.value;
    console.log('Selected asset changed to:', currentAsset);
    // مش بنحمل البيانات تلقائياً، بنستنى المستخدم يضغط LOAD
}

// Load selected asset from dropdown
function loadSelectedAsset() {
    console.log(`Loading data for ${currentCategory}/${currentAsset}`);
    
    fetch(`/api/data/${currentCategory}/${currentAsset}`)
        .then(response => response.json())
        .then(data => {
            console.log('Data received:', data);
            if (data.success) {
                chartData = data;
                showNotification(`Data loaded: ${data.symbol} (${data.prices.length} points)`);
                // مش بنعرض تلقائياً، بنستنى المستخدم يضغط DISPLAY
                // لكن بنحدث معلومات سريعة
                updateMiniInfo(data);
            } else {
                console.error('Error in data:', data.error);
                showNotification('Error loading data: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showNotification('Error loading data', 'error');
        });
}

// تحديث معلومات سريعة (بدون رسم)
function updateMiniInfo(data) {
    // ممكن تحديث بعض المعلومات في الـ UI
    document.getElementById('filename').value = data.symbol + ' - ready to display';
}

// Load uploaded file
function loadUploadedFile() {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first');
        return;
    }
    
    console.log('Uploading file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Upload response:', data);
        if (data.success) {
            chartData = data;
            document.getElementById('filename').value = file.name + ' - ready to display';
            showNotification(`File uploaded: ${file.name}`, 'success');
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
    });
}

// Quick symbol click
function quickSymbol(symbol) {
    console.log('Quick symbol:', symbol);
    
    // Determine category
    let category = 'stock';
    const mineralSymbols = ['GOLD', 'SILVER', 'COPPER', 'OIL'];
    const currencySymbols = ['BTC/USD', 'EUR/USD', 'GBP/USD', 'EGP/USD'];
    
    if (mineralSymbols.includes(symbol)) {
        category = 'mineral';
    } else if (currencySymbols.includes(symbol)) {
        category = 'currency';
    }
    
    currentCategory = category;
    currentAsset = symbol;
    
    // Update UI
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(category === 'mineral' ? 'mineral' : 
                                                     category === 'currency' ? 'currency' : 'stock')) {
            btn.classList.add('active');
        }
    });
    
    // Update data type display
    const typeMap = {
        stock: '📊 STOCK MARKET',
        currency: '💱 CURRENCY',
        mineral: '⛏ MINERAL'
    };
    document.getElementById('data-type-display').textContent = typeMap[category];
    
    // Load assets first
    loadAssets(category);
    
    // Load the symbol data after a short delay
    setTimeout(() => {
        loadSelectedAsset();
    }, 500);
}

// Change viewer type
function changeViewer(type) {
    currentViewer = type;
    
    document.querySelectorAll('.viewer-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // لو في بيانات معروضة، نعيد الرسم
    if (chartData && document.getElementById('main-chart').children.length > 1) {
        renderChart(type);
    }
}

// Switch main view (tabs)
function switchMainView(type) {
    currentViewer = type;
    
    document.querySelectorAll('.viewer-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // لو في بيانات معروضة، نعيد الرسم
    if (chartData && document.getElementById('main-chart').children.length > 1) {
        renderChart(type);
    }
}

// Render chart based on type
function renderChart(type) {
    if (!chartData) return;
    
    const chartDiv = document.getElementById('main-chart');
    
    if (type === 'standard') {
        renderStandard(chartDiv);
    } else if (type === 'xor') {
        renderXOR(chartDiv);
    } else if (type === 'polar') {
        renderPolar(chartDiv);
    } else if (type === 'recurrence') {
        renderRecurrence(chartDiv);
    }
    
    // Update mini viewers
    setTimeout(() => updateMiniViewers(), 100);
}

// Standard chart
function renderStandard(div) {
    const trace = {
        x: chartData.dates,
        y: chartData.prices,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#38bdf8', width: 2 },
        name: chartData.symbol
    };
    
    const layout = {
        title: {
            text: `${chartData.symbol} - Standard View`,
            font: { color: '#f1f5f9', size: 16 }
        },
        xaxis: { 
            title: 'Date', 
            gridcolor: '#334155',
            color: '#94a3b8',
            tickfont: { size: 11 }
        },
        yaxis: { 
            title: 'Price', 
            gridcolor: '#334155',
            color: '#94a3b8',
            tickfont: { size: 11 }
        },
        paper_bgcolor: '#1e293b',
        plot_bgcolor: '#1e293b',
        font: { color: '#f1f5f9' },
        margin: { l: 60, r: 40, t: 60, b: 60 },
        showlegend: true,
        legend: { font: { color: '#f1f5f9' } },
        hovermode: 'x unified'
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
        displaylogo: false
    };
    
    Plotly.newPlot(div, [trace], layout, config);
}

// XOR chart
function renderXOR(div) {
    const prices = chartData.prices;
    const chunkSize = 30;
    const chunks = [];
    
    for (let i = 0; i < prices.length; i += chunkSize) {
        chunks.push(prices.slice(i, i + chunkSize));
    }
    
    const traces = [];
    for (let i = 1; i < chunks.length; i++) {
        const minLen = Math.min(chunks[i-1].length, chunks[i].length);
        const xorData = [];
        const xorDates = chartData.dates.slice(i * chunkSize, i * chunkSize + minLen);
        
        for (let j = 0; j < minLen; j++) {
            const diff = Math.abs(chunks[i-1][j] - chunks[i][j]);
            xorData.push(diff > 5 ? chunks[i][j] : null);
        }
        
        traces.push({
            x: xorDates,
            y: xorData,
            type: 'scatter',
            mode: 'lines',
            name: `Segment ${i}`,
            line: { color: `hsl(${i * 30}, 70%, 60%)`, width: 1.5 }
        });
    }
    
    const layout = {
        title: {
            text: `${chartData.symbol} - XOR View (Chunk Size: 30 days)`,
            font: { color: '#f1f5f9' }
        },
        paper_bgcolor: '#1e293b',
        plot_bgcolor: '#1e293b',
        font: { color: '#f1f5f9' },
        xaxis: { 
            gridcolor: '#334155',
            color: '#94a3b8'
        },
        yaxis: { 
            gridcolor: '#334155',
            color: '#94a3b8'
        },
        hovermode: 'x unified'
    };
    
    Plotly.newPlot(div, traces, layout);
}

// Polar chart
function renderPolar(div) {
    const r = chartData.prices.slice(-100);
    const theta = Array.from({length: r.length}, (_, i) => i);
    
    const trace = {
        r: r,
        theta: theta,
        type: 'scatterpolar',
        mode: 'lines+markers',
        line: { color: '#38bdf8', width: 2 },
        marker: { size: 3, color: '#38bdf8' },
        name: chartData.symbol
    };
    
    const layout = {
        title: {
            text: `${chartData.symbol} - Polar View (Last 100 points)`,
            font: { color: '#f1f5f9' }
        },
        paper_bgcolor: '#1e293b',
        font: { color: '#f1f5f9' },
        polar: {
            bgcolor: '#1e293b',
            radialaxis: { 
                gridcolor: '#334155', 
                color: '#94a3b8',
                tickfont: { size: 10 }
            },
            angularaxis: { 
                gridcolor: '#334155', 
                color: '#94a3b8',
                tickfont: { size: 10 }
            }
        }
    };
    
    Plotly.newPlot(div, [trace], layout);
}

// Recurrence chart
function renderRecurrence(div) {
    const prices = chartData.prices;
    const x = prices.slice(0, -1);
    const y = prices.slice(1);
    
    const trace = {
        x: x,
        y: y,
        type: 'scatter',
        mode: 'markers',
        marker: {
            size: 4,
            color: y,
            colorscale: 'Viridis',
            showscale: true,
            colorbar: {
                title: 'Price',
                titleside: 'right',
                tickfont: { size: 10 }
            }
        },
        name: chartData.symbol
    };
    
    const layout = {
        title: {
            text: `${chartData.symbol} - Recurrence Plot (Price[t] vs Price[t+1])`,
            font: { color: '#f1f5f9' }
        },
        xaxis: { 
            title: 'Price[t]', 
            gridcolor: '#334155',
            color: '#94a3b8'
        },
        yaxis: { 
            title: 'Price[t+1]', 
            gridcolor: '#334155',
            color: '#94a3b8'
        },
        paper_bgcolor: '#1e293b',
        plot_bgcolor: '#1e293b',
        font: { color: '#f1f5f9' },
        hovermode: 'closest'
    };
    
    Plotly.newPlot(div, [trace], layout);
}

// Update info panel
function updateInfo(data) {
    const prices = data.prices;
    const lastPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice * 100).toFixed(2);
    
    document.getElementById('info-symbol').textContent = data.symbol;
    document.getElementById('info-current').textContent = `$${lastPrice.toFixed(2)}`;
    document.getElementById('info-change').textContent = 
        `${change > 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)`;
    document.getElementById('current-price').textContent = `$${lastPrice.toFixed(2)}`;
    document.getElementById('min-value').textContent = `$${Math.min(...prices).toFixed(2)}`;
    document.getElementById('max-value').textContent = `$${Math.max(...prices).toFixed(2)}`;
    
    if (data.volume) {
        const avgVolume = (data.volume.slice(-5).reduce((a,b) => a + b, 0) / 5).toFixed(0);
        document.getElementById('info-volume').textContent = parseInt(avgVolume).toLocaleString();
    } else {
        document.getElementById('info-volume').textContent = '—';
    }
}

// Update mini viewers
function updateMiniViewers() {
    if (!chartData) return;
    
    try {
        // Mini standard
        Plotly.newPlot('mini-standard', [{
            x: chartData.dates.slice(-50),
            y: chartData.prices.slice(-50),
            type: 'scatter',
            mode: 'lines',
            line: { color: '#38bdf8', width: 1 }
        }], {
            paper_bgcolor: '#0f172a',
            plot_bgcolor: '#0f172a',
            showlegend: false,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            xaxis: { showticklabels: false, showgrid: false, zeroline: false },
            yaxis: { showticklabels: false, showgrid: false, zeroline: false }
        });
        
        // Mini XOR
        const prices = chartData.prices.slice(-100);
        const chunkSize = 20;
        const chunks = [];
        for (let i = 0; i < prices.length; i += chunkSize) {
            chunks.push(prices.slice(i, i + chunkSize));
        }
        
        if (chunks.length > 1) {
            Plotly.newPlot('mini-xor', [{
                y: chunks[1],
                type: 'scatter',
                mode: 'lines',
                line: { color: '#38bdf8' }
            }], {
                paper_bgcolor: '#0f172a',
                plot_bgcolor: '#0f172a',
                showlegend: false,
                margin: { l: 0, r: 0, t: 0, b: 0 },
                xaxis: { showticklabels: false, showgrid: false },
                yaxis: { showticklabels: false, showgrid: false }
            });
        }
    } catch (error) {
        console.error('Error updating mini viewers:', error);
    }
}

// Play animation
function playSignal() {
    if (!chartData) return;
    
    if (animationInterval) clearInterval(animationInterval);
    
    let pos = 0;
    animationInterval = setInterval(() => {
        pos += 10;
        Plotly.relayout('main-chart', {
            'xaxis.range': [pos, pos + 100]
        });
    }, 100);
}

// Stop animation
function stopSignal() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

// Toggle prediction controls
function togglePrediction() {
    const controls = document.getElementById('prediction-controls');
    controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
}

// Run prediction
function runPrediction() {
    if (!chartData) {
        alert('Please load and display data first');
        return;
    }
    
    alert('Prediction feature coming soon!');
}