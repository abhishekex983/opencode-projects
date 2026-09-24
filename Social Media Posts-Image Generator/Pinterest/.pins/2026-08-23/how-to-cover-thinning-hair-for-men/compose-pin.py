from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(os.path.abspath(__file__))
BEFORE_IMG = os.path.join(BASE, "before-original.png")
AFTER_IMG = os.path.join(BASE, "after-original.png")

W, H = 1080, 1620

NAVY = (0, 36, 68)
RED = (185, 28, 28)
WHITE = (255, 255, 255)

canvas = Image.new("RGB", (W, H), WHITE)
draw = ImageDraw.Draw(canvas)

def load_font(names, size):
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except:
            continue
    return ImageFont.load_default()

font_huge = load_font(["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"], 96)
font_large = load_font(["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"], 80)
font_label = load_font(["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"], 44)
font_cta_big = load_font(["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"], 96)
font_cta_sub = load_font(["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"], 52)

# --- NAVY BANNER (380px = 23%) ---
BANNER_H = 380
draw.rectangle([(0, 0), (W, BANNER_H)], fill=NAVY)

line1 = "BEFORE vs AFTER:"
line2 = "Covering Thinning Hair"
bb1 = draw.textbbox((0, 0), line1, font=font_huge)
bb2 = draw.textbbox((0, 0), line2, font=font_large)
tw1 = bb1[2] - bb1[0]
tw2 = bb2[2] - bb2[0]
h1 = bb1[3] - bb1[1]
h2 = bb2[3] - bb2[1]
total_text_h = h1 + 16 + h2
y_start = (BANNER_H - total_text_h) // 2

draw.text(((W - tw1) // 2, y_start), line1, fill=WHITE, font=font_huge)
draw.text(((W - tw2) // 2, y_start + h1 + 16), line2, fill=WHITE, font=font_large)

# Red bar
BAR = 6
draw.rectangle([(0, BANNER_H), (W, BANNER_H + BAR)], fill=RED)

# --- LABELS ---
y_label = BANNER_H + BAR + 12
half_w = W // 2
pad = 14

before_text = "BEFORE"
after_text = "AFTER"
bb = draw.textbbox((0, 0), before_text, font=font_label)
ba = draw.textbbox((0, 0), after_text, font=font_label)
tw_b = bb[2] - bb[0]
tw_a = ba[2] - ba[0]
th = bb[3] - bb[1]

bw = tw_b + pad * 2
bx = (half_w - bw) // 2
draw.rounded_rectangle([(bx, y_label), (bx + bw, y_label + th + pad * 2)], radius=6, fill=NAVY)
draw.text((bx + pad, y_label + pad - 3), before_text, fill=WHITE, font=font_label)

aw = tw_a + pad * 2
ax = half_w + (half_w - aw) // 2
draw.rounded_rectangle([(ax, y_label), (ax + aw, y_label + th + pad * 2)], radius=6, fill=RED)
draw.text((ax + pad, y_label + pad - 3), after_text, fill=WHITE, font=font_label)

# --- PHOTOS (reduced to ~850px) ---
photo_top = y_label + th + pad * 2 + 12
BOTTOM_H = 320
photo_bottom = H - BOTTOM_H
photo_h = photo_bottom - photo_top
photo_w = half_w - 30

before = Image.open(BEFORE_IMG)
after = Image.open(AFTER_IMG)

def resize_fill(img, tw, th_):
    ratio = max(tw / img.width, th_ / img.height)
    nw = int(img.width * ratio)
    nh = int(img.height * ratio)
    img = img.resize((nw, nh), Image.LANCZOS)
    l = (nw - tw) // 2
    t = (nh - th_) // 2
    return img.crop((l, t, l + tw, t + th_))

before_r = resize_fill(before, photo_w, photo_h)
after_r = resize_fill(after, photo_w, photo_h)

x_b = (half_w - photo_w) // 2
x_a = half_w + (half_w - photo_w) // 2
canvas.paste(before_r, (x_b, photo_top))
canvas.paste(after_r, (x_a, photo_top))

# Divider
draw.line([(half_w, photo_top), (half_w, photo_bottom)], fill=(200, 200, 200), width=2)

# Red bar
draw.rectangle([(0, photo_bottom), (W, photo_bottom + BAR)], fill=RED)

# --- BOTTOM TEXT (320px) ---
y_bot = photo_bottom + BAR + 30

l1 = "3 minutes."
l2 = "That's all it takes."
bb1 = draw.textbbox((0, 0), l1, font=font_cta_big)
bb2 = draw.textbbox((0, 0), l2, font=font_cta_sub)
tw1 = bb1[2] - bb1[0]
tw2 = bb2[2] - bb2[0]

draw.text(((W - tw1) // 2, y_bot + 20), l1, fill=RED, font=font_cta_big)
draw.text(((W - tw2) // 2, y_bot + 140), l2, fill=NAVY, font=font_cta_sub)

# Save JPEG
OUTPUT_JPG = os.path.join(BASE, "before-after-pin.jpg")
canvas.convert("RGB").save(OUTPUT_JPG, "JPEG", quality=88, optimize=True)
print(f"Saved: {OUTPUT_JPG} ({os.path.getsize(OUTPUT_JPG)} bytes)")

# Save PNG
OUTPUT_PNG = os.path.join(BASE, "before-after-pin.png")
canvas.save(OUTPUT_PNG, "PNG", optimize=True)
print(f"Saved: {OUTPUT_PNG} ({os.path.getsize(OUTPUT_PNG)} bytes)")
