import os
import wfdb
import mne
import librosa
from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings('ignore')
app = Flask(__name__)

# ==================== المسارات والإعدادات ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'temp_uploads')
if not os.path.exists(UPLOAD_FOLDER): os.makedirs(UPLOAD_FOLDER)

DATA_PATHS = {
    'stock': os.path.join(BASE_DIR, 'FINAL DATA', 'Stock'),
    'currency': os.path.join(BASE_DIR, 'FINAL DATA', 'currencies'),
    'mineral': os.path.join(BASE_DIR, 'FINAL DATA', 'minerals')
}

ASSETS = {
    'stock': [
        {'symbol': 'AAPL', 'name': 'Apple Inc.', 'file': 'AAPL.csv', 'display': 'AAPL'},
        {'symbol': 'NVDA', 'name': 'NVIDIA', 'file': 'nvda_data.csv', 'display': 'NVDA'},
        {'symbol': 'TSLA', 'name': 'Tesla', 'file': 'tsla_data.csv', 'display': 'TSLA'},
        {'symbol': 'NIFTY50', 'name': 'NIFTY 50', 'file': 'nifty_data.csv', 'display': 'NIFTY'}
    ],
    'currency': [
        {'symbol': 'BTC-USD', 'name': 'Bitcoin', 'file': 'BTCUSD_data.csv', 'display': 'BTC'},
        {'symbol': 'EUR-USD', 'name': 'Euro', 'file': 'EURUSD_data.csv', 'display': 'EUR/USD'},
        {'symbol': 'GBP-USD', 'name': 'British Pound', 'file': 'GBPUSD_data.csv', 'display': 'GBP/USD'},
        {'symbol': 'EGP-USD', 'name': 'Egyptian Pound', 'file': 'EGPUSD_data.csv', 'display': 'EGP/USD'}
    ],
    'mineral': [
        {'symbol': 'GOLD', 'name': 'Gold', 'file': 'gold_data.csv', 'display': 'GOLD'},
        {'symbol': 'SILVER', 'name': 'Silver', 'file': 'silver_data.csv', 'display': 'SILVER'},
        {'symbol': 'COPPER', 'name': 'Copper', 'file': 'Copper_data.csv', 'display': 'COPPER'},
        {'symbol': 'OIL', 'name': 'Crude Oil', 'file': 'oil_data.csv', 'display': 'OIL'}
    ]
}

data_store = {"df": None, "channel_names": []}


# ==================== دالة تنظيف البيانات (مسترجعة) ====================
def clean_numeric(series):
    result = []
    for val in series:
        try:
            if pd.isna(val) or val is None: continue
            if isinstance(val, str):
                val = val.replace('$', '').replace(',', '').strip()
                if val == '' or val.lower() in ['null', 'nan']: continue
            result.append(float(val))
        except:
            continue
    return result


# ==================== المسارات (Routes) ====================
@app.route('/')
def index(): return render_template('index.html')


@app.route('/viewer')
def medical_viewer(): return render_template('viewer.html')


@app.route('/stock')
def stock_page(): return render_template('stock.html')


@app.route('/sound')
def sound_page(): return render_template('sound.html')


@app.route('/microbiome')
def microbiome_page(): return render_template('micro.html')


# ==================== تحليل الصوت والسرعة ====================
@app.route('/detect_drone', methods=['POST'])
def detect_drone():
    try:
        file = request.files['file']
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)
        y, sr = librosa.load(path)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = pitches[pitches > 0]
        if len(pitch_values) > 10:
            f_approach = np.percentile(pitch_values, 90)
            f_recede = np.percentile(pitch_values, 10)
            avg_pitch = np.mean(pitch_values)
            velocity_ms = 343 * (f_approach - f_recede) / (f_approach + f_recede)
            velocity_kmh = velocity_ms * 3.6
        else:
            f_approach = f_recede = avg_pitch = velocity_ms = velocity_kmh = 0
        return jsonify({
            "result": "Analysis Complete", "pitch": round(float(avg_pitch), 2),
            "approach_freq": round(float(f_approach), 2), "receding_freq": round(float(f_recede), 2),
            "velocity_ms": round(float(velocity_ms), 2), "velocity_kmh": round(float(velocity_kmh), 2),
            "color": "#38bdf8", "status": "Success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== الميديكال (Upload) ====================
@app.route('/upload', methods=['POST'])
def upload():
    try:
        category = request.form.get('category', 'signal')
        for f in os.listdir(UPLOAD_FOLDER):
            try:
                os.remove(os.path.join(UPLOAD_FOLDER, f))
            except:
                pass
        files = request.files.getlist('file')
        main_file = None
        for f in files:
            path = os.path.join(UPLOAD_FOLDER, f.filename)
            f.save(path)
            if f.filename.lower().endswith(('.csv', '.hea', '.edf', '.rec', '.dat')):
                if not main_file or f.filename.lower().endswith(('.hea', '.edf')):
                    main_file = path
        if not main_file: return jsonify({"error": "File not supported"}), 400
        ext = os.path.splitext(main_file)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(main_file)
            if 't' in df.columns:
                df = df.drop(columns=['t'])
            elif 'time' in df.columns.str.lower():
                df = df.iloc[:, 1:]
            processed_df, names = df.T, df.columns.tolist()
        elif ext == '.hea':
            record_base = os.path.join(UPLOAD_FOLDER, os.path.splitext(os.path.basename(main_file))[0])
            record = wfdb.rdrecord(record_base)
            processed_df, names = pd.DataFrame(record.p_signal, columns=record.sig_name).T, record.sig_name
        else:
            raw = mne.io.read_raw(main_file, preload=True)
            processed_df, names = pd.DataFrame(raw.get_data(), index=raw.ch_names), raw.ch_names
        data_store["df"] = processed_df
        data_store["channel_names"] = list(names)
        return jsonify({"channels_count": len(names), "channel_names": list(names), "ai_status": "Ready"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_all_channels')
def get_all_channels():
    if data_store["df"] is not None:
        return jsonify({"channels": data_store["df"].values.tolist(), "names": data_store["channel_names"]})
    return jsonify({"error": "No data found"}), 404


# ==================== الأسهم (النسخة الذكية المسترجعة) ====================
@app.route('/api/categories')
def get_stock_categories(): return jsonify(ASSETS)


@app.route('/api/data/<category>/<symbol>')
def get_stock_data(category, symbol):
    try:
        asset = next((a for a in ASSETS[category] if a['symbol'] == symbol), None)
        if not asset: return jsonify({'error': 'Symbol not found'}), 404
        df = pd.read_csv(os.path.join(DATA_PATHS[category], asset['file']))
        df.columns = [str(col).strip() for col in df.columns]

        # البحث عن التاريخ
        date_col = next((c for c in df.columns if c.lower() in ['date', 'timestamp', 'datetime']), None)
        dates = pd.to_datetime(df[date_col]).dt.strftime('%Y-%m-%d').tolist() if date_col else [f"Day {i}" for i in
                                                                                                range(len(df))]

        # تنظيف وجلب الأسعار
        res_prices = {}
        for key, aliases in {'open': ['Open', 'open'], 'high': ['High', 'high'], 'low': ['Low', 'low'],
                             'close': ['Close', 'close', 'Adj Close']}.items():
            col = next((c for c in df.columns if any(a in c for a in aliases)), None)
            if col: res_prices[key] = clean_numeric(df[col])[:len(dates)]

        return jsonify({'symbol': symbol, 'dates': dates, 'prices': res_prices})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)