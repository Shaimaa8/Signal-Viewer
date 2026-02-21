import os
from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

# مسارات البيانات
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATHS = {
    'stock': os.path.join(BASE_DIR, 'FINAL DATA', 'Stock'),
    'currency': os.path.join(BASE_DIR, 'FINAL DATA', 'currencies'),
    'mineral': os.path.join(BASE_DIR, 'FINAL DATA', 'minerals')
}

# تعريف الأصول المتاحة (بأسماء مطابقة للملفات)
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

@app.route('/')
def index():
    return render_template('stock.html')  # تأكد إن اسم الملف stock.html

@app.route('/api/categories')
def get_categories():
    return jsonify(ASSETS)

@app.route('/api/assets/<category>')
def get_assets(category):
    if category in ASSETS:
        return jsonify(ASSETS[category])
    return jsonify([])

def clean_numeric(series):
    """تنظيف البيانات من null و NaN والقيم النصية"""
    result = []
    for val in series:
        try:
            # لو كان NaN أو None
            if pd.isna(val) or val is None:
                continue
                
            # لو كان نص، نظفه
            if isinstance(val, str):
                val = val.replace('$', '').replace(',', '').strip()
                if val == '' or val.lower() == 'null' or val.lower() == 'nan':
                    continue
            
            # حول لرقم
            num = float(val)
            result.append(num)
        except:
            continue
    return result

@app.route('/api/data/<category>/<symbol>')
def get_data(category, symbol):
    """جلب بيانات رمز معين مع كل الأعمدة"""
    try:
        print(f"Loading {category} - {symbol}")
        
        # البحث عن الملف
        asset = None
        for a in ASSETS[category]:
            if a['symbol'] == symbol or a['display'] == symbol:
                asset = a
                break
        
        if not asset:
            return jsonify({'error': f'Symbol {symbol} not found'}), 404
        
        file_path = os.path.join(DATA_PATHS[category], asset['file'])
        print(f"File path: {file_path}")
        
        if not os.path.exists(file_path):
            return jsonify({'error': f'File not found: {file_path}'}), 404
        
        # قراءة الملف
        df = pd.read_csv(file_path)
        print(f"Original columns: {df.columns.tolist()}")
        print(f"First few rows: {df.head(3).to_dict()}")
        
        # تنظيف أسماء الأعمدة
        df.columns = [str(col).strip() for col in df.columns]
        
        # البحث عن عمود التاريخ
        date_col = None
        for col in ['Date', 'date', 'Timestamp', 'timestamp', 'Datetime']:
            if col in df.columns:
                date_col = col
                break
        
        # تحويل التاريخ
        dates = []
        if date_col:
            # تخطي أول 3 صفوف لو كان فيها مشاكل
            for i, val in enumerate(df[date_col]):
                try:
                    if i < 3 and (pd.isna(val) or val == 'null' or val == 'nan'):
                        continue
                    date = pd.to_datetime(val, errors='coerce')
                    if pd.notna(date):
                        dates.append(date.strftime('%Y-%m-%d'))
                except:
                    continue
            
            # لو ملقتش تواريخ صالحة، استخدم index
            if len(dates) == 0:
                dates = [f"Day {i+1}" for i in range(len(df))]
        else:
            dates = [f"Day {i+1}" for i in range(len(df))]
        
        # جمع كل الأعمدة المهمة
        result = {
            'symbol': asset['display'],
            'name': asset['name'],
            'category': category,
            'dates': dates,
            'count': len(dates),
            'prices': {}
        }
        
        # أعمدة الأسعار المختلفة
        price_columns = {}
        
        # البحث عن Open, High, Low, Close, Volume
        col_mapping = {
            'open': ['open', 'Open', 'OPEN'],
            'high': ['high', 'High', 'HIGH'],
            'low': ['low', 'Low', 'LOW'],
            'close': ['close', 'Close', 'CLOSE', 'Adj Close', 'adj close'],
            'volume': ['volume', 'Volume', 'VOLUME']
        }
        
        for key, possible_names in col_mapping.items():
            for col in df.columns:
                if any(name in col for name in possible_names):
                    cleaned = clean_numeric(df[col])
                    if len(cleaned) > 0:
                        # خذ نفس عدد التواريخ
                        result['prices'][key] = cleaned[:len(dates)]
                        print(f"Found {key}: {len(cleaned)} values, first: {cleaned[0] if cleaned else None}")
                    break
        
        # تأكد من وجود close على الأقل
        if 'close' not in result['prices']:
            # خد أول عمود رقمي
            for col in df.columns:
                cleaned = clean_numeric(df[col])
                if len(cleaned) > 0:
                    result['prices']['close'] = cleaned[:len(dates)]
                    print(f"Using {col} as close")
                    break
        
        print(f"Final data: {list(result['prices'].keys())}")
        print(f"Sample close: {result['prices'].get('close', [])[:5]}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    return jsonify({'message': 'Prediction coming soon'})

if __name__ == '__main__':
    print("=" * 50)
    print("BioSignal AI - Stocks Module")
    print("=" * 50)
    
    # التحقق من وجود المجلدات
    for category, path in DATA_PATHS.items():
        exists = os.path.exists(path)
        print(f"{category}: {path} - {'✅' if exists else '❌'}")
        if exists:
            files = os.listdir(path)
            print(f"  Files: {files}")
    
    print("\n" + "=" * 50)
    app.run(debug=True, port=5000)