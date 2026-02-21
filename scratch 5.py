import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import time

# --- Page Configuration (الإعدادات العامة للموقع) ---
st.set_page_config(page_title="Professional Signal Hub", layout="wide")

# --- Custom Styling (تصميم Front-end مخصص) ---
st.markdown("""
    <style>
    .main { background-color: #f8f9fa; }
    .stButton>button { width: 100%; border-radius: 10px; background-color: #28a745; color: white; height: 3em; }
    .stSelectbox { color: #495057; }
    </style>
    """, unsafe_allow_html=True)

st.title("🌐 Advanced Signal Visualization & Analysis")
st.markdown("---")

# --- Sidebar (لوحة التحكم الجانبية) ---
st.sidebar.header("📂 Data Management")
uploaded_file = st.sidebar.file_uploader("Upload your ECG/EEG CSV file", type=["csv"])

if uploaded_file is not None:
    # تحميل البيانات (Backend)
    df = pd.read_csv(uploaded_file, header=None)
    st.sidebar.success(f"Successfully loaded {len(df)} signals!")

    # اختيار وضع العرض (Navigation)
    view_mode = st.sidebar.radio("Navigate to:",
                                 ["Single View & Playback", "Multi-Signal Comparison", "Geometric Analysis"])

    # ---------------------------------------------------------
    # 1. Single View & Playback (خاصية العرض المنفرد مع التشغيل)
    # ---------------------------------------------------------
    if view_mode == "Single View & Playback":
        st.header("🔍 Individual Signal Monitor")

        row_idx = st.sidebar.number_input("Select Signal Index", 0, len(df) - 1, 0)
        signal = df.iloc[row_idx, :-1].values  # استبعاد العمود الأخير (Label)

        col_c1, col_c2 = st.sidebar.columns(2)
        play_btn = col_c1.button("▶️ Play")
        # في Streamlit، أي ضغطة زرار أخرى تعمل بمثابة Pause تلقائياً

        plot_placeholder = st.empty()  # مكان الرسم الذي سيتحدث باستمرار

        if play_btn:
            window_size = 60  # حجم النافذة المتحركة
            for i in range(len(signal) - window_size):
                current_window = signal[i: i + window_size]
                fig = go.Figure(go.Scatter(y=current_window, mode='lines', line=dict(color='#00ff00', width=2)))
                fig.update_layout(
                    title=f"Live Monitor - Signal {row_idx}",
                    template="plotly_dark",
                    height=500,
                    xaxis=dict(range=[0, window_size]),
                    yaxis=dict(range=[min(signal), max(signal)])
                )
                plot_placeholder.plotly_chart(fig, use_container_width=True)
                time.sleep(0.02)  # التحكم في سرعة العرض
        else:
            fig_static = go.Figure(go.Scatter(y=signal, mode='lines', line=dict(color='#007bff')))
            fig_static.update_layout(title=f"Static Overview - Signal {row_idx}", height=500)
            plot_placeholder.plotly_chart(fig_static, use_container_width=True)

    # ---------------------------------------------------------
    # 2. Multi-Signal Comparison (مقارنة عدد غير محدود من الإشارات)
    # ---------------------------------------------------------
    elif view_mode == "Multi-Signal Comparison":
        st.header("⚖️ Multi-Signal Comparison")

        # اختيار عدد مفتوح من الإشارات للمقارنة
        selected_indices = st.sidebar.multiselect(
            "Select indices to display:",
            options=list(range(len(df))),
            default=[0, 1]
        )

        if selected_indices:
            # الرسم البياني المتعدد
            fig_multi = go.Figure()
            for idx in selected_indices:
                sig_data = df.iloc[idx, :-1].values
                fig_multi.add_trace(go.Scatter(y=sig_data, name=f"Signal {idx}"))

            fig_multi.update_layout(title="Overlay View (Comparison)", height=600)
            st.plotly_chart(fig_multi, use_container_width=True)

            # X-Y Comparison (Lissajous) - يعتمد على أول اثنين تم اختيارهما
            if len(selected_indices) >= 2:
                st.markdown("---")
                st.subheader(f"X-Y Axis Mapping: Signal {selected_indices[0]} vs {selected_indices[1]}")
                s_x = df.iloc[selected_indices[0], :-1].values
                s_y = df.iloc[selected_indices[1], :-1].values

                fig_xy = go.Figure(go.Scatter(x=s_x, y=s_y, mode='lines', line=dict(color='purple')))
                fig_xy.update_layout(xaxis_title=f"Channel: {selected_indices[0]}",
                                     yaxis_title=f"Channel: {selected_indices[1]}", height=500)
                st.plotly_chart(fig_xy, use_container_width=True)
        else:
            st.warning("Please select at least one signal from the sidebar.")

    # ---------------------------------------------------------
    # 3. Geometric Analysis (Polar & Recursive Map)
    # ---------------------------------------------------------
    elif view_mode == "Geometric Analysis":
        st.header("🔄 Polar & Recursive Mapping")

        row_target = st.sidebar.number_input("Select Analysis Target", 0, len(df) - 1, 0)
        sig_target = df.iloc[row_target, :-1].values

        col_left, col_right = st.columns(2)

        with col_left:
            st.subheader("Polar Representation")
            t_slide = st.slider("Time Scroll (Theta)", 0, len(sig_target) - 1, 0)
            # تمثيل الجهد كنصف قطر r والوقت كزاوية theta
            fig_pol = go.Figure(go.Scatterpolar(
                r=[0, sig_target[t_slide]],
                theta=[0, (t_slide / len(sig_target)) * 360],
                mode='lines+markers', line=dict(width=3, color='red')
            ))
            fig_pol.update_layout(polar=dict(radialaxis=dict(range=[0, 1])), height=450)
            st.plotly_chart(fig_pol, use_container_width=True)

        with col_right:
            st.subheader("Recursive Poincaré Map")
            # رسم القيمة الحالية مقابل القيمة التالية
            fig_recur = go.Figure(go.Scatter(x=sig_target[:-1], y=sig_target[1:],
                                             mode='markers', marker=dict(size=2, color='darkorange')))
            fig_recur.update_layout(xaxis_title="V(n)", yaxis_title="V(n+1)", height=450)
            st.plotly_chart(fig_recur, use_container_width=True)

else:
    st.info("👋 Welcome! Please upload your medical CSV data file to begin.")
    # عرض صورة افتراضية شيك في البداية
    st.image("https://via.placeholder.com/1000x400.png?text=Awaiting+Data+Upload...", use_container_width=True)

# --- Footer ---
st.markdown("---")
st.caption("Signal Analyzer Pro v3.0 | 2026 | Powered by Streamlit & Plotly")