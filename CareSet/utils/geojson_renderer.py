import pandas as pd
import json
import math
import base64
from io import BytesIO
from PIL import Image
import plotly.graph_objects as go
import streamlit as st


def latlon_to_meters(lat, lon, origin_lat, origin_lon):
    """Convert lat/lon to local meter coordinates using equirectangular projection"""
    dx = (lon - origin_lon) * math.cos(math.radians(origin_lat)) * 111000
    dy = (lat - origin_lat) * 111000
    return dx, dy


def meters_to_latlon(x, y, origin_lat, origin_lon):
    """Convert local meter coordinates back to lat/lon"""
    lat = origin_lat + (y / 111000)
    lon = origin_lon + (x / (111000 * math.cos(math.radians(origin_lat))))
    return lat, lon


def rotate_point(x, y, angle_deg, cx, cy):
    """Rotate a point (x,y) around center (cx,cy) by angle_deg degrees."""
    if angle_deg == 0:
        return x, y
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    dx = x - cx
    dy = y - cy
    rx = cx + dx * cos_a - dy * sin_a
    ry = cy + dx * sin_a + dy * cos_a
    return rx, ry


def rotate_points(xs, ys, angle_deg, cx, cy):
    """Rotate lists of x,y coordinates around center (cx,cy) by angle_deg degrees."""
    if angle_deg == 0:
        return xs, ys
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    rxs = []
    rys = []
    for x, y in zip(xs, ys):
        dx = x - cx
        dy = y - cy
        rxs.append(cx + dx * cos_a - dy * sin_a)
        rys.append(cy + dx * sin_a + dy * cos_a)
    return rxs, rys


def get_rotation_center(floor):
    """Get the center point of a floor plan for rotation."""
    bounds = get_geojson_bounds(floor)
    if bounds:
        cx = (bounds['min_x'] + bounds['max_x']) / 2
        cy = (bounds['min_y'] + bounds['max_y']) / 2
        return cx, cy
    return float(floor.width_meters) / 2, float(floor.height_meters) / 2


def render_rotation_controls(key_prefix, t_func=None):
    """Render rotation controls (step buttons + slider) and return the current angle.
    
    Args:
        key_prefix: Unique prefix for session state keys (e.g., 'gateways', 'planning')
        t_func: Translation function, takes a key and returns translated string
    
    Returns:
        Current rotation angle in degrees
    """
    state_key = f"rotation_{key_prefix}"
    if state_key not in st.session_state:
        st.session_state[state_key] = 0

    label_rotate = "Rotate Floor Plan" if not t_func else t_func("rotate_floor_plan")
    label_reset = "Reset" if not t_func else t_func("rotation_reset")
    label_custom = "Custom angle" if not t_func else t_func("rotation_custom")

    with st.expander(f"🔄 {label_rotate}", expanded=False):
        step_cols = st.columns(8)
        steps = [0, 45, 90, 135, 180, 225, 270, 315]
        for i, angle in enumerate(steps):
            with step_cols[i]:
                label = f"{angle}°" if angle > 0 else label_reset
                if st.button(label, key=f"{key_prefix}_rot_{angle}", width='stretch'):
                    st.session_state[state_key] = angle
                    st.rerun()

        current = st.session_state[state_key]
        new_angle = st.slider(
            label_custom,
            min_value=0, max_value=359, value=current, step=1,
            key=f"{key_prefix}_rot_slider"
        )
        if new_angle != current:
            st.session_state[state_key] = new_angle
            st.rerun()

    return st.session_state[state_key]


