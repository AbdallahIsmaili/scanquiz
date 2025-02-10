import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: Request) {
  const { title, questions } = await req.json();
  const scriptPath = path.join(process.cwd(), "python-scripts", "omr_sheet.py");

  return new Promise((resolve) => {
    const pythonProcess = spawn("python", [
      scriptPath,
      JSON.stringify({ title, questions }),
    ]);

    let pythonOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.on("close", async () => {
      try {
        const response = JSON.parse(pythonOutput.trim().split("\n").pop());
        const exam_id = response.exam_id;
        const omrSheetUrl = response.omrSheetUrl;

        console.log("Generated New Exam ID:", exam_id);

        // ✅ Send updated `exam_id` to backend
        await fetch("http://localhost:3001/save-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, questions, exam_id }),
        });

        resolve(NextResponse.json({ omrSheetUrl, exam_id }));
      } catch (error) {
        console.error("❌ Error parsing Python output:", error);
        resolve(
          NextResponse.json(
            { error: "Failed to generate OMR sheet" },
            { status: 500 }
          )
        );
      }
    });
  });
}
