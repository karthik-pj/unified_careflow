import streamlit as st
import time
from datetime import datetime, timedelta
from database import get_db_session, Gateway, Beacon, RSSISignal, Position, Floor, Building, CalibrationPoint
from utils.signal_processor import get_signal_processor
from utils.triangulation import (
    rssi_to_distance, get_debug_info, GatewayReading, trilaterate_2d,
    ALGORITHM_OPTIONS, ALGORITHM_WEIGHTED_LS, ALGORITHM_LEAST_SQUARES_TOA,
    reset_kalman_state
)


def render():
    st.title("Signal Diagnostics")
    st.markdown("Debug positioning accuracy by examining raw signals, calculated distances, and position results")

    processor = get_signal_processor()
    if not processor.is_running:
        st.warning("Signal processor is not running. Start it in MQTT Configuration to see live data.")

    tab_live, tab_calibrate = st.tabs(["Live Diagnostics", "Calibration"])

    with tab_live:
        render_live_diagnostics()

    with tab_calibrate:
        render_calibration()


def render_live_diagnostics():
    col_ctrl1, col_ctrl2 = st.columns([1, 3])
    with col_ctrl1:
        if st.button("Refresh Data", type="primary"):
            st.rerun()

    with col_ctrl2:
        auto_refresh = st.checkbox("Auto-refresh (5s)", value=False)

    with get_db_session() as session:
        window_seconds = 15
        window_start = datetime.utcnow() - timedelta(seconds=window_seconds)

        beacons = session.query(Beacon).filter(Beacon.is_active == True).order_by(Beacon.name).all()

        if not beacons:
            st.info("No active beacons registered.")
            return

        for beacon in beacons:
            signals = session.query(RSSISignal).filter(
                RSSISignal.beacon_id == beacon.id,
                RSSISignal.timestamp >= window_start
            ).order_by(RSSISignal.timestamp.desc()).all()

            signal_count = len(signals)
            gateway_ids = set(s.gateway_id for s in signals)

            latest_pos = session.query(Position).filter(
                Position.beacon_id == beacon.id
            ).order_by(Position.timestamp.desc()).first()

            pos_age = ""
            if latest_pos:
                age_sec = (datetime.utcnow() - latest_pos.timestamp).total_seconds()
                pos_age = f" ({age_sec:.0f}s ago)"

            header = f"{beacon.name} ({beacon.mac_address}) - {signal_count} signals from {len(gateway_ids)} gateways"
            with st.expander(header, expanded=(signal_count > 0)):
                if signal_count == 0:
                    st.warning("No signals received in the last 15 seconds")
                    if latest_pos:
                        st.write(f"Last known position: ({latest_pos.x_position:.2f}m, {latest_pos.y_position:.2f}m){pos_age}")
                    continue

                st.markdown("**Per-Gateway Signal Analysis**")

                gw_data = {}
                for sig in signals:
                    if sig.gateway_id not in gw_data:
                        gw_data[sig.gateway_id] = []
                    gw_data[sig.gateway_id].append(sig)

                table_rows = []
                for gw_id, gw_signals in gw_data.items():
                    gw = session.query(Gateway).filter(Gateway.id == gw_id).first()
                    if not gw:
                        continue

                    rssi_values = [s.rssi for s in gw_signals]
                    avg_rssi = sum(rssi_values) / len(rssi_values)
                    min_rssi = min(rssi_values)
                    max_rssi = max(rssi_values)
                    tx_power = gw_signals[0].tx_power or -59

                    distance = rssi_to_distance(
                        int(round(avg_rssi)),
                        tx_power,
                        gw.path_loss_exponent or 2.5
                    )

                    table_rows.append({
                        "Gateway": gw.name,
                        "Position": f"({gw.x_position:.1f}, {gw.y_position:.1f})",
                        "Signals": len(gw_signals),
                        "Avg RSSI": f"{avg_rssi:.0f} dBm",
                        "Min/Max": f"{min_rssi}/{max_rssi} dBm",
                        "TX Power": f"{tx_power} dBm",
                        "Path Loss": f"{gw.path_loss_exponent or 2.5}",
                        "Est. Distance": f"{distance:.2f}m"
                    })

                if table_rows:
                    st.dataframe(table_rows, use_container_width=True, hide_index=True)

                debug_info = get_debug_info(beacon.id)
                if beacon.id in debug_info:
                    dbg = debug_info[beacon.id]
                    st.markdown("**Position Calculation Details**")

                    detail_col1, detail_col2 = st.columns(2)

                    with detail_col1:
                        st.write(f"Algorithm: **{ALGORITHM_OPTIONS.get(dbg.algorithm, dbg.algorithm)}**")
                        st.write(f"Raw Position: ({dbg.raw_position[0]:.2f}m, {dbg.raw_position[1]:.2f}m)")
                        st.write(f"Smoothed Position: ({dbg.smoothed_position[0]:.2f}m, {dbg.smoothed_position[1]:.2f}m)")
                        st.write(f"Estimated Accuracy: {dbg.accuracy:.2f}m")

                    with detail_col2:
                        if dbg.distances:
                            st.write("**Distances (RSSI to meters):**")
                            for i, (gwr, dist, w) in enumerate(zip(dbg.gateway_readings, dbg.distances, dbg.weights)):
                                gw = session.query(Gateway).filter(Gateway.id == gwr['gateway_id']).first()
                                gw_name = gw.name if gw else f"GW#{gwr['gateway_id']}"
                                st.write(f"  {gw_name}: {dist:.2f}m (weight: {w:.3f}, RSSI: {gwr['rssi']} dBm)")

                    if dbg.residuals:
                        st.markdown("**Residuals** (positive = calc distance > measured distance)")
                        res_rows = []
                        for i, (gwr, res) in enumerate(zip(dbg.gateway_readings, dbg.residuals)):
                            gw = session.query(Gateway).filter(Gateway.id == gwr['gateway_id']).first()
                            gw_name = gw.name if gw else f"GW#{gwr['gateway_id']}"
                            res_rows.append({
                                "Gateway": gw_name,
                                "Residual": f"{res:+.2f}m",
                                "Quality": "Good" if abs(res) < 1.0 else ("Fair" if abs(res) < 2.0 else "Poor")
                            })
                        st.dataframe(res_rows, use_container_width=True, hide_index=True)

                elif latest_pos:
                    st.markdown("**Last Known Position**")
                    st.write(f"Position: ({latest_pos.x_position:.2f}m, {latest_pos.y_position:.2f}m)")
                    st.write(f"Accuracy: {latest_pos.accuracy:.2f}m")
                    st.write(f"Method: {latest_pos.calculation_method}")
                    st.write(f"Time: {latest_pos.timestamp}{pos_age}")

                st.markdown("---")
                st.markdown("**Quick Compare: Both Algorithms**")
                readings = []
                for gw_id, gw_signals in gw_data.items():
                    gw = session.query(Gateway).filter(Gateway.id == gw_id).first()
                    if not gw or not gw_signals:
                        continue
                    rssi_values = [s.rssi for s in gw_signals]
                    avg_rssi = int(round(sum(rssi_values) / len(rssi_values)))
                    tx_power = gw_signals[0].tx_power or -59
                    readings.append(GatewayReading(
                        gateway_id=gw.id,
                        x=gw.x_position,
                        y=gw.y_position,
                        rssi=avg_rssi,
                        tx_power=tx_power,
                        path_loss_exponent=gw.path_loss_exponent or 2.5
                    ))

                if len(readings) >= 2:
                    cmp_col1, cmp_col2 = st.columns(2)
                    with cmp_col1:
                        x1, y1, a1 = trilaterate_2d(readings, algorithm=ALGORITHM_WEIGHTED_LS)
                        st.write(f"**Weighted LS:** ({x1:.2f}m, {y1:.2f}m) ± {a1:.2f}m")
                    with cmp_col2:
                        x2, y2, a2 = trilaterate_2d(readings, algorithm=ALGORITHM_LEAST_SQUARES_TOA)
                        st.write(f"**LS (ToA):** ({x2:.2f}m, {y2:.2f}m) ± {a2:.2f}m")
                else:
                    st.info("Need at least 2 gateways to compare algorithms")

    if auto_refresh:
        time.sleep(5)
        st.rerun()