def get_geojson_bounds(floor):
    """Calculate the actual coordinate bounds of the GeoJSON floor plan in meters"""
    if not floor.floor_plan_geojson:
        return None
    
    try:
        geojson_data = json.loads(floor.floor_plan_geojson)
        all_x = []
        all_y = []
        
        has_origin = floor.origin_lat and floor.origin_lon
        
        for feature in geojson_data.get('features', []):
            geom = feature.get('geometry', {})
            geom_type = geom.get('type', '')
            
            coords_list = []
            if geom_type == 'Polygon':
                coords_list = geom.get('coordinates', [[]])[0]
            elif geom_type == 'MultiPolygon':
                for polygon in geom.get('coordinates', []):
                    if polygon:
                        coords_list.extend(polygon[0])
            elif geom_type == 'LineString':
                coords_list = geom.get('coordinates', [])
            elif geom_type == 'MultiLineString':
                for line in geom.get('coordinates', []):
                    coords_list.extend(line)
            
            for c in coords_list:
                if len(c) >= 2:
                    if has_origin:
                        x, y = latlon_to_meters(c[1], c[0], floor.origin_lat, floor.origin_lon)
                    else:
                        x, y = c[0], c[1]
                    all_x.append(x)
                    all_y.append(y)
        
        if all_x and all_y:
            return {
                'min_x': min(all_x),
                'max_x': max(all_x),
                'min_y': min(all_y),
                'max_y': max(all_y),
                'width': max(all_x) - min(all_x),
                'height': max(all_y) - min(all_y)
            }
        return None
    except Exception:
        return None


def extract_rooms_from_geojson(floor):
    """Extract room polygons from GeoJSON floor plan with their coordinates in meters"""
    rooms = []
    
    if not floor.floor_plan_geojson:
        return rooms
    
    try:
        geojson_data = json.loads(floor.floor_plan_geojson)
        has_origin = floor.origin_lat and floor.origin_lon
        
        for feature in geojson_data.get('features', []):
            props = feature.get('properties', {})
            geom = feature.get('geometry', {})
            geom_type = props.get('geomType', '')
            geometry_type = geom.get('type', '')
            
            if geom_type == 'room' and geometry_type == 'Polygon':
                coords = geom.get('coordinates', [[]])[0]
                if coords:
                    meter_coords = []
                    for c in coords:
                        if len(c) >= 2:
                            if has_origin:
                                x, y = latlon_to_meters(c[1], c[0], floor.origin_lat, floor.origin_lon)
                            else:
                                x, y = c[0], c[1]
                            meter_coords.append([x, y])
                    
                    if meter_coords:
                        xs = [p[0] for p in meter_coords]
                        ys = [p[1] for p in meter_coords]
                        rooms.append({
                            'name': props.get('name', 'Unnamed'),
                            'coords': meter_coords,
                            'center_x': sum(xs) / len(xs),
                            'center_y': sum(ys) / len(ys),
                            'min_x': min(xs),
                            'max_x': max(xs),
                            'min_y': min(ys),
                            'max_y': max(ys),
                            'properties': props
                        })
        
        return rooms
    except Exception:
        return rooms


def render_polygon_ring(fig, ring_coords, floor, props, convert_coords=True):
    """Render a single polygon ring (exterior or interior)"""
    if not ring_coords:
        return
    
    xs = []
    ys = []
    has_origin = floor.origin_lat and floor.origin_lon
    
    for c in ring_coords:
        if len(c) >= 2:
            if convert_coords and has_origin:
                lon, lat = c[0], c[1]
                x, y = latlon_to_meters(lat, lon, floor.origin_lat, floor.origin_lon)
            else:
                x, y = c[0], c[1]
            xs.append(x)
            ys.append(y)
    
    if not xs:
        return
    
    name = props.get('name', '')
    geom_type = props.get('geomType', '')
    
    if geom_type == 'room':
        fill_color = 'rgba(46, 92, 191, 0.15)'
        line_color = '#2e5cbf'
        line_width = 1
    elif geom_type == 'building':
        fill_color = 'rgba(200, 200, 200, 0.1)'
        line_color = '#444'
        line_width = 2
    else:
        fill_color = 'rgba(150, 150, 150, 0.1)'
        line_color = '#666'
        line_width = 1
    
    fig.add_trace(go.Scatter(
        x=xs,
        y=ys,
        fill='toself',
        fillcolor=fill_color,
        line=dict(color=line_color, width=line_width),
        name=name if name else geom_type,
        hovertemplate=f"<b>{name or geom_type}</b><extra></extra>",
        mode='lines',
        showlegend=False
    ))
    
    if name and geom_type == 'room':
        center_x = sum(xs) / len(xs)
        center_y = sum(ys) / len(ys)
        fig.add_annotation(
            x=center_x,
            y=center_y,
            text=name[:12],
            showarrow=False,
            font=dict(size=8, color='#1a1a1a')
        )


