# README.md - Signal Viewer AI Platform

![Home Page](docs/images/Home%20Page.jpeg)

<div align="center">
  <h1>🔬 Signal Viewer AI Platform</h1>
  <p><strong>Multi-Modal Signal Analysis with Deep Learning</strong></p>
  <p>DSP Course - Task 01 | Team 08 | Spring 2026</p>
</div>

---

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Module Documentation](#module-documentation)
- [Model Architectures](#model-architectures)
- [Feature Engineering](#feature-engineering)
- [Screenshots Gallery](#screenshots-gallery)
- [Demo Video](#demo-video)
- [Requirements](#requirements)
- [Training Scripts](#training-scripts)
- [Team](#team)

---

## 🎯 Overview

**Signal Viewer AI** is an integrated web-based platform for analyzing four distinct types of signals using state-of-the-art deep learning models and classic signal processing algorithms. The platform provides real-time visualization, AI-powered classification, and comprehensive analysis across multiple domains.

| Module | Signals | Data Sources |
|--------|---------|--------------|
| 🫀 Medical | ECG, EEG | MIT-BIH Arrhythmia, CHB-MIT Scalp EEG |
| 🦠 Microbiome | Taxonomic Profiles | iHMP, taxonomic_profiles.tsv |
| 📈 Trading | Stocks, Currencies, Minerals | Yahoo Finance, Historical Data |
| 🔊 Acoustic | Vehicle, Drone Sounds | Real recordings (WhatsApp Audio/Video) |

---

## ✨ Key Features

### 🫀 **Medical Signal Analysis**
- **Multi-channel visualization** for ECG/EEG with 7 abnormality types:
  - Atrial Fibrillation (AFib)
  - Bradycardia
  - Fusion & Unknown beats (F+Q)
  - Normal Sinus Rhythm
  - ST-Elevation (STEMI)
  - Supraventricular (S)
  - Tachycardia
  - Ventricular ectopic beats

- **AI-based classification** using HuBERT model
- **Classic ML comparison** using statistical features + autocorrelation
- **4 Viewer Types**:
  - Continuous time-domain
  - XOR abnormality detection
  - Polar magnitude-time plots
  - Recurrence scatter plots
- **Channel customization**: Color, thickness, show/hide per channel

### 🔊 **Acoustic Signal Analysis**
- **Doppler effect simulator** with adjustable velocity (1-300 m/s) and frequency (100-2000 Hz)
- **Real vehicle analysis**: Upload car passing recordings
- **Drone detection** using frequency analysis on real drone audio/video
- **Audio playback** with play/pause controls
- **Download generated sounds** as WAV files

### 📈 **Trading Signal Analysis**
- **Multi-category support**: Stocks, currencies, minerals
- **LSTM-based prediction** with 5-365 day horizon
- **Multiple chart types**:
  - Candlestick + Volume
  - Moving Average overlays
  - Bollinger Bands
  - Volatility analysis
  - Seasonality patterns
- **View modes**: Static or over-time animation
- **Confidence intervals** for predictions (95%)

### 🦠 **Microbiome Analysis**
- **Disease prediction**: CD, UC, Healthy, nonIBD using iHMP dataset
- **Diversity metrics**: Shannon Index, F/B Ratio
- **Clinical reporting** with personalized recommendations
- **Interactive visualizations**:
  - Bar charts for top taxa
  - Radar plots for microbial profiles
  - Progress bars for beneficial/pathogen levels

---

## 📁 Project Structure

```
SIGNAL_VIEWER/
│
├── app.py                          # Main Flask application (2000+ lines)
│
├── Data/                            # Comprehensive signal datasets
│   ├── Acoustic Signals/
│   │   ├── car/                    # Vehicle passing sounds (WhatsApp Audio)
│   │   │   ├── WhatsApp Audio 2026-02-18 at 6.53.14 PM.mpeg
│   │   │   └── WhatsApp Audio 2026-02-18 at 6.53.15 PM.mpeg
│   │   └── Drones/                  # Drone audio/video samples
│   │       ├── WhatsApp Audio 2026-02-18 at 6.53.12 PM.mpeg
│   │       └── WhatsApp Video 2026-02-18 at 6.53.13 PM.mp4
│   │
│   ├── Medical Signals/
│   │   ├── ECG Data/                # MIT-BIH Arrhythmia Database
│   │   │   ├── Atrial Fibrillation (AFib)/
│   │   │   │   ├── 04015.dat
│   │   │   │   ├── 04015.hea
│   │   │   │   └── 04015.hea-
│   │   │   │
│   │   │   ├── Bradycardia/
│   │   │   │   ├── 202.dat
│   │   │   │   └── 202.hea
│   │   │   │
│   │   │   ├── Fusion & Unknown (F + Q)/
│   │   │   │   ├── 207.atr
│   │   │   │   ├── 207.dat
│   │   │   │   └── 207.hea
│   │   │   │
│   │   │   ├── Normal Sinus Rhythm/
│   │   │   │   ├── 19090.atr
│   │   │   │   ├── 19090.dat
│   │   │   │   ├── 19090.hea
│   │   │   │   └── 19090.xws
│   │   │   │
│   │   │   ├── ST-Elevation (STEMI)/
│   │   │   │   ├── s0015lre.dat
│   │   │   │   ├── s0015lre.hea
│   │   │   │   └── s0015lre.xyz
│   │   │   │
│   │   │   ├── Supraventricular (S)/
│   │   │   │   ├── 200.atr
│   │   │   │   ├── 200.dat
│   │   │   │   ├── 200.hea
│   │   │   │   └── 200.xws
│   │   │   │
│   │   │   ├── Tachycardia/
│   │   │   │   ├── 100.atr
│   │   │   │   ├── 100.dat
│   │   │   │   ├── 100.hea
│   │   │   │   └── 100.xws
│   │   │   │
│   │   │   └── Ventricular ectopic beats/
│   │   │       ├── 214.atr
│   │   │       ├── 214.dat
│   │   │       ├── 214.hea
│   │   │       └── 214.xws
│   │   │
│   │   └── EEG/                      # CHB-MIT Scalp EEG Database
│   │       ├── Epileptic Seizure/
│   │       │   ├── chb01_03.edf
│   │       │   ├── chb01_03.edf.seizures
│   │       │   └── chb01_04.edf.seizures
│   │       │
│   │       ├── Normal/
│   │       │   ├── S001R01.edf
│   │       │   └── S001R02.edf
│   │       │
│   │       └── Sleep Disorder/
│   │           ├── sc4002e0.hyp
│   │           └── sc4002e0.rec
│   │
│   ├── Microbiome Signals/
│   │   ├── iHMP_data.csv            # Integrative Human Microbiome Project
│   │   └── taxonomic_profiles.tsv   # Taxonomic abundance data
│   │
│   └── Trading Signals/
│       ├── currencies/               # Currency pairs data
│       ├── minerals/                 # Mineral commodities
│       └── Stock/                     # Stock market data
│
├── Models/                           # Pre-trained models and training scripts
│   ├── Medical/
│   │   ├── hubert_ecg.py             # HuBERT model for ECG
│   │   ├── train_model(1).py          # Training script
│   │   ├── model-ecg.py               # ECG model definition
│   │   ├── classification.py           # Classification utilities
│   │   ├── ecg_classifier.pkl         # Trained classifier
│   │   ├── model.safetensors          # HuBERT weights
│   │   └── config.json                 # Model configuration
│   │
│   ├── Microbiome/
│   │   ├── microbiome_model.pkl       # Random Forest model
│   │   ├── model_features.pkl         # Feature names
│   │   ├── iHMP_data.csv              # Training data
│   │   └── train_model (1).py          # Training script
│   │
│   ├── Trading/
│   │   ├── __init__.py
│   │   ├── global_lstm.py             # LSTM model definition
│   │   ├── prepare_data.py             # Data preprocessing
│   │   └── train_global_lstm.py        # Training script
│   │
│   └── saved/                         # Trained LSTM models
│       ├── asset_mapping.json          # Asset name mappings
│       ├── global_lstm_model_metadata.pkl
│       ├── global_lstm_model_scaler_x.pkl
│       ├── global_lstm_model_scaler_y.pkl
│       ├── global_lstm_model.h5
│       └── training_data.csv
│
├── static/                            # Frontend assets
│   ├── CSS/
│   │   ├── sound_style.css
│   │   ├── style-micro.css
│   │   ├── style-stock.css
│   │   └── style.css
│   │
│   └── JS/
│       ├── script.js                    # Medical viewer logic
│       ├── sound_logic.js                # Acoustic analysis
│       └── sound.js                       # Doppler simulation
│
├── Templates/                          # HTML pages
│   ├── index.html                       # Home page
│   ├── viewer.html                       # Medical viewer
│   ├── sound.html                         # Acoustic analysis
│   ├── stock.html                          # Trading analysis
│   └── micro.html                           # Microbiome analysis
│
├── docs/                                 # Documentation
│   ├── images/                             # Screenshots (40+ files)
│   │   ├── Medical/                         # 15+ medical screenshots
│   │   │   ├── 2 Channel Polar .jpeg
│   │   │   ├── 2 Channel Polar.jpeg
│   │   │   ├── 2D cumulative Scatter.jpeg
│   │   │   ├── AI Comparison .jpeg
│   │   │   ├── All Views.jpeg
│   │   │   ├── EEG - polar&XOR views .jpeg
│   │   │   ├── EEG signal.jpeg
│   │   │   ├── Midecal page.jpeg
│   │   │   ├── overlay polar view.jpeg
│   │   │   ├── overlay view.jpeg
│   │   │   ├── overlay XOR view .jpeg
│   │   │   ├── Select Channels & color .jpeg
│   │   │   ├── Select Type .jpeg
│   │   │   ├── Select Type 2 .jpeg
│   │   │   ├── Single channel Polar.jpeg
│   │   │   └── Single Channel View.jpeg
│   │   │
│   │   ├── Trading/                          # 12+ trading screenshots
│   │   │   ├── AAPL Stock File Over Time .jpeg
│   │   │   ├── AAPL Stock File Static .jpeg
│   │   │   ├── AAPL Stock File With Prediction.jpeg
│   │   │   ├── Candlestick + Volume Chart overtime.jpeg
│   │   │   ├── Currencies – All Charts (over time).jpeg
│   │   │   ├── Currencies – All Charts (Static).jpeg
│   │   │   ├── Line Chart .jpeg
│   │   │   ├── Minerals-All Charts(overtime).jpeg
│   │   │   ├── Minerals-All Charts(Static).jpeg
│   │   │   ├── Stock-All Charts(overtime).jpeg
│   │   │   ├── StockPage.jpeg
│   │   │   └── Upload file in stock page .jpeg
│   │   │
│   │   ├── Acoustic Page.jpeg
│   │   ├── Home Page.jpeg
│   │   └── Microbine .jpeg
│   │
│   └── Video/
│       └── signal_viewer_demo.mp4           # 3-min demo video
│
└── requirements.txt                    # Python dependencies
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.8+
- 8GB RAM (minimum)
- 4GB free disk space

### Installation (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/your-repo/SIGNAL_VIEWER.git
cd SIGNAL_VIEWER

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run application
python app.py

# 5. Open browser
http://127.0.0.1:5000
```

---

## 📚 Module Documentation

### 🫀 Medical Viewer (`/viewer`)

#### Supported ECG Abnormalities
| Category | Files | Description |
|----------|-------|-------------|
| Atrial Fibrillation (AFib) | 04015.dat, .hea | Irregular heartbeat |
| Bradycardia | 202.dat, .hea | Slow heart rate (<60 BPM) |
| Fusion & Unknown | 207.atr, .dat, .hea | Combined beats |
| Normal Sinus Rhythm | 19090.* | Healthy rhythm |
| ST-Elevation (STEMI) | s0015lre.* | Heart attack indicator |
| Supraventricular (S) | 200.* | Upper chamber arrhythmia |
| Tachycardia | 100.* | Fast heart rate (>100 BPM) |
| Ventricular ectopic | 214.* | Lower chamber premature beats |

#### Supported EEG Conditions
| Category | Files | Description |
|----------|-------|-------------|
| Epileptic Seizure | chb01_03.edf, .seizures | Seizure activity |
| Normal | S001R01.edf, S001R02.edf | Healthy brain activity |
| Sleep Disorder | sc4002e0.hyp, .rec | Sleep patterns |

#### Feature Engineering - Classic ML

The classic ML algorithm extracts the following statistical features:

| Feature | Description | Clinical Significance |
|---------|-------------|----------------------|
| **SDNN** | Standard deviation of NN intervals | Overall heart rate variability |
| **RMSSD** | Root mean square of successive differences | Parasympathetic activity |
| **BPM** | Beats per minute | Heart rate |
| **RR Intervals** | Time between consecutive R-peaks | Beat-to-beat variation |
| **Autocorrelation** | Signal self-similarity | Periodicity detection |
| **Peak Prominence** | Height of R-peaks | Signal quality |

```python
# Example feature extraction
rr_intervals = np.diff(peaks) / fs
sdnn = np.std(rr_intervals)
rmssd = np.sqrt(np.mean(np.diff(rr_intervals) ** 2))
bpm = (len(peaks) / duration) * 60
```

### 🔊 Acoustic Analysis (`/sound`)

#### Doppler Simulator
- **Velocity range**: 1-300 m/s
- **Frequency range**: 100-2000 Hz
- **Duration**: 5 seconds
- **Envelope**: Triangular amplitude modulation

```python
# Doppler frequency calculation
f_approach = f * (v_sound + v) / (v_sound - v)
f_recede = f * (v_sound - v) / (v_sound + v)
```

#### Vehicle Detection Algorithm

The classic algorithm uses:
1. **Band-pass filter** (100-600 Hz) - removes noise
2. **Window segmentation** (0.5s windows) - temporal analysis
3. **Autocorrelation** - finds fundamental frequency
4. **Velocity estimation** using Doppler equation

```python
def estimate_frequency(segment, sample_rate):
    # Autocorrelation-based frequency estimation
    correlations = np.correlate(segment, segment, mode='full')
    peak_lag = find_peak_lag(correlations)
    return sample_rate / peak_lag
```

#### Drone Detection
- **Frequency range**: 50-500 Hz (drone propeller noise)
- **Window size**: 100ms sliding windows
- **Threshold**: 150-800 Hz for classification

### 📈 Trading Analysis (`/stock`)

#### Feature Engineering for LSTM

The LSTM model uses 5 technical indicators:

| Feature | Calculation | Purpose |
|---------|-------------|---------|
| **Open** | Raw opening price | Market sentiment |
| **High** | Daily maximum | Volatility |
| **Low** | Daily minimum | Support levels |
| **Close** | Raw closing price | Primary prediction target |
| **Volume** | Trading volume | Market participation |

Additional derived features (in code but not shown in UI):
- **Returns**: log(close / close_shifted)
- **Volatility**: rolling standard deviation
- **RSI**: Relative Strength Index
- **MACD**: Moving Average Convergence Divergence

```python
# Example from prepare_data.py
def create_sequences(data, seq_length=60):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i+seq_length])
        y.append(data[i+seq_length, 3])  # Close price
    return np.array(X), np.array(y)
```

### 🦠 Microbiome Analysis (`/microbiome`)

#### Feature Engineering

The Random Forest model uses:

| Feature Type | Examples | Biological Significance |
|--------------|----------|------------------------|
| **Phylum level** | Firmicutes, Bacteroidetes | Major gut divisions |
| **Genus level** | Faecalibacterium, Bifidobacterium | Beneficial bacteria |
| **Species level** | E. coli, Shigella | Pathogen detection |
| **Diversity metrics** | Shannon Index | Overall health |
| **Ratios** | F/B Ratio | Metabolic efficiency |

```python
# Feature calculation
shannon_index = -sum(p * log(p) for p in relative_abundance)
fb_ratio = firmicutes_sum / (bacteroidetes_sum + 1e-8)
beneficial_pct = sum(beneficial_genera) * 100
```

---

## 🧠 Model Architectures

### Medical: HuBERT + SVM

```python
# From hubert_ecg.py
class HuBERTECG:
    def __init__(self):
        self.encoder = AutoModel.from_pretrained("facebook/hubert-base-ls960")
        self.classifier = SVM(kernel='rbf')
    
    def extract_features(self, ecg_signal):
        # Input: 187-sample ECG segment
        # Output: 768-dimensional embedding
        with torch.no_grad():
            outputs = self.encoder(ecg_tensor)
            features = outputs.last_hidden_state.mean(dim=1)
        return features.numpy()
```

### Trading: Global LSTM

```python
# From global_lstm.py
class GlobalLSTM:
    def __init__(self):
        self.model = Sequential([
            LSTM(256, return_sequences=True, input_shape=(60, 5)),
            Dropout(0.2),
            LSTM(128, return_sequences=True),
            Dropout(0.2),
            LSTM(64),
            Dense(32, activation='relu'),
            Dense(1)  # Next day price
        ])
        self.model.compile(optimizer='adam', loss='mse')
```

### Microbiome: Random Forest

```python
# From train_model (1).py
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    random_state=42
)
rf_model.fit(X_train, y_train)
```

---

## 🔬 Feature Engineering Deep Dive

### Medical Signal Features

**Classic ML Algorithm** (`app.py` lines 340-390):

```python
# 1. R-peak detection
peaks, _ = scipy.signal.find_peaks(
    signal, 
    distance=int(0.4 * fs),  # Minimum 0.4 seconds between beats
    prominence=0.5            # Peak height threshold
)

# 2. Heart rate calculation
bpm = (len(peaks) / duration) * 60

# 3. HRV features
rr_intervals = np.diff(peaks) / fs
sdnn = np.std(rr_intervals)                    # Overall variability
rmssd = np.sqrt(np.mean(np.diff(rr_intervals) ** 2))  # Short-term variability

# 4. Autocorrelation features
autocorr = np.correlate(signal, signal, mode='full')
autocorr = autocorr[len(autocorr)//2:]  # Take positive lags

# 5. Classification rules
if sdnn > 0.12 or rmssd > 0.12:
    result = "Arrhythmia Suspected"
elif bpm > 100:
    result = "Tachycardia"
elif bpm < 50:
    result = "Bradycardia"
else:
    result = "Normal Rhythm"
```

### Acoustic Features

**Frequency Estimation** (`sound_logic.js` lines 120-150):

```javascript
function estimateFrequency(segment, sampleRate, minF=100, maxF=800) {
    // Band-pass filter to isolate relevant frequencies
    const filtered = bandPassFilter(segment, sampleRate, minF, maxF);
    
    // Autocorrelation for periodicity detection
    let maxCorr = 0, bestLag = -1;
    for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        for (let i = 0; i < size - lag; i++) {
            corr += filtered[i] * filtered[i + lag];
        }
        if (corr > maxCorr) {
            maxCorr = corr;
            bestLag = lag;
        }
    }
    return sampleRate / bestLag;
}
```

### Microbiome Features

**Diversity Metrics** (`app.py` lines 170-190):

```python
def calculate_shannon(data):
    """Shannon diversity index (H)"""
    p = data[data > 0]  # Remove zero abundances
    if len(p) == 0: 
        return 0
    return -np.sum(p * np.log(p))

def fb_ratio(sample):
    """Firmicutes/Bacteroidetes ratio"""
    firmicutes = sample[sample.index.str.contains('p__Firmicutes')].sum()
    bacteroidetes = sample[sample.index.str.contains('p__Bacteroidetes')].sum()
    return firmicutes / (bacteroidetes + 1e-8)
```

---

## 📸 Screenshots Gallery

### Medical Module

| View Type | Screenshot |
|-----------|------------|
| **Medical Page** | ![Medical Page](docs/images/Medical/Midecal%20page.jpeg) |
| **Single Channel** | ![Single Channel](docs/images/Medical/Single%20Channel%20View.jpeg) |
| **Overlay View** | ![Overlay](docs/images/Medical/overlay%20view.jpeg) |
| **Polar View** | ![Polar](docs/images/Medical/Single%20channel%20Polar.jpeg) |
| **2D Scatter** | ![2D Scatter](docs/images/Medical/2D%20cumulative%20Scatter.jpeg) |
| **AI Comparison** | ![AI Comparison](docs/images/Medical/AI%20Comparison%20.jpeg) |
| **2 Channel Polar** | ![2 Channel Polar](docs/images/Medical/2%20Channel%20Polar%20.jpeg) |
| **All Views** | ![All Views](docs/images/Medical/All%20Views.jpeg) |
| **EEG Polar/XOR** | ![EEG Polar](docs/images/Medical/EEG%20-%20polar&XOR%20views%20.jpeg) |
| **EEG Signal** | ![EEG Signal](docs/images/Medical/EEG%20signal.jpeg) |
| **Overlay Polar** | ![Overlay Polar](docs/images/Medical/overlay%20polar%20view.jpeg) |
| **Overlay XOR** | ![Overlay XOR](docs/images/Medical/overlay%20XOR%20view%20.jpeg) |
| **Channel Selection** | ![Channels](docs/images/Medical/Select%20Channels%20%26%20color%20.jpeg) |
| **Select Type** | ![Select Type](docs/images/Medical/Select%20Type%20.jpeg) |
| **Select Type 2** | ![Select Type 2](docs/images/Medical/Select%20Type%202%20.jpeg) |

### Trading Module

| Category | Screenshot |
|----------|------------|
| **Stock Page** | ![Stock Page](docs/images/Trading/StockPage.jpeg) |
| **Upload File** | ![Upload](docs/images/Trading/Upload%20file%20in%20stock%20page%20.jpeg) |
| **AAPL Static** | ![AAPL Static](docs/images/Trading/AAPL%20Stock%20File%20Static%20.jpeg) |
| **AAPL Overtime** | ![AAPL Overtime](docs/images/Trading/AAPL%20Stock%20File%20Over%20Time%20.jpeg) |
| **With Prediction** | ![Prediction](docs/images/Trading/AAPL%20Stock%20File%20With%20Prediction.jpeg) |
| **Candlestick** | ![Candlestick](docs/images/Trading/Candlestick%20%2B%20Volume%20Chart%20overtime.jpeg) |
| **Line Chart** | ![Line Chart](docs/images/Trading/Line%20Chart%20.jpeg) |
| **Currencies Static** | ![Currencies Static](docs/images/Trading/Currencies%20–%20All%20Charts%20(Static).jpeg) |
| **Currencies Overtime** | ![Currencies Overtime](docs/images/Trading/Currencies%20–%20All%20Charts%20(over%20time).jpeg) |
| **Minerals Static** | ![Minerals Static](docs/images/Trading/Minerals-All%20Charts(Static).jpeg) |
| **Minerals Overtime** | ![Minerals Overtime](docs/images/Trading/Minerals-All%20Charts(overtime).jpeg) |
| **Stock All Charts Static** | ![Stock Static](docs/images/Trading/Stock-All%20Charts(Static).jpeg) |
| **Stock All Charts Overtime** | ![Stock Overtime](docs/images/Trading/Stock-All%20Charts(overtime).jpeg) |

### Acoustic & Home

| Page | Screenshot |
|------|------------|
| **Home Page** | ![Home](docs/images/Home%20Page.jpeg) |
| **Acoustic Page** | ![Acoustic](docs/images/Acoustic%20Page.jpeg) |
| **Microbiome Page** | ![Microbiome](docs/images/Microbine%20.jpeg) |

---

## 🎥 Demo Video

[![Demo Video](docs/images/Home%20Page.jpeg)](docs/Video/signal_viewer_demo.mp4)

*Click image above to watch the 3-minute demonstration video*

**Video Contents:**
- 0:00 - Home page overview
- 0:30 - Medical viewer with 8 abnormality types
- 1:15 - Acoustic Doppler simulation with real car sounds
- 1:45 - Drone detection using real recordings
- 2:15 - Trading analysis with LSTM prediction (AAPL example)
- 2:45 - Microbiome profiling with iHMP dataset

---

## 📦 Requirements

```txt
# Core Dependencies
flask==2.3.3
pandas==2.1.3
numpy==1.24.3
scipy==1.11.4
joblib==1.3.2

# Medical Signal Processing
wfdb==4.1.2
mne==1.6.1
torch==2.1.2
transformers==4.36.2

# Acoustic Processing
librosa==0.10.1

# Trading & ML
tensorflow==2.15.0
scikit-learn==1.3.2

# Visualization
plotly==5.18.0

# Utilities
requests==2.31.0
python-dotenv==1.0.0
```

---

## 🏋️ Training Scripts

### Medical Model Training (`Models/Medical/train_model(1).py`)

```python
# HuBERT feature extraction + SVM classification
def train_medical_model():
    # Load ECG data from 8 abnormality classes
    data, labels = load_ecg_data()
    
    # Extract HuBERT features
    features = []
    for ecg in data:
        feat = hubert_model.extract_features(ecg)
        features.append(feat)
    
    # Train SVM classifier
    svm = SVC(kernel='rbf', probability=True)
    svm.fit(features, labels)
    
    # Save model
    joblib.dump(svm, 'ecg_classifier.pkl')
```

### Microbiome Training (`Models/Microbiome/train_model (1).py`)

```python
# Random Forest for disease classification
def train_microbiome_model():
    # Load iHMP dataset
    df = pd.read_csv('iHMP_data.csv', index_col=0)
    
    # Feature engineering
    X = df.drop('diagnosis', axis=1)
    y = df['diagnosis']
    
    # Train Random Forest
    rf = RandomForestClassifier(n_estimators=100)
    rf.fit(X, y)
    
    # Save model and feature names
    joblib.dump(rf, 'microbiome_model.pkl')
    joblib.dump(X.columns.tolist(), 'model_features.pkl')
```

### Trading LSTM Training (`Models/Trading/train_global_lstm.py`)

```python
# Global LSTM for multi-asset prediction
def train_trading_model():
    # Load all assets
    data = load_all_assets()
    
    # Create sequences (60 days)
    X, y = create_sequences(data, seq_length=60)
    
    # Scale features
    scaler_x = MinMaxScaler()
    scaler_y = MinMaxScaler()
    X_scaled = scaler_x.fit_transform(X.reshape(-1, X.shape[-1])).reshape(X.shape)
    y_scaled = scaler_y.fit_transform(y.reshape(-1, 1))
    
    # Build LSTM
    model = Sequential([
        LSTM(256, return_sequences=True, input_shape=(60, 5)),
        Dropout(0.2),
        LSTM(128, return_sequences=True),
        Dropout(0.2),
        LSTM(64),
        Dense(32, activation='relu'),
        Dense(1)
    ])
    
    # Train
    model.fit(X_scaled, y_scaled, epochs=50, batch_size=32)
    
    # Save model and scalers
    model.save('saved/global_lstm_model.h5')
    joblib.dump(scaler_x, 'saved/global_lstm_model_scaler_x.pkl')
    joblib.dump(scaler_y, 'saved/global_lstm_model_scaler_y.pkl')
```

---

## 📝 License

This project is created for educational purposes as part of the **Digital Signal Processing Course** - Task 01: Signal Viewer with Basic Processing.

**Course:** Digital Signal Processing  
**Task:** Signal Viewer with Basic Processing  
**Semester:** Spring 2026  
**Team:** 08  

---

<div align="center">
  <p>⭐ Star us on GitHub if you find this project useful!</p>
  <p>📧 Contact: team08@dsp-course.edu</p>
  <p>🔗 Repository: https://github.com/your-repo/SIGNAL_VIEWER</p>
</div>
```
