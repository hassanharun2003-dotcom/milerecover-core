#!/usr/bin/env python3
"""Render measurable image-lock reference crops from IMAGE_LOCK_SPEC geometry.

These crops are the working visual lock derived from the attached collage's
vision extraction (collage binary was not available on the agent VM).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "reference-crops"
SCALE = 2
W, H = 390 * SCALE, 844 * SCALE
SAFE_TOP = 47 * SCALE
SAFE_BOTTOM = 34 * SCALE
PAGE_X = 20 * SCALE

C_WHITE = (255, 255, 255, 255)
C_CANVAS = (247, 249, 252, 255)
C_MUTED = (245, 245, 245, 255)
C_MINT = (232, 244, 238, 255)
C_PRIMARY = (15, 107, 70, 255)
C_DEEP = (7, 61, 44, 255)
C_TEXT = (15, 23, 42, 255)
C_SECONDARY = (71, 85, 105, 255)
C_TERTIARY = (100, 116, 139, 255)
C_BORDER = (226, 232, 240, 255)
C_ON = (255, 255, 255, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    # Caller passes pixel size (already includes SCALE).
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def new_phone(bg=C_WHITE) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (W, H), bg)
    draw = ImageDraw.Draw(img)
    # status bar stub
    draw.rectangle((0, 0, W, SAFE_TOP), fill=bg)
    draw.text((PAGE_X, 14 * SCALE), "9:41", fill=C_TEXT, font=font(12 * SCALE, True))
    return img, draw


def round_rect(draw, xy, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def primary_button(draw, y, label):
    x0, x1 = PAGE_X, W - PAGE_X
    h = 52 * SCALE
    round_rect(draw, (x0, y, x1, y + h), 14 * SCALE, fill=C_PRIMARY)
    f = font(16 * SCALE, True)
    bbox = draw.textbbox((0, 0), label, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((W - tw) / 2, y + (h - th) / 2 - 2), label, fill=C_ON, font=f)
    return y + h


def secondary_button(draw, y, label):
    x0, x1 = PAGE_X, W - PAGE_X
    h = 52 * SCALE
    round_rect(draw, (x0, y, x1, y + h), 14 * SCALE, fill=C_WHITE, outline=C_PRIMARY, width=2)
    f = font(16 * SCALE, True)
    bbox = draw.textbbox((0, 0), label, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((W - tw) / 2, y + (h - th) / 2 - 2), label, fill=C_PRIMARY, font=f)
    return y + h


def tab_bar(draw, active: str):
    y0 = H - SAFE_BOTTOM - 56 * SCALE
    draw.rectangle((0, y0, W, H), fill=C_WHITE)
    draw.line((0, y0, W, y0), fill=C_BORDER, width=1)
    tabs = ["Home", "Review", "Proof", "Profile"]
    slot = W / 4
    for i, name in enumerate(tabs):
        cx = slot * i + slot / 2
        color = C_PRIMARY if name == active else C_TERTIARY
        draw.ellipse((cx - 10 * SCALE, y0 + 8 * SCALE, cx + 10 * SCALE, y0 + 28 * SCALE), outline=color, width=2)
        f = font(11 * SCALE, name == active)
        bbox = draw.textbbox((0, 0), name, font=f)
        tw = bbox[2] - bbox[0]
        draw.text((cx - tw / 2, y0 + 32 * SCALE), name, fill=color, font=f)


def progress(draw, step: int, total: int = 5):
    y = SAFE_TOP + 8 * SCALE
    draw.text((PAGE_X, y), "‹", fill=C_TEXT, font=font(22 * SCALE, True))
    label = f"{step} of {total}"
    f = font(13 * SCALE)
    bbox = draw.textbbox((0, 0), label, font=f)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) / 2, y + 6 * SCALE), label, fill=C_SECONDARY, font=f)
    bar_y = y + 28 * SCALE
    round_rect(draw, (PAGE_X, bar_y, W - PAGE_X, bar_y + 4 * SCALE), 2 * SCALE, fill=C_MUTED)
    fill_w = int((W - 2 * PAGE_X) * (step / total))
    round_rect(draw, (PAGE_X, bar_y, PAGE_X + fill_w, bar_y + 4 * SCALE), 2 * SCALE, fill=C_PRIMARY)
    return bar_y + 20 * SCALE


def save(img: Image.Image, name: str):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    img.convert("RGB").save(path, "PNG", optimize=True)
    print("wrote", path)


def render_welcome():
    img, d = new_phone()
    d.text((W - PAGE_X - 40 * SCALE, SAFE_TOP + 8 * SCALE), "Skip", fill=C_SECONDARY, font=font(13 * SCALE))
    cy = SAFE_TOP + 120 * SCALE
    # shield logo
    round_rect(d, (W / 2 - 36 * SCALE, cy, W / 2 + 36 * SCALE, cy + 72 * SCALE), 18 * SCALE, fill=C_PRIMARY)
    d.text((W / 2 - 10 * SCALE, cy + 22 * SCALE), "🛡", fill=C_ON, font=font(28 * SCALE))
    cy += 90 * SCALE
    title = "Welcome to MileRecover"
    f = font(28 * SCALE, True)
    bbox = d.textbbox((0, 0), title, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) / 2, cy), title, fill=C_PRIMARY, font=f)
    cy += 56 * SCALE
    benefits = [
        "Recover forgotten miles",
        "Tax & employer ready",
        "Automatic tracking",
    ]
    for b in benefits:
        d.ellipse((PAGE_X, cy, PAGE_X + 40 * SCALE, cy + 40 * SCALE), fill=C_MINT, outline=C_PRIMARY)
        d.text((PAGE_X + 12 * SCALE, cy + 8 * SCALE), "✓", fill=C_PRIMARY, font=font(16 * SCALE, True))
        d.text((PAGE_X + 56 * SCALE, cy + 10 * SCALE), b, fill=C_TEXT, font=font(16 * SCALE))
        cy += 56 * SCALE
    # dots
    dy = H - SAFE_BOTTOM - 52 * SCALE - 36 * SCALE
    for i in range(4):
        x = W / 2 - 30 * SCALE + i * 20 * SCALE
        fill = C_PRIMARY if i == 0 else C_BORDER
        d.ellipse((x, dy, x + 8 * SCALE, dy + 8 * SCALE), fill=fill)
    primary_button(d, H - SAFE_BOTTOM - 52 * SCALE - 16 * SCALE, "Get started →")
    save(img, "01-welcome.png")


def render_purpose():
    img, d = new_phone()
    y = progress(d, 2)
    d.text((PAGE_X, y), "What's your main reason\nfor tracking mileage?", fill=C_TEXT, font=font(24 * SCALE, True))
    y += 78 * SCALE
    d.text((PAGE_X, y), "We'll tailor rates, reports, and tips.", fill=C_SECONDARY, font=font(15 * SCALE))
    y += 36 * SCALE
    options = [
        ("Employee reimbursement", True),
        ("Self-employed / Business", False),
        ("Delivery or gig work", False),
        ("Personal", False),
    ]
    for label, selected in options:
        h = 58 * SCALE
        outline = C_PRIMARY if selected else C_BORDER
        width = 2 if selected else 1
        fill = C_MINT if selected else C_WHITE
        round_rect(d, (PAGE_X, y, W - PAGE_X, y + h), 16 * SCALE, fill=fill, outline=outline, width=width)
        d.text((PAGE_X + 16 * SCALE, y + 18 * SCALE), label, fill=C_TEXT, font=font(16 * SCALE, selected))
        if selected:
            d.text((W - PAGE_X - 28 * SCALE, y + 16 * SCALE), "✓", fill=C_PRIMARY, font=font(18 * SCALE, True))
        y += h + 12 * SCALE
    primary_button(d, H - SAFE_BOTTOM - 52 * SCALE - 16 * SCALE, "Continue →")
    save(img, "02-purpose.png")


def render_region():
    img, d = new_phone()
    y = progress(d, 3)
    d.text((PAGE_X, y), "Set your region and\nmileage rate.", fill=C_TEXT, font=font(24 * SCALE, True))
    y += 78 * SCALE
    d.text((PAGE_X, y), "Country", fill=C_SECONDARY, font=font(13 * SCALE, True))
    y += 22 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 52 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
    d.text((PAGE_X + 16 * SCALE, y + 16 * SCALE), "🇺🇸  United States", fill=C_TEXT, font=font(16 * SCALE))
    d.text((W - PAGE_X - 24 * SCALE, y + 14 * SCALE), "▾", fill=C_TERTIARY, font=font(16 * SCALE))
    y += 68 * SCALE
    d.text((PAGE_X, y), "Mileage rate", fill=C_SECONDARY, font=font(13 * SCALE, True))
    y += 22 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 52 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
    d.text((PAGE_X + 16 * SCALE, y + 16 * SCALE), "$0.70 per mile", fill=C_TEXT, font=font(16 * SCALE, True))
    d.text((W - PAGE_X - 100 * SCALE, y + 16 * SCALE), "Update rate", fill=C_PRIMARY, font=font(14 * SCALE, True))
    y += 72 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 72 * SCALE), 12 * SCALE, fill=C_MINT, outline=C_PRIMARY)
    d.text((PAGE_X + 16 * SCALE, y + 16 * SCALE), "ⓘ  This is your chosen estimate.\n     You can change it anytime.", fill=C_TEXT, font=font(13 * SCALE))
    primary_button(d, H - SAFE_BOTTOM - 52 * SCALE - 16 * SCALE, "Continue →")
    save(img, "03-region-rate.png")


def render_home():
    img, d = new_phone()
    y = SAFE_TOP + 8 * SCALE
    d.text((PAGE_X, y), "≡", fill=C_TEXT, font=font(22 * SCALE, True))
    brand = "MileRecover"
    f = font(16 * SCALE, True)
    bbox = d.textbbox((0, 0), brand, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) / 2, y + 4 * SCALE), brand, fill=C_PRIMARY, font=f)
    d.text((W - PAGE_X - 20 * SCALE, y), "🔔", fill=C_TEXT, font=font(16 * SCALE))
    y += 40 * SCALE
    d.text((PAGE_X, y), "Good morning, Hasan 👋", fill=C_TEXT, font=font(20 * SCALE, True))
    y += 36 * SCALE
    hero_h = 110 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + hero_h), 20 * SCALE, fill=C_DEEP)
    d.text((PAGE_X + 20 * SCALE, y + 24 * SCALE), "You've protected", fill=C_ON, font=font(14 * SCALE))
    d.text((PAGE_X + 20 * SCALE, y + 48 * SCALE), "$487.32", fill=C_ON, font=font(28 * SCALE, True))
    d.text((PAGE_X + 20 * SCALE, y + 82 * SCALE), "this year.", fill=C_ON, font=font(14 * SCALE))
    d.ellipse((W - PAGE_X - 72 * SCALE, y + 24 * SCALE, W - PAGE_X - 16 * SCALE, y + 80 * SCALE), fill=C_PRIMARY)
    d.text((W - PAGE_X - 54 * SCALE, y + 40 * SCALE), "🛡", fill=C_ON, font=font(22 * SCALE))
    y += hero_h + 12 * SCALE
    # three metric tiles
    gap = 8 * SCALE
    tile_w = (W - 2 * PAGE_X - 2 * gap) / 3
    metrics = [("1,264", "Work miles"), ("48", "Work drives"), ("$34.13", "This month")]
    for i, (val, label) in enumerate(metrics):
        x0 = PAGE_X + i * (tile_w + gap)
        round_rect(d, (x0, y, x0 + tile_w, y + 64 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
        d.text((x0 + 10 * SCALE, y + 12 * SCALE), val, fill=C_TEXT, font=font(15 * SCALE, True))
        d.text((x0 + 10 * SCALE, y + 36 * SCALE), label, fill=C_TERTIARY, font=font(11 * SCALE))
    y += 76 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 48 * SCALE), 12 * SCALE, fill=C_MINT)
    d.text((PAGE_X + 16 * SCALE, y + 14 * SCALE), "🛡  All systems normal — Tracking", fill=C_PRIMARY, font=font(13 * SCALE, True))
    y += 60 * SCALE
    d.text((PAGE_X, y), "Next up", fill=C_SECONDARY, font=font(13 * SCALE, True))
    y += 22 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 52 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
    d.text((PAGE_X + 16 * SCALE, y + 16 * SCALE), "Review 2 drives", fill=C_TEXT, font=font(16 * SCALE))
    d.text((W - PAGE_X - 24 * SCALE, y + 14 * SCALE), "›", fill=C_TERTIARY, font=font(20 * SCALE))
    y += 64 * SCALE
    primary_button(d, y, "+ Add a drive")
    y += 60 * SCALE
    secondary_button(d, y, "Check for missed drives")
    tab_bar(d, "Home")
    save(img, "04-home.png")


def render_review():
    img, d = new_phone()
    y = SAFE_TOP + 12 * SCALE
    d.text((PAGE_X, y), "Review", fill=C_TEXT, font=font(24 * SCALE, True))
    y += 40 * SCALE
    # segments
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 40 * SCALE), 12 * SCALE, fill=C_MUTED)
    mid = W / 2
    round_rect(d, (PAGE_X + 2 * SCALE, y + 2 * SCALE, mid - 2 * SCALE, y + 38 * SCALE), 10 * SCALE, fill=C_WHITE)
    d.text((PAGE_X + 20 * SCALE, y + 11 * SCALE), "Needs review (2)", fill=C_PRIMARY, font=font(13 * SCALE, True))
    d.text((mid + 24 * SCALE, y + 11 * SCALE), "Done (48)", fill=C_SECONDARY, font=font(13 * SCALE))
    y += 56 * SCALE
    for _ in range(2):
        h = 210 * SCALE
        round_rect(d, (PAGE_X, y, W - PAGE_X, y + h), 16 * SCALE, fill=C_WHITE, outline=C_BORDER)
        d.text((PAGE_X + 16 * SCALE, y + 12 * SCALE), "Today · 9:14 AM", fill=C_SECONDARY, font=font(12 * SCALE))
        d.text((PAGE_X + 16 * SCALE, y + 36 * SCALE), "123 Main St → 456 Oak Ave", fill=C_TEXT, font=font(14 * SCALE, True))
        round_rect(d, (PAGE_X + 16 * SCALE, y + 64 * SCALE, W - PAGE_X - 16 * SCALE, y + 150 * SCALE), 12 * SCALE, fill=C_MINT)
        d.text((PAGE_X + 24 * SCALE, y + 96 * SCALE), "Route preview", fill=C_PRIMARY, font=font(12 * SCALE))
        d.text((PAGE_X + 16 * SCALE, y + 160 * SCALE), "12.4 mi   28 min   $8.68", fill=C_TEXT, font=font(13 * SCALE, True))
        # purpose segments
        seg_y = y + h - 40 * SCALE
        sw = (W - 2 * PAGE_X - 32 * SCALE) / 3
        for i, lab in enumerate(["Work", "Personal", "Not sure"]):
            x0 = PAGE_X + 16 * SCALE + i * (sw + 4 * SCALE)
            fill = C_PRIMARY if i == 0 else C_MUTED
            ink = C_ON if i == 0 else C_SECONDARY
            round_rect(d, (x0, seg_y, x0 + sw, seg_y + 28 * SCALE), 8 * SCALE, fill=fill)
            d.text((x0 + 10 * SCALE, seg_y + 6 * SCALE), lab, fill=ink, font=font(11 * SCALE, True))
        y += h + 12 * SCALE
    tab_bar(d, "Review")
    save(img, "05-review.png")


def render_proof():
    img, d = new_phone()
    y = SAFE_TOP + 12 * SCALE
    d.text((PAGE_X, y), "Proof", fill=C_TEXT, font=font(24 * SCALE, True))
    y += 40 * SCALE
    labels = ["Month", "Quarter", "Year", "YTD"]
    sw = (W - 2 * PAGE_X - 18 * SCALE) / 4
    for i, lab in enumerate(labels):
        x0 = PAGE_X + i * (sw + 6 * SCALE)
        fill = C_PRIMARY if i == 0 else C_MUTED
        ink = C_ON if i == 0 else C_SECONDARY
        round_rect(d, (x0, y, x0 + sw, y + 32 * SCALE), 10 * SCALE, fill=fill)
        d.text((x0 + 10 * SCALE, y + 8 * SCALE), lab, fill=ink, font=font(12 * SCALE, True))
    y += 48 * SCALE
    d.text((PAGE_X, y), "August 2025", fill=C_SECONDARY, font=font(13 * SCALE, True))
    y += 24 * SCALE
    for i, (v, l) in enumerate([("126.4", "Work miles"), ("8", "Work drives"), ("$88.48", "Est. value")]):
        x0 = PAGE_X + i * ((W - 2 * PAGE_X) / 3)
        d.text((x0, y), v, fill=C_TEXT, font=font(16 * SCALE, True))
        d.text((x0, y + 22 * SCALE), l, fill=C_TERTIARY, font=font(11 * SCALE))
    y += 56 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 140 * SCALE), 16 * SCALE, fill=C_CANVAS, outline=C_BORDER)
    for i, hbar in enumerate([40, 70, 55, 90, 60, 100, 80]):
        x0 = PAGE_X + 24 * SCALE + i * 42 * SCALE
        by = y + 120 * SCALE
        round_rect(d, (x0, by - hbar * SCALE / 2, x0 + 22 * SCALE, by), 4 * SCALE, fill=C_PRIMARY)
    y += 156 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 56 * SCALE), 12 * SCALE, fill=C_MINT)
    d.text((PAGE_X + 16 * SCALE, y + 18 * SCALE), "Tax-ready & employer-ready", fill=C_PRIMARY, font=font(13 * SCALE, True))
    y += 68 * SCALE
    primary_button(d, y, "Fix 2 items")
    y += 60 * SCALE
    secondary_button(d, y, "Preview report")
    y += 68 * SCALE
    d.text((PAGE_X, y), "Export", fill=C_SECONDARY, font=font(13 * SCALE, True))
    y += 22 * SCALE
    for lab in ["CSV export", "PDF report"]:
        round_rect(d, (PAGE_X, y, W - PAGE_X, y + 48 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
        d.text((PAGE_X + 16 * SCALE, y + 14 * SCALE), lab, fill=C_TEXT, font=font(15 * SCALE))
        d.text((W - PAGE_X - 24 * SCALE, y + 12 * SCALE), "›", fill=C_TERTIARY, font=font(18 * SCALE))
        y += 56 * SCALE
    tab_bar(d, "Proof")
    save(img, "06-proof.png")


def render_add_drive():
    img, d = new_phone()
    y = SAFE_TOP + 12 * SCALE
    d.text((PAGE_X, y), "‹  Add drive", fill=C_TEXT, font=font(18 * SCALE, True))
    y += 40 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 40 * SCALE), 12 * SCALE, fill=C_MUTED)
    mid = W / 2
    round_rect(d, (PAGE_X + 2 * SCALE, y + 2 * SCALE, mid - 2 * SCALE, y + 38 * SCALE), 10 * SCALE, fill=C_PRIMARY)
    d.text((PAGE_X + 28 * SCALE, y + 11 * SCALE), "Manual entry", fill=C_ON, font=font(13 * SCALE, True))
    d.text((mid + 20 * SCALE, y + 11 * SCALE), "From other app", fill=C_SECONDARY, font=font(13 * SCALE))
    y += 56 * SCALE
    d.text((PAGE_X, y), "Work or personal?", fill=C_SECONDARY, font=font(13 * SCALE, True))
    y += 22 * SCALE
    for i, lab in enumerate(["Work", "Personal"]):
        x0 = PAGE_X + i * ((W - 2 * PAGE_X - 8 * SCALE) / 2 + 8 * SCALE)
        w = (W - 2 * PAGE_X - 8 * SCALE) / 2
        fill = C_PRIMARY if i == 0 else C_MUTED
        ink = C_ON if i == 0 else C_SECONDARY
        round_rect(d, (x0, y, x0 + w, y + 40 * SCALE), 12 * SCALE, fill=fill)
        d.text((x0 + 36 * SCALE, y + 11 * SCALE), lab, fill=ink, font=font(14 * SCALE, True))
    y += 56 * SCALE
    for lab, val in [("Date", "Aug 5, 2026"), ("Start location", "Start address"), ("End location", "End address"), ("Distance (mi)", "12.4")]:
        d.text((PAGE_X, y), lab, fill=C_SECONDARY, font=font(12 * SCALE, True))
        y += 18 * SCALE
        round_rect(d, (PAGE_X, y, W - PAGE_X, y + 52 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
        d.text((PAGE_X + 16 * SCALE, y + 16 * SCALE), val, fill=C_TEXT, font=font(15 * SCALE))
        y += 64 * SCALE
    primary_button(d, H - SAFE_BOTTOM - 52 * SCALE - 40 * SCALE, "Save drive")
    d.text((PAGE_X + 40 * SCALE, H - SAFE_BOTTOM - 28 * SCALE), "🔒 Your data stays private and secure", fill=C_TERTIARY, font=font(12 * SCALE))
    save(img, "07-add-drive.png")


def render_protection():
    img, d = new_phone(C_WHITE)
    y = SAFE_TOP + 12 * SCALE
    d.text((PAGE_X, y), "‹  Protection Center", fill=C_TEXT, font=font(18 * SCALE, True))
    y += 40 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 100 * SCALE), 20 * SCALE, fill=C_DEEP)
    d.text((PAGE_X + 20 * SCALE, y + 24 * SCALE), "You're protected", fill=C_ON, font=font(20 * SCALE, True))
    d.text((PAGE_X + 20 * SCALE, y + 54 * SCALE), "MileRecover is actively tracking\nyour work drives.", fill=C_ON, font=font(13 * SCALE))
    y += 120 * SCALE
    rows = [
        ("Background tracking", "On"),
        ("Location access", "Active"),
        ("Battery optimized", "Up to date"),
        ("Motion detection", "On"),
        ("Data sync", "Up to date"),
    ]
    for name, status in rows:
        round_rect(d, (PAGE_X, y, W - PAGE_X, y + 52 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
        d.ellipse((PAGE_X + 14 * SCALE, y + 14 * SCALE, PAGE_X + 38 * SCALE, y + 38 * SCALE), fill=C_MINT)
        d.text((PAGE_X + 20 * SCALE, y + 16 * SCALE), "✓", fill=C_PRIMARY, font=font(12 * SCALE, True))
        d.text((PAGE_X + 52 * SCALE, y + 16 * SCALE), name, fill=C_TEXT, font=font(15 * SCALE))
        d.text((W - PAGE_X - 90 * SCALE, y + 16 * SCALE), status, fill=C_PRIMARY, font=font(13 * SCALE, True))
        y += 60 * SCALE
    primary_button(d, H - SAFE_BOTTOM - 52 * SCALE - 16 * SCALE, "Run diagnostics")
    save(img, "08-protection-center.png")


def render_subscription():
    img, d = new_phone()
    y = SAFE_TOP + 16 * SCALE
    d.text((PAGE_X, y), "Go Pro", fill=C_TEXT, font=font(28 * SCALE, True))
    y += 36 * SCALE
    d.text((PAGE_X, y), "Recover more miles. Save more money.", fill=C_SECONDARY, font=font(15 * SCALE))
    y += 36 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 40 * SCALE), 12 * SCALE, fill=C_MUTED)
    mid = W / 2
    round_rect(d, (PAGE_X + 2 * SCALE, y + 2 * SCALE, mid - 2 * SCALE, y + 38 * SCALE), 10 * SCALE, fill=C_WHITE)
    d.text((PAGE_X + 40 * SCALE, y + 11 * SCALE), "Monthly", fill=C_PRIMARY, font=font(13 * SCALE, True))
    d.text((mid + 16 * SCALE, y + 11 * SCALE), "Yearly (Save 20%)", fill=C_SECONDARY, font=font(12 * SCALE))
    y += 56 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 220 * SCALE), 20 * SCALE, fill=C_DEEP)
    d.text((PAGE_X + 20 * SCALE, y + 16 * SCALE), "Most Popular", fill=C_PRIMARY, font=font(11 * SCALE, True))
    d.text((PAGE_X + 20 * SCALE, y + 40 * SCALE), "Pro", fill=C_ON, font=font(24 * SCALE, True))
    d.text((PAGE_X + 20 * SCALE, y + 74 * SCALE), "$14.99 / month", fill=C_ON, font=font(18 * SCALE, True))
    feats = [
        "Unlimited automatic tracking",
        "Missing drive recovery",
        "Advanced PDF reports",
        "Multiple vehicles",
        "Priority support",
    ]
    fy = y + 110 * SCALE
    for ftxt in feats:
        d.text((PAGE_X + 20 * SCALE, fy), f"✓  {ftxt}", fill=C_ON, font=font(13 * SCALE))
        fy += 20 * SCALE
    primary_button(d, H - SAFE_BOTTOM - 52 * SCALE - 40 * SCALE, "Start Free 7-Day Trial")
    d.text((PAGE_X + 90 * SCALE, H - SAFE_BOTTOM - 24 * SCALE), "Compare all plans", fill=C_PRIMARY, font=font(13 * SCALE, True))
    save(img, "09-subscription.png")


def render_profile():
    img, d = new_phone()
    y = SAFE_TOP + 12 * SCALE
    d.text((W - PAGE_X - 24 * SCALE, y), "⚙", fill=C_TEXT, font=font(18 * SCALE))
    d.ellipse((PAGE_X, y, PAGE_X + 56 * SCALE, y + 56 * SCALE), fill=C_PRIMARY)
    d.text((PAGE_X + 18 * SCALE, y + 14 * SCALE), "H", fill=C_ON, font=font(22 * SCALE, True))
    d.text((PAGE_X + 72 * SCALE, y + 10 * SCALE), "Hasan", fill=C_TEXT, font=font(20 * SCALE, True))
    d.text((PAGE_X + 72 * SCALE, y + 36 * SCALE), "Employee • Milwaukee, WI", fill=C_SECONDARY, font=font(13 * SCALE))
    y += 76 * SCALE
    rows = [
        ("Vehicles", "2 vehicles"),
        ("Mileage rate", "$0.70 / mi"),
        ("Work information", "Employee"),
        ("Tracking health", "All systems normal"),
        ("Import mileage", ""),
        ("Export history", ""),
        ("Help & support", ""),
        ("About MileRecover", "Version 0.2.5"),
    ]
    for name, sub in rows:
        round_rect(d, (PAGE_X, y, W - PAGE_X, y + 56 * SCALE), 12 * SCALE, fill=C_WHITE, outline=C_BORDER)
        d.ellipse((PAGE_X + 14 * SCALE, y + 16 * SCALE, PAGE_X + 38 * SCALE, y + 40 * SCALE), fill=C_MINT)
        d.text((PAGE_X + 52 * SCALE, y + 10 * SCALE), name, fill=C_TEXT, font=font(15 * SCALE))
        if sub:
            d.text((PAGE_X + 52 * SCALE, y + 32 * SCALE), sub, fill=C_TERTIARY, font=font(12 * SCALE))
        d.text((W - PAGE_X - 24 * SCALE, y + 14 * SCALE), "›", fill=C_TERTIARY, font=font(18 * SCALE))
        y += 64 * SCALE
    tab_bar(d, "Profile")
    save(img, "10-profile.png")


def render_missing():
    img, d = new_phone()
    y = SAFE_TOP + 12 * SCALE
    d.text((PAGE_X, y), "‹  Missing drives", fill=C_TEXT, font=font(18 * SCALE, True))
    y += 48 * SCALE
    round_rect(d, (PAGE_X, y, W - PAGE_X, y + 160 * SCALE), 20 * SCALE, fill=C_MINT)
    d.text((PAGE_X + 120 * SCALE, y + 60 * SCALE), "🚗  📍", fill=C_PRIMARY, font=font(36 * SCALE))
    y += 180 * SCALE
    d.text((PAGE_X, y), "Find the miles you missed", fill=C_TEXT, font=font(22 * SCALE, True))
    y += 36 * SCALE
    d.text((PAGE_X, y), "We'll scan for likely work drives that\nweren't saved yet.", fill=C_SECONDARY, font=font(15 * SCALE))
    y += 56 * SCALE
    for bullet in [
        "Uses your existing location data",
        "Nothing is added without you",
        "Takes about 1 minute",
    ]:
        d.text((PAGE_X, y), f"✓  {bullet}", fill=C_PRIMARY, font=font(14 * SCALE, True))
        y += 28 * SCALE
    primary_button(d, H - SAFE_BOTTOM - 52 * SCALE - 40 * SCALE, "Run check now")
    d.text((PAGE_X + 100 * SCALE, H - SAFE_BOTTOM - 24 * SCALE), "Takes about 1 minute", fill=C_TERTIARY, font=font(12 * SCALE))
    save(img, "11-missing-drives.png")


def main():
    render_welcome()
    render_purpose()
    render_region()
    render_home()
    render_review()
    render_proof()
    render_add_drive()
    render_protection()
    render_subscription()
    render_profile()
    render_missing()
    # manifest
    files = sorted(OUT.glob("*.png"))
    (OUT / "MANIFEST.md").write_text(
        "# Reference crops\n\n"
        "Generated from IMAGE_LOCK_SPEC (vision extraction of attached collage).\n"
        "Marketing panel excluded.\n\n"
        + "\n".join(f"- `{p.name}` ({p.stat().st_size} bytes)" for p in files)
        + "\n",
        encoding="utf-8",
    )
    print("done", len(files), "crops")


if __name__ == "__main__":
    main()
