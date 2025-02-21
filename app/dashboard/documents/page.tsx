"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/ui/file-upload"; // Custom file upload component

interface Quiz {
  id: string;
  title: string;
  exam_id: string;
  questions: Array<{
    id: string;
    question_text: string;
    choices: Array<{
      id: string;
      choice_text: string;
      is_correct: boolean;
    }>;
  }>;
}

export default function Dashboard() {
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizDetails, setSelectedQuizDetails] = useState<Quiz | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(true);
  const router = useRouter();

  // Fetch quizzes created by the user
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/quizzes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        } else {
          toast.error("Failed to fetch quizzes.");
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("An error occurred while fetching quizzes.");
      } finally {
        setIsFetchingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Fetch quiz details when a quiz is selected
  useEffect(() => {
    if (selectedQuiz) {
      const fetchQuizDetails = async () => {
        try {
          const quizResponse = await fetch(
            `http://localhost:3001/api/quizzes/${selectedQuiz}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (!quizResponse.ok) {
            throw new Error("Failed to fetch quiz metadata.");
          }

          const quizData = await quizResponse.json();

          const questionsResponse = await fetch(
            `http://localhost:3001/api/quizzes/${selectedQuiz}/questions`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (!questionsResponse.ok) {
            throw new Error("Failed to fetch quiz questions.");
          }

          const questionsData = await questionsResponse.json();

          setSelectedQuizDetails({
            ...quizData,
            questions: questionsData,
          });
        } catch (error) {
          console.error("Error fetching quiz details:", error);
          toast.error("An error occurred while fetching quiz details.");
        }
      };

      fetchQuizDetails();
    }
  }, [selectedQuiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuiz || !file) {
      toast.error("Please select a quiz and upload a file.");
      return;
    }

    setIsConfirmationOpen(true);
  };

  const handleConfirmation = async () => {
    setIsConfirmationOpen(false);
    setLoading(true);
    toast.loading("Generating answer sheets...");

    const selectedQuizId = Number(selectedQuiz);
    const selectedQuizDetails = quizzes.find(
      (quiz) => quiz.id === selectedQuizId
    );

    if (!selectedQuizDetails) {
      toast.error("Failed to find selected quiz details.");
      setLoading(false);
      toast.dismiss();
      return;
    }

    const exam_id = selectedQuizDetails.exam_id || "UNKNOWN";

    const formData = new FormData();
    formData.append("quizId", selectedQuiz);
    formData.append("file", file);
    formData.append("exam_id", exam_id);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/generate-sheets", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student_sheets_merged.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Answer sheets generated successfully!");
      } else {
        toast.error("Failed to generate sheets.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  const selectedQuizTitle =
    quizzes.find((quiz) => quiz.id === selectedQuiz)?.title ||
    "-- Select a Quiz --";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="quiz">Select Quiz:</Label>
          <Select
            onValueChange={(value) => setSelectedQuiz(value)}
            value={selectedQuiz}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectedQuizTitle} />
            </SelectTrigger>
            <SelectContent>
              {isFetchingQuizzes ? (
                <Skeleton className="h-10 w-full" />
              ) : quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.title} (Exam ID: {quiz.exam_id || "N/A"})
                  </SelectItem>
                ))
              ) : (
                <p className="text-sm text-gray-500">No quizzes available.</p>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedQuizDetails && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedQuizDetails.title}</CardTitle>
              <CardDescription>
                Exam ID: {selectedQuizDetails.exam_id || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Number of Questions: {selectedQuizDetails.questions.length}</p>
              <Button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                className="mt-4"
              >
                View Questions
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <Label htmlFor="file">Upload Student Excel File:</Label>
          <FileUpload
            id="file"
            accept=".xlsx, .xls"
            onFileChange={(file) => setFile(file)}
          />
          {file && (
            <p className="text-sm text-gray-500 mt-2">
              Selected file: {file.name}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading || !selectedQuiz || !file}>
          {loading ? "Generating..." : "Generate Sheets"}
        </Button>
      </form>

      {/* Questions Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Questions and Options</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {selectedQuizDetails?.questions.map((question) => (
                  <div key={question.id} className="mb-4">
                    <p className="font-semibold">{question.question_text}</p>
                    <ul className="list-disc pl-5">
                      {question.choices.map((choice) => (
                        <li key={choice.id}>
                          {choice.choice_text}{" "}
                          {choice.is_correct && "(Correct)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate answer sheets for the selected quiz. Please
              confirm to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmation}>Confirm</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
