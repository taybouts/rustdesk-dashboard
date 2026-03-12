"""
Taydesk — RustDesk Dashboard Desktop App
System tray + pywebview wrapper around the Node.js server.
No console window, no browser. Just a native app.
"""
import threading
import subprocess
import time
import sys
import os
import socket
import ctypes
from collections import deque

import webview
import pystray
from pystray import MenuItem as Item
from PIL import Image

# -- Config --
APP_NAME = "Taydesk"
PORT = 3777
URL = f"http://localhost:{PORT}"
ICON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "taydesk.ico")
APP_DIR = os.path.dirname(os.path.abspath(__file__))

# -- State --
server_process = None
main_window = None
compact_window = None
tray_icon = None
always_on_top = False
compact_on_top = True  # Compact is always-on-top by default


def port_in_use(port):
    """Check if the port is already listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def wait_for_server(port, timeout=30):
    """Wait until the server is accepting connections."""
    start = time.time()
    while time.time() - start < timeout:
        if port_in_use(port):
            return True
        time.sleep(0.3)
    return False


def start_server():
    """Launch the Node.js server as a hidden subprocess."""
    global server_process

    if port_in_use(PORT):
        return  # Server already running

    CREATE_NO_WINDOW = 0x08000000
    server_process = subprocess.Popen(
        ['npm', 'start'],
        cwd=APP_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        creationflags=CREATE_NO_WINDOW
    )


def stop_server():
    """Kill the Node.js server."""
    global server_process
    if server_process:
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
        server_process = None


def set_window_icon(title, ico_path, retries=30):
    """Set .ico on the window title bar and taskbar using Win32 API."""
    if not os.path.exists(ico_path):
        return

    try:
        user32 = ctypes.windll.user32
        WM_SETICON = 0x0080
        ICON_BIG = 1
        ICON_SMALL = 0

        # Load icon with LoadImage for better taskbar support
        IMAGE_ICON = 1
        LR_LOADFROMFILE = 0x00000010
        LR_DEFAULTSIZE = 0x00000040

        hicon_big = user32.LoadImageW(
            0, ico_path, IMAGE_ICON, 48, 48, LR_LOADFROMFILE
        )
        hicon_small = user32.LoadImageW(
            0, ico_path, IMAGE_ICON, 16, 16, LR_LOADFROMFILE
        )

        if not hicon_big:
            # Fallback to ExtractIcon
            hicon_big = ctypes.windll.shell32.ExtractIconW(0, ico_path, 0)
            hicon_small = hicon_big

        if not hicon_big:
            return

        for _ in range(retries):
            hwnd = user32.FindWindowW(None, title)
            if hwnd:
                user32.SendMessageW(hwnd, WM_SETICON, ICON_BIG, hicon_big)
                user32.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, hicon_small)
                return
            time.sleep(0.5)
    except Exception:
        pass


def toggle_on_top(icon=None, item=None):
    """Toggle always-on-top for the main window."""
    global always_on_top
    always_on_top = not always_on_top
    if main_window:
        main_window.on_top = always_on_top
    if tray_icon:
        tray_icon.update_menu()


def toggle_compact_on_top(icon=None, item=None):
    """Toggle always-on-top for the compact window."""
    global compact_on_top
    compact_on_top = not compact_on_top
    if compact_window:
        compact_window.on_top = compact_on_top
    if tray_icon:
        tray_icon.update_menu()


def show_window(icon=None, item=None):
    """Show the main window."""
    if main_window:
        main_window.show()
        main_window.restore()


def hide_window(icon=None, item=None):
    """Hide the main window."""
    if main_window:
        main_window.hide()


def show_compact(icon=None, item=None):
    """Show the compact mission control window."""
    if compact_window:
        compact_window.show()
        compact_window.restore()


def hide_compact(icon=None, item=None):
    """Hide the compact window."""
    if compact_window:
        compact_window.hide()


def quit_app(icon=None, item=None):
    """Clean shutdown."""
    stop_server()
    if tray_icon:
        tray_icon.stop()
    if compact_window:
        compact_window.destroy()
    if main_window:
        main_window.destroy()
    os._exit(0)


def on_closing():
    """Hide instead of close."""
    if main_window:
        main_window.hide()
    return False  # Prevent actual close


def on_compact_closing():
    """Hide compact instead of close."""
    if compact_window:
        compact_window.hide()
    return False


def run_tray():
    """System tray icon with menu."""
    global tray_icon

    # Load icon
    if os.path.exists(ICON_PATH):
        icon_img = Image.open(ICON_PATH)
    else:
        # Fallback: purple circle
        icon_img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        from PIL import ImageDraw
        d = ImageDraw.Draw(icon_img)
        d.ellipse([4, 4, 60, 60], fill=(108, 92, 231, 255))

    menu = pystray.Menu(
        Item("Show Dashboard", show_window, default=True),
        Item("Mission Control", show_compact),
        pystray.Menu.SEPARATOR,
        Item("Dashboard on Top", toggle_on_top,
             checked=lambda item: always_on_top),
        Item("Control on Top", toggle_compact_on_top,
             checked=lambda item: compact_on_top),
        pystray.Menu.SEPARATOR,
        Item("Quit", quit_app),
    )

    tray_icon = pystray.Icon(APP_NAME, icon_img, APP_NAME, menu)
    tray_icon.run()


def main():
    global main_window, compact_window

    # Set AppUserModelID so Windows shows our icon in taskbar (not Python's)
    try:
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("taydesk.app")
    except Exception:
        pass

    # Start the Node.js server (hidden)
    start_server()

    # Wait for it to be ready
    if not wait_for_server(PORT):
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Taydesk", f"Server failed to start on port {PORT}")
        root.destroy()
        stop_server()
        sys.exit(1)

    # Create the main dashboard window
    main_window = webview.create_window(
        APP_NAME,
        URL,
        width=1100,
        height=750,
        min_size=(600, 400),
        resizable=True,
        on_top=False,
    )
    main_window.events.closing += on_closing

    # JS API for compact window controls
    class CompactApi:
        def minimize(self):
            if compact_window:
                compact_window.minimize()

        def toggle_maximize(self):
            if compact_window:
                compact_window.toggle_fullscreen()

        def close(self):
            if compact_window:
                compact_window.hide()

        def resize_window(self, x, y, w, h):
            if compact_window:
                compact_window.move(x, y)
                compact_window.resize(w, h)

    # Create the compact mission control window (starts hidden)
    compact_window = webview.create_window(
        "Taydesk Control",
        f"{URL}/compact.html",
        width=420,
        height=320,
        min_size=(200, 150),
        resizable=True,
        on_top=True,
        hidden=True,
        frameless=True,
        js_api=CompactApi(),
    )
    compact_window.events.closing += on_compact_closing

    # Start tray in its own thread
    threading.Thread(target=run_tray, daemon=True).start()

    # Set window icons after they appear
    threading.Thread(target=set_window_icon, args=(APP_NAME, ICON_PATH), daemon=True).start()
    threading.Thread(target=set_window_icon, args=("Taydesk Control", ICON_PATH), daemon=True).start()

    # Start pywebview (blocks until all windows closed)
    webview.start()

    # If we get here, clean up
    quit_app()


if __name__ == '__main__':
    main()
