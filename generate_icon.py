"""Generate taydesk.ico — retro TV with antenna and color bars."""
from PIL import Image, ImageDraw

def create_icon():
    sizes = [16, 32, 48, 64, 128, 256]
    images = []

    for sz in sizes:
        # Draw at 4x for anti-aliasing
        s = sz * 4
        img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)

        m = s // 32  # margin unit

        # -- Antennas (V shape) --
        tip_y = m * 2
        base_y = m * 9
        center_x = s // 2
        # Left antenna
        d.line([(center_x - m * 6, tip_y), (center_x - m * 1, base_y)],
               fill=(180, 180, 190, 255), width=max(m, 2))
        # Right antenna
        d.line([(center_x + m * 6, tip_y), (center_x + m * 1, base_y)],
               fill=(180, 180, 190, 255), width=max(m, 2))
        # Antenna tips (small circles)
        r = max(m, 2)
        d.ellipse([center_x - m*6 - r, tip_y - r, center_x - m*6 + r, tip_y + r],
                  fill=(220, 220, 230, 255))
        d.ellipse([center_x + m*6 - r, tip_y - r, center_x + m*6 + r, tip_y + r],
                  fill=(220, 220, 230, 255))

        # -- TV Body --
        body_top = m * 8
        body_bot = m * 28
        body_left = m * 3
        body_right = s - m * 3
        corner = m * 3
        # Outer shell (dark gray)
        d.rounded_rectangle([body_left, body_top, body_right, body_bot],
                            radius=corner, fill=(45, 45, 55, 255))
        # Inner bezel
        d.rounded_rectangle([body_left + m, body_top + m, body_right - m, body_bot - m],
                            radius=corner - 1, fill=(35, 35, 45, 255))

        # -- Screen area --
        scr_left = body_left + m * 3
        scr_right = body_right - m * 3
        scr_top = body_top + m * 3
        scr_bot = body_bot - m * 3
        d.rounded_rectangle([scr_left, scr_top, scr_right, scr_bot],
                            radius=m * 2, fill=(20, 20, 30, 255))

        # -- Color bars (SMPTE-style) --
        bar_colors = [
            (255, 255, 255),  # white
            (255, 255, 0),    # yellow
            (0, 255, 255),    # cyan
            (0, 200, 0),      # green
            (255, 0, 255),    # magenta
            (220, 50, 50),    # red
            (50, 100, 220),   # blue
        ]
        bar_w = (scr_right - scr_left) / len(bar_colors)
        for i, color in enumerate(bar_colors):
            bx1 = scr_left + int(i * bar_w)
            bx2 = scr_left + int((i + 1) * bar_w)
            d.rectangle([bx1, scr_top + m, bx2, scr_bot - m], fill=(*color, 230))

        # -- Scanlines effect --
        for y in range(scr_top + m, scr_bot - m, max(m, 3)):
            d.line([(scr_left, y), (scr_right, y)], fill=(0, 0, 0, 40), width=1)

        # -- Screen glare (subtle) --
        for i in range(m * 2):
            alpha = max(0, 30 - i * 4)
            d.line([(scr_left + m + i, scr_top + m), (scr_left + m, scr_top + m + i)],
                   fill=(255, 255, 255, alpha), width=1)

        # -- TV Legs --
        leg_w = m * 2
        leg_h = m * 3
        d.polygon([
            (body_left + m * 5, body_bot),
            (body_left + m * 5 - leg_w, body_bot + leg_h),
            (body_left + m * 5 + leg_w, body_bot + leg_h),
        ], fill=(60, 60, 70, 255))
        d.polygon([
            (body_right - m * 5, body_bot),
            (body_right - m * 5 - leg_w, body_bot + leg_h),
            (body_right - m * 5 + leg_w, body_bot + leg_h),
        ], fill=(60, 60, 70, 255))

        # Downscale with anti-aliasing
        img = img.resize((sz, sz), Image.LANCZOS)
        images.append(img)

    # Save as .ico with all sizes
    images[-1].save('taydesk.ico', format='ICO', sizes=[(s, s) for s in sizes],
                    append_images=images[:-1])
    print(f"Created taydesk.ico with sizes: {sizes}")

if __name__ == '__main__':
    create_icon()
