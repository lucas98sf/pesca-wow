import time
import keyboard
import numpy as np
import cv2
import mss
import mss.tools
from dataclasses import dataclass
from typing import Optional

@dataclass
class Region:
    left: int
    top: int
    width: int
    height: int

class FishingBot:
    def __init__(self):
        self.fishing_area: Optional[Region] = None
        self.running = True
        self.state = "THROWING"
        
        keyboard.on_press_key('esc', lambda _: self.stop())
    
    def stop(self):
        print("Stopping bot...")
        self.running = False

    def find_image(self, template_path: str, region: Region, confidence: float = 0.7) -> Optional[Region]:
        screenshot = self.sct.grab({
            "left": region.left,
            "top": region.top,
            "width": region.width,
            "height": region.height
        })
        
        screenshot = np.array(screenshot)
        screenshot = cv2.cvtColor(screenshot, cv2.COLOR_BGRA2BGR)
        
        template = cv2.imread(template_path)
        
        if template is None:
            raise FileNotFoundError(f"Could not load template image: {template_path}")
        
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
        
        if self.DEBUG:
            print(f"Match confidence: {max_val}")
        
        if max_val >= confidence:
            return Region(
                left=region.left + max_loc[0],
                top=region.top + max_loc[1],
                width=template.shape[1],
                height=template.shape[0]
            )
        return None

    def click(self, x: int, y: int):
        """
        Simulate mouse click at given coordinates.
        You might need to adjust this based on your OS and requirements.
        """
        import ctypes
        
        MOUSEEVENTF_LEFTDOWN = 0x0002
        MOUSEEVENTF_LEFTUP = 0x0004
        
        ctypes.windll.user32.SetCursorPos(x, y)
        
        ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        ctypes.windll.user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

    def run(self):
        print("Starting fishing bot...")
        print("Press 'esc' to stop")
        
        while self.running:
            try:
                if self.state == "THROWING":
                    print("Casting fishing line...")
                    keyboard.press('shift')
                    keyboard.press('q')
                    keyboard.release('q')
                    keyboard.release('shift')
                    time.sleep(2)
                    self.state = "FISHING"
                
                elif self.state == "FISHING":
                    search_region = Region(740, 290, 500, 500)
                    
                    if self.DEBUG:
                        debug_screenshot = self.sct.grab({
                            "left": search_region.left,
                            "top": search_region.top,
                            "width": search_region.width,
                            "height": search_region.height
                        })
                        mss.tools.to_png(debug_screenshot.rgb, debug_screenshot.size, output="debug_search.png")
                    
                    fishing_spot = self.find_image(
                        "images/fishing.png",
                        search_region
                    )
                    
                    if fishing_spot:
                        self.fishing_area = Region(
                            fishing_spot.left,
                            fishing_spot.top,
                            35,
                            35
                        )
                        if self.DEBUG:
                            print(f"Found fishing spot at: {self.fishing_area}")
                    else:
                        print("Fish found! Catching...")
                        self.state = "CATCHING"
                    
                
                elif self.state == "CATCHING":
                    if not self.fishing_area:
                        raise Exception("Fishing area not found")
                    
                    time.sleep(np.random.random() * 0.1)
                    
                    self.click(self.fishing_area.left, self.fishing_area.top)
                    print("Clicked! Waiting before next cast...")
                    time.sleep(2)
                    self.state = "THROWING"
            
            except Exception as err:
                print(f"Error occurred: {str(err)}")
                print("Retrying in 5 seconds...")
                time.sleep(5)
                self.state = "THROWING"

def main():
    print("Starting in 3 seconds...")
    time.sleep(3)
    
    bot = FishingBot()
    bot.run()

if __name__ == "__main__":
    main()