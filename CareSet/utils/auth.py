import streamlit as st
import hashlib
import secrets
import jwt
import os
from datetime import datetime, timedelta
from database import get_db_session, User, UserSession

DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo123"

ROLES = {
    'admin': {
        'name': 'Administrator',
        'description': 'Full access to all features',
        'default_pages': 'all'
    },
    'operator': {
        'name': 'Operator',
        'description': 'Can manage gateways, beacons, and view tracking',
        'default_pages': 'dashboard,live_tracking,gateways,beacons,buildings,mqtt'
    },
    'viewer': {
        'name': 'Viewer',
        'description': 'View-only access to tracking and dashboard',
        'default_pages': 'dashboard,live_tracking'
    }
}

ALL_PAGES = [
    ('dashboard', 'Dashboard'),
    ('buildings', 'Buildings'),
    ('gateways', 'Gateways'),
    ('beacons', 'Beacons'),
    ('live_tracking', 'Live Tracking'),
    ('alert_zones', 'Alert Zones'),
    ('gateway_planning', 'Gateway Planning'),
    ('mqtt', 'MQTT Configuration'),
    ('user_management', 'User Management'),
    ('signal_diagnostics', 'Signal Diagnostics'),
]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def create_session_token() -> str:
    return secrets.token_urlsafe(32)


def ensure_demo_user():
    with get_db_session() as session:
        # CareSet 'demo' user
        demo_user = session.query(User).filter(User.username == DEMO_USERNAME).first()
        if not demo_user:
            demo_user = User(
                username=DEMO_USERNAME,
                password_hash=hash_password(DEMO_PASSWORD),
                email="demo@careflow.local",
                full_name="Demo User",
                role="operator",
                is_active=True,
                allowed_pages="dashboard,buildings,gateways,beacons,live_tracking,signal_diagnostics"
            )
            session.add(demo_user)
        else:
            # Force update to ensure matching requirements
            demo_user.role = "operator"
            demo_user.allowed_pages = "dashboard,buildings,gateways,beacons,live_tracking,signal_diagnostics"

        
        # CareSet 'admin' user
        admin_user = session.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password_hash=hash_password("admin123"),
                email="admin@careflow.local",
                full_name="Administrator",
                role="admin",
                is_active=True,
                allowed_pages="all"
            )
            session.add(admin_user)
        else:
            # Force admin role and permissions
            admin_user.role = "admin"
            admin_user.allowed_pages = "all"
            
        session.commit()



def authenticate_user(username: str, password: str):
    with get_db_session() as session:
        user = session.query(User).filter(
            User.username == username,
            User.is_active == True
        ).first()
        
        if user and verify_password(password, user.password_hash):
            user.last_login = datetime.utcnow()
            
            session_token = create_session_token()
            expires_at = datetime.utcnow() + timedelta(hours=24)
            
            user_session = UserSession(
                user_id=user.id,
                session_token=session_token,
                expires_at=expires_at
            )
            session.add(user_session)
            session.commit()
            
            return {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'role': user.role,
                'allowed_pages': user.allowed_pages or '',
                'session_token': session_token
            }
    return None


def login_with_sso(token: str):
    """
    Validates a JWT SSO token and logs in the user automatically.
    """
    sso_secret = os.environ.get("SSO_JWT_SECRET")
    if not sso_secret:
        st.error("SSO Configuration Error: Secret not found.")
        return False

    try:
        # Decode and verify the token
        payload = jwt.decode(token, sso_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        
        with get_db_session() as session:
            user = session.query(User).filter(
                User.id == user_id,
                User.is_active == True
            ).first()
            
            print(f"SSO Debug: Token subject (user_id): {user_id}")
            if user:
                print(f"SSO Debug: User found: {user.username}, Role: {user.role}")
                print(f"SSO Debug: Allowed Pages: {user.allowed_pages}")
            else:
                print(f"SSO Debug: No active user found for ID: {user_id}")

            if not user:
                st.error("SSO Login failed: User not found or inactive.")
                return False

            # Create a new session in CareSet
            session_token = create_session_token()
            expires_at = datetime.utcnow() + timedelta(hours=24)
            
            user_session = UserSession(
                user_id=user.id,
                session_token=session_token,
                expires_at=expires_at
            )
            session.add(user_session)
            session.commit()
            
            # Set the user in Streamlit session state
            st.session_state.user = {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name or user.display_name or user.username,
                'role': user.role,
                'allowed_pages': user.allowed_pages or '',
                'session_token': session_token
            }
            return True

    except jwt.ExpiredSignatureError:
        st.error("SSO Token has expired. Please try again from App Hub.")
    except jwt.InvalidTokenError:
        st.error("Invalid SSO token.")
    except Exception as e:
        st.error(f"SSO Error: {str(e)}")
    
    return False


def get_current_user():
    if 'user' not in st.session_state:
        return None
    return st.session_state.user


def is_logged_in() -> bool:
    return get_current_user() is not None


def logout():
    if 'user' in st.session_state:
        token = st.session_state.user.get('session_token')
        if token:
            with get_db_session() as session:
                session.query(UserSession).filter(
                    UserSession.session_token == token
                ).delete()
                session.commit()
        del st.session_state['user']


def can_access_page(page_id: str) -> bool:
    user = get_current_user()
    if not user:
        return False
    
    if user['role'] == 'admin':
        return True
    
    allowed = user.get('allowed_pages', '')
    if allowed == 'all':
        return True
    
    allowed_list = [p.strip() for p in allowed.split(',')]
    return page_id in allowed_list


def require_login():
    if not is_logged_in():
        st.warning("Please log in to access this page.")
        st.stop()


def require_admin():
    require_login()
    user = get_current_user()
    if user['role'] != 'admin':
        st.error("You don't have permission to access this page.")
        st.stop()


def require_page_access(page_id: str):
    require_login()
    if not can_access_page(page_id):
        st.error("You don't have permission to access this page.")
        st.stop()
