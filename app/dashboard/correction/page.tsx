"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TypographyH2 } from "@/components/Typography";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [maxScore, setMaxScore] = useState<number>(20);
  const [error, setError] = useState(0);

  // Function to update scores based on maxScore change
  const updateScoresWithMaxScore = () => {
    if (!results || !results.gradedResults) return;

    const updatedResults = results.gradedResults.map((student) => {
      const totalCorrect = student.answers.filter(
        (ans) => ans.isCorrect
      ).length;
      const totalQuestions = student.answers.length;
      const updatedScore = ((totalCorrect / totalQuestions) * maxScore).toFixed(
        2
      );

      return { ...student, score: updatedScore };
    });

    setResults((prevResults) => ({
      ...prevResults,
      gradedResults: updatedResults,
    }));
  };

  // Recalculate scores when maxScore changes
  useEffect(() => {
    updateScoresWithMaxScore();
  }, [maxScore]);

   useEffect(() => {
     switch (error) {
       case 1:
         toast.error("Exam not found. Please check the exam ID and try again.");
         break;
       case 2:
         toast.error("Server error. Please try again later.");
         break;
       case 3:
         toast.error("Failed to fetch exam data.");
         break;
       case 4:
         toast.error("An unexpected error occurred. Please try again.");
         break;
       default:
         break;
     }

     // Reset the error state after showing the toast
     if (error !== 0) {
       setError(0);
     }
   }, [error]);


  axios.interceptors.response.use(
    (response) => response, // Success case: pass through
    (error) => {
      // Handle the error silently
      if (error.response?.status === 404) {
        // You can optionally log the error internally (e.g., for debugging)
        console.log("Exam not found (404). Error handled silently.");
      } else {
        // Log other errors (optional)
        console.error("Axios error:", error);
      }
      return Promise.reject(error); // Reject the promise to propagate the error
    }
  );

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

  const handleUpload = async () => {
    // Check if files are selected
    if (!files || files.length === 0) {
      toast.error("Please select files to upload.");
      return;
    }

    // Set loading state and show loading toast
    setLoading(true);
    toast.loading("Uploading files...");

    // Prepare form data for the upload
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      // Step 1: Upload files and process OMR data
      const response = await axios.post("/api/process-omr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Response data:", response.data);

      // Check if the response contains valid exam data
      if (
        !response.data.extractedData[0]?.exam_info ||
        !response.data.extractedData[0].exam_info.exam_id
      ) {
        throw new Error("exam_id not found in response data.");
      }

      // Step 2: Fetch exam information using the exam_id
      const examId = response.data.extractedData[0].exam_info.exam_id;
      const examData = await fetchExamInfo(examId);

      // If exam data is not found, stop further processing
      if (!examData) {
        return;
      }

      // Step 3: Extract and format student answers
      const studentAnswers = response.data.extractedData.map((student) => {
        // Convert checked_options from object to array format
        const checkedOptionsArray = Object.entries(student.checked_options).map(
          ([key, value]) => ({
            question: parseInt(key.replace("Q", ""), 10), // Extract question number
            selectedChoices: [value], // Convert to array for comparison
          })
        );

        return {
          student_info: student.student_info,
          checked_options: checkedOptionsArray, // Now in array format
        };
      });

      // Step 4: Compare student answers with correct answers and calculate scores
      const gradedResults = studentAnswers.map((student) => {
        const comparedAnswers = student.checked_options.map((studentAns) => {
          const correctQuestion = examData.questions.find(
            (q, i) => i + 1 === studentAns.question // Match question ID
          );

          if (!correctQuestion) {
            return { ...studentAns, isCorrect: false, correctAnswers: [] };
          }

          // Find the correct answers for the question
          const correctChoices = correctQuestion.choices
            .filter((c) => c.is_correct) // Get only correct answers
            .map((c) => c.choice_text); // Extract choice text

          // Convert student's selected choices (A, B, C, D) to actual text
          const studentSelected = studentAns.selectedChoices
            ? studentAns.selectedChoices.map((letter) => {
                const choiceIndex = letter.charCodeAt(0) - 65; // Convert A, B, C, D → Index
                return (
                  correctQuestion.choices[choiceIndex]?.choice_text || letter
                ); // Match choice text
              })
            : [];

          // Check if the student's answers match the correct answers
          const isCorrect =
            studentSelected.length === correctChoices.length &&
            studentSelected.every((choice) => correctChoices.includes(choice));

          return {
            ...studentAns,
            isCorrect,
            correctAnswers: correctChoices, // Store correct answers
          };
        });

        // Calculate the student's score
        const totalCorrect = comparedAnswers.filter(
          (ans) => ans.isCorrect
        ).length;
        const totalQuestions = comparedAnswers.length;
        const score = ((totalCorrect / totalQuestions) * maxScore).toFixed(2); // Round to 2 decimal places

        return {
          student_info: student.student_info,
          answers: comparedAnswers,
          score: score, // Store the calculated score
        };
      });

      // Step 5: Update the state with the results
      setResults({
        extractedData: response.data.extractedData,
        examData,
        gradedResults, // Store graded answers
      });

      // Show success toast
      toast.success("Files uploaded and processed successfully!");
    } catch (error) {
      console.error("Error uploading files:", error);

      // Only show a generic error if the error is not already handled by fetchExamInfo
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        toast.error("Failed to upload files.");
      }
    } finally {
      // Reset loading state and dismiss the loading toast
      setLoading(false);
      toast.dismiss();
    }
  };

  axios.interceptors.response.use(
    (response) => response, // Success case: pass through
    (error) => {
      if (error.response?.status === 404) {
        console.log("Exam not found (404). Error handled silently.");
      } else {
        console.error("Axios error:", error);
      }
      return Promise.reject(error);
    }
  );

  const fetchExamInfo = async (examId) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/exam-info/${examId}`
      );
      toast.success("Exam data fetched successfully!");
      return response.data;
    } catch (error) {

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setError(1);
        } else if (error.response?.status === 500) {
          setError(2);
        } else {
          setError(3);
        }
      } else {
        setError(4);
      }

      return null;
    }
  };

  const handleSaveResults = async () => {
    if (!results || !results.gradedResults) {
      toast.error("No results to save!");
      return;
    }

    try {
      await axios.post("http://localhost:3001/api/save-results", {
        examId: results.examData.exam_info.exam_id,
        students: results.gradedResults,
      });

      toast.success("Results saved successfully!");
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error("Failed to save results.");
    }
  };

  const handleExportToExcel = () => {
    if (!results || !results.gradedResults) {
      toast.error("No results to export!");
      return;
    }

    const examInfo = results.examData.exam_info;
    const worksheetData = [];

    // Add Exam Title & ID only once at the top
    worksheetData.push(["Exam Title:", examInfo?.title || "N/A"]);
    worksheetData.push(["Exam ID:", examInfo?.exam_id || "N/A"]);
    worksheetData.push([]); // Empty row for spacing

    // Filter out duplicate students based on CIN
    const uniqueStudents = results.gradedResults.filter(
      (student, index, self) => {
        const firstIndex = self.findIndex(
          (s) => s.student_info?.CIN === student.student_info?.CIN
        );
        return index === firstIndex; // Keep only the first occurrence
      }
    );

    uniqueStudents.forEach((student) => {
      // Add Student Information
      worksheetData.push(["Student Name", "CIN", "Class", "Score"]);
      worksheetData.push([
        student.student_info?.Name || "N/A",
        student.student_info?.CIN || "N/A",
        student.student_info?.Class || "N/A",
        student.score,
      ]);
      worksheetData.push([]); // Empty row
      worksheetData.push([]); // Empty row

      // Add Question Details
      worksheetData.push([
        "Question",
        "Chosen Options",
        "Correct Options",
        "Is Correct",
      ]);
      student.answers.forEach((answer) => {
        worksheetData.push([
          `Q${answer.question}`,
          answer.selectedChoices.join(", ") || "No Answer",
          answer.correctAnswers.join(", "),
          answer.isCorrect ? "✅" : "❌",
        ]);
      });

      worksheetData.push([]); // Space before next student
    });

    // Create Excel Sheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Results");

    // Apply Styles
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } }, // Blue background
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const dataStyle = {
      font: { bold: false, color: { rgb: "000000" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          if (row === 0 || row === 1 || row === 4 || row === 7) {
            worksheet[cellRef].s = headerStyle;
          } else {
            worksheet[cellRef].s = dataStyle;
          }
        }
      }
    }

    // Auto-fit columns for better readability
    worksheet["!cols"] = [
      { wch: 20 }, // Exam Title
      { wch: 15 }, // Exam ID
      { wch: 25 }, // Student Name
      { wch: 15 }, // CIN
      { wch: 10 }, // Class
      { wch: 10 }, // Score
      { wch: 20 }, // Question
      { wch: 20 }, // Chosen Options
      { wch: 20 }, // Correct Options
      { wch: 10 }, // Is Correct
    ];

    // Download Excel File
    XLSX.writeFile(workbook, `exam_results_${examInfo?.exam_id || "N/A"}.xlsx`);
    toast.success("Results exported to Excel!");
  };

  const handleExportStudentInfo = () => {
    if (!results || !results.gradedResults) {
      toast.error("No results to export!");
      return;
    }

    const examInfo = results.examData.exam_info;

    // Filter out duplicate students based on CIN
    const uniqueStudents = results.gradedResults.filter(
      (student, index, self) => {
        const firstIndex = self.findIndex(
          (s) => s.student_info?.CIN === student.student_info?.CIN
        );
        return index === firstIndex; // Keep only the first occurrence
      }
    );

    // Table headers
    const worksheetData = [
      ["Exam Title", "Exam ID", "Student Name", "CIN", "Class", "Score"],
    ];

    // Add student data (each student on a single line)
    uniqueStudents.forEach((student) => {
      worksheetData.push([
        examInfo?.title || "N/A",
        examInfo?.exam_id || "N/A",
        student.student_info?.Name || "N/A",
        student.student_info?.CIN || "N/A",
        student.student_info?.Class || "N/A",
        student.score,
      ]);
    });

    // Create worksheet and apply styles
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Style headers (bold & background color)
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } }, // Blue background
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    // Style data rows
    const dataStyle = {
      font: { bold: false, color: { rgb: "000000" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    // Apply header style
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle;
      }
    }

    // Apply data style
    for (let row = 1; row <= uniqueStudents.length; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = dataStyle;
        }
      }
    }

    // Auto-fit columns for better readability
    worksheet["!cols"] = [
      { wch: 20 }, // Exam Title
      { wch: 15 }, // Exam ID
      { wch: 25 }, // Student Name
      { wch: 15 }, // CIN
      { wch: 10 }, // Class
      { wch: 10 }, // Score
    ];

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Info");

    // Download Excel File
    XLSX.writeFile(workbook, `student_info_${examInfo?.exam_id || "N/A"}.xlsx`);
    toast.success("Styled Student Info exported!");
  };


  return (
    <div className="flex justify-center min-h-screen p-6 bg-gray-50">
      <Card className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">
            Upload MCQ Answer Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* File Upload Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <Label
                htmlFor="file-upload"
                className="text-gray-700 font-medium md:col-span-3"
              >
                Choose Files
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                className="md:col-span-7 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf,.zip,.rar"
              />
              <Button
                onClick={handleUpload}
                disabled={loading}
                className="w-full md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {/* Max Score Input */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <Label
                htmlFor="max-score"
                className="text-gray-700 font-medium md:col-span-3"
              >
                Max Score
              </Label>
              <Input
                id="max-score"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="md:col-span-7 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                min="1"
              />
            </div>
          </div>

          {/* Exam Information */}
          {results?.examData && (
            <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
              <TypographyH2 className="text-blue-800">
                Exam Information
              </TypographyH2>
              <div className="mt-4 space-y-2 text-gray-700">
                <p>
                  <strong>Exam Title:</strong>{" "}
                  {results.examData.exam_info.title || "N/A"}
                </p>
                <p>
                  <strong>Exam ID:</strong>{" "}
                  {results.examData.exam_info.exam_id || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* Student Results */}
          {results?.gradedResults && (
            <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <TypographyH2 className="text-gray-800">
                Student Results
              </TypographyH2>
              <div className="mt-6 space-y-6">
                {results.gradedResults
                  .filter((student, index, self) => {
                    // Filter out duplicates based on student CIN (or another unique identifier)
                    const firstIndex = self.findIndex(
                      (s) => s.student_info?.CIN === student.student_info?.CIN
                    );
                    return index === firstIndex; // Keep only the first occurrence
                  })
                  .map((student, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <h3 className="text-xl font-semibold text-blue-600">
                        Student {index + 1}
                      </h3>
                      <div className="mt-4 space-y-2 text-gray-700">
                        <p>
                          <strong>Full Name:</strong>{" "}
                          {student.student_info?.Name || "N/A"}
                        </p>
                        <p>
                          <strong>Class:</strong>{" "}
                          {student.student_info?.Class || "N/A"}
                        </p>
                        <p>
                          <strong>CIN:</strong>{" "}
                          {student.student_info?.CIN || "N/A"}
                        </p>
                        <p>
                          <strong>Score:</strong>{" "}
                          <span className="font-semibold text-green-600">
                            {student.score} / {maxScore}
                          </span>
                        </p>
                      </div>

                      <h3 className="mt-6 text-lg font-semibold text-gray-700">
                        Answers:
                      </h3>
                      <ul className="mt-4 space-y-4">
                        {student.answers.map((ans, i) => (
                          <li
                            key={i}
                            className="p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <p>
                              <strong>Q{ans.question}:</strong>{" "}
                              <span
                                className={
                                  ans.isCorrect
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {ans.selectedChoices.join(", ") || "No answer"}
                              </span>
                            </p>
                            {ans.isCorrect ? (
                              <p className="text-green-500 mt-2">✔ Correct</p>
                            ) : (
                              <div className="mt-2">
                                <p className="text-red-500">✘ Incorrect</p>
                                <p className="text-gray-500">
                                  <strong>Correct Answer:</strong>{" "}
                                  {ans.correctAnswers.join(", ")}
                                </p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                            View Answers
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Answers for{" "}
                              {student.student_info?.Name || "Student"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Review the student's answers along with the
                              correct ones.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="max-h-80 overflow-y-auto space-y-4 p-2">
                            {student.answers.map((ans, i) => (
                              <div
                                key={i}
                                className="p-4 bg-gray-100 rounded-lg border border-gray-200"
                              >
                                <p>
                                  <strong>Q{i + 1}:</strong> {ans.question}
                                </p>
                                <p
                                  className={
                                    ans.isCorrect
                                      ? "text-green-600 font-medium"
                                      : "text-red-600 font-medium"
                                  }
                                >
                                  <strong>Student's Answer:</strong>{" "}
                                  {ans.selectedChoices?.join(", ") ||
                                    "No answer"}
                                </p>
                                {!ans.isCorrect && (
                                  <p className="text-gray-500">
                                    <strong>Correct Answer:</strong>{" "}
                                    {ans.correctAnswers?.join(", ")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Close</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* New Card for Exam Title, Exam ID, and Statistics Link */}
          {results?.examData && (
            <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {results.examData.exam_info.title || "N/A"}
                  </h2>
                  <p className="text-sm text-blue-100">
                    Exam ID: {results.examData.exam_info.exam_id || "N/A"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    // Navigate to the statistics page for this exam
                    // Replace this with your actual navigation logic
                    console.log(
                      "Navigating to statistics page for exam:",
                      results.examData.exam_info.exam_id
                    );
                  }}
                  className="flex items-center bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  <span>Save and View Statistics</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Buttons for Save and Export */}
          {results?.gradedResults && results.gradedResults.length > 0 && (
            <div className="flex space-x-4 mt-6">
              <Button
                onClick={handleSaveResults}
                className="bg-green-600 text-white"
              >
                Save Results
              </Button>

              <Button
                onClick={handleExportToExcel}
                className="bg-blue-600 text-white"
              >
                Export Full Report (With Questions)
              </Button>

              <Button
                onClick={handleExportStudentInfo}
                className="bg-yellow-600 text-white"
              >
                Export Student Info Only
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
