import numpy as np
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass, field
from collections import defaultdict
import time


ALGORITHM_WEIGHTED_LS = "weighted_ls"
ALGORITHM_LEAST_SQUARES_TOA = "ls_toa"
ALGORITHM_OPTIONS = {
    ALGORITHM_WEIGHTED_LS: "Weighted Least Squares",
    ALGORITHM_LEAST_SQUARES_TOA: "Least Squares (ToA)"
}


@dataclass
class GatewayReading:
    """RSSI reading from a single gateway"""
    gateway_id: int
    x: float
    y: float
    rssi: int
    tx_power: int = -59
    path_loss_exponent: float = 3.0


@dataclass
class PositionDebugInfo:
    """Debug information from a single position calculation for diagnostics"""
    beacon_id: int
    beacon_name: str
    algorithm: str
    gateway_readings: list
    distances: list
    weights: list
    raw_position: Tuple[float, float]
    smoothed_position: Tuple[float, float]
    accuracy: float
    residuals: list
    timestamp: float = 0.0


@dataclass
class KalmanState:
    """Kalman filter state for beacon tracking"""
    x: float = 0.0
    y: float = 0.0
    vx: float = 0.0
    vy: float = 0.0
    P: np.ndarray = field(default_factory=lambda: np.eye(4) * 10.0)
    last_update: float = 0.0
    initialized: bool = False


_kalman_states: Dict[int, KalmanState] = {}
_last_debug_info: Dict[int, PositionDebugInfo] = {}


def get_kalman_state(beacon_id: int) -> KalmanState:
    if beacon_id not in _kalman_states:
        _kalman_states[beacon_id] = KalmanState()
    return _kalman_states[beacon_id]


def get_debug_info(beacon_id: Optional[int] = None) -> Dict[int, PositionDebugInfo]:
    if beacon_id is not None:
        if beacon_id in _last_debug_info:
            return {beacon_id: _last_debug_info[beacon_id]}
        return {}
    return _last_debug_info.copy()


def store_debug_info(info: PositionDebugInfo):
    _last_debug_info[info.beacon_id] = info


def rssi_to_distance(rssi: int, tx_power: int = -59, path_loss_exponent: float = 3.0) -> float:
    if rssi >= tx_power:
        return 0.3

    ratio = (tx_power - rssi) / (10 * path_loss_exponent)
    distance = pow(10, ratio)

    return max(0.3, min(distance, 50))


