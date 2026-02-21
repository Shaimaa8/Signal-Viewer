# 🌐 BioSignal AI Platform – Task 1: Signal Viewer

**Online Multi-Modal Signal Viewer with Basic Processing**

This module is part of the **BioSignal AI Platform**, designed for **real-time visualization and analysis** of **medical, acoustic, financial, and microbiome signals**. The Signal Viewer provides interactive visualizations, AI-assisted detection, and classic signal processing algorithms.

---

## 🏗️ Features by Signal Type

### 1️⃣ Medical Signals (ECG/EEG)

* **Multi-Channel Visualization**:

  * View multiple channels simultaneously.
  * Two viewing modes:

    * **Grouped Small Viewers:** One viewer per channel, synchronized controls.
    * **Single Large Viewer:** All channels in one view with toggleable channels and adjustable properties (color, thickness, etc.).
  * Controls: **zoom, pan, play/stop, speed adjustment**.

* **Advanced Visualizations**:

  * **XOR Graph**: Overlapping time chunks plotted with XOR function (identical segments erased).
  * **Polar Graph**: Magnitude vs. time; can display latest segment or cumulative plot.
  * **Recurrence Graph**: Cumulative scatter plot for every two channels.

* **AI-Assisted Abnormality Detection**:

  * Supports **pre-trained multi-channel AI models** (e.g., **ECGNet**, **EfficientNet**).
  * Detects whether signal is **normal or abnormal**, and identifies **type of abnormality**.

* **Classic ML Analysis**:

  * Apply statistical and autocorrelation-based algorithms to detect arrhythmias.
  * Compare results with AI model predictions for validation.

---

### 2️⃣ Acoustic Signals

* **Vehicle-Passing Doppler Effect**:

  * Simulate passing vehicle sound with adjustable **velocity (v)** and **horn frequency (f)**.
  * Estimate **velocity and frequency** of real vehicle sounds using classic DSP algorithms.

* **Drone/Submarine Detection**:

  * Detect unmanned vehicle sounds among environmental noise.
  * Methods: classic algorithms or AI-assisted detection.

---

### 3️⃣ Financial Signals (Stocks, Currencies, Minerals)

* **Real-Time Visualization**:

  * Interactive charts for multiple signal types.
  * Compare trends and historical data.

* **Prediction**:

  * AI-assisted forecasting of future market behavior.
  * Supports multi-type datasets for stocks, currencies, and commodities.

---

### 4️⃣ Microbiome Signals

* **Dataset Integration**:

  * Supports real datasets (e.g., **iHMP, iPOP**).
  * Visualize bacterial/disease profiling and patient status.

* **Patient Profiling**:

  * Estimate patient health profile based on microbiome composition.
  * Interactive visualizations for easy interpretation.

---

## ⚡ Viewer Controls

* Select which channel(s) to display.
* Control **time window**, **chunk size**, and **color maps** for 2D intensity plots.
* Apply AI detection or classic ML algorithms on the opened signal.

---

## 🛠️ Installation & Running

1. **Clone the repository**:

```bash
git clone https://github.com/yourusername/BioSignal-AI-Platform.git
cd BioSignal-AI-Platform
```

2. **Install requirements**:

```bash
pip install -r requirements.txt
```

3. **Run the Flask server**:

```bash
python app.py
```

4. **Open the Signal Viewer**:

* Visit `http://localhost:5000/viewer.html` in your browser.
* Upload or select sample signals to start visualization.

---

## 📁 Project Structure

```text
/BioSignal-AI-Platform
│
├── 🐍 Backend & Logic (Python)
│   ├── app.py                 # Medical signals + AI diagnostics
│   ├── app-Stock.py           # Financial microservice
│   ├── scratch_2.py           # Poincaré & Polar analysis tool
│   └── scratch 5.py           # Experimental visual analysis
│
├── 🌐 Frontend Pages
│   ├── index.html
│   ├── viewer.html
│   ├── sound.html
│   ├── stock.html
│   └── micro.html
│
├── 🎨 CSS Styling
│   ├── style.css
│   ├── sound_style.css
│   ├── style-stock.css
│   └── style-micro.css
│
├── ⚡ JS Logic
│   ├── main.js
│   ├── script.js
│   ├── sound.js
│   ├── sound_logic.js
│   └── microbiome (1).js
│
└── 📊 Data & Assets
    ├── FINAL DATA/            # Stocks, currencies, commodities CSVs
    └── temp_uploads/          # Uploaded files storage
```

---

## 📚 References & Algorithms

* AI models: **ECGNet**, **EfficientNet** (multi-channel classification)
* Classic ML methods: **autocorrelation**, **statistical features**, **spectral analysis**
* DSP methods for acoustic signals: **FFT, Doppler estimation**, **cross-correlation**

---

## 📝 Notes

* Designed for **modular expansion**.
* Users can **upload custom signals** for real-time analysis.
* Interactive visualizations make signal patterns and abnormalities easily interpretable.
