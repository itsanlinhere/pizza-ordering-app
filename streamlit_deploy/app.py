import streamlit as st
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="🍕 Pizza Ordering App",
    page_icon="🍕",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit UI elements for clean look
hide_streamlit_style = """
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stDeployButton {display:none;}
    header {visibility: hidden;}
    </style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:5000/api")
REACT_APP_URL = os.getenv("REACT_APP_URL", "http://localhost:3000")

st.title("🍕 Pizza Ordering App")
st.write("*Embedded React Application*\n")

# Main content
st.info("""
**Welcome to Pizza Ordering App!**

Your original React application is embedded below. 
All features work exactly as designed - no changes to the UI!
""")

# Display the React app in an iframe
iframe_html = f"""
<iframe 
    src="{REACT_APP_URL}" 
    style="width:100%; height:900px; border:none; border-radius:8px;"
    title="Pizza Ordering App"
    allow="camera; microphone; clipboard-read; clipboard-write"
>
</iframe>
"""

st.components.v1.html(iframe_html, height=900)

# Footer
st.divider()
st.write("""
**How it works:**
- Frontend: React App
- Backend: Node.js API
- Database: MongoDB
- Wrapper: Streamlit Cloud

**Status:** ✅ Live and Running
""")
