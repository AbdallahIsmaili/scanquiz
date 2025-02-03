"use client";

import { useState, ChangeEvent } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Result = {
  fullName: string;
  className: string;
  cin: string;
  answers: Record<string, string>;
  score: number;
};

const FileUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>("");

  const correctAnswers = {
    Q1: "B",
    Q2: "D",
    Q3: "A",
    Q4: "C",
    Q5: "B",
    Q6: "A",
    Q7: "D",
    Q8: "C",
    Q9: "A",
    Q10: "B",
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    setFiles(uploadedFiles);
  };

  const handleExtractAndScore = async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const response = await axios.post("/pages/api/correction", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResults(response.data.results);
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("There was an issue processing your files. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative max-w-screen-xl mx-auto text-center overflow-hidden">
        <div className="items-center mx-auto">
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-4 p-6 bg-white rounded-md dark:bg-gray-900 dark:border-gray-700 mt-4 mb-8">
            <Label
              htmlFor="fileInput"
              className="text-lg font-medium text-gray-700 dark:text-gray-300"
            >
              Import a PDF or Image
            </Label>
            <div className="relative w-full">
              <input
                id="fileInput"
                type="file"
                accept=".pdf, image/*"
                multiple
                onChange={handleFileChange}
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <Button onClick={handleExtractAndScore} disabled={isLoading}>
              {isLoading ? "Processing..." : "Extract and Score"}
            </Button>
            {error && <div className="mt-4 text-red-500">{error}</div>}
          </div>
        </div>

        {results.length > 0 && (
          <div className="flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl">Results:</h2>
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 border rounded-md mb-4 w-full max-w-md"
              >
                <p>
                  <strong>Full Name:</strong> {result.fullName}
                </p>
                <p>
                  <strong>Class:</strong> {result.className}
                </p>
                <p>
                  <strong>CIN:</strong> {result.cin}
                </p>
                <p>
                  <strong>Score:</strong> {result.score}
                </p>
                <div>
                  <h3 className="font-semibold">Answers:</h3>
                  <ul>
                    {Object.entries(result.answers).map(
                      ([question, answer]) => (
                        <li key={question}>
                          {question}: {answer} -{" "}
                          {answer === correctAnswers[question]
                            ? "✅ Correct"
                            : "❌ Incorrect"}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FileUploader;
