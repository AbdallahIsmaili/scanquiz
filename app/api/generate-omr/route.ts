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

    pythonProcess.on("close", () => {
      try {
        const response = JSON.parse(pythonOutput.trim().split("\n").pop()); // Get last line
        const omrSheetUrl = response.omrSheetUrl;

        // ✅ Return direct link to the file in /public/
        resolve(NextResponse.json({ omrSheetUrl }));
      } catch (error) {
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
