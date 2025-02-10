"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TypographyH2 } from "@/components/Typography";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const allowedFileTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/vnd.rar",
    "application/octet-stream",
  ];

  const allowedFileExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
    ".zip",
    ".rar",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      for (let file of filesArray) {
        console.log("File:", file.name, "MIME Type:", file.type);
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (
          fileExtension &&
          !allowedFileExtensions.includes(`.${fileExtension}`)
        ) {
          toast.error(
            `Invalid file type: ${file.name}. Only images, PDFs, ZIPs, and RARs are allowed.`
          );
          return;
        }
      }
      setFiles(e.target.files);
    }
  };

  // const handleUpload = async () => {
  //   if (!files || files.length === 0) {
  //     toast.error("Please select files to upload.");
  //     return;
  //   }

  //   // Check file extensions
  //   for (let i = 0; i < files.length; i++) {
  //     const fileExtension = files[i].name.split(".").pop()?.toLowerCase();

  //     if (!allowedFileExtensions.includes(`.${fileExtension}`)) {
  //       toast.error(
  //         `Invalid file type: ${files[i].name}. Only images, PDFs, ZIPs, and RARs are allowed.`
  //       );
  //       return;
  //     }
  //   }

  //   setLoading(true);
  //   toast.loading("Uploading files...");

  //   const formData = new FormData();
  //   for (let i = 0; i < files.length; i++) {
  //     formData.append("files", files[i]);
  //   }

  //   try {
  //     const response = await axios.post("/api/process-omr", formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });

  //     setResults(response.data);
  //     toast.success("Files uploaded and processed successfully!");
  //   } catch (error) {
  //     console.error("Error uploading files:", error);
  //     toast.error("Failed to upload files.");
  //   } finally {
  //     setLoading(false);
  //     toast.dismiss();
  //   }
  // };


  // const handleUpload = async () => {
  //   if (!files || files.length === 0) {
  //     toast.error("Please select files to upload.");
  //     return;
  //   }

  //   setLoading(true);
  //   toast.loading("Uploading files...");

  //   const formData = new FormData();
  //   for (let i = 0; i < files.length; i++) {
  //     formData.append("files", files[i]);
  //   }

  //   try {
  //     const response = await axios.post("/api/process-omr", formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });

  //     console.log("Response data:", response.data);

  //     if (
  //       !response.data.extractedData[0]?.exam_info ||
  //       !response.data.extractedData[0].exam_info.exam_id
  //     ) {
  //       throw new Error("exam_id not found in response data.");
  //     }

  //     const examId = response.data.extractedData[0].exam_info.exam_id;
  //     const examData = await fetchExamInfo(examId);

  //     if (examData) {
  //       setResults({
  //         extractedData: response.data.extractedData,
  //         examData, // ✅ Store fetched exam data
  //       });
  //     }

  //     toast.success("Files uploaded and processed successfully!");
  //   } catch (error) {
  //     console.error("Error uploading files:", error);
  //     toast.error("Failed to upload files.");
  //   } finally {
  //     setLoading(false);
  //     toast.dismiss();
  //   }
  // };