def _convert_coord(c, has_origin, floor):
    """Convert a single GeoJSON coordinate to meters."""
    if has_origin:
        return latlon_to_meters(c[1], c[0], floor.origin_lat, floor.origin_lon)
    return c[0], c[1]


def _extract_coords(coord_list, has_origin, floor):
    """Extract and convert a list of GeoJSON coordinates to x,y lists."""
    xs, ys = [], []
    for c in coord_list:
        if len(c) >= 2:
            x, y = _convert_coord(c, has_origin, floor)
            xs.append(x)
            ys.append(y)
    return xs, ys


def render_geojson_floor_plan(fig, floor, show_room_labels=True, rotation_angle=0, rotation_center=None):
    """Render GeoJSON floor plan as Plotly traces in meter coordinates.
    
    Handles all geometry types: Point, LineString, Polygon, MultiPolygon, etc.
    Works with both DXF-converted GeoJSON (meter coords) and GPS-based GeoJSON.
    """
    if not floor.floor_plan_geojson:
        return False
    
    try:
        geojson_data = json.loads(floor.floor_plan_geojson)
        rendered_any = False
        has_origin = floor.origin_lat and floor.origin_lon
        
        if rotation_angle != 0 and rotation_center is None:
            rotation_center = get_rotation_center(floor)
        cx, cy = rotation_center if rotation_center else (0, 0)
        
        for feature in geojson_data.get('features', []):
            props = feature.get('properties', {})
            geom = feature.get('geometry', {})
            geometry_type = geom.get('type', '')
            geom_type = props.get('geomType', '')
            
            if geometry_type == 'Polygon':
                rings = geom.get('coordinates', [])
                if rings:
                    xs, ys = _extract_coords(rings[0], has_origin, floor)
                    if rotation_angle != 0 and xs:
                        xs, ys = rotate_points(xs, ys, rotation_angle, cx, cy)
                    
                    if xs:
                        name = props.get('name', '')
                        
                        if geom_type == 'room':
                            fill_color = 'rgba(46, 92, 191, 0.15)'
                            line_color = '#2e5cbf'
                        elif geom_type == 'building':
                            fill_color = 'rgba(200, 200, 200, 0.1)'
                            line_color = '#444'
                        else:
                            fill_color = 'rgba(150, 150, 150, 0.1)'
                            line_color = '#666'
                        
                        fig.add_trace(go.Scatter(
                            x=xs,
                            y=ys,
                            fill='toself',
                            fillcolor=fill_color,
                            line=dict(color=line_color, width=1),
                            name=name if name else geom_type,
                            hovertemplate=f"<b>{name or geom_type}</b><extra></extra>",
                            mode='lines',
                            showlegend=False
                        ))
                        
                        if show_room_labels and name and geom_type == 'room':
                            center_x = sum(xs) / len(xs)
                            center_y = sum(ys) / len(ys)
                            fig.add_annotation(
                                x=center_x,
                                y=center_y,
                                text=name[:12],
                                showarrow=False,
                                font=dict(size=8, color='#1a1a1a')
                            )
                        
                        rendered_any = True
            
            elif geometry_type == 'MultiPolygon':
                polygons = geom.get('coordinates', [])
                for polygon in polygons:
                    if polygon:
                        xs, ys = _extract_coords(polygon[0], has_origin, floor)
                        if rotation_angle != 0 and xs:
                            xs, ys = rotate_points(xs, ys, rotation_angle, cx, cy)
                        
                        if xs:
                            fig.add_trace(go.Scatter(
                                x=xs,
                                y=ys,
                                fill='toself',
                                fillcolor='rgba(200, 200, 200, 0.1)',
                                line=dict(color='#444', width=2),
                                mode='lines',
                                showlegend=False,
                                hoverinfo='skip'
                            ))
                            rendered_any = True
            
            elif geometry_type == 'LineString':
                coords = geom.get('coordinates', [])
                if coords:
                    xs, ys = _extract_coords(coords, has_origin, floor)
                    if rotation_angle != 0 and xs:
                        xs, ys = rotate_points(xs, ys, rotation_angle, cx, cy)
                    
                    if xs:
                        wall_type = props.get('subType', 'inner')
                        line_width = 2 if wall_type == 'outer' or geom_type == 'wall' else 1
                        
                        fig.add_trace(go.Scatter(
                            x=xs,
                            y=ys,
                            mode='lines',
                            line=dict(color='#333', width=line_width),
                            showlegend=False,
                            hoverinfo='skip'
                        ))
                        rendered_any = True
            
            elif geometry_type == 'MultiLineString':
                lines = geom.get('coordinates', [])
                for line_coords in lines:
                    if line_coords:
                        xs, ys = _extract_coords(line_coords, has_origin, floor)
                        if rotation_angle != 0 and xs:
                            xs, ys = rotate_points(xs, ys, rotation_angle, cx, cy)
                        
                        if xs:
                            fig.add_trace(go.Scatter(
                                x=xs,
                                y=ys,
                                mode='lines',
                                line=dict(color='#333', width=1),
                                showlegend=False,
                                hoverinfo='skip'
                            ))
                            rendered_any = True
        
        return rendered_any
    except Exception:
        return False


