# models/global_lstm.py

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import StandardScaler
import joblib
import os

class GlobalLSTM:
    """
    Global LSTM Model trained on multiple assets
    Uses asset_id as additional feature
    """
    
    def __init__(self, sequence_length=60, n_features=5, use_asset_id=True):
        """
        Initialize Global LSTM model
        
        Parameters:
        - sequence_length: number of past days to use (60)
        - n_features: number of features (open, high, low, close, volume) = 5
        - use_asset_id: whether to include asset_id in features
        """
        self.sequence_length = sequence_length
        self.n_features = n_features
        self.use_asset_id = use_asset_id
        self.model = None
        self.scaler_X = StandardScaler()
        self.scaler_y = StandardScaler()
        self.is_fitted = False
        self.name = "GlobalLSTM"
        
        # Final input features count
        if use_asset_id:
            self.input_features = n_features + 1
        else:
            self.input_features = n_features
    
    def prepare_features(self, df):
        """
        Prepare features from dataframe
        
        Features:
        - Returns for each price column
        - Volume (scaled)
        - asset_id (one-hot or scaled)
        """
        # Make a copy to avoid warnings
        df = df.copy()
        
        # Calculate returns for price columns with safe division
        price_cols = ['open', 'high', 'low', 'close']
        for col in price_cols:
            # pct_change gives nan for the first row
            df[f'{col}_return'] = df[col].pct_change()
            
            # Replace inf and -inf with nan
            df[f'{col}_return'] = df[f'{col}_return'].replace([np.inf, -np.inf], np.nan)
            
            # Remove very large values (more than 100%)
            df.loc[df[f'{col}_return'].abs() > 1.0, f'{col}_return'] = np.nan
        
        # Volume change
        df['volume_change'] = df['volume'].pct_change()
        df['volume_change'] = df['volume_change'].replace([np.inf, -np.inf], np.nan)
        df.loc[df['volume_change'].abs() > 1.0, 'volume_change'] = np.nan
        
        # Remove rows with NaN
        df = df.dropna()
        
        return df
    
    def create_sequences(self, df):
        """
        Create sequences for LSTM training
        
        Each sequence contains:
        - last 60 days of returns for each feature
        - target: next day's close return
        """
        X, y = [], []
        
        # Group by asset_id to create sequences per asset
        for asset_id in df['asset_id'].unique():
            asset_data = df[df['asset_id'] == asset_id].sort_values('date')
            
            # Get feature columns
            feature_cols = ['open_return', 'high_return', 'low_return', 'close_return', 'volume_change']
            
            # Ensure there is enough data
            if len(asset_data) <= self.sequence_length:
                continue
                
            values = asset_data[feature_cols].values
            
            for i in range(len(values) - self.sequence_length):
                X.append(values[i:i + self.sequence_length])
                y.append(values[i + self.sequence_length, 3])  # close_return is index 3
        
        return np.array(X), np.array(y)
    
    def fit_from_dataframe(self, df, epochs=50, batch_size=32, validation_split=0.1):
        """
        Train model directly from prepared dataframe
        """
        # Prepare features
        print("📊 Preparing features...")
        df = self.prepare_features(df)
        print(f"   After preparation: {len(df)} rows")
        
        # Create sequences
        print("🔗 Creating sequences...")
        X, y = self.create_sequences(df)
        
        if len(X) == 0:
            raise ValueError("No sequences created! Check your data.")
        
        print(f"   X shape: {X.shape}, y shape: {y.shape}")
        
        # Reshape for LSTM (samples, timesteps, features)
        # X is already (samples, timesteps, features)
        
        # Scale features - ensuring no inf values
        print("📏 Scaling features...")
        original_shape = X.shape
        X_flat = X.reshape(-1, X.shape[-1])
        
        # Ensure no inf values
        if np.any(np.isinf(X_flat)):
            print("   ⚠️ Found inf values, replacing with nan")
            X_flat = np.where(np.isinf(X_flat), np.nan, X_flat)
        
        # Remove any rows with nan
        valid_rows = ~np.isnan(X_flat).any(axis=1)
        if not np.all(valid_rows):
            print(f"   ⚠️ Removing {np.sum(~valid_rows)} rows with nan")
            X_flat = X_flat[valid_rows]
            # Adjust y as well
            y = y[valid_rows]
        
        # Scale
        X_scaled = self.scaler_X.fit_transform(X_flat)
        X = X_scaled.reshape(-1, original_shape[1], original_shape[2])
        
        # Scale target
        y = y.reshape(-1, 1)
        y_scaled = self.scaler_y.fit_transform(y).flatten()
        
        # Build model
        print("🔨 Building LSTM model...")
        self.build_model()
        
        # Early stopping
        early_stop = EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True
        )
        
        # Train
        print("🎯 Training model...")
        history = self.model.fit(
            X, y_scaled,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=[early_stop],
            verbose=1
        )
        
        self.is_fitted = True
        print("✅ Model training completed!")
        
        return history
    
    def build_model(self):
        """Build LSTM architecture"""
        model = Sequential([
            Input(shape=(self.sequence_length, self.input_features)),
            LSTM(128, return_sequences=True),
            Dropout(0.2),
            LSTM(64, return_sequences=True),
            Dropout(0.2),
            LSTM(32),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1)
        ])
        
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        
        self.model = model
        print("✅ LSTM model built")
        return model
    
    def predict_next(self, last_sequence):
        """
        Predict next day's return
        
        Parameters:
        - last_sequence: array of shape (sequence_length, features)
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted yet")
        
        # Scale
        last_flat = last_sequence.reshape(-1, last_sequence.shape[-1])
        last_scaled = self.scaler_X.transform(last_flat)
        last_scaled = last_scaled.reshape(1, self.sequence_length, self.input_features)
        
        # Predict
        pred_scaled = self.model.predict(last_scaled, verbose=0)[0, 0]
        
        # Inverse scale
        pred = self.scaler_y.inverse_transform([[pred_scaled]])[0, 0]
        
        return pred
    
    def predict_prices(self, df, days=30):
        """
        Predict future prices for a given asset
        
        Parameters:
        - df: dataframe with last N days of data for a single asset
        - days: number of days to predict
        """
        # Prepare features
        df = self.prepare_features(df)
        
        if len(df) < self.sequence_length:
            raise ValueError(f"Need at least {self.sequence_length} rows, got {len(df)}")
        
        # Get last sequence_length rows
        last_rows = df.tail(self.sequence_length).copy()
        
        # Create feature matrix
        feature_cols = ['open_return', 'high_return', 'low_return', 'close_return', 'volume_change']
        last_sequence = last_rows[feature_cols].values
        
        predictions = []
        current_sequence = last_sequence.copy()
        last_price = df['close'].iloc[-1]
        
        for _ in range(days):
            # Predict next return
            next_return = self.predict_next(current_sequence)
            
            # Ensure the return is reasonable
            next_return = np.clip(next_return, -0.2, 0.2)  # Max 20% up or down
            
            # Calculate next price
            next_price = last_price * (1 + next_return)
            predictions.append(next_price)
            
            # Update sequence (shift and add new return)
            # This is simplified - in reality you'd need to update all features
            new_row = current_sequence[-1].copy()
            new_row[3] = next_return  # update close_return
            current_sequence = np.vstack([current_sequence[1:], new_row])
            
            last_price = next_price
        
        return np.array(predictions)
    
    def save_model(self, filepath):
        """Save model and scalers"""
        if not self.is_fitted:
            raise ValueError("Cannot save unfitted model")
        
        # Save Keras model
        self.model.save(f"{filepath}.h5")
        
        # Save scalers
        joblib.dump(self.scaler_X, f"{filepath}_scaler_X.pkl")
        joblib.dump(self.scaler_y, f"{filepath}_scaler_y.pkl")
        
        # Save metadata
        metadata = {
            'sequence_length': self.sequence_length,
            'n_features': self.n_features,
            'use_asset_id': self.use_asset_id,
            'input_features': self.input_features,
            'name': self.name,
            'is_fitted': self.is_fitted
        }
        joblib.dump(metadata, f"{filepath}_metadata.pkl")
        
        print(f"✅ Model saved to {filepath}")

    @classmethod
    def load_model(cls, filepath):
        """Load model and scalers"""

        # 1. تحميل الموديل وتجاهل إيرور التحديث (compile=False)
        keras_model = load_model(f"{filepath}.h5", compile=False)

        # 2. تحميل باقي الملفات
        scaler_X = joblib.load(f"{filepath}_scaler_X.pkl")
        scaler_y = joblib.load(f"{filepath}_scaler_y.pkl")
        metadata = joblib.load(f"{filepath}_metadata.pkl")

        # 3. تجهيز الكلاس
        instance = cls(
            sequence_length=metadata['sequence_length'],
            n_features=metadata['n_features'],
            use_asset_id=metadata['use_asset_id']
        )

        # 4. ربط الموديل بالكلاس
        instance.model = keras_model
        instance.scaler_X = scaler_X
        instance.scaler_y = scaler_y
        instance.is_fitted = metadata['is_fitted']
        instance.name = metadata['name']

        print(f"✅ Model loaded from {filepath}")
        return instance