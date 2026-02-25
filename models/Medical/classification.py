import pandas as pd
import numpy as np
import torch
from transformers import AutoModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib
import time

# 1. تحميل الموديل الجاهز بتاعك
print("جاري تحميل موديل HuBERT...")
model = AutoModel.from_pretrained("./my_ecg_model", trust_remote_code=True)
model.eval()

# 2. قراءة الداتا
print("جاري قراءة البيانات...")
df = pd.read_csv("mitbih_train.csv", header=None)

# 3. أخذ عينة متوازنة (500 نبضة من كل نوع عشان اللاب توب يخلص بسرعة والنتايج تطلع دقيقة)
print("جاري تجهيز عينة متوازنة لحل مشكلة الداتا...")
samples_per_class = 500
balanced_df = df.groupby(187).apply(lambda x: x.sample(n=min(len(x), samples_per_class), random_state=42)).reset_index(
    drop=True)

X = balanced_df.iloc[:, :-1].values
y = balanced_df.iloc[:, -1].values

features_list = []
labels_list = []

# 4. استخراج الخصائص (دي الخطوة اللي هتاخد شوية وقت، ممكن 3 لـ 5 دقايق)
print(f"جاري استخراج الخصائص لـ {len(X)} إشارة، سيبيه يحمل براحته...")
start_time = time.time()

with torch.no_grad():
    for i in range(len(X)):
        sig = X[i]

        # تطبيع الإشارة (Normalization)
        min_val, max_val = np.min(sig), np.max(sig)
        norm_sig = (sig - min_val) / (max_val - min_val + 1e-8)

        # تحويلها لتنسور وإدخالها للموديل
        sig_tensor = torch.tensor(norm_sig, dtype=torch.float32).unsqueeze(0)
        outputs = model(sig_tensor)

        # أخذ متوسط الخصائص
        feature = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
        features_list.append(feature)
        labels_list.append(y[i])

        if (i + 1) % 500 == 0:
            print(f"تم الانتهاء من {i + 1} إشارة...")

print(f"تم استخراج الخصائص في {round(time.time() - start_time, 2)} ثانية.")

# 5. تدريب المُصنف
print("جاري تدريب المُصنف (Random Forest)...")
clf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
clf.fit(features_list, labels_list)

# 6. حفظ المُصنف
joblib.dump(clf, 'ecg_classifier.pkl')
print("✅ تم تدريب وحفظ المُصنف بنجاح باسم ecg_classifier.pkl")

# طباعة تقرير الدقة
y_pred = clf.predict(features_list)
print("\n--- تقرير دقة التدريب ---")
print(classification_report(labels_list, y_pred))