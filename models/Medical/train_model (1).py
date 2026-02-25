import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

print("🧠 ببدأ تدريب الـ AI على داتا iHMP...")

# 1. تحميل الداتا المجهزة
df = pd.read_csv('../Microbiome/iHMP_data.csv', index_col=0)

# 2. فصل البيانات (نسب البكتيريا) عن النتيجة (التشخيص)
X = df.drop('diagnosis', axis=1)
y = df['diagnosis']

# 3. تقسيم الداتا (جزء للتعليم وجزء للاختبار)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. اختيار موديل الذكاء الاصطناعي (Random Forest)
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# 5. قياس الدقة
accuracy = model.score(X_test, y_test)
print(f"✅ تم التدريب بنجاح! دقة الموديل: {accuracy * 100:.2f}%")

# 6. حفظ "العقل" الناتج في ملف pkl
joblib.dump(model, '../Microbiome/microbiome_model.pkl')
# حفظ أسماء البكتيريا عشان الويب سايت يعرفها
joblib.dump(list(X.columns), '../Microbiome/model_features.pkl')

print("📁 تم حفظ الملفات: microbiome_model.pkl و model_features.pkl")