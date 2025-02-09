# # # import cv2
# # # import numpy as np
# # # from PIL import Image, ImageDraw, ImageFont
# # # from fpdf import FPDF

# # # # Create a blank white image
# # # width, height = 2100, 2970  # A4 size at 300 dpi
# # # omr_sheet = np.ones((height, width, 3), dtype=np.uint8) * 255

# # # # Define parameters
# # # num_questions = 30
# # # options_per_question = 4
# # # bubble_radius = 20
# # # bubble_spacing = 60
# # # question_spacing = 80
# # # left_margin = 500
# # # top_margin = 800
# # # column_spacing = 1000
# # # font_path = "Times New Roman/times new roman bold.ttf"  # Change to a font file you prefer
# # # title_font_size = 60
# # # info_font_size = 40
# # # option_font_size = 30

# # # # Use PIL to draw text with a custom font
# # # def draw_text_pil(img, text, position, font_size):
# # #     pil_img = Image.fromarray(img)
# # #     draw = ImageDraw.Draw(pil_img)
# # #     font = ImageFont.truetype(font_path, font_size)
# # #     text_bbox = draw.textbbox(position, text, font=font)
# # #     text_position = (position[0] - (text_bbox[2] - text_bbox[0]) // 2, position[1])
# # #     draw.text(text_position, text, font=font, fill=(0, 0, 0))
# # #     return np.array(pil_img)

# # # # Add exam title, professor's name, university name, and exam ID
# # # exam_title = "Introduction to AI"
# # # prof_name = "Prof. John Doe"
# # # university_name = "Tech University"
# # # exam_id = "AI-2025-01"

# # # # Add centered title
# # # omr_sheet = draw_text_pil(omr_sheet, exam_title, (width // 2, 100), title_font_size)

# # # # Add centered professor's name
# # # omr_sheet = draw_text_pil(omr_sheet, prof_name, (width // 2, 200), info_font_size)

# # # # Add centered university name
# # # omr_sheet = draw_text_pil(omr_sheet, university_name, (width // 2, 300), info_font_size)

# # # # Add exam ID at the top-right corner
# # # omr_sheet = draw_text_pil(omr_sheet, exam_id, (width - left_margin, 50), info_font_size)

# # # # Add a horizontal line below the title
# # # cv2.line(omr_sheet, (left_margin, 400), (width - left_margin, 400), (0, 0, 0), 2)

# # # # Add student information fields
# # # info_fields = {
# # #     "Name": (width // 2 - 700, 500),
# # #     "Class": (width // 2 - 200, 500),
# # #     "CIN": (width // 2 + 400, 500)
# # # }

# # # # Draw labeled boxes for student information
# # # box_width, box_height = 400, 70
# # # for field, (x, y) in info_fields.items():
# # #     # Draw the box
# # #     cv2.rectangle(omr_sheet, (x, y), (x + box_width, y + box_height), (0, 0, 0), 2)
# # #     # Add the field label above the box
# # #     omr_sheet = draw_text_pil(omr_sheet, field, (x + box_width // 2, y - 40), info_font_size)

# # # # Draw bubbles for each question
# # # for q in range(num_questions):
# # #     if q < 25:
# # #         x_offset = left_margin
# # #         y_offset = top_margin + q * question_spacing
# # #     else:
# # #         x_offset = left_margin + column_spacing
# # #         y_offset = top_margin + (q - 25) * question_spacing

# # #     # Add question number
# # #     omr_sheet = draw_text_pil(omr_sheet, f"Q{q + 1}", (x_offset - 80, y_offset + 10), option_font_size)

# # #     for o in range(options_per_question):
# # #         center = (x_offset + o * bubble_spacing, y_offset)
# # #         # Draw the bubble
# # #         cv2.circle(omr_sheet, center, bubble_radius, (0, 0, 0), 2)
# # #         # Add option name (A, B, C, D)
# # #         option_name = chr(65 + o)  # 65 is ASCII for 'A'
# # #         omr_sheet = draw_text_pil(omr_sheet, option_name, (center[0] + 4, center[1] + 22), option_font_size)

# # # # Add a border around the entire sheet
# # # cv2.rectangle(omr_sheet, (50, 50), (width - 50, height - 50), (0, 0, 0), 3)

# # # # Save the OMR sheet as an image
# # # image_path = "empty_omr_sheet.png"
# # # cv2.imwrite(image_path, omr_sheet)

# # # # Save the OMR sheet as a PDF
# # # pdf_path = "empty_omr_sheet.pdf"
# # # image = Image.open(image_path)
# # # pdf = FPDF()
# # # pdf.add_page()
# # # pdf.image(image_path, 0, 0, 210, 297)  # A4 dimensions in mm
# # # pdf.output(pdf_path)

# # # # Optional: Display the OMR sheet
# # # cv2.imshow("Modern OMR Sheet", omr_sheet)
# # # cv2.waitKey(0)
# # # cv2.destroyAllWindows()




# # import cv2
# # import numpy as np
# # import json
# # import sys
# # import os
# # import datetime
# # from PIL import Image, ImageDraw, ImageFont
# # from fpdf import FPDF

# # # Read JSON input from command-line argument
# # if len(sys.argv) > 1:
# #     data = json.loads(sys.argv[1])
# #     exam_title = data.get("title", "Sample Quiz").strip()
# #     questions = data.get("questions", [])
# #     num_questions = len(questions)
# # else:
# #     print("No input received. Using default values.")
# #     exam_title = "Sample Quiz"
# #     num_questions = 30
# #     questions = [{"text": f"Question {i+1}"} for i in range(num_questions)]

# # # Generate unique exam ID
# # current_year = datetime.datetime.now().year
# # microsecond = datetime.datetime.now().microsecond
# # exam_id = (
# #     (exam_title[-3:] if len(exam_title) >= 3 else exam_title)  # Last 3 letters
# #     + str(current_year)  # Year
# #     + str(microsecond)  # Microsecond timestamp
# #     + exam_title[0]  # First letter
# # ).upper()

# # print(f"Generated Exam ID: {exam_id}")

# # # Constants
# # width, height = 2100, 2970  # A4 size at 300 dpi
# # bubble_radius = 20
# # bubble_spacing = 60
# # question_spacing = 80
# # left_margin = 500
# # top_margin = 800
# # column_spacing = 1000
# # options_per_question = 4  # Default options A, B, C, D
# # font_path = "C:/Windows/Fonts/Arial.ttf"
# # title_font_size = 60
# # info_font_size = 40
# # option_font_size = 30

# # # Ensure output directory exists
# # output_dir = "/public/"
# # os.makedirs(output_dir, exist_ok=True)

# # # File paths with exam ID
# # image_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.png")
# # pdf_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.pdf")

# # # Create a blank white image
# # omr_sheet = np.ones((height, width, 3), dtype=np.uint8) * 255

# # # Function to draw text
# # def draw_text_pil(img, text, position, font_size):
# #     pil_img = Image.fromarray(img)
# #     draw = ImageDraw.Draw(pil_img)
# #     font = ImageFont.truetype(font_path, font_size)
# #     text_bbox = draw.textbbox(position, text, font=font)
# #     text_position = (position[0] - (text_bbox[2] - text_bbox[0]) // 2, position[1])
# #     draw.text(text_position, text, font=font, fill=(0, 0, 0))
# #     return np.array(pil_img)

# # # Add title and exam ID
# # omr_sheet = draw_text_pil(omr_sheet, exam_title, (width // 2, 100), title_font_size)
# # omr_sheet = draw_text_pil(omr_sheet, f"Exam ID: {exam_id}", (width - left_margin, 50), info_font_size)

# # # Student information fields
# # info_fields = {"Name": (width // 2 - 700, 500), "Class": (width // 2 - 200, 500), "CIN": (width // 2 + 400, 500)}
# # box_width, box_height = 400, 70

# # for field, (x, y) in info_fields.items():
# #     cv2.rectangle(omr_sheet, (x, y), (x + box_width, y + box_height), (0, 0, 0), 2)
# #     omr_sheet = draw_text_pil(omr_sheet, field, (x + box_width // 2, y - 40), info_font_size)

# # # Draw questions and answer bubbles
# # for q, question in enumerate(questions):
# #     if q < 25:
# #         x_offset = left_margin
# #         y_offset = top_margin + q * question_spacing
# #     else:
# #         x_offset = left_margin + column_spacing
# #         y_offset = top_margin + (q - 25) * question_spacing

# #     omr_sheet = draw_text_pil(omr_sheet, f"Q{q + 1}", (x_offset - 80, y_offset + 10), option_font_size)

# #     for o in range(options_per_question):
# #         center = (x_offset + o * bubble_spacing, y_offset)
# #         cv2.circle(omr_sheet, center, bubble_radius, (0, 0, 0), 2)
# #         option_name = chr(65 + o)
# #         omr_sheet = draw_text_pil(omr_sheet, option_name, (center[0] + 4, center[1] + 22), option_font_size)

# # # Add a border
# # cv2.rectangle(omr_sheet, (50, 50), (width - 50, height - 50), (0, 0, 0), 3)

# # # Save the OMR sheet as an image and PDF
# # cv2.imwrite(image_path, omr_sheet)
# # image = Image.open(image_path)

# # pdf = FPDF()
# # pdf.add_page()
# # pdf.image(image_path, 0, 0, 210, 297)  # A4 dimensions in mm
# # pdf.output(pdf_path)

# # print(f"OMR Sheet Generated Successfully: {pdf_path}")



# import cv2
# import numpy as np
# import json
# import sys
# import os
# import datetime
# from PIL import Image, ImageDraw, ImageFont
# from fpdf import FPDF

# sys.stdout.reconfigure(encoding="utf-8")  

# # Read JSON input from command-line argument
# if len(sys.argv) > 1:
#     data = json.loads(sys.argv[1])
#     exam_title = data.get("title", "Sample Quiz").strip()
#     questions = data.get("questions", [])
#     num_questions = len(questions)
# else:
#     print("No input received. Using default values.")
#     exam_title = "Sample Quiz"
#     num_questions = 30
#     questions = [{"text": f"Question {i+1}"} for i in range(num_questions)]

# # Generate unique exam ID
# current_year = datetime.datetime.now().year
# microsecond = datetime.datetime.now().microsecond
# exam_id = (
#     (exam_title[-3:] if len(exam_title) >= 3 else exam_title)  # Last 3 letters
#     + str(current_year)  # Year
#     + str(microsecond)  # Microsecond timestamp
#     + exam_title[0]  # First letter
# ).upper()

# print(f"Generated Exam ID: {exam_id}")

# # ✅ FIX: Ensure output directory exists
# output_dir = os.path.abspath(os.path.join(os.getcwd(), "public/generated-sheets/"))
# os.makedirs(output_dir, exist_ok=True)

# # ✅ FIX: Generate correct paths
# image_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.png")
# pdf_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.pdf")

# # Constants
# width, height = 2100, 2970  # A4 size at 300 dpi
# bubble_radius = 20
# bubble_spacing = 60
# question_spacing = 80
# left_margin = 500
# top_margin = 800
# column_spacing = 1000
# options_per_question = 4  # Default options A, B, C, D
# font_path = "C:/Windows/Fonts/Arial.ttf"
# title_font_size = 60
# info_font_size = 40
# option_font_size = 30

# # Create a blank white image
# omr_sheet = np.ones((height, width, 3), dtype=np.uint8) * 255

# # Function to draw text
# def draw_text_pil(img, text, position, font_size):
#     pil_img = Image.fromarray(img)
#     draw = ImageDraw.Draw(pil_img)
#     font = ImageFont.truetype(font_path, font_size)
#     text_bbox = draw.textbbox(position, text, font=font)
#     text_position = (position[0] - (text_bbox[2] - text_bbox[0]) // 2, position[1])
#     draw.text(text_position, text, font=font, fill=(0, 0, 0))
#     return np.array(pil_img)

# # Add title and exam ID
# omr_sheet = draw_text_pil(omr_sheet, exam_title, (width // 2, 100), title_font_size)
# omr_sheet = draw_text_pil(omr_sheet, f"Exam ID: {exam_id}", (width - left_margin, 50), info_font_size)

# # Student information fields
# info_fields = {"Name": (width // 2 - 700, 500), "Class": (width // 2 - 200, 500), "CIN": (width // 2 + 400, 500)}
# box_width, box_height = 400, 70

# for field, (x, y) in info_fields.items():
#     cv2.rectangle(omr_sheet, (x, y), (x + box_width, y + box_height), (0, 0, 0), 2)
#     omr_sheet = draw_text_pil(omr_sheet, field, (x + box_width // 2, y - 40), info_font_size)

# # Draw questions and answer bubbles
# for q, question in enumerate(questions):
#     if q < 25:
#         x_offset = left_margin
#         y_offset = top_margin + q * question_spacing
#     else:
#         x_offset = left_margin + column_spacing
#         y_offset = top_margin + (q - 25) * question_spacing

#     omr_sheet = draw_text_pil(omr_sheet, f"Q{q + 1}", (x_offset - 80, y_offset + 10), option_font_size)

#     for o in range(options_per_question):
#         center = (x_offset + o * bubble_spacing, y_offset)
#         cv2.circle(omr_sheet, center, bubble_radius, (0, 0, 0), 2)
#         option_name = chr(65 + o)
#         omr_sheet = draw_text_pil(omr_sheet, option_name, (center[0] + 4, center[1] + 22), option_font_size)

# # Add a border
# cv2.rectangle(omr_sheet, (50, 50), (width - 50, height - 50), (0, 0, 0), 3)

# # ✅ FIX: Check if image is saved successfully
# if cv2.imwrite(image_path, omr_sheet):
#     print(f" Image saved: {image_path}")
# else:
#     print("❌ Image saving failed!")

# # ✅ FIX: Check if image exists before adding to PDF
# if os.path.exists(image_path):
#     image = Image.open(image_path)

#     pdf = FPDF()
#     pdf.add_page()
#     pdf.image(image_path, 0, 0, 210, 297)  # A4 dimensions in mm
#     pdf.output(pdf_path)

#     print(f" PDF saved: {pdf_path}")
# else:
#     print("❌ PDF creation skipped because image was not found!")


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

# Read JSON input from command-line argument
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

# ✅ Generate shorter unique exam ID
current_year = datetime.datetime.now().year
random_digits = random.randint(100, 999)  # Generate 3 random digits
exam_id = (
    (exam_title[-3:] if len(exam_title) >= 3 else exam_title)  # Last 3 letters
    + str(current_year)[-2:]  # Last 2 digits of year
    + str(random_digits)  # Random 3-digit number
    + exam_title[0]  # First letter
).upper()

print(f"Generated Exam ID: {exam_id}")

# ✅ Ensure output directory exists
output_dir = os.path.abspath(os.path.join(os.getcwd(), "public/generated-sheets/"))
os.makedirs(output_dir, exist_ok=True)

# ✅ Generate correct paths
image_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.png")
pdf_path = os.path.join(output_dir, f"omr_sheet_{exam_id}.pdf")

# Constants
width, height = 2100, 2970  # A4 size at 300 dpi
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

# Create a blank white image
omr_sheet = np.ones((height, width, 3), dtype=np.uint8) * 255

# Function to draw text
def draw_text_pil(img, text, position, font_size):
    pil_img = Image.fromarray(img)
    draw = ImageDraw.Draw(pil_img)
    font = ImageFont.truetype(font_path, font_size)
    text_bbox = draw.textbbox(position, text, font=font)
    text_position = (position[0] - (text_bbox[2] - text_bbox[0]) // 2, position[1])
    draw.text(text_position, text, font=font, fill=(0, 0, 0))
    return np.array(pil_img)

# ✅ Add title and Exam ID (WITHOUT "Exam ID:")
omr_sheet = draw_text_pil(omr_sheet, exam_title, (width // 2, 100), title_font_size)
omr_sheet = draw_text_pil(omr_sheet, exam_id, (width - left_margin, 50), info_font_size)
omr_sheet = draw_text_pil(omr_sheet, "ANSWER SHEET", (width // 2, 200), title_font_size)


# Student information fields
info_fields = {"Name": (width // 2 - 700, 500), "Class": (width // 2 - 200, 500), "CIN": (width // 2 + 400, 500)}
box_width, box_height = 400, 70

for field, (x, y) in info_fields.items():
    cv2.rectangle(omr_sheet, (x, y), (x + box_width, y + box_height), (0, 0, 0), 2)
    omr_sheet = draw_text_pil(omr_sheet, field, (x + box_width // 2, y - 40), info_font_size)

# Draw questions and answer bubbles
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

# Add a border
cv2.rectangle(omr_sheet, (50, 50), (width - 50, height - 50), (0, 0, 0), 3)

# ✅ FIX: Prevent duplicate image saving
cv2.imwrite(image_path, omr_sheet)
print(f"Image saved: {image_path}")

# ✅ FIX: Ensure image exists before generating PDF
if os.path.exists(image_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.image(image_path, 0, 0, 210, 297)  # A4 dimensions in mm
    pdf.output(pdf_path)
    print(f"PDF saved: {pdf_path}")
else:
    print("❌ PDF creation skipped because image was not found!")

# ✅ Return correct file path for Next.js
print(json.dumps({"omrSheetUrl": f"/generated-sheets/omr_sheet_{exam_id}.pdf"}))

