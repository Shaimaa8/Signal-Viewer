import pandas as pd
import numpy as np
import torch
from transformers import AutoModel
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report
import joblib
import time

print("⏳ جاري تحميل موديل HuBERT...")
model = AutoModel.from_pretrained("./my_ecg_model", trust_remote_code=True)
model.eval()

print("⏳ جاري قراءة البيانات (mitbih_train.csv)...")
df = pd.read_csv("mitbih_train.csv", header=None)

# أخذ عينة متوازنة (600 نبضة من كل نوع عشان ندي للشبكة العصبية داتا كفاية تتعلم منها)
print("⏳ جاري تجهيز الداتا المتوازنة للـ 5 أنواع...")
samples_per_class = 600
balanced_df = df.groupby(187, group_keys=False).apply(
    lambda x: x.sample(n=min(len(x), samples_per_class), random_state=42)).reset_index(drop=True)

X = balanced_df.iloc[:, :-1].values
y = balanced_df.iloc[:, -1].values

features_list = []
labels_list = []

print(f"⏳ جاري استخراج الخصائص لـ {len(X)} إشارة (هياخد دقايق بسيطة)...")
start_time = time.time()

with torch.no_grad():
    for i in range(len(X)):
        sig = X[i]

        # التطبيع
        min_val, max_val = np.min(sig), np.max(sig)
        norm_sig = (sig - min_val) / (max_val - min_val + 1e-8)

        # استخراج الخصائص
        sig_tensor = torch.tensor(norm_sig, dtype=torch.float32).unsqueeze(0)
        outputs = model(sig_tensor)

        feature = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
        features_list.append(feature)
        labels_list.append(y[i])

        if (i + 1) % 500 == 0:
            print(f"   - تم الانتهاء من {i + 1} إشارة...")

print(f"✅ تم استخراج الخصائص في {round(time.time() - start_time, 2)} ثانية.")

# ================= التعديل الجديد =================
print("🧠 جاري تدريب شبكة عصبية (MLP) للتمييز بين الـ 5 أنواع بذكاء...")
# استخدمنا 3 طبقات مخفية عشان تفهم الفروق الدقيقة بين F و Q وباقي الأنواع
clf = MLPClassifier(hidden_layer_sizes=(256, 128, 64), max_iter=500, activation='relu', random_state=42)
clf.fit(features_list, labels_list)
# =================================================

joblib.dump(clf, 'ecg_classifier.pkl')
print("✅ تم حفظ الشبكة العصبية بنجاح باسم ecg_classifier.pkl")

print("\n📊 --- تقرير دقة التدريب النهائي للـ 5 أنواع ---")
y_pred = clf.predict(features_list)
print(classification_report(labels_list, y_pred, target_names=["N (0)", "S (1)", "V (2)", "F (3)", "Q (4)"]))