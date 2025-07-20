import pyautogui

while True:
    try:
        pyautogui.moveRel(0, 5, duration=4)
        pyautogui.moveRel(0, -5, duration=4)
    except pyautogui.FailSafeException:
        # Print the time it happens
        
        print("Mouse moved to corner, exiting.")
        break