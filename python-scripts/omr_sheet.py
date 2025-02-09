import cv2
import numpy as np
import json
import sys
import os
import datetime
import random
from PIL import Image, ImageDraw, ImageFont
from fpdf import FPDF

sys.stdout.reconfigure(encoding="utf-8")  

if len(sys.argv) > 1:
    data = json.loads(sys.argv[1])
    exam_title = data.get("title", "Sample Quiz").strip()
    questions = data.get("questions", [])
    num_questions = len(questions)
else:
    print("No input received. Using default values.")
    exam_title = "Sample Quiz"
    num_questions = 30
    questions = [{"text": f"Question {i+1}"} for i in range(num_questions)]

current_year = datetime.datetime.now().year
random_digits = random.randint(100, 999)  
exam_id = (
    (exam_title[-3:] if len(exam_title) >= 3 else exam_title)  # Last 3 letters
    + str(current_year)[-2:]  
    + str(random_digits)  
    + exam_title[0]  
).upper()

print(f"Generated Exam ID: {exam_id}")

output_dir = os.path.abspath(os.path.join(os.getcwd(), "public/generated-sheets/"))
os.makedirs(output_dir, exist_ok=True)

image_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.png")
pdf_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.pdf")

width, height = 2100, 2970  
bubble_radius = 20
bubble_spacing = 60
question_spacing = 80
left_margin = 500
top_margin = 800
column_spacing = 1000
options_per_question = 4  # Default options A, B, C, D
font_path = "python-scripts/Times New Roman/times new roman bold.ttf"



title_font_size = 60
info_font_size = 40
option_font_size = 30

omr_sheet = np.ones((height, width, 3), dtype=np.uint8) * 255

def draw_text_pil(img, text, position, font_size):
    pil_img = Image.fromarray(img)
    draw = ImageDraw.Draw(pil_img)
    font = ImageFont.truetype(font_path, font_size)
    text_bbox = draw.textbbox(position, text, font=font)
    text_position = (position[0] - (text_bbox[2] - text_bbox[0]) // 2, position[1])
    draw.text(text_position, text, font=font, fill=(0, 0, 0))
    return np.array(pil_img)

omr_sheet = draw_text_pil(omr_sheet, exam_title, (width // 2, 100), title_font_size)
omr_sheet = draw_text_pil(omr_sheet, exam_id, (width - left_margin, 50), info_font_size)
omr_sheet = draw_text_pil(omr_sheet, "ANSWER SHEET", (width // 2, 200), title_font_size)


info_fields = {"Name": (width // 2 - 700, 500), "Class": (width // 2 - 200, 500), "CIN": (width // 2 + 400, 500)}
box_width, box_height = 400, 70

for field, (x, y) in info_fields.items():
    cv2.rectangle(omr_sheet, (x, y), (x + box_width, y + box_height), (0, 0, 0), 2)
    omr_sheet = draw_text_pil(omr_sheet, field, (x + box_width // 2, y - 40), info_font_size)

for q, question in enumerate(questions):
    if q < 25:
        x_offset = left_margin
        y_offset = top_margin + q * question_spacing
    else:
        x_offset = left_margin + column_spacing
        y_offset = top_margin + (q - 25) * question_spacing

    omr_sheet = draw_text_pil(omr_sheet, f"Q{q + 1}", (x_offset - 80, y_offset + 10), option_font_size)

    for o in range(options_per_question):
        center = (x_offset + o * bubble_spacing, y_offset)
        cv2.circle(omr_sheet, center, bubble_radius, (0, 0, 0), 2)
        option_name = chr(65 + o)
        omr_sheet = draw_text_pil(omr_sheet, option_name, (center[0] + 4, center[1] + 22), option_font_size)

cv2.rectangle(omr_sheet, (50, 50), (width - 50, height - 50), (0, 0, 0), 3)

cv2.imwrite(image_path, omr_sheet)
print(f"Image saved: {image_path}")

if os.path.exists(image_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.image(image_path, 0, 0, 210, 297)  # A4 dimensions in mm
    pdf.output(pdf_path)
    print(f"PDF saved: {pdf_path}")
else:
    print("❌ PDF creation skipped because image was not found!")

print(json.dumps({"omrSheetUrl": f"/generated-sheets/omr_sheet_{exam_id}.pdf"}))