def render_image_floor_plan(fig, floor):
    """Render image-based floor plan as Plotly layout image"""
    if not floor.floor_plan_image:
        return False
    
    try:
        image = Image.open(BytesIO(floor.floor_plan_image))
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        fig.add_layout_image(
            dict(
                source=f"data:image/png;base64,{img_str}",
                xref="x",
                yref="y",
                x=0,
                y=floor.height_meters,
                sizex=floor.width_meters,
                sizey=floor.height_meters,
                sizing="stretch",
                opacity=0.9,
                layer="below"
            )
        )
        return True
    except Exception:
        return False


def _compute_rotated_ranges(floor, rotation_angle, rotation_center):
    """Compute axis ranges that fit the rotated floor plan."""
    w = float(floor.width_meters)
    h = float(floor.height_meters)
    cx, cy = rotation_center
    
    corners = [(0, 0), (w, 0), (w, h), (0, h)]
    rxs, rys = [], []
    for x, y in corners:
        rx, ry = rotate_point(x, y, rotation_angle, cx, cy)
        rxs.append(rx)
        rys.append(ry)
    
    bounds = get_geojson_bounds(floor)
    if bounds:
        geojson_corners = [
            (bounds['min_x'], bounds['min_y']),
            (bounds['max_x'], bounds['min_y']),
            (bounds['max_x'], bounds['max_y']),
            (bounds['min_x'], bounds['max_y'])
        ]
        for x, y in geojson_corners:
            rx, ry = rotate_point(x, y, rotation_angle, cx, cy)
            rxs.append(rx)
            rys.append(ry)
    
    margin = max(w, h) * 0.05
    return (min(rxs) - margin, max(rxs) + margin), (min(rys) - margin, max(rys) + margin)


