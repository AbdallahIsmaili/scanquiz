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
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

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

const DashboardPage: FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [profName, setProfName] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [branch, setBranch] = useState("");

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

  const handlePreviewQuiz = () => {
    if (!questions || questions.length === 0) {
      toast.error("No questions found for the selected quiz.");
      return;
    }

    const quizContainer = document.getElementById("quiz-preview");
    quizContainer.innerHTML = `
    <style>
      .quiz-container {
        padding: 20px;
        font-size: 12px;
      }
      .student-info {
        border: 1px solid #000;
        padding: 10px;
        margin-bottom: 20px;
      }
      .quiz-title {
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        margin: 20px 0;
      }
      .short-answer-box {
        border: 1px solid #000;
        margin-top: 10px;
      }
    </style>
    <div class="quiz-container">
      <div class="student-info">
        <p><strong>Family Name of the Student:</strong> ______________________</p>
        <p><strong>Personal Name:</strong> ______________________</p>
        <p><strong>Class:</strong> ______________________</p>
        <p><strong>Title of the Subject:</strong> ______________________</p>
        <p><strong>CIN:</strong> ______________________</p>
        <p><strong>Note:</strong> ______________________</p>
      </div>
      <div class="quiz-title">${quizTitle}</div>
      <p><strong>School:</strong> ${schoolName}</p>
      <p><strong>Professor:</strong> ${profName}</p>
      <p><strong>Branch/Field of Study:</strong> ${branch}</p>
      ${questions
        .map(
          (question, index) => `
        <div>
          <p><strong>Q${index + 1}:</strong> ${question.question_text}</p>
          ${
            question.question_type === "short-answer"
              ? `
            <div class="short-answer-box" style="height: ${
              question.box_size * 20
            }px;"></div>
          `
              : `
            ${
              question.choices
                ? question.choices
                    .map(
                      (choice) => `
                  <p>${choice.choice_text}</p>
                `
                    )
                    .join("")
                : "<p>No choices available</p>"
            }
          `
          }
        </div>
      `
        )
        .join("")}
    </div>
  `;
  };

  const handleExportQuiz = () => {
    if (!questions || questions.length === 0) {
      toast.error("No questions found for the selected quiz.");
      return;
    }

    const quizContainer = document.getElementById("quiz-preview");
    const pdf = new jsPDF();
    pdf.html(quizContainer, {
      callback: function (doc) {
        doc.save("quiz.pdf");
      },
    });
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
            <Button variant="secondary" onClick={handlePreviewQuiz}>
              Preview
            </Button>
            <Button variant="default" onClick={handleExportQuiz}>
              Export
            </Button>
          </>
        )}
      </div>

      <div id="quiz-preview" className="p-4 border rounded shadow-lg my-4">
        
      </div>
    </>
  );
};

export default DashboardPage;
