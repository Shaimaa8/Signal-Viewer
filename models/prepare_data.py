# prepare_data.py

import os
import pandas as pd
import numpy as np
import json
from datetime import datetime

# المسارات
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)  # المجلد الرئيسي (STOCK PART)

DATA_PATHS = {
    'stock': os.path.join(PARENT_DIR, 'FINAL DATA', 'Stock'),
    'currency': os.path.join(PARENT_DIR, 'FINAL DATA', 'currencies'),
    'mineral': os.path.join(PARENT_DIR, 'FINAL DATA', 'minerals')
}

def detect_file_format(file_path):
    """اكتشاف تنسيق الملف"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = [f.readline().strip() for _ in range(5)]
        
        print(f"\n📄 {os.path.basename(file_path)}")
        print(f"  Line 0: {lines[0]}")
        print(f"  Line 1: {lines[1]}")
        print(f"  Line 2: {lines[2]}")
        
        # التحقق من وجود Ticker في السطر الثاني
        if len(lines) >= 2 and 'Ticker' in lines[1]:
            print("  ✅ Yahoo Finance format detected (skip first 2 rows)")
            return 'yahoo', 2  # نوع ياهو فاينانس - نسكب أول سطرين
        
        # التحقق من وجود أرقام في أول سطر (تنسيق عادي)
        try:
            # لو أول سطر فيه أرقام، يبقى تنسيق عادي
            first_line_parts = lines[0].split(',')
            if first_line_parts[0].replace('-', '').replace('/', '').isdigit():
                print("  ✅ Standard CSV format detected (no header)")
                return 'standard_no_header', 0
        except:
            pass
        
        # تنسيق عادي (أول سطر هو header)
        print("  ✅ Standard CSV format detected (with header)")
        return 'standard', 0
        
    except Exception as e:
        print(f"  ⚠️ Error detecting format: {e}")
        return 'standard', 0

def extract_price_from_value(val):
    """استخراج الرقم من أي قيمة"""
    try:
        if pd.isna(val):
            return None
        if isinstance(val, str):
            # تنظيف النص
            val = val.replace(',', '').replace('$', '').replace('"', '').strip()
            if val and val != '-' and val.lower() != 'null' and val.lower() != 'nan':
                return float(val)
        elif isinstance(val, (int, float)):
            return float(val)
    except:
        pass
    return None

def read_csv_file(file_path):
    """قراءة ملف CSV ومعالجته حسب تنسيقه"""
    try:
        # اكتشاف تنسيق الملف
        format_type, skip_rows = detect_file_format(file_path)
        
        # قراءة الملف حسب التنسيق
        if format_type == 'yahoo':
            # تنسيق ياهو فاينانس
            df = pd.read_csv(file_path, skiprows=skip_rows)
            
            # إعادة تسمية الأعمدة (أول سطر هو الـ header الفعلي)
            with open(file_path, 'r', encoding='utf-8') as f:
                header_line = f.readline().strip()
                headers = [h.strip() for h in header_line.split(',')]
            
            # التأكد من تطابق عدد الأعمدة
            if len(headers) >= len(df.columns):
                df.columns = headers[:len(df.columns)]
            
        elif format_type == 'standard_no_header':
            # تنسيق عادي بدون header
            df = pd.read_csv(file_path, header=None)
            # الأعمدة هتكون 0, 1, 2, ...
        else:
            # تنسيق عادي مع header
            df = pd.read_csv(file_path)
        
        # توحيد أسماء الأعمدة (خفض حالة الأحرف)
        df.columns = [str(col).lower().strip() for col in df.columns]
        print(f"  Columns after reading: {df.columns.tolist()}")
        
        # البحث عن عمود التاريخ
        date_col = None
        
        # أولاً: البحث عن عمود اسمه 'date'
        for col in df.columns:
            if col == 'date':
                date_col = col
                print(f"  Found date column by name: {col}")
                break
        
        # لو ملقتش، جرب أي عمود فيه كلمة date
        if date_col is None:
            for col in df.columns:
                if 'date' in col:
                    date_col = col
                    print(f"  Found date column by partial name: {col}")
                    break
        
        # لو لسه ملقتش، جرب أول عمود
        if date_col is None and len(df.columns) > 0:
            # جرب أول عمود
            first_col = df.columns[0]
            sample = str(df[first_col].iloc[0]) if len(df) > 0 else ""
            # لو فيه شرطات أو شرط، غالباً ده تاريخ
            if '-' in sample or '/' in sample:
                date_col = first_col
                print(f"  Using first column as date: {date_col}")
        
        # استخراج التواريخ
        dates = []
        if date_col:
            for val in df[date_col]:
                try:
                    date = pd.to_datetime(val, errors='coerce')
                    if pd.notna(date):
                        dates.append(date.strftime('%Y-%m-%d'))
                    else:
                        dates.append(str(val))
                except:
                    dates.append(str(val))
        else:
            # لو ملقتش تاريخ، استخدم index
            dates = [f"Day {i+1}" for i in range(len(df))]
        
        print(f"  Dates: {len(dates)} rows, sample: {dates[0] if dates else 'None'}")
        
        # البحث عن الأعمدة المهمة
        result = {
            'date': dates,
            'open': [],
            'high': [],
            'low': [],
            'close': [],
            'volume': []
        }
        
        # البحث عن كل عمود
        column_patterns = {
            'open': ['open', 'open price'],
            'high': ['high', 'high price'],
            'low': ['low', 'low price'],
            'close': ['close', 'close price', 'adj close', 'price'],
            'volume': ['volume']
        }
        
        for target, patterns in column_patterns.items():
            found = False
            for col in df.columns:
                col_lower = str(col).lower().strip()
                # لو العمود ده هو التاريخ، نستثنيه
                if date_col and col == date_col:
                    continue
                
                # البحث عن أي نمط
                for pattern in patterns:
                    if pattern in col_lower:
                        print(f"  Found {target} column: {col}")
                        values = []
                        valid_count = 0
                        
                        for val in df[col]:
                            price = extract_price_from_value(val)
                            if price is not None:
                                values.append(price)
                                valid_count += 1
                            else:
                                values.append(0)
                        
                        result[target] = values
                        found = True
                        break
                
                if found:
                    break
            
            if not found:
                print(f"  ⚠️ No {target} column found, using zeros")
                result[target] = [0] * len(df)
        
        # تحويل إلى DataFrame
        result_df = pd.DataFrame(result)
        
        # حذف الصفوف اللي فيها NaN في الأسعار المهمة
        result_df = result_df.dropna(subset=['close'])
        
        # التأكد من أن كل الأعمدة بنفس الطول
        min_len = min(len(result_df), len(dates))
        if len(result_df) > min_len:
            result_df = result_df.head(min_len)
        
        print(f"  ✅ Extracted {len(result_df)} rows with valid data")
        print(f"  Close price range: {result_df['close'].min():.2f} - {result_df['close'].max():.2f}")
        
        return result_df
        
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def prepare_all_data():
    """قراءة كل الملفات ودمجها"""
    
    all_dfs = []
    asset_counter = 0
    asset_mapping = {}
    
    print("=" * 60)
    print("📊 Preparing ALL data for training")
    print("=" * 60)
    
    # قراءة كل المجلدات
    for category_name, category_path in DATA_PATHS.items():
        print(f"\n📁 {category_name.upper()} folder:")
        
        if not os.path.exists(category_path):
            print(f"  ❌ Path not found: {category_path}")
            continue
        
        files = [f for f in os.listdir(category_path) if f.endswith('.csv')]
        print(f"  Found {len(files)} CSV files")
        
        for file_name in files:
            file_path = os.path.join(category_path, file_name)
            df = read_csv_file(file_path)
            
            if df is not None and len(df) > 100:  # نحتاج على الأقل 100 نقطة
                # إضافة asset_id
                df['asset_id'] = asset_counter
                asset_mapping[asset_counter] = f"{category_name}/{file_name}"
                
                # التأكد من وجود عمود التاريخ
                if 'date' in df.columns:
                    df['date'] = pd.to_datetime(df['date'])
                
                all_dfs.append(df)
                asset_counter += 1
                print(f"  ✅ Added asset {asset_counter-1}: {file_name} ({len(df)} rows)")
            else:
                print(f"  ❌ Skipped {file_name} (insufficient data)")
    
    if len(all_dfs) == 0:
        print("\n❌ No valid data found!")
        return None, None
    
    # دمج كل البيانات
    print("\n" + "=" * 60)
    print("🔄 Merging all data...")
    
    final_df = pd.concat(all_dfs, ignore_index=True)
    
    # ترتيب حسب التاريخ والأصل
    if 'date' in final_df.columns:
        final_df = final_df.sort_values(['date', 'asset_id'])
    
    # إعادة تعيين index
    final_df = final_df.reset_index(drop=True)
    
    print(f"✅ Total rows: {len(final_df)}")
    print(f"✅ Total assets: {asset_counter}")
    if 'date' in final_df.columns:
        print(f"✅ Date range: {final_df['date'].min()} to {final_df['date'].max()}")
    print(f"✅ Columns: {final_df.columns.tolist()}")
    
    # عرض إحصائيات سريعة
    print("\n📊 Quick stats:")
    print(final_df[['open', 'high', 'low', 'close', 'volume']].describe())
    
    # عرض ملفات mapping
    print("\n📝 Asset mapping:")
    for asset_id, name in asset_mapping.items():
        asset_data = final_df[final_df['asset_id'] == asset_id]
        print(f"  {asset_id}: {name} ({len(asset_data)} rows)")
    
    return final_df, asset_mapping

def validate_data(df):
    """التحقق من صحة البيانات"""
    print("\n" + "=" * 60)
    print("🔍 Validating data...")
    print("=" * 60)
    
    # التحقق من القيم المفقودة
    missing = df.isnull().sum()
    print(f"\nMissing values:")
    for col in missing.index:
        if missing[col] > 0:
            print(f"  {col}: {missing[col]} rows ({missing[col]/len(df)*100:.1f}%)")
    
    # التحقق من القيم الصفرية
    zeros = (df[['open', 'high', 'low', 'close']] == 0).sum()
    print(f"\nZero values:")
    for col in zeros.index:
        if zeros[col] > 0:
            print(f"  {col}: {zeros[col]} rows ({zeros[col]/len(df)*100:.1f}%)")
    
    # التحقق من نطاق الأسعار
    print(f"\nPrice ranges by asset:")
    for asset_id in df['asset_id'].unique():
        asset_data = df[df['asset_id'] == asset_id]
        print(f"  Asset {asset_id}: "
              f"${asset_data['close'].min():.2f} - ${asset_data['close'].max():.2f}")

if __name__ == "__main__":
    # تجهيز البيانات
    data, mapping = prepare_all_data()
    
    if data is not None:
        # التحقق من صحة البيانات
        validate_data(data)
        
        # حفظ البيانات
        output_dir = os.path.join(PARENT_DIR, 'models', 'saved')
        os.makedirs(output_dir, exist_ok=True)
        
        data_path = os.path.join(output_dir, 'training_data.csv')
        data.to_csv(data_path, index=False)
        print(f"\n✅ Saved training data to: {data_path}")
        
        # حفظ mapping
        mapping_path = os.path.join(output_dir, 'asset_mapping.json')
        with open(mapping_path, 'w') as f:
            json.dump(mapping, f, indent=2)
        print(f"✅ Saved asset mapping to: {mapping_path}")
        
        # عرض عينة من البيانات
        print("\n📋 Sample data (first 10 rows):")
        print(data.head(10))
        
        # إحصائيات نهائية
        print("\n" + "=" * 60)
        print("📈 Final Statistics:")
        print(f"  Total assets: {len(mapping)}")
        print(f"  Total rows: {len(data):,}")
        print(f"  Date range: {data['date'].min()} to {data['date'].max()}")
        print("=" * 60)