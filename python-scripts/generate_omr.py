import sys
import json
import cv2
import numpy as np
import os
from PIL import Image, ImageDraw, ImageFont
from fpdf import FPDF

# Redirect debug logs to stderr
def log(message):
    print(message, file=sys.stderr)

log("Starting Python script...")

if len(sys.argv) > 1:
    try:
        # Parse the JSON string from the command line
        data = json.loads(sys.argv[1])
        log("Received data: " + str(data))  # Debug: Log the received data to stderr
    except json.JSONDecodeError as e:
        log("Error decoding JSON: " + str(e))
        sys.exit(1)
else:
    log("No input received. Using default values.")
    sys.exit(1)

# Extract quiz and student data
exam_title = data.get("title", "Sample Quiz").strip()
questions = data.get("questions", [])
student = data.get("student", {})
student_name = student.get("name", "Unknown")
student_class = student.get("class", "Unknown")
student_cin = student.get("cin", "Unknown")
exam_id = data.get("exam_id", "UNKNOWN")  # Use the exam_id provided by the backend

log(f"Extracted student data: Name={student_name}, Class={student_class}, CIN={student_cin}")
log(f"Using exam_id: {exam_id}")

# Create output directory
output_dir = os.path.abspath(os.path.join(os.getcwd(), "public/generated-sheets/"))
os.makedirs(output_dir, exist_ok=True)
log(f"Output directory: {output_dir}")

# Define file paths
image_path = os.path.join(output_dir, f"omr_sheet_{exam_id}_{student_cin}.png")
pdf_path = os.path.join(output_dir, f"omr_sheet_{exam_id}_{student_cin}.pdf")

log(f"Image path: {image_path}")
log(f"PDF path: {pdf_path}")

# Define OMR sheet dimensions and layout
width, height = 2100, 2970
bubble_radius = 20
bubble_spacing = 60
question_spacing = 80
left_margin = 500
top_margin = 800
column_spacing = 1000
options_per_question = 4
font_path = "python-scripts/Times New Roman/times new roman bold.ttf"

title_font_size = 60
info_font_size = 40
option_font_size = 30

# Create a blank white image for the OMR sheet
omr_sheet = np.ones((height, width, 3), dtype=np.uint8) * 255
log("Created blank OMR sheet.")

# Function to draw text using PIL
def draw_text_pil(img, text, position, font_size):
    pil_img = Image.fromarray(img)
    draw = ImageDraw.Draw(pil_img)
    font = ImageFont.truetype(font_path, font_size)
    text_bbox = draw.textbbox(position, text, font=font)
    text_position = (position[0] - (text_bbox[2] - text_bbox[0]) // 2, position[1])
    draw.text(text_position, text, font=font, fill=(0, 0, 0))
    return np.array(pil_img)

# Add exam title, ID, and "ANSWER SHEET" text
omr_sheet = draw_text_pil(omr_sheet, exam_title, (width // 2, 100), title_font_size)
omr_sheet = draw_text_pil(omr_sheet, exam_id, (width - left_margin, 50), info_font_size)
omr_sheet = draw_text_pil(omr_sheet, "ANSWER SHEET", (width // 2, 200), title_font_size)
log("Added exam title, ID, and 'ANSWER SHEET' text.")

# Add student info fields
info_fields = {"Name": (width // 2 - 700, 500), "Class": (width // 2 - 200, 500), "CIN": (width // 2 + 400, 500)}
box_width, box_height = 400, 70

for field, (x, y) in info_fields.items():
    cv2.rectangle(omr_sheet, (x, y), (x + box_width, y + box_height), (0, 0, 0), 2)
    omr_sheet = draw_text_pil(omr_sheet, field, (x + box_width // 2, y - 40), info_font_size)

log("Added student info fields.")


# Fill student info
omr_sheet = draw_text_pil(omr_sheet, student_name, (width // 2 - 700 + box_width // 2, 500 - 10  + box_height // 2), info_font_size)
omr_sheet = draw_text_pil(omr_sheet, student_class, (width // 2 - 200 + box_width // 2, 500 - 10 + box_height // 2), info_font_size)
omr_sheet = draw_text_pil(omr_sheet, student_cin, (width // 2 + 400 + box_width // 2, 500 - 10 + box_height // 2), info_font_size)
log("Filled student info.")

# Add questions and options
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

log("Added questions and options.")

# Add border to the OMR sheet
cv2.rectangle(omr_sheet, (50, 50), (width - 50, height - 50), (0, 0, 0), 3)
log("Added border to the OMR sheet.")

# Save the OMR sheet as an image
cv2.imwrite(image_path, omr_sheet)
log(f"Image saved: {image_path}")

# Convert the image to a PDF
if os.path.exists(image_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.image(image_path, 0, 0, 210, 297)
    pdf.output(pdf_path)
    log(f"PDF saved: {pdf_path}")
else:
    log("❌ PDF creation skipped because image was not found!")

# Return the OMR sheet URL as JSON
output = {
    "exam_id": exam_id,
    "omrSheetUrl": f"/generated-sheets/omr_sheet_{exam_id}_{student_cin}.pdf"
}
print(json.dumps(output))  # Only print JSON to stdout
log("Script completed successfully.")