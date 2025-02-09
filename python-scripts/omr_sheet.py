import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fpdf import FPDF

# Create a blank white image
width, height = 2100, 2970  # A4 size at 300 dpi
omr_sheet = np.ones((height, width, 3), dtype=np.uint8) * 255

# Define parameters
num_questions = 30
options_per_question = 4
bubble_radius = 20
bubble_spacing = 60
question_spacing = 80
left_margin = 500
top_margin = 800
column_spacing = 1000
font_path = "Times New Roman/times new roman bold.ttf"  # Change to a font file you prefer
title_font_size = 60
info_font_size = 40
option_font_size = 30

# Use PIL to draw text with a custom font
def draw_text_pil(img, text, position, font_size):
    pil_img = Image.fromarray(img)
    draw = ImageDraw.Draw(pil_img)
    font = ImageFont.truetype(font_path, font_size)
    text_bbox = draw.textbbox(position, text, font=font)
    text_position = (position[0] - (text_bbox[2] - text_bbox[0]) // 2, position[1])
    draw.text(text_position, text, font=font, fill=(0, 0, 0))
    return np.array(pil_img)

# Add exam title, professor's name, university name, and exam ID
exam_title = "Introduction to AI"
prof_name = "Prof. John Doe"
university_name = "Tech University"
exam_id = "AI-2025-01"

# Add centered title
omr_sheet = draw_text_pil(omr_sheet, exam_title, (width // 2, 100), title_font_size)

# Add centered professor's name
omr_sheet = draw_text_pil(omr_sheet, prof_name, (width // 2, 200), info_font_size)

# Add centered university name
omr_sheet = draw_text_pil(omr_sheet, university_name, (width // 2, 300), info_font_size)

# Add exam ID at the top-right corner
omr_sheet = draw_text_pil(omr_sheet, exam_id, (width - left_margin, 50), info_font_size)

# Add a horizontal line below the title
cv2.line(omr_sheet, (left_margin, 400), (width - left_margin, 400), (0, 0, 0), 2)

# Add student information fields
info_fields = {
    "Name": (width // 2 - 700, 500),
    "Class": (width // 2 - 200, 500),
    "CIN": (width // 2 + 400, 500)
}

# Draw labeled boxes for student information
box_width, box_height = 400, 70
for field, (x, y) in info_fields.items():
    # Draw the box
    cv2.rectangle(omr_sheet, (x, y), (x + box_width, y + box_height), (0, 0, 0), 2)
    # Add the field label above the box
    omr_sheet = draw_text_pil(omr_sheet, field, (x + box_width // 2, y - 40), info_font_size)

# Draw bubbles for each question
for q in range(num_questions):
    if q < 25:
        x_offset = left_margin
        y_offset = top_margin + q * question_spacing
    else:
        x_offset = left_margin + column_spacing
        y_offset = top_margin + (q - 25) * question_spacing

    # Add question number
    omr_sheet = draw_text_pil(omr_sheet, f"Q{q + 1}", (x_offset - 80, y_offset + 10), option_font_size)

    for o in range(options_per_question):
        center = (x_offset + o * bubble_spacing, y_offset)
        # Draw the bubble
        cv2.circle(omr_sheet, center, bubble_radius, (0, 0, 0), 2)
        # Add option name (A, B, C, D)
        option_name = chr(65 + o)  # 65 is ASCII for 'A'
        omr_sheet = draw_text_pil(omr_sheet, option_name, (center[0] + 4, center[1] + 22), option_font_size)

# Add a border around the entire sheet
cv2.rectangle(omr_sheet, (50, 50), (width - 50, height - 50), (0, 0, 0), 3)

# Save the OMR sheet as an image
image_path = "empty_omr_sheet.png"
cv2.imwrite(image_path, omr_sheet)

# Save the OMR sheet as a PDF
pdf_path = "empty_omr_sheet.pdf"
image = Image.open(image_path)
pdf = FPDF()
pdf.add_page()
pdf.image(image_path, 0, 0, 210, 297)  # A4 dimensions in mm
pdf.output(pdf_path)

# Optional: Display the OMR sheet
cv2.imshow("Modern OMR Sheet", omr_sheet)
cv2.waitKey(0)
cv2.destroyAllWindows()
