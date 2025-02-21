import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync, createReadStream } from "fs";
import { exec } from "child_process";
import path from "path";
import * as XLSX from "xlsx";
import { PDFDocument } from "pdf-lib";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const quizId = formData.get("quizId") as string;
  const exam_id = formData.get("exam_id") as string; // Extract exam_id from the request

  // Extract the token from the headers
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!file || !quizId || !token || !exam_id) {
    return NextResponse.json(
      { error: "File, quiz ID, exam ID, and token are required." },
      { status: 400 }
    );
  }

  try {
    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Save the uploaded file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadsDir, file.name);
    await writeFile(filePath, buffer);

    // Debug: Confirm file was written successfully
    console.log("File written successfully:", existsSync(filePath));

    // Read the Excel file from the buffer
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const students = XLSX.utils.sheet_to_json(worksheet);

    // Check for required columns
    const requiredColumns = ["Name", "Class", "CIN"];
    if (students.length > 0) {
      const missingColumns = requiredColumns.filter(
        (col) => !Object.keys(students[0]).includes(col)
      );
      if (missingColumns.length > 0) {
        return NextResponse.json(
          {
            error: `Missing columns in Excel file: ${missingColumns.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "No student data found in the Excel file." },
        { status: 400 }
      );
    }

    // Fetch quiz details
    const quizResponse = await fetch(
      `http://localhost:3001/api/quizzes/${quizId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!quizResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch quiz details." },
        { status: 500 }
      );
    }

    const quizData = await quizResponse.json();

    // Fetch questions and choices
    const questionsResponse = await fetch(
      `http://localhost:3001/api/quizzes/${quizId}/questions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!questionsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch quiz questions." },
        { status: 500 }
      );
    }

    const questionsData = await questionsResponse.json();

    // Combine quiz metadata and questions
    const quizDetails = {
      ...quizData,
      questions: questionsData,
    };

    // Generate OMR sheets for each student
    const outputDir = path.join(process.cwd(), "public/generated-sheets");
    await mkdir(outputDir, { recursive: true });
    const generatedFiles = [];

    for (const student of students) {
      const studentData = {
        ...quizDetails,
        student: {
          name: student["Name"],
          class: student["Class"],
          cin: student["CIN"],
        },
        exam_id: exam_id, // Pass the exam_id to the Python script
      };

      const pythonScriptPath = path.join(
        process.cwd(),
        "python-scripts/generate_omr.py"
      );
      const command = `python "${pythonScriptPath}" "${JSON.stringify(
        studentData
      ).replace(/"/g, '\\"')}"`;

      // Debug: Log the command
      console.log("Executing command:", command);

      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${stderr}`);
            reject(error);
          } else {
            const output = JSON.parse(stdout);
            generatedFiles.push(output.omrSheetUrl);
            resolve(output);
          }
        });
      });
    }

    // Merge all PDFs into a single PDF
    const mergedPdf = await PDFDocument.create();

    for (const fileUrl of generatedFiles) {
      const filePath = path.join(process.cwd(), "public", fileUrl);
      const pdfBytes = await readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices()
      );
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const mergedPdfPath = path.join(outputDir, "student_sheets_merged.pdf");
    await writeFile(mergedPdfPath, mergedPdfBytes);

    console.log("Merged PDF created successfully:", mergedPdfPath);

    // Stream the merged PDF to the client
    const fileStream = createReadStream(mergedPdfPath);
    const response = new NextResponse(fileStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="student_sheets_merged.pdf"`,
      },
    });

    return response;
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating sheets." },
      { status: 500 }
    );
  }
}