def render_calibration():
    st.markdown("Place a beacon at a known position and compare with the calculated position to improve accuracy")

    with get_db_session() as session:
        beacons = session.query(Beacon).filter(Beacon.is_active == True).order_by(Beacon.name).all()
        floors_query = session.query(Floor).order_by(Floor.id).all()

        if not beacons:
            st.info("No active beacons available for calibration")
            return

        if not floors_query:
            st.info("No floors configured. Add buildings and floors first.")
            return

        floor_options = {}
        for f in floors_query:
            building = session.query(Building).filter(Building.id == f.building_id).first()
            label = f"{building.name if building else 'Unknown'} - {f.name or f'Floor {f.floor_number}'}"
            floor_options[label] = f.id

        st.subheader("New Calibration Point")

        with st.form("calibration_form"):
            cal_col1, cal_col2 = st.columns(2)

            with cal_col1:
                beacon_names = [f"{b.name} ({b.mac_address})" for b in beacons]
                selected_beacon_idx = st.selectbox("Select Beacon", range(len(beacon_names)), format_func=lambda i: beacon_names[i])
                selected_beacon = beacons[selected_beacon_idx]

                floor_labels = list(floor_options.keys())
                selected_floor_label = st.selectbox("Floor", floor_labels)
                selected_floor_id = floor_options[selected_floor_label]

            with cal_col2:
                known_x = st.number_input("Known X Position (meters)", value=0.0, step=0.1, format="%.2f")
                known_y = st.number_input("Known Y Position (meters)", value=0.0, step=0.1, format="%.2f")

            st.info("Place the beacon at the specified position for at least 30 seconds before capturing.")

            capture = st.form_submit_button("Capture Calibration Point", type="primary")

            if capture:
                latest_pos = session.query(Position).filter(
                    Position.beacon_id == selected_beacon.id
                ).order_by(Position.timestamp.desc()).first()

                if latest_pos:
                    age = (datetime.utcnow() - latest_pos.timestamp).total_seconds()
                    if age > 60:
                        st.warning(f"Latest position is {age:.0f}s old. Make sure the beacon is active and signals are being received.")

                    error_distance = ((latest_pos.x_position - known_x) ** 2 + (latest_pos.y_position - known_y) ** 2) ** 0.5

                    cal_point = CalibrationPoint(
                        floor_id=selected_floor_id,
                        beacon_id=selected_beacon.id,
                        known_x=known_x,
                        known_y=known_y,
                        measured_x=latest_pos.x_position,
                        measured_y=latest_pos.y_position,
                        error_distance=error_distance,
                        is_verified=True
                    )
                    session.add(cal_point)
                    session.commit()

                    if error_distance < 1.0:
                        st.success(f"Calibration point saved! Error: {error_distance:.2f}m - Good accuracy")
                    elif error_distance < 2.0:
                        st.warning(f"Calibration point saved! Error: {error_distance:.2f}m - Consider adjusting gateway calibration")
                    else:
                        st.error(f"Calibration point saved! Error: {error_distance:.2f}m - Significant deviation, calibration needed")

                    st.write(f"Known: ({known_x:.2f}m, {known_y:.2f}m)")
                    st.write(f"Measured: ({latest_pos.x_position:.2f}m, {latest_pos.y_position:.2f}m)")
                    st.write(f"Error: {error_distance:.2f}m")
                else:
                    st.error("No position data available for this beacon. Make sure it is active and receiving signals.")

        st.markdown("---")
        st.subheader("Calibration History")

        cal_points = session.query(CalibrationPoint).order_by(CalibrationPoint.timestamp.desc()).limit(50).all()

        if cal_points:
            cal_rows = []
            for cp in cal_points:
                beacon = session.query(Beacon).filter(Beacon.id == cp.beacon_id).first()
                floor = session.query(Floor).filter(Floor.id == cp.floor_id).first()
                cal_rows.append({
                    "Beacon": beacon.name if beacon else f"#{cp.beacon_id}",
                    "Floor": floor.name if floor else f"#{cp.floor_id}",
                    "Known Pos": f"({cp.known_x:.2f}, {cp.known_y:.2f})",
                    "Measured Pos": f"({cp.measured_x:.2f}, {cp.measured_y:.2f})" if cp.measured_x is not None else "N/A",
                    "Error": f"{cp.error_distance:.2f}m" if cp.error_distance is not None else "N/A",
                    "Time": cp.timestamp.strftime("%Y-%m-%d %H:%M") if cp.timestamp else "N/A"
                })
            st.dataframe(cal_rows, use_container_width=True, hide_index=True)

            if len(cal_points) >= 2:
                errors = [cp.error_distance for cp in cal_points if cp.error_distance is not None]
                if errors:
                    avg_error = sum(errors) / len(errors)
                    max_error = max(errors)
                    min_error = min(errors)
                    st.markdown(f"**Summary:** {len(errors)} points, Avg error: {avg_error:.2f}m, Min: {min_error:.2f}m, Max: {max_error:.2f}m")

        else:
            st.info("No calibration points captured yet. Use the form above to add reference measurements.")

        st.markdown("---")
        st.subheader("Gateway Calibration Tuning")
        st.markdown("Adjust per-gateway TX Power and Path Loss Exponent to improve accuracy")

        gateways = session.query(Gateway).filter(Gateway.is_active == True).order_by(Gateway.name).all()

        if gateways:
            for gw in gateways:
                with st.expander(f"{gw.name} ({gw.mac_address})"):
                    gw_col1, gw_col2, gw_col3 = st.columns(3)

                    with gw_col1:
                        st.write(f"**Current TX Power:** {gw.signal_strength_calibration or -59} dBm")
                        st.write(f"**Current Path Loss:** {gw.path_loss_exponent or 2.5}")

                    with gw_col2:
                        new_tx = st.number_input(
                            "TX Power (dBm)",
                            min_value=-100, max_value=0,
                            value=int(gw.signal_strength_calibration or -59),
                            key=f"cal_tx_{gw.id}",
                            help="Signal strength at 1 meter. Typical: -40 to -70 dBm"
                        )

                        new_ple = st.number_input(
                            "Path Loss Exponent",
                            min_value=1.0, max_value=6.0,
                            value=float(gw.path_loss_exponent or 2.5),
                            step=0.1,
                            key=f"cal_ple_{gw.id}",
                            help="2.0=free space, 2.5=light indoor, 3.0=obstacles, 3.5-4.0=dense"
                        )

                    with gw_col3:
                        st.markdown("**RSSI to Distance Preview:**")
                        for test_rssi in [-50, -60, -70, -80, -90]:
                            d = rssi_to_distance(test_rssi, new_tx, new_ple)
                            st.write(f"  {test_rssi} dBm = {d:.1f}m")

                    if st.button(f"Save {gw.name} Calibration", key=f"save_cal_{gw.id}"):
                        gw.signal_strength_calibration = float(new_tx)
                        gw.path_loss_exponent = float(new_ple)
                        session.commit()
                        reset_kalman_state()
                        st.success(f"Calibration updated for {gw.name}. Kalman filters reset.")
                        st.rerun()
        else:
            st.info("No active gateways found")