def create_floor_plan_figure(floor, show_room_labels=True, rotation_angle=0, rotation_center=None):
    """Create base figure with floor plan (image or GeoJSON).
    
    This is the main entry point for rendering floor plans.
    Automatically handles both image-based and GeoJSON floor plans.
    """
    fig = go.Figure()
    
    has_floor_plan = False
    
    if rotation_angle != 0 and rotation_center is None:
        rotation_center = get_rotation_center(floor)
    
    if floor.floor_plan_image and rotation_angle == 0:
        has_floor_plan = render_image_floor_plan(fig, floor)
    
    if floor.floor_plan_geojson:
        geojson_rendered = render_geojson_floor_plan(
            fig, floor, show_room_labels, rotation_angle, rotation_center)
        has_floor_plan = has_floor_plan or geojson_rendered
    
    if not has_floor_plan:
        corners_x = [0, float(floor.width_meters), float(floor.width_meters), 0, 0]
        corners_y = [0, 0, float(floor.height_meters), float(floor.height_meters), 0]
        if rotation_angle != 0 and rotation_center:
            corners_x, corners_y = rotate_points(
                corners_x, corners_y, rotation_angle, rotation_center[0], rotation_center[1])
        fig.add_trace(go.Scatter(
            x=corners_x, y=corners_y,
            mode='lines',
            line=dict(color="#2e5cbf", width=2),
            fill='toself',
            fillcolor="rgba(46, 92, 191, 0.05)",
            showlegend=False,
            hoverinfo='skip'
        ))
    
    if rotation_angle != 0 and rotation_center:
        x_range, y_range = _compute_rotated_ranges(floor, rotation_angle, rotation_center)
    else:
        x_range = [0, float(floor.width_meters)]
        y_range = [0, float(floor.height_meters)]
    
    fig.update_layout(
        xaxis=dict(
            title="X (meters)",
            range=list(x_range),
            scaleanchor="y",
            scaleratio=1,
            showgrid=True,
            gridcolor='rgba(0,0,0,0.1)'
        ),
        yaxis=dict(
            title="Y (meters)",
            range=list(y_range),
            showgrid=True,
            gridcolor='rgba(0,0,0,0.1)'
        ),
        showlegend=True,
        margin=dict(l=50, r=50, t=50, b=50),
        plot_bgcolor='rgba(255,255,255,0.9)'
    )
    
    return fig, has_floor_plan


def render_zone_polygon(fig, coords, name, color='#2e5cbf', opacity=0.2, show_label=True,
                        rotation_angle=0, rotation_center=None):
    """Render a zone polygon on the figure."""
    if not coords:
        return
    
    xs = [c[0] for c in coords]
    ys = [c[1] for c in coords]
    
    if xs[0] != xs[-1] or ys[0] != ys[-1]:
        xs.append(xs[0])
        ys.append(ys[0])
    
    if rotation_angle != 0 and rotation_center:
        xs, ys = rotate_points(xs, ys, rotation_angle, rotation_center[0], rotation_center[1])
    
    try:
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        fill_color = f'rgba({r}, {g}, {b}, {opacity})'
    except:
        fill_color = f'rgba(46, 92, 191, {opacity})'
    
    fig.add_trace(go.Scatter(
        x=xs, y=ys,
        fill='toself',
        fillcolor=fill_color,
        line=dict(color=color, width=2),
        mode='lines',
        name=name,
        hovertemplate=f"<b>{name}</b><extra></extra>"
    ))
    
    if show_label:
        center_x = sum(xs[:-1]) / len(xs[:-1])
        center_y = sum(ys[:-1]) / len(ys[:-1])
        fig.add_annotation(
            x=center_x, y=center_y,
            text=name,
            showarrow=False,
            font=dict(size=10, color=color),
            bgcolor='rgba(255,255,255,0.8)'
        )


