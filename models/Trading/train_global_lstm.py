# train_global_lstm.py

import os
import sys
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# Add the correct path to the main directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the model
from models.global_lstm import GlobalLSTM

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # This is the models folder
SAVED_DIR = os.path.join(BASE_DIR, 'saved')
DATA_PATH = os.path.join(SAVED_DIR, 'training_data.csv')
MODEL_SAVE_PATH = os.path.join(SAVED_DIR, 'global_lstm_model')

def main():
    print("=" * 60)
    print("🚀 Training Global LSTM Model")
    print("=" * 60)
    
    # 1. Check if data file exists
    print(f"\n📂 Looking for data at: {DATA_PATH}")
    
    if not os.path.exists(DATA_PATH):
        print(f"❌ Training data not found!")
        print(f"   Run prepare_data.py first")
        return
    
    # 2. Read data
    print(f"\n📊 Loading training data...")
    df = pd.read_csv(DATA_PATH)
    df['date'] = pd.to_datetime(df['date'])
    
    print(f"   ✅ File loaded successfully!")
    print(f"   Total rows: {len(df):,}")
    print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"   Unique assets: {df['asset_id'].nunique()}")
    
    # Show data distribution by asset
    print("\n📈 Data distribution by asset:")
    asset_counts = df['asset_id'].value_counts().sort_index()
    for asset_id, count in asset_counts.items():
        print(f"   Asset {asset_id}: {count:>5} rows")
    
    # 3. Create model
    print("\n🔨 Creating model...")
    model = GlobalLSTM(
        sequence_length=60,
        n_features=5,  # open, high, low, close, volume
        use_asset_id=False  # Not using asset_id for now because prices differ
    )
    
    # 4. Training
    print("\n🎯 Training model (this may take 5-10 minutes)...")
    print("   Press Ctrl+C to stop early\n")
    
    try:
        history = model.fit_from_dataframe(
            df,
            epochs=30,           # 30 training epochs
            batch_size=64,        # Batch size
            validation_split=0.1  # 10% for validation
        )
        
        # 5. Save model
        print("\n💾 Saving model...")
        os.makedirs(SAVED_DIR, exist_ok=True)
        model.save_model(MODEL_SAVE_PATH)
        
        # 6. Show results
        print("\n" + "=" * 60)
        print("✅ Training completed successfully!")
        print("=" * 60)
        
        # Show final loss
        if history and hasattr(history, 'history'):
            final_loss = history.history['loss'][-1]
            final_val_loss = history.history['val_loss'][-1]
            print(f"\n📉 Final training loss: {final_loss:.6f}")
            print(f"📉 Final validation loss: {final_val_loss:.6f}")
        
        print(f"\n💾 Model saved to: {MODEL_SAVE_PATH}.h5")
        print(f"💾 Scalers saved to: {MODEL_SAVE_PATH}_scaler_X.pkl, etc.")
        print("=" * 60)
        
        # 7. Quick test
        print("\n🧪 Quick test: Predicting for first asset...")
        test_asset = df[df['asset_id'] == 0].head(200)  # First 200 days of AAPL
        
        if len(test_asset) >= 60:
            predictions = model.predict_prices(test_asset, days=10)
            print(f"   Last price: ${test_asset['close'].iloc[-1]:.2f}")
            print(f"   Next 10 days predictions:")
            for i, pred in enumerate(predictions, 1):
                change = ((pred - test_asset['close'].iloc[-1]) / test_asset['close'].iloc[-1]) * 100
                print(f"     Day {i}: ${pred:.2f} ({change:+.2f}%)")
        
    except KeyboardInterrupt:
        print("\n\n⏹ Training interrupted by user")
        # Save model even if interrupted
        print("\n💾 Saving partial model...")
        model.save_model(MODEL_SAVE_PATH + "_partial")
        print(f"✅ Partial model saved")
        
    except Exception as e:
        print(f"\n❌ Error during training: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()