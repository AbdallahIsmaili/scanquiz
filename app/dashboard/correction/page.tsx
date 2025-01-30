"use client";

import { FC, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Quiz {
  id: number;
  title: string;
  user_id: number;
}

interface Choice {
  id: number;
  question_id: number;
  choice_text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: string;
  box_size: string | null;
  choices: Choice[];
}

const ExportationPage: FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [profName, setProfName] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [generalInfo, setGeneralInfo] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/quizzes", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setQuizzes(data))
      .catch((err) => setError(err.message));
  }, []);

  const fetchQuizData = async (
    url: string,
    setData: (data: any) => void,
    setError: (error: string) => void
  ) => {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setData(data);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  useEffect(() => {
    if (selectedQuiz) {
      const url = `http://localhost:3001/api/quizzes/${selectedQuiz}/questions`;
      fetchQuizData(url, setQuestions, setError);
    }
  }, [selectedQuiz]);

  const handleSelectChange = (value: string) => {
    setSelectedQuiz(value);
  };

  
const renderQuizPreview = () => {
  if (!questions || questions.length === 0) {
    toast.error("No questions found for the selected quiz.");
    return;
  }

  const quizContainer = document.getElementById("quiz-preview");
  quizContainer.innerHTML = `
    <div class="max-w-3xl mx-auto bg-white  mb-6">
      <!-- Student & Exam Info -->
      <div class="border-b pb-4 mb-6">
        <div class="text-gray-700 text-center mb-4">
          <p class="text-xl font-bold">${schoolName}</p>
          <p class="text-lg"><strong>Professor:</strong> ${profName}</p>
          <p class="text-lg"><strong>Branch/Field of Study:</strong> ${branch}</p>
        </div>

        <h2 class="mt-4 text-xl font-semibold text-gray-700 text-center">Student Information</h2>
        <div class="border-2 border-black rounded-sm grid grid-cols-2 gap-4 text-gray-600 p-4 mt-2">
          <p><strong>Family Name:</strong> <span class="border-b border-gray-400 w-full inline-block"></span></p>
          <p><strong>Personal Name:</strong> <span class="border-b border-gray-400 w-full inline-block"></span></p>
          <p><strong>Class:</strong> <span class="border-b border-gray-400 w-full inline-block"></span></p>
          <p><strong>Title of the Subject:</strong> <span class="border-b border-gray-400 w-full inline-block"></span></p>
          <p><strong>CIN:</strong> <span class="border-b border-gray-400 w-full inline-block"></span></p>
        </div>
        <p class="mt-4"><strong>Note:</strong> <span class="border-b border-gray-400 w-full inline-block"></span></p>
      </div>

      <!-- General Information (Exam Rules) -->
      <div class="h-[500px]  rounded-md bg-gray-50 p-6 mt-6">
        <h2 class="text-lg font-semibold text-gray-800">General Information & Exam Rules</h2>
        <p class="mt-2 text-gray-700">${generalInfo || "No rules provided."}</p>
      </div>
    </div>
    
    <div class="max-w-3xl mx-auto bg-white p-8 shadow-md rounded-lg  mt-4 mb-6">
      <!-- Page Break -->
      <div style="page-break-before: always;"></div>

      <!-- Quiz Title -->
      <h1 class="text-3xl font-bold text-center text-black mt-8">${quizTitle}</h1>

      <!-- Questions Section -->
      <div class="mt-6 space-y-6">
        ${questions
          .map(
            (question, index) => `
              <div>
                <p class="font-semibold text-gray-800"><span class="text-black">Q${
                  index + 1
                }:</span> ${question.question_text}</p>
                ${
                  question.question_type === "short-answer"
                    ? `<div class="mt-3 h-24 border border-gray-400 rounded-md"></div>`
                    : `<div class="mt-3 space-y-2">
                        ${
                          question.choices?.length > 0
                            ? question.choices
                                .map(
                                  (choice, i) => `
                                  <div class="flex items-center">
                                    <label class="ml-2 text-gray-700">${String.fromCharCode(
                                      65 + i
                                    )}. ${choice.choice_text}</label>
                                  </div>`
                                )
                                .join("")
                            : `<p class="text-red-500 italic">No choices available</p>`
                        }
                      </div>`
                }
              </div>
            `
          )
          .join("")}
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-gray-600 text-sm">
        <p><strong>End of Quiz</strong></p>
      </div>
    </div>
    
    <div class="max-w-3xl mx-auto bg-white p-8 shadow-md rounded-lg mt-4 mb-6" style="page-break-before: always;">

      <!-- Page Break -->
      <div style="page-break-before: always;"></div>

      <!-- Student & Exam Info -->
      <div class="border-t mt-8 pt-4">
        <h2 class="text-xl font-semibold text-gray-700 text-center">Student & Exam Information</h2>
        <p class="text-center"><strong>School:</strong> ${schoolName}</p>
        <p class="text-center"><strong>Professor:</strong> ${profName}</p>
        <p class="text-center"><strong>Branch/Field of Study:</strong> ${branch}</p>
        <p class="text-center"><strong>Student Name:</strong> ____________________</p>
        <p class="text-center"><strong>CIN:</strong> ____________________</p>
      </div>

      <!-- Answers Section -->
      <h2 class="text-2xl font-bold text-center text-black mt-8">Answer Sheet</h2>
      <div class="mt-6">
        <table class="table-auto w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-gray-200">
              <th class="px-2 py-1 border">Question</th>
              <th class="px-2 py-1 border">A</th>
              <th class="px-2 py-1 border">B</th>
              <th class="px-2 py-1 border">C</th>
              <th class="px-2 py-1 border">D</th>
            </tr>
          </thead>
          <tbody>
            ${questions
              .map(
                (question, index) => `
                  <tr>
                    <td class="px-2 py-1 border">Q${index + 1}</td>
                    ${
                      question.question_type === "short-answer"
                        ? `<td colspan="4" class="px-2 py-1 border"></td>`
                        : Array(4)
                            .fill("")
                            .map((_, i) => `<td class="px-2 py-1 border"></td>`)
                            .join("")
                    }
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

const exportQuizToPDF = () => {
  const quizContainer = document.getElementById("quiz-preview");

  if (!quizContainer.innerHTML.trim()) {
    toast.error("Please preview the quiz before exporting.");
    return;
  }

  // Use more precise page breaks for each section
  const options = {
    pagesplit: true,
  };

  html2canvas(quizContainer, { scale: 2 })
    .then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 10;
      let heightLeft = imgHeight;

      // Split Content into Pages with Page Break
      pdf.addImage(
        imgData,
        "PNG",
        10,
        yPosition,
        imgWidth,
        imgHeight,
        "",
        "FAST",
        options
      );
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        yPosition -= pageHeight - 20;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          10,
          yPosition,
          imgWidth,
          imgHeight,
          "",
          "FAST",
          options
        );
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`${quizTitle.replace(/\s+/g, "_")}_Exam.pdf`);
    })
    .catch((err) => {
      console.error("Error exporting quiz:", err);
      toast.error("Failed to export the quiz.");
    });
};

const handlePreviewQuiz = () => {
  renderQuizPreview();
};

const handleExportQuiz = () => {
  renderQuizPreview();
  exportQuizToPDF();
};



  // Function to format text
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <>
      <div className="flex justify-between items-center gap-4 mx-auto text-left my-4">
        <Select onValueChange={handleSelectChange}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a QCM" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>QCM Exams</SelectLabel>
              {quizzes.map((quiz) => (
                <SelectItem key={quiz.id} value={quiz.id.toString()}>
                  {quiz.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {selectedQuiz && (
          <>
            <Input
              type="text"
              placeholder="School Name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Professor's Name"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Quiz Title"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Branch/Field of Study"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />

            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              Add Rules
            </Button>
            <Button variant="secondary" onClick={handlePreviewQuiz}>
              Preview
            </Button>
            <Button variant="default" onClick={handleExportQuiz}>
              Export
            </Button>
          </>
        )}
      </div>

      <div
        id="quiz-preview"
        className="p-4 rounded shadow-lg my-4"
      ></div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="w-3/4 h-3/4">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Quiz Rules</AlertDialogTitle>
            <AlertDialogDescription>
              Use the editor below to add the rules for the quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex mb-4">
            <button onClick={() => formatText("bold")} className="mr-2">
              Bold
            </button>
            <button onClick={() => formatText("underline")} className="mr-2">
              Underline
            </button>
            <button onClick={() => formatText("italic")} className="mr-2">
              Italic
            </button>
          </div>
          <div
            className="w-full h-64 border border-gray-300 rounded-lg p-2 overflow-y-auto"
            contentEditable
            onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
          ></div>
          <AlertDialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            <Button
              onClick={() => {
                handlePreviewQuiz();
                setGeneralInfo(editorContent);
                setIsDialogOpen(false);
              }}
              className="ml-2"
            >
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExportationPage;