def render_gateways(fig, gateways, gateway_status=None, rotation_angle=0, rotation_center=None):
    """Render gateways on the figure with status-based colors."""
    for gw in gateways:
        status = gateway_status.get(gw.id, 'connected') if gateway_status else 'connected'
        
        if status == 'active':
            color = 'green'
            symbol = 'square'
        elif status == 'offline':
            color = 'red'
            symbol = 'square'
        else:
            color = 'blue'
            symbol = 'square'
        
        gx, gy = float(gw.x_position), float(gw.y_position)
        if rotation_angle != 0 and rotation_center:
            gx, gy = rotate_point(gx, gy, rotation_angle, rotation_center[0], rotation_center[1])
        
        fig.add_trace(go.Scatter(
            x=[gx],
            y=[gy],
            mode='markers+text',
            marker=dict(size=12, color=color, symbol=symbol),
            text=[gw.name],
            textposition='top center',
            name=f"GW: {gw.name}",
            hovertemplate=f"<b>{gw.name}</b><br>Status: {status}<br>({gw.x_position:.1f}, {gw.y_position:.1f})<extra></extra>"
        ))


def render_beacons(fig, beacon_positions, show_labels=True, rotation_angle=0, rotation_center=None):
    """Render beacon positions on the figure."""
    colors = ['#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#00bcd4', '#e91e63']
    
    for idx, (beacon_name, pos) in enumerate(beacon_positions.items()):
        color = colors[idx % len(colors)]
        accuracy = pos.get('accuracy', 1.0)
        
        bx, by = pos['x'], pos['y']
        if rotation_angle != 0 and rotation_center:
            bx, by = rotate_point(bx, by, rotation_angle, rotation_center[0], rotation_center[1])
        
        fig.add_trace(go.Scatter(
            x=[bx],
            y=[by],
            mode='markers+text' if show_labels else 'markers',
            marker=dict(size=12, color=color),
            text=[beacon_name] if show_labels else None,
            textposition='bottom center',
            name=beacon_name,
            hovertemplate=f"<b>{beacon_name}</b><br>({pos['x']:.1f}, {pos['y']:.1f})<br>Accuracy: ±{accuracy:.1f}m<extra></extra>"
        ))


def polygon_to_geojson(coords, name, geom_type='zone', properties=None):
    """Convert polygon coordinates to GeoJSON Feature format.
    
    Args:
        coords: List of [x, y] coordinate pairs in meters
        name: Feature name
        geom_type: Type of geometry ('zone', 'focus_area', 'alert_zone')
        properties: Additional properties dict
    
    Returns:
        GeoJSON Feature dict
    """
    if coords[0] != coords[-1]:
        coords = coords + [coords[0]]
    
    feature = {
        'type': 'Feature',
        'properties': {
            'name': name,
            'geomType': geom_type,
            **(properties or {})
        },
        'geometry': {
            'type': 'Polygon',
            'coordinates': [coords]
        }
    }
    
    return feature


def geojson_to_polygon_coords(geojson_feature):
    """Extract polygon coordinates from a GeoJSON Feature.
    
    Args:
        geojson_feature: GeoJSON Feature dict
    
    Returns:
        List of [x, y] coordinate pairs
    """
    geom = geojson_feature.get('geometry', {})
    if geom.get('type') == 'Polygon':
        coords = geom.get('coordinates', [[]])[0]
        return [[c[0], c[1]] for c in coords if len(c) >= 2]
    return []


def find_nearest_room_corner(x, y, rooms, snap_distance=2.0):
    """Find the nearest room corner to a point for snap-to-corner functionality.
    
    Args:
        x, y: Point coordinates in meters
        rooms: List of room dicts from extract_rooms_from_geojson
        snap_distance: Maximum distance to snap (meters)
    
    Returns:
        Tuple of (snapped_x, snapped_y, room_name) or (x, y, None) if no snap
    """
    best_distance = snap_distance
    best_point = (x, y)
    best_room = None
    
    for room in rooms:
        for coord in room['coords']:
            dist = math.sqrt((coord[0] - x)**2 + (coord[1] - y)**2)
            if dist < best_distance:
                best_distance = dist
                best_point = (coord[0], coord[1])
                best_room = room['name']
    
    return best_point[0], best_point[1], best_room
