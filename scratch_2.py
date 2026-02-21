import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import time

# --- Page Configuration ---
st.set_page_config(page_title="Professional Signal Hub", layout="wide")

# --- Custom Styling ---
st.markdown("""
    <style>
    .main { background-color: #f8f9fa; }
    .stButton>button { width: 100%; border-radius: 10px; background-color: #28a745; color: white; height: 3em; }
    </style>
    """, unsafe_allow_html=True)

st.title("🌐 Advanced Signal Visualization & Analysis")
st.markdown("---")

# --- Sidebar ---
st.sidebar.header("📂 Data Management")
uploaded_file = st.sidebar.file_uploader("Upload your ECG/EEG CSV file", type=["csv"])

if uploaded_file is not None:
    df = pd.read_csv(uploaded_file, header=None)
    st.sidebar.success(f"Successfully loaded {len(df)} signals!")

    view_mode = st.sidebar.radio("Navigate to:",
                                 ["Single View & Playback", "Multi-Signal Comparison", "Geometric Analysis"])

    # 1. Single View & Playback
    if view_mode == "Single View & Playback":
        st.header("🔍 Individual Signal Monitor")
        row_idx = st.sidebar.number_input("Select Signal Index", 0, len(df) - 1, 0)
        signal = df.iloc[row_idx, :-1].values
        col_c1, col_c2 = st.sidebar.columns(2)
        play_btn = col_c1.button("▶️ Play")
        plot_placeholder = st.empty()

        if play_btn:
            window_size = 60
            for i in range(len(signal) - window_size):
                current_window = signal[i: i + window_size]
                fig = go.Figure(go.Scatter(y=current_window, mode='lines', line=dict(color='#00ff00', width=2)))
                fig.update_layout(title=f"Live Monitor - Signal {row_idx}", template="plotly_dark", height=500,
                                  xaxis=dict(range=[0, window_size]), yaxis=dict(range=[min(signal), max(signal)]))
                plot_placeholder.plotly_chart(fig, use_container_width=True)
                time.sleep(0.02)
        else:
            fig_static = go.Figure(go.Scatter(y=signal, mode='lines', line=dict(color='#007bff')))
            fig_static.update_layout(title=f"Static Overview - Signal {row_idx}", height=500)
            plot_placeholder.plotly_chart(fig_static, use_container_width=True)

    # 2. Multi-Signal Comparison (MODIFIED)
    elif view_mode == "Multi-Signal Comparison":
        st.header("⚖️ Multi-Signal Comparison & Playback")

        selected_indices = st.sidebar.multiselect("Select indices to display:", options=list(range(len(df))),
                                                  default=[0, 1])

        if selected_indices:
            # خيار طريقة العرض
            display_mode = st.radio("Display Mode:", ["Overlaid (One Screen)", "Grid (Separate Screens)"],
                                    horizontal=True)

            multi_play = st.button("▶️ Play Selected Signals")
            plot_container = st.empty()

            if multi_play:
                window_size = 60
                # الحصول على طول أقصر إشارة مختارة لتجنب الخطأ
                total_len = len(df.columns) - 1

                for i in range(0, total_len - window_size, 5):  # قفزة بـ 5 لزيادة السرعة
                    if display_mode == "Overlaid (One Screen)":
                        fig = go.Figure()
                        for idx in selected_indices:
                            window = df.iloc[idx, i: i + window_size].values
                            fig.add_trace(go.Scatter(y=window, name=f"Signal {idx}"))
                        fig.update_layout(template="plotly_dark", height=600, xaxis=dict(range=[0, window_size]))
                        plot_container.plotly_chart(fig, use_container_width=True)

                    else:
                        # في وضع الـ Grid أثناء الأنيماشين، سنعرضهم تحت بعض في حاوية واحدة لتوفير الأداء
                        fig = go.Figure()
                        for step, idx in enumerate(selected_indices):
                            window = df.iloc[idx, i: i + window_size].values
                            # إضافة إزاحة (Offset) رأسية لمحاكاة الشاشات المنفصلة
                            fig.add_trace(go.Scatter(y=window + (step * 2), name=f"Signal {idx}"))
                        fig.update_layout(template="plotly_dark", height=200 * len(selected_indices), showlegend=True)
                        plot_container.plotly_chart(fig, use_container_width=True)

                    time.sleep(0.01)
            else:
                # العرض الثابت (Static)
                if display_mode == "Overlaid (One Screen)":
                    fig_multi = go.Figure()
                    for idx in selected_indices:
                        sig_data = df.iloc[idx, :-1].values
                        fig_multi.add_trace(go.Scatter(y=sig_data, name=f"Signal {idx}"))
                    fig_multi.update_layout(title="Overlay View (Comparison)", height=600)
                    st.plotly_chart(fig_multi, use_container_width=True)
                else:
                    for idx in selected_indices:
                        st.subheader(f"Monitor Screen: Signal {idx}")
                        sig_data = df.iloc[idx, :-1].values
                        fig_ind = go.Figure(go.Scatter(y=sig_data, name=f"Signal {idx}", line=dict(color="#007bff")))
                        st.plotly_chart(fig_ind, use_container_width=True)

            if len(selected_indices) >= 2:
                st.markdown("---")
                st.subheader(f"X-Y Axis Mapping: Signal {selected_indices[0]} vs {selected_indices[1]}")
                s_x, s_y = df.iloc[selected_indices[0], :-1].values, df.iloc[selected_indices[1], :-1].values
                fig_xy = go.Figure(go.Scatter(x=s_x, y=s_y, mode='lines', line=dict(color='purple')))
                fig_xy.update_layout(xaxis_title=f"Channel: {selected_indices[0]}",
                                     yaxis_title=f"Channel: {selected_indices[1]}", height=500)
                st.plotly_chart(fig_xy, use_container_width=True)
        else:
            st.warning("Please select at least one signal.")

    # 3. Geometric Analysis
    elif view_mode == "Geometric Analysis":
        st.header("🔄 Periodic Polar & Recursive Analysis")
        row_target = st.sidebar.number_input("Select Analysis Target", 0, len(df) - 1, 0)
        full_signal = pd.to_numeric(df.iloc[row_target, :-1], errors='coerce').fillna(0).values
        sig_len = len(full_signal)
        st.sidebar.markdown("---")
        st.sidebar.subheader("Periodicity Tuning")
        period_len = st.sidebar.slider("Periodicity Slider (Points)", 10, sig_len, 187 if sig_len > 187 else sig_len)
        max_off = max(0, sig_len - period_len)
        if max_off > 0:
            offset = st.sidebar.slider("Shift Signal Start (Offset)", 0, max_off, 0)
        else:
            offset = 0
        current_cycle = full_signal[offset: offset + period_len]
        theta_angles = np.linspace(0, 360, len(current_cycle))
        col_left, col_right = st.columns(2)
        with col_left:
            st.subheader("Periodic Polar Layout")
            fig_pol = go.Figure()
            fig_pol.add_trace(go.Scatterpolar(r=current_cycle, theta=theta_angles, mode='lines', fill='toself',
                                              line=dict(width=2, color='red'), name='Beat Cycle'))
            fig_pol.update_layout(polar=dict(radialaxis=dict(range=[min(full_signal), max(full_signal)], visible=True),
                                             angularaxis=dict(direction="clockwise")), height=500, showlegend=False)
            st.plotly_chart(fig_pol, use_container_width=True)
            st.info("💡 Adjust the periodicity slider until the loop closes perfectly.")
        with col_right:
            st.subheader("Recursive Poincaré Map")
            fig_recur = go.Figure(go.Scatter(x=full_signal[:-1], y=full_signal[1:], mode='markers',
                                             marker=dict(size=2, color='darkorange')))
            fig_recur.update_layout(xaxis_title="V(n)", yaxis_title="V(n+1)", height=500)
            st.plotly_chart(fig_recur, use_container_width=True)

else:
    st.info("👋 Welcome! Please upload your medical CSV data file to begin.")
    st.image("https://via.placeholder.com/1000x400.png?text=Awaiting+Data+Upload...", use_container_width=True)

st.markdown("---")
st.caption("Signal Analyzer Pro v5.0 | 2026 | Powered by Streamlit")