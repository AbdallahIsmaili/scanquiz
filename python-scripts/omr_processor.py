import cv2
import numpy as np
import pytesseract
import zipfile
import rarfile
import os
import sys
import json
import shutil
from pdf2image import convert_from_path

width, height = 2100, 2970  

num_questions = 30
options_per_question = 4
bubble_radius = 20
bubble_spacing = 60
question_spacing = 80
left_margin = 500
top_margin = 800
column_spacing = 1000
box_width, box_height = 400, 70

info_fields = {
    "Name": (width // 2 - 700, 500),
    "Class": (width // 2 - 200, 500),
    "CIN": (width // 2 + 400, 500),
}

exam_info_fields = {
    "exam_title": (width // 2 - 400, 100, width // 2 + 400, 160),
    "prof_name": (width // 2 - 400, 200, width // 2 + 400, 260),
    "university_name": (width // 2 - 400, 300, width // 2 + 400, 360),
    "exam_id": (width - left_margin - 500, 50, width - left_margin + 200, 100),
}

def extract_text(roi):
    if roi is None or roi.size == 0:
        return ""
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)
    text = pytesseract.image_to_string(binary, config="--psm 6")
    return text.strip()

def process_omr_sheet(omr_sheet):
    if omr_sheet is None or omr_sheet.size == 0:
        return {"error": "OMR sheet is empty or not properly loaded."}

    result = {"exam_info": {}, "student_info": {}, "checked_options": {}}

    for field, (x1, y1, x2, y2) in exam_info_fields.items():
        roi = omr_sheet[y1:y2, x1:x2]
        result["exam_info"][field] = extract_text(roi)

    for field, (x, y) in info_fields.items():
        roi = omr_sheet[y:y + box_height, x:x + box_width]
        result["student_info"][field] = extract_text(roi)

    for q in range(num_questions):
        if q < 25:
            x_offset = left_margin
            y_offset = top_margin + q * question_spacing
        else:
            x_offset = left_margin + column_spacing
            y_offset = top_margin + (q - 25) * question_spacing

        for o in range(options_per_question):
            center = (x_offset + o * bubble_spacing, y_offset)
            roi = omr_sheet[center[1] - bubble_radius:center[1] + bubble_radius,
                            center[0] - bubble_radius:center[0] + bubble_radius]
            if roi is None or roi.size == 0:
                continue
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)
            filled_percentage = np.sum(binary) / (bubble_radius ** 2 * np.pi * 255)
            if filled_percentage > 0.5:
                result["checked_options"][f"Q{q + 1}"] = chr(65 + o)
                break

    return result

def process_omr_archive(archive_path):
    results = []
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)

    if archive_path.endswith(".zip"):
        with zipfile.ZipFile(archive_path, "r") as archive:
            archive.extractall(temp_dir)
    elif archive_path.endswith(".rar"):
        with rarfile.RarFile(archive_path, "r") as archive:
            archive.extractall(temp_dir)

    image_files = [
        os.path.join(root, file)
        for root, _, files in os.walk(temp_dir)
        for file in files if file.lower().endswith((".png", ".jpg", ".jpeg", ".pdf"))
    ]

    for image_file in image_files:
        if image_file.lower().endswith(".pdf"):
            pages = convert_from_path(image_file)
            for page in pages:
                omr_sheet = np.array(page)
                results.append(process_omr_sheet(omr_sheet))
        else:
            omr_sheet = cv2.imread(image_file)
            if omr_sheet is not None:
                results.append(process_omr_sheet(omr_sheet))

    shutil.rmtree(temp_dir)  
    return results

def process_single_file(file_path):
    if file_path.lower().endswith(".pdf"):
        pages = convert_from_path(file_path)
        return [process_omr_sheet(np.array(page)) for page in pages]
    else:
        omr_sheet = cv2.imread(file_path)
        return [process_omr_sheet(omr_sheet)] if omr_sheet is not None else []

if __name__ == "__main__":
    file_paths = sys.argv[1:]
    results = []

    for file_path in file_paths:
        if file_path.endswith((".zip", ".rar")):
            results.extend(process_omr_archive(file_path))
        elif file_path.endswith((".png", ".jpg", ".jpeg", ".pdf")):
            results.extend(process_single_file(file_path))
        else:
            print(json.dumps({"error": f"Unsupported file format: {file_path}"}))
            sys.exit(1)

    print(json.dumps({"extractedData": results}))