def filter_rssi_readings(readings: List[GatewayReading], min_rssi: int = -95) -> List[GatewayReading]:
    gateway_readings: Dict[int, List[GatewayReading]] = defaultdict(list)

    for reading in readings:
        if reading.rssi >= min_rssi:
            gateway_readings[reading.gateway_id].append(reading)

    filtered = []
    for gateway_id, gw_readings in gateway_readings.items():
        if not gw_readings:
            continue

        rssi_values = [r.rssi for r in gw_readings]

        if len(rssi_values) >= 3:
            median_rssi = int(np.median(rssi_values))
            q1 = np.percentile(rssi_values, 25)
            q3 = np.percentile(rssi_values, 75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            filtered_values = [v for v in rssi_values if lower_bound <= v <= upper_bound]
            if filtered_values:
                median_rssi = int(np.median(filtered_values))
        else:
            median_rssi = int(np.median(rssi_values))

        template = gw_readings[0]
        filtered.append(GatewayReading(
            gateway_id=gateway_id,
            x=template.x,
            y=template.y,
            rssi=median_rssi,
            tx_power=template.tx_power,
            path_loss_exponent=template.path_loss_exponent
        ))

    return filtered


def calculate_weights(readings: List[GatewayReading]) -> np.ndarray:
    if not readings:
        return np.array([])

    rssi_values = np.array([r.rssi for r in readings])

    rssi_positive = rssi_values + 100
    rssi_weights = np.exp(rssi_positive / 20)

    distances = np.array([
        rssi_to_distance(r.rssi, r.tx_power, r.path_loss_exponent)
        for r in readings
    ])
    distance_weights = 1 / np.maximum(distances ** 1.5, 0.5)

    weights = rssi_weights * distance_weights
    weights = weights / np.sum(weights)

    return weights


def least_squares_toa_position(
    positions: np.ndarray,
    distances: np.ndarray
) -> Tuple[float, float]:
    """
    Calculate position using linearized Least Squares (ToA) method.

    Based on TR-2-2015 by Mathias Pelka, Luebeck University.
    Uses first anchor as reference, subtracts equations to linearize,
    then solves r = pinv(A) * b / 2.
    """
    n = len(positions)

    if n < 2:
        return float(positions[0, 0]), float(positions[0, 1])

    x = positions[:, 0]
    y = positions[:, 1]
    k = x ** 2 + y ** 2

    A = np.zeros((n - 1, 2))
    b = np.zeros(n - 1)

    for i in range(1, n):
        A[i - 1, :] = [x[i] - x[0], y[i] - y[0]]
        b[i - 1] = distances[0] ** 2 - distances[i] ** 2 + k[i] - k[0]

    try:
        result = np.linalg.pinv(A) @ b / 2
        return float(result[0]), float(result[1])
    except np.linalg.LinAlgError:
        return float(np.mean(x)), float(np.mean(y))


def weighted_least_squares_toa_position(
    positions: np.ndarray,
    distances: np.ndarray,
    weights: np.ndarray
) -> Tuple[float, float]:
    """
    Weighted variant of the linearized Least Squares (ToA) method.

    Applies signal-quality weights to the least squares solution.
    Uses all anchors as reference in turn and combines results for robustness.
    """
    n = len(positions)

    if n < 2:
        return float(positions[0, 0]), float(positions[0, 1])

    if n == 2:
        return least_squares_toa_position(positions, distances)

    results_x = []
    results_y = []
    result_weights = []

    for ref in range(min(n, 4)):
        x = positions[:, 0]
        y = positions[:, 1]
        k = x ** 2 + y ** 2

        indices = [i for i in range(n) if i != ref]

        A = np.zeros((len(indices), 2))
        b = np.zeros(len(indices))
        w = np.zeros(len(indices))

        for j, i in enumerate(indices):
            A[j, :] = [x[i] - x[ref], y[i] - y[ref]]
            b[j] = distances[ref] ** 2 - distances[i] ** 2 + k[i] - k[ref]
            w[j] = weights[i]

        w_norm = w / np.sum(w) if np.sum(w) > 0 else np.ones(len(w)) / len(w)
        W = np.diag(w_norm)

        try:
            AtWA = A.T @ W @ A
            AtWb = A.T @ W @ b

            if np.linalg.det(AtWA) < 1e-10:
                result = np.linalg.pinv(A) @ b / 2
            else:
                result = np.linalg.solve(AtWA, AtWb) / 2

            results_x.append(result[0])
            results_y.append(result[1])
            result_weights.append(weights[ref])
        except (np.linalg.LinAlgError, ValueError):
            continue

    if not results_x:
        return least_squares_toa_position(positions, distances)

    total_w = sum(result_weights)
    if total_w > 0:
        final_x = sum(rx * rw for rx, rw in zip(results_x, result_weights)) / total_w
        final_y = sum(ry * rw for ry, rw in zip(results_y, result_weights)) / total_w
    else:
        final_x = np.mean(results_x)
        final_y = np.mean(results_y)

    return float(final_x), float(final_y)


def trilaterate_2d(
    readings: List[GatewayReading],
    beacon_id: Optional[int] = None,
    algorithm: str = ALGORITHM_WEIGHTED_LS,
    beacon_name: str = ""
) -> Tuple[float, float, float]:
    if not readings:
        return 0.0, 0.0, 100.0

    filtered_readings = filter_rssi_readings(readings)

    if len(filtered_readings) < 1:
        return 0.0, 0.0, 100.0

    if len(filtered_readings) == 1:
        r = filtered_readings[0]
        distance = rssi_to_distance(r.rssi, r.tx_power, r.path_loss_exponent)
        return r.x, r.y, distance

    positions = np.array([[r.x, r.y] for r in filtered_readings])
    distances = np.array([
        rssi_to_distance(r.rssi, r.tx_power, r.path_loss_exponent)
        for r in filtered_readings
    ])
    weights = calculate_weights(filtered_readings)

    if len(filtered_readings) == 2:
        x, y = weighted_two_gateway_position(positions, distances, weights)
        accuracy = estimate_accuracy_two_gateways(positions, distances)
    else:
        if algorithm == ALGORITHM_LEAST_SQUARES_TOA:
            x, y = weighted_least_squares_toa_position(positions, distances, weights)
        else:
            x, y = weighted_least_squares_position(positions, distances, weights)
        accuracy = estimate_accuracy(positions, distances, x, y)

    raw_x, raw_y = x, y

    if beacon_id is not None:
        x, y, accuracy = apply_kalman_filter(beacon_id, x, y, accuracy)

    estimated_dists = np.sqrt((positions[:, 0] - raw_x) ** 2 + (positions[:, 1] - raw_y) ** 2)
    residuals_list = (estimated_dists - distances).tolist()

    if beacon_id is not None:
        debug = PositionDebugInfo(
            beacon_id=beacon_id,
            beacon_name=beacon_name,
            algorithm=algorithm,
            gateway_readings=[{
                'gateway_id': r.gateway_id,
                'x': r.x,
                'y': r.y,
                'rssi': r.rssi,
                'tx_power': r.tx_power,
                'path_loss_exponent': r.path_loss_exponent
            } for r in filtered_readings],
            distances=distances.tolist(),
            weights=weights.tolist(),
            raw_position=(raw_x, raw_y),
            smoothed_position=(x, y),
            accuracy=accuracy,
            residuals=residuals_list,
            timestamp=time.time()
        )
        store_debug_info(debug)

    return float(x), float(y), float(accuracy)


def weighted_two_gateway_position(
    positions: np.ndarray,
    distances: np.ndarray,
    weights: np.ndarray
) -> Tuple[float, float]:
    p1, p2 = positions[0], positions[1]
    d1, d2 = distances[0], distances[1]

    gateway_dist = np.linalg.norm(p2 - p1)

    if gateway_dist < 0.1:
        return float(p1[0]), float(p1[1])

    direction = (p2 - p1) / gateway_dist

    t = (gateway_dist ** 2 + d1 ** 2 - d2 ** 2) / (2 * gateway_dist)
    t = np.clip(t, 0, gateway_dist)

    point_on_line = p1 + direction * t

    h_squared = d1 ** 2 - t ** 2
    if h_squared > 0:
        h = np.sqrt(h_squared)
        perpendicular = np.array([-direction[1], direction[0]])
        candidate1 = point_on_line + perpendicular * h
        candidate2 = point_on_line - perpendicular * h
        x = (candidate1[0] + candidate2[0]) / 2
        y = (candidate1[1] + candidate2[1]) / 2
    else:
        x, y = point_on_line[0], point_on_line[1]

    return float(x), float(y)


def weighted_least_squares_position(
    positions: np.ndarray,
    distances: np.ndarray,
    weights: np.ndarray
) -> Tuple[float, float]:
    n = len(positions)

    A = np.zeros((n - 1, 2))
    b = np.zeros(n - 1)

    for i in range(n - 1):
        A[i, 0] = 2 * (positions[i, 0] - positions[n - 1, 0])
        A[i, 1] = 2 * (positions[i, 1] - positions[n - 1, 1])
        b[i] = (distances[n - 1] ** 2 - distances[i] ** 2 +
                positions[i, 0] ** 2 - positions[n - 1, 0] ** 2 +
                positions[i, 1] ** 2 - positions[n - 1, 1] ** 2)

    W = np.diag(weights[:-1] / np.sum(weights[:-1]))

    try:
        AtWA = A.T @ W @ A
        AtWb = A.T @ W @ b

        if np.linalg.det(AtWA) < 1e-10:
            x = np.sum(positions[:, 0] * weights)
            y = np.sum(positions[:, 1] * weights)
        else:
            result = np.linalg.solve(AtWA, AtWb)
            x, y = result[0], result[1]
    except np.linalg.LinAlgError:
        x = np.sum(positions[:, 0] * weights)
        y = np.sum(positions[:, 1] * weights)

    return float(x), float(y)


def estimate_accuracy(
    positions: np.ndarray,
    distances: np.ndarray,
    x: float,
    y: float
) -> float:
    estimated_distances = np.sqrt((positions[:, 0] - x) ** 2 + (positions[:, 1] - y) ** 2)

    residuals = np.abs(estimated_distances - distances)
    rmse = np.sqrt(np.mean(residuals ** 2))

    n = len(positions)
    if n >= 3:
        centroid = np.mean(positions, axis=0)
        spread = np.mean(np.linalg.norm(positions - centroid, axis=1))
        if spread > 0:
            gdop = 1.0 / (spread / 10.0 + 0.1)
        else:
            gdop = 5.0
    else:
        gdop = 3.0

    accuracy = rmse * (1 + gdop * 0.1)

    return max(0.5, min(accuracy, 50.0))


def estimate_accuracy_two_gateways(
    positions: np.ndarray,
    distances: np.ndarray
) -> float:
    gateway_dist = np.linalg.norm(positions[1] - positions[0])
    avg_distance = np.mean(distances)

    base_accuracy = avg_distance * 0.15

    if gateway_dist < avg_distance:
        geometry_penalty = 1.5
    else:
        geometry_penalty = 1.0

    return max(1.0, base_accuracy * geometry_penalty)


def apply_kalman_filter(
    beacon_id: int,
    measured_x: float,
    measured_y: float,
    measurement_accuracy: float
) -> Tuple[float, float, float]:
    state = get_kalman_state(beacon_id)
    current_time = time.time()

    if not state.initialized:
        state.x = measured_x
        state.y = measured_y
        state.vx = 0.0
        state.vy = 0.0
        state.P = np.eye(4) * measurement_accuracy ** 2
        state.last_update = current_time
        state.initialized = True
        return measured_x, measured_y, measurement_accuracy

    dt = min(current_time - state.last_update, 10.0)
    if dt < 0.01:
        dt = 0.1

    F = np.array([
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ])

    process_noise = 0.5
    Q = np.array([
        [dt ** 4 / 4, 0, dt ** 3 / 2, 0],
        [0, dt ** 4 / 4, 0, dt ** 3 / 2],
        [dt ** 3 / 2, 0, dt ** 2, 0],
        [0, dt ** 3 / 2, 0, dt ** 2]
    ]) * process_noise ** 2

    x_pred = np.array([state.x, state.y, state.vx, state.vy])
    x_pred = F @ x_pred
    P_pred = F @ state.P @ F.T + Q

    H = np.array([
        [1, 0, 0, 0],
        [0, 1, 0, 0]
    ])

    R = np.eye(2) * (measurement_accuracy ** 2)

    z = np.array([measured_x, measured_y])
    y_residual = z - H @ x_pred
    S = H @ P_pred @ H.T + R
    K = P_pred @ H.T @ np.linalg.inv(S)

    x_new = x_pred + K @ y_residual
    P_new = (np.eye(4) - K @ H) @ P_pred

    state.x = float(x_new[0])
    state.y = float(x_new[1])
    state.vx = float(x_new[2])
    state.vy = float(x_new[3])
    state.P = P_new
    state.last_update = current_time

    filtered_accuracy = np.sqrt(P_new[0, 0] + P_new[1, 1])

    return state.x, state.y, float(max(0.3, min(filtered_accuracy, measurement_accuracy)))


def calculate_velocity(
    current_pos: Tuple[float, float],
    previous_pos: Tuple[float, float],
    time_delta_seconds: float
) -> Tuple[float, float, float, float]:
    if time_delta_seconds <= 0:
        return 0.0, 0.0, 0.0, 0.0

    dx = current_pos[0] - previous_pos[0]
    dy = current_pos[1] - previous_pos[1]

    velocity_x = dx / time_delta_seconds
    velocity_y = dy / time_delta_seconds

    speed = np.sqrt(velocity_x ** 2 + velocity_y ** 2)

    heading = np.degrees(np.arctan2(dy, dx))
    if heading < 0:
        heading += 360

    return float(velocity_x), float(velocity_y), float(speed), float(heading)


def smooth_position(
    current_pos: Tuple[float, float],
    previous_positions: List[Tuple[float, float]],
    alpha: float = 0.7,
    jump_threshold: float = 3.0
) -> Tuple[float, float]:
    if not previous_positions:
        return current_pos

    last_pos = previous_positions[-1]

    distance = np.sqrt((current_pos[0] - last_pos[0]) ** 2 + (current_pos[1] - last_pos[1]) ** 2)

    if distance > jump_threshold:
        return current_pos

    smoothed_x = alpha * current_pos[0] + (1 - alpha) * last_pos[0]
    smoothed_y = alpha * current_pos[1] + (1 - alpha) * last_pos[1]

    return smoothed_x, smoothed_y


def filter_outlier_readings(
    readings: List[GatewayReading],
    max_distance: float = 30.0
) -> List[GatewayReading]:
    filtered = []
    for reading in readings:
        distance = rssi_to_distance(
            reading.rssi,
            reading.tx_power,
            reading.path_loss_exponent
        )
        if distance <= max_distance:
            filtered.append(reading)

    return filtered if filtered else readings


def reset_kalman_state(beacon_id: Optional[int] = None):
    global _kalman_states
    if beacon_id is None:
        _kalman_states.clear()
    elif beacon_id in _kalman_states:
        del _kalman_states[beacon_id]