const handleUpload = async () => {
  if (!files || files.length === 0) {
    toast.error("Please select files to upload.");
    return;
  }

  setLoading(true);
  toast.loading("Uploading files...");

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  try {
    // Upload and process OMR
    const response = await axios.post("/api/process-omr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("Response data:", response.data);

    if (
      !response.data.extractedData[0]?.exam_info ||
      !response.data.extractedData[0].exam_info.exam_id
    ) {
      throw new Error("exam_id not found in response data.");
    }

    const examId = response.data.extractedData[0].exam_info.exam_id;
    const examData = await fetchExamInfo(examId);

    if (examData) {
      // **Step 1: Extract Student Answers & Convert to Array**
      const studentAnswers = response.data.extractedData.map((student) => {
        // ✅ Convert checked_options { Q1: "D", Q2: "C" } → Array format
        const checkedOptionsArray = Object.entries(student.checked_options).map(
          ([key, value]) => ({
            question: parseInt(key.replace("Q", ""), 10), // Extract number
            selectedChoices: [value], // Convert to array for comparison
          })
        );

        return {
          student_info: student.student_info,
          checked_options: checkedOptionsArray, // ✅ Now it's an array!
        };
      });

      // **Step 2: Compare Answers**
      const gradedResults = studentAnswers.map((student) => {
        const comparedAnswers = student.checked_options.map((studentAns) => {
          const correctQuestion = examData.questions.find(
            (q, i) => i + 1 === studentAns.question // Match question ID
          );

          if (!correctQuestion) {
            return { ...studentAns, isCorrect: false, correctAnswers: [] };
          }

          // ✅ Fix: Find the actual correct answers
          const correctChoices = correctQuestion.choices
            .filter((c) => c.is_correct) // Get only correct answers
            .map((c) => c.choice_text); // Extract actual text (not position)

          const studentSelected = studentAns.selectedChoices
            ? studentAns.selectedChoices.map((letter) => {
                const choiceIndex = letter.charCodeAt(0) - 65; // Convert A, B, C, D → Index
                return (
                  correctQuestion.choices[choiceIndex]?.choice_text || letter
                ); // Match choice text
              })
            : [];

          const isCorrect =
            studentSelected.length === correctChoices.length &&
            studentSelected.every((choice) => correctChoices.includes(choice));

          return {
            ...studentAns,
            isCorrect,
            correctAnswers: correctChoices, // ✅ Now this will be correct!
          };
        });

        return {
          student_info: student.student_info,
          answers: comparedAnswers,
        };
      });


      setResults({
        extractedData: response.data.extractedData,
        examData,
        gradedResults, // ✅ Store graded answers
      });
    }

    toast.success("Files uploaded and processed successfully!");
  } catch (error) {
    console.error("Error uploading files:", error);
    toast.error("Failed to upload files.");
  } finally {
    setLoading(false);
    toast.dismiss();
  }
};


  const fetchExamInfo = async (examId: string) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/exam-info/${examId}`
      );
      toast.success("Exam data fetched successfully!");
      return response.data; // ✅ Return the data instead of setting state
    } catch (error) {
      console.error("Error fetching exam data:", error);
      toast.error("Failed to fetch exam data.");
      return null;
    }
  };


  return (
    <div className="flex justify-center min-h-screen p-6">
      <Card className="w-full p-6 border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-700">
            Upload MCQ Answer Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid items-center w-full max-w-4xl mx-auto grid-cols-12 gap-2 ">
            <Label
              htmlFor="file-upload"
              className="text-gray-600 text-center font-medium col-span-2"
            >
              Choose files
            </Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              className="col-span-7 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf,.zip,.rar"
            />
            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all col-span-3"
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>

          </div>

          {results?.examData && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-300">
              <TypographyH2>Exam Information</TypographyH2>
              <p>
                <strong>Exam Title:</strong>{" "}
                {results.examData.exam_info.title || "N/A"}
              </p>
              <p>
                <strong>Exam ID:</strong>{" "}
                {results.examData.exam_info.exam_id || "N/A"}
              </p>
            </div>
          )}

          {results?.gradedResults && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-300">
              <TypographyH2>Student Results</TypographyH2>

              {results.gradedResults.map((student, index) => (
                <div key={index} className="mb-6 border-b pb-4">
                  <h3 className="text-lg font-semibold text-blue-600">
                    Student {index + 1}
                  </h3>
                  <p>
                    <strong>Full Name:</strong>{" "}
                    {student.student_info?.Name || "N/A"}
                  </p>
                  <p>
                    <strong>Class:</strong>{" "}
                    {student.student_info?.Class || "N/A"}
                  </p>
                  <p>
                    <strong>CIN:</strong> {student.student_info?.CIN || "N/A"}
                  </p>

                  <h3 className="mt-4 font-semibold text-gray-700">Answers:</h3>
                  <ul className="mt-2">
                    {student.answers.map((ans, i) => (
                      <li key={i} className="mb-2">
                        <strong>Q{ans.question}:</strong>
                        <span
                          className={
                            ans.isCorrect ? "text-green-600" : "text-red-600"
                          }
                        >
                          {ans.selectedChoices.join(", ") || "No answer"}
                        </span>
                        {ans.isCorrect ? (
                          <span className="text-green-500 ml-2">✔ Correct</span>
                        ) : (
                          <>
                            <span className="text-red-500 ml-2">
                              ✘ Incorrect
                            </span>
                            <p className="text-gray-500">
                              Correct Answer: {ans.correctAnswers.join(", ")}
                            </p>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
