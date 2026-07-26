"""
Prepare the uploaded VerifScan logo for use on the site:
  1. Make the white background transparent (so it works on dark navy footer too)
  2. Auto-crop padding around the logo content
  3. Add a small inner padding for breathing room
  4. Save to /home/z/my-project/public/logo.png

Re-runnable: idempotent (reads from upload/, writes to public/).
"""
from PIL import Image
import numpy as np

SRC = "/home/z/my-project/upload/7abff173-3f5c-48cd-af6f-749d1ca4334f.png"
DST = "/home/z/my-project/public/logo.png"

# 1. Open and convert to RGBA
img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
print(f"Original size: {img.size}, mode: {img.mode}")

# 2. Make near-white pixels transparent
#    Use threshold: any pixel where R, G, B are all >= 230 → transparent
rgb = arr[:, :, :3]
alpha = arr[:, :, 3]
white_mask = np.all(rgb >= 230, axis=2)
alpha[white_mask] = 0
arr[:, :, 3] = alpha

# 3. Find content bounding box (non-transparent pixels)
non_transparent = arr[:, :, 3] > 0
rows = np.any(non_transparent, axis=1)
cols = np.any(non_transparent, axis=0)
top = int(np.argmax(rows))
bottom = int(len(rows) - np.argmax(rows[::-1]) - 1)
left = int(np.argmax(cols))
right = int(len(cols) - np.argmax(cols[::-1]) - 1)
print(f"Content bounding box: top={top}, bottom={bottom}, left={left}, right={right}")
print(f"Content size: {right-left+1} x {bottom-top+1}")

# 4. Crop to content + add 8px padding on each side
PAD = 8
cropped_arr = arr[top:bottom+1, left:right+1]
h, w = cropped_arr.shape[:2]
new_w = w + 2 * PAD
new_h = h + 2 * PAD
final_arr = np.zeros((new_h, new_w, 4), dtype=np.uint8)
final_arr[PAD:PAD+h, PAD:PAD+w] = cropped_arr

final_img = Image.fromarray(final_arr, "RGBA")
final_img.save(DST, "PNG", optimize=True)
print(f"\n✅ Saved: {DST}")
print(f"   Final size: {final_img.size}")

# 5. Verify
verify = Image.open(DST)
print(f"   Verified: size={verify.size}, mode={verify.mode}")
v_arr = np.array(verify)
transparent_pixels = np.sum(v_arr[:, :, 3] == 0)
total_pixels = v_arr.shape[0] * v_arr.shape[1]
print(f"   Transparent pixels: {transparent_pixels}/{total_pixels} ({100*transparent_pixels/total_pixels:.1f}%)")
