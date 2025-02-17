import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const tempDir = path.join(os.tmpdir(), "uploads");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePaths: string[] = [];
  for (const file of files) {
    const filePath = path.join(tempDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    filePaths.push(filePath);
  }

  const scriptPath = path.join(
    process.cwd(),
    "python-scripts",
    "omr_processor.py"
  );

  return new Promise((resolve) => {
    const pythonProcess = spawn("python", [scriptPath, ...filePaths]);

    let pythonOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python Error:", data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const response = JSON.parse(pythonOutput.trim());
        resolve(NextResponse.json(response));
      } catch (error) {
        console.error("Error parsing Python output:", error);
        resolve(
          NextResponse.json(
            { error: "Failed to process files" },
            { status: 500 }
          )
        );
      }
    });
  });
}
