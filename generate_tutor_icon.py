from PIL import Image, ImageDraw

SIZE = 512
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Color Palette
SKIN = (255, 222, 195, 255)
SKIN_SHADOW = (238, 195, 162, 255)
HAIR = (38, 34, 52, 255)
HAIR_LIGHT = (68, 62, 88, 255)
SUIT_NAVY = (24, 43, 73, 255)
SUIT_DARK = (16, 30, 52, 255)
SUIT_LIGHT = (42, 72, 118, 255)
SHIRT_WHITE = (255, 255, 255, 255)
TIE_ORANGE = (255, 107, 0, 255)
VERIFIED_GREEN = (16, 185, 129, 255)
DARK_FRAME = (28, 30, 42, 255)
LIP_COLOR = (235, 95, 105, 255)

# --- 1. BACK HAIR (Bob Cut Volume) ---
draw.ellipse([130, 110, 382, 345], fill=HAIR)

# --- 2. SUIT & BODY ---
# Torso
draw.polygon([(80, 512), (125, 360), (200, 325), (312, 325), (387, 360), (432, 512)], fill=SUIT_NAVY)

# White Shirt V-neck
draw.polygon([(195, 325), (256, 445), (317, 325)], fill=SHIRT_WHITE)

# Orange Lanyard / Tie
draw.polygon([(246, 365), (266, 365), (274, 512), (238, 512)], fill=TIE_ORANGE)

# Suit Lapels
draw.polygon([(125, 360), (195, 325), (256, 445), (180, 480)], fill=SUIT_LIGHT)
draw.polygon([(387, 360), (317, 325), (256, 445), (332, 480)], fill=SUIT_DARK)

# --- 3. NECK ---
draw.rectangle([222, 260, 290, 335], fill=SKIN)
draw.polygon([(222, 305), (256, 335), (290, 305), (290, 335), (222, 335)], fill=SKIN_SHADOW)

# --- 4. HEAD & FACE ---
# Ears
draw.ellipse([160, 205, 184, 245], fill=SKIN)
draw.ellipse([328, 205, 352, 245], fill=SKIN)

# Main Face Oval
draw.ellipse([174, 130, 338, 295], fill=SKIN)

# --- 5. EYES & GLASSES ---
# Glasses (Sleek Rounded Rectangle Frames)
draw.rounded_rectangle([190, 192, 246, 238], radius=14, outline=DARK_FRAME, width=6)
draw.rounded_rectangle([266, 192, 322, 238], radius=14, outline=DARK_FRAME, width=6)
# Bridge
draw.line([(246, 210), (266, 210)], fill=DARK_FRAME, width=6)
# Arms
draw.line([(174, 208), (190, 208)], fill=DARK_FRAME, width=5)
draw.line([(322, 208), (338, 208)], fill=DARK_FRAME, width=5)

# Pupils
draw.ellipse([208, 206, 228, 226], fill=DARK_FRAME)
draw.ellipse([284, 206, 302, 226], fill=DARK_FRAME)
# Catchlight
draw.ellipse([217, 209, 223, 215], fill=SHIRT_WHITE)
draw.ellipse([293, 209, 299, 215], fill=SHIRT_WHITE)

# Eyebrows
draw.arc([190, 175, 244, 195], start=195, end=345, fill=DARK_FRAME, width=4)
draw.arc([268, 175, 322, 195], start=195, end=345, fill=DARK_FRAME, width=4)

# --- 6. NOSE & SMILE ---
draw.arc([248, 228, 264, 244], start=30, end=150, fill=SKIN_SHADOW, width=3)

# Cheerful Smile
draw.chord([228, 248, 284, 278], start=0, end=180, fill=LIP_COLOR)
draw.line([(226, 248), (286, 248)], fill=DARK_FRAME, width=3)

# --- 7. BANGS & FRONT HAIR ---
# Smooth elegant side bangs
draw.chord([160, 100, 352, 175], start=180, end=360, fill=HAIR)
draw.ellipse([160, 125, 260, 175], fill=HAIR)
draw.ellipse([252, 125, 352, 175], fill=HAIR)

# Hair highlight arc
draw.arc([190, 108, 320, 145], start=210, end=330, fill=HAIR_LIGHT, width=7)

# --- 8. VERIFIED BADGE ---
bx, by, br = 365, 365, 50
draw.ellipse([bx - br - 4, by - br - 4, bx + br + 4, by + br + 4], fill=SHIRT_WHITE)
draw.ellipse([bx - br, by - br, bx + br, by + br], fill=VERIFIED_GREEN)
chk = [(bx - 19, by - 2), (bx - 6, by + 13), (bx + 19, by - 13)]
draw.line(chk, fill=SHIRT_WHITE, width=10, joint="round")

img.save("assets/icon_tutor.png", "PNG")
print("Perfect Tutor Icon Saved!")
