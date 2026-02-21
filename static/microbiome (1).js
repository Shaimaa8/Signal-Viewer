let rawData = [], headers = [], patients = [], bacteria = [];

// 1. تحسين قراءة الملف لضمان معالجة دقيقة للفواصل والصفوف الفارغة
document.getElementById("fileInput").addEventListener("change", e => {
    const reader = new FileReader();
    reader.onload = evt => {
        // استخدام regex لتقسيم الصفوف لضمان دعم كافة أنظمة التشغيل (\r\n)
        const rows = evt.target.result.trim().split(/\r?\n/).map(r => r.split(/,|\t/));
        headers = rows[0].map(h => h.trim());

        // فلترة الصفوف الفارغة وتحويل الأرقام بدقة
        rawData = rows.slice(1).filter(r => r.length > 1).map(r => r.map((v, i) => {
            let cleanVal = v.trim();
            // العمود الأول (ID) والأخير (Status) نصوص، والباقي أرقام
            return (i === 0 || i === r.length - 1) ? cleanVal : (parseFloat(cleanVal) || 0);
        }));

        patients = rawData.map(r => r[0]);
        bacteria = headers.slice(1, -1);

        const sel = document.getElementById("sampleSelector");
        sel.innerHTML = "";
        patients.forEach((p, i) => {
            sel.innerHTML += `<option value="${i}">${p}</option>`;
        });
        alert("تم تحميل البيانات بنجاح! جاهز للتحليل.");
    };
    reader.readAsText(e.target.files[0]);
});

// 2. تحديث إعدادات الرسم لتكون متجاوبة وشفافة لتناسب تصميم الـ CSS
function plotNow() {
    const type = document.getElementById("plotType").value;
    const patientIndex = parseInt(document.getElementById("sampleSelector").value) || 0;

    const layoutCommon = {
        paper_bgcolor: 'rgba(0,0,0,0)', // جعل الخلفية شفافة لتناسب الكارد
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff', size: 12 },
        autosize: true,
        margin: { l: 40, r: 20, t: 40, b: 40 }
    };

    if (type === "line") {
        let traces = bacteria.map((b, bi) => ({
            x: patients,
            y: rawData.map(r => r[bi + 1]),
            mode: 'lines+markers',
            name: b,
            marker: { size: 6 }
        }));
        Plotly.newPlot("mainPlot", traces, layoutCommon, {responsive: true});
    }

    if (type === "heatmap") {
        const matrix = rawData.map(r => r.slice(1, -1));
        Plotly.newPlot("heatmapPlot", [{
            z: matrix, x: bacteria, y: patients, type: 'heatmap', colorscale: 'Viridis'
        }], layoutCommon, {responsive: true});
    }

    if (type === "polar") {
        const abund = rawData[patientIndex].slice(1, -1);
        Plotly.newPlot("polarPlot", [{
            r: abund, theta: bacteria, type: 'scatterpolar', fill: 'toself',
            line: { color: '#38bdf8' }
        }], {
            ...layoutCommon,
            polar: { bgcolor: '#0f172a', radialaxis: { visible: true, gridcolor: '#475569' } }
        }, {responsive: true});
    }

    generateAdvancedSummary(patientIndex);
}

// 3. تحسين حساب مؤشر شانون (Shannon Index) لضمان الدقة الإحصائية
function generateAdvancedSummary(index) {
    const row = rawData[index].slice(1, -1);
    const diseaseRaw = rawData[index][rawData[index].length - 1];
    const disease = diseaseRaw.toLowerCase().trim();
    const total = row.reduce((a, b) => a + b, 0);

    let shannon = 0;
    if (total > 0) {
        row.forEach(val => {
            if (val > 0) {
                let p = val / total;
                shannon -= p * Math.log(p);
            }
        });
    }

    const richness = row.filter(v => v > 0).length;
    const evenness = richness > 1 ? shannon / Math.log(richness) : 0;

    let status, color;
    if (disease.includes("healthy")) {
        status = "Healthy / Balanced Microbiome";
        color = "#22c55e";
    } else if (disease.includes("obesity")) {
        status = "Metabolic Dysbiosis (Obesity)";
        color = "#eab308";
    } else {
        status = "Clinical Dysbiosis (High Risk)";
        color = "#ef4444";
    }

    let html = `
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border-left: 8px solid ${color};">
            <h3 style="margin-top:0; color:${color};">🔬 التقرير الطبي: ${diseaseRaw}</h3>
            <p><strong>Patient ID:</strong> ${patients[index]}</p>
            <p><strong>Shannon Diversity (H'):</strong> ${shannon.toFixed(4)}</p>
            <p><strong>Condition:</strong> <span style="color:${color}; font-weight:bold;">${status}</span></p>
        </div>
        <div style="margin-top:15px;">
            <select id="langSel" onchange="updateLanguage(${index}, ${shannon}, '${disease}')" 
                    style="background:#1e293b; color:white; border:1px solid #38bdf8; padding:8px; border-radius:5px;">
                <option value="en">English Report</option>
                <option value="ar">التقرير بالعربية</option>
            </select>
        </div>
        <div id="extraExplanation" style="margin-top:10px; padding:15px; background:#0f172a; border-radius:8px; border: 1px solid #1e293b;"></div>
    `;

    document.getElementById("patientSummary").innerHTML = html;
    updateLanguage(index, shannon, disease);
}

// 4. دالة تحديث اللغة وتفسير النتائج
function updateLanguage(index, h, disease) {
    const lang = document.getElementById("langSel").value;
    const expDiv = document.getElementById("extraExplanation");
    const row = rawData[index].slice(1, -1);
    const dominantIndex = row.indexOf(Math.max(...row));
    const dominantName = bacteria[dominantIndex];

    if (lang === "ar") {
        let msg = disease.includes("healthy") ? "✅ الميكروبيوم متوازن، تنوع بكتيري جيد." :
                  disease.includes("obesity") ? "⚠️ لوحظ نمط بكتيري مرتبط بالسمنة واستخلاص الطاقة." :
                  "🚨 تحذير: فقدان في التنوع البكتيري، مؤشر شانون منخفض.";

        expDiv.innerHTML = `<div style="line-height:1.6; font-size:18px;"><b>السلالة السائدة:</b> ${dominantName}<br><b>التحليل المتقدم:</b> ${msg}</div>`;
    } else {
        let msg = disease.includes("healthy") ? "✅ Balanced microbiome with optimal diversity." :
                  disease.includes("obesity") ? "⚠️ Microbial pattern associated with caloric storage." :
                  "🚨 Risk: Low diversity detected, suggesting dysbiosis.";

        expDiv.innerHTML = `<div style="line-height:1.6; font-size:18px;"><b>Dominant Taxa:</b> ${dominantName}<br><b>Expert Insight:</b> ${msg}</div>`;
    }
}

function clearAll() {
    ["mainPlot", "heatmapPlot", "polarPlot"].forEach(id => {
        const el = document.getElementById(id);
        if(el) Plotly.purge(id);
    });
    document.getElementById("patientSummary").innerHTML = "";
}