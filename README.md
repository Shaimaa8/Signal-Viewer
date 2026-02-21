# 🌐 BioSignal AI Platform

**BioSignal AI** is a **multi-modal signal analysis platform** for **medical, acoustic, financial, and microbiome applications**.  
It provides **real-time visualization, AI-assisted diagnostics, and advanced analytics** through a modular design.

---

## 🏗️ Project Directory Structure

```text
/BioSignal-AI-Platform
│
├── 🐍 Backend & Logic (Python)
│   ├── app.py                 # Main Flask server (medical signals, uploads, AI diagnostics)
│   ├── app-Stock.py           # Financial microservice (stocks, currencies, commodities)
│   ├── scratch_2.py           # Streamlit tool for geometric analysis (Poincaré & Polar)
│   └── scratch 5.py           # Experimental visual analysis tool
│
├── 🌐 Frontend Pages (Templates)
│   ├── index.html             # Landing page directing to all modules
│   ├── viewer.html            # Multi-channel ECG/EEG viewer
│   ├── sound.html             # Acoustic lab (Doppler & drone detection)
│   ├── stock.html             # Financial dashboard
│   └── micro.html             # Microbiome profiling
│
├── 🎨 Styling (CSS)
│   ├── style.css              # General styling
│   ├── sound_style.css        # Sound lab Dark-mode UI
│   ├── style-stock.css        # Financial dashboard
│   └── style-micro.css        # Microbiome dashboard
│
├── ⚡ Client-Side Logic (JavaScript)
│   ├── main.js                # General data flow & UI updates
│   ├── script.js              # Signal Viewer logic
│   ├── sound.js               # Frequency analysis & audio processing
│   ├── sound_logic.js         # Doppler effect & velocity estimation
│   └── microbiome (1).js      # CSV parsing & biological indices
│
└── 📊 Data & Assets
    ├── FINAL DATA/            # CSV files for stocks, currencies, commodities
    └── temp_uploads/          # Temporary storage for uploaded files
🚀 Key Tasks Overview
🟢 Task 1 – Signal Viewer: Medical Signals

Online signal viewer with AI-assisted analysis.

Features:

Multi-Channel ECG/EEG Visualization

Display N channels, each with four types of abnormalities.

Viewer options:

Default Continuous-Time Viewer – fixed time window with zoom, pan, play/stop, applies to all channels simultaneously.

Group Viewers – N small synchronized viewers.

Single Large Viewer – Show/hide channels, change color/thickness per channel.

Advanced Graphs

XOR Graph – Time chunks plotted with XOR to highlight differences.

Polar Graph – 
𝑟
=
signal magnitude
r=signal magnitude, 
𝜃
=
time
θ=time, cumulative or latest-time display.

Reoccurrence Graph – Cumulative scatter of two channels 
𝑐
ℎ
𝑋
,
𝑐
ℎ
𝑌
chX,chY.

AI & Classic ML Analysis

AI: Pretrained multi-channel model (ECGNet, EfficientNet) detects normal vs abnormal signals and identifies abnormality type.

Classic ML: Statistical-based algorithms (autocorrelation, variance analysis, thresholding) for arrhythmia detection.

Comparison: Users can compare AI vs Classic ML results.

Suggested Screenshot: viewer.html showing multi-channel ECG/EEG with overlay and XOR graph.

🔊 Task 2 – Acoustic Signals
Vehicle-Passing Doppler Effect

Generate expected sound for velocity 
𝑣
v and horn frequency 
𝑓
f.

Estimate speed & frequency from real recordings using classic algorithms.

Equation:

𝑓
′
=
𝑓
𝑣
+
𝑣
𝑟
𝑣
+
𝑣
𝑠
f
′
=f
v+v
s
	​

v+v
r
	​

	​


𝑓
′
f
′
 → observed frequency

𝑓
f → source frequency

𝑣
v → speed of sound

𝑣
𝑟
v
r
	​

 → receiver velocity

𝑣
𝑠
v
s
	​

 → source velocity

Drones/Submarines

Detect unmanned vehicles from real sound data using AI or classic methods.

Frequency-domain filtering and pattern matching.

Suggested Screenshot: sound.html Doppler simulation + drone detection.

💹 Task 3 – Stock-Market / Trading Signals

Visualize and analyze:

Stocks

Currencies

Minerals / Commodities

Predict future trends using:

Statistical methods

Optional ML models

Interactive dashboard with charts & AI predictions.

Suggested Screenshot: stock.html showing candlestick charts and prediction status.

🦠 Task 4 – Microbiome Signals

Load real microbiome datasets (iHMP, iPOP, etc.).

Visualize:

Taxonomic abundance

Diversity indices

Predict patient health status (Healthy vs Diseased) using AI-assisted classification.

Suggested Screenshot: micro.html showing bacterial profiles and patient summary.

🛠️ Installation & Setup

Clone repository & install dependencies

pip install flask pandas numpy plotly librosa scipy streamlit wfdb mne

Run Flask backend

python app.py

Run Streamlit geometric analysis

streamlit run scratch_2.py

Open frontend pages

index.html → main hub

viewer.html → medical signals

sound.html → acoustic lab

stock.html → financial dashboard

micro.html → microbiome analysis

🚧 Roadmap / Work in Progress

 Real-time LSTM stock prediction

 Multi-source Doppler detection

 3D Heatmaps for microbiome data

 Live ECG/EEG hardware integration

📸 Notes & Recommendations

Include screenshots for each module for GitHub appeal.

Keep datasets private (medical, financial).

Highlight AI performance metrics (accuracy, F1-score).

Dark Mode recommended for prolonged clinical/lab usage.
