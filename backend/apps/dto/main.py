import pyautogui
import sys
import json
import time
import ctypes
ctypes.windll.user32.SetProcessDPIAware()
# Default fallback values

# Try to parse coords from first argument
try:
    x, y = 100, 100
    coords_json = sys.argv[1]
    coords = json.loads(coords_json)
    y = int(coords.get('x', x))
    x = int(coords.get('y', y))
    pyautogui.moveTo(x, y)
except Exception as e:
    print("Failed to parse coords:", e)

# Optional: move to starting position

# Keep alive loop
while True:
    try:
        pyautogui.moveRel(0, 5, duration=4)
        pyautogui.moveRel(0, -5, duration=4)
        time.sleep(1)
    except pyautogui.FailSafeException:
        print("Mouse moved to corner, exiting.")
        break
