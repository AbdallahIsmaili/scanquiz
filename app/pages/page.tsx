"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TypographyH3, TypographyH4 } from "@/components/Typography";
import ClientLayout from "@/components/ClientLayout";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";

const CreateQuizPage: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionType, setQuestionType] = useState<string | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [numChoices, setNumChoices] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page
    if (validateQuiz()) {
      setIsConfirmationDialogOpen(true);
    }
  };

  const addQuestion = (type: string) => {
    setQuestionType(type);
    setIsAlertDialogOpen(true);
  };

  const handleAddMultipleChoiceQuestion = () => {
    const newQuestion = {
      type: "multiple-choice",
      text: "",
      choices: Array.from({ length: numChoices }, () => ({
        text: "",
        isCorrect: false,
      })),
    };
    setQuestions([...questions, newQuestion]);
    setIsAlertDialogOpen(false);
  };

  const handleAddTypingBoxQuestion = (boxSize: string) => {
    const newQuestion = {
      type: "typing-box",
      text: "",
      boxSize,
    };
    setQuestions([...questions, newQuestion]);
    setIsAlertDialogOpen(false);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = value;
    setQuestions(newQuestions);
  };

  const handleChoiceChange = (
    questionIndex: number,
    choiceIndex: number,
    value: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].choices[choiceIndex].text = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerToggle = (
    questionIndex: number,
    choiceIndex: number
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].choices[choiceIndex].isCorrect =
      !newQuestions[questionIndex].choices[choiceIndex].isCorrect;
    setQuestions(newQuestions);
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      toast.error("Quiz title is required");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return false;
      }

      if (isDuplicateQuestion(question, i)) {
        toast.error(`Question ${i + 1} is a duplicate`);
        return false;
      }

      if (question.type === "multiple-choice") {
        const hasCorrectAnswer = question.choices.some(
          (choice) => choice.isCorrect
        );

        if (!hasCorrectAnswer) {
          toast.error(`Question ${i + 1} needs at least one correct answer`);
          return false;
        }

        for (let j = 0; j < question.choices.length; j++) {
          if (!question.choices[j].text.trim()) {
            toast.error(`Question ${i + 1} Choice ${j + 1} text is required`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const isDuplicateQuestion = (newQuestion, index) => {
    return questions.some(
      (question, questionIndex) =>
        questionIndex !== index &&
        question.text.trim().toLowerCase() ===
          newQuestion.text.trim().toLowerCase()
    );
  };

  const handleConfirmSubmit = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Authorization token not found. Please log in again.");
      setIsConfirmationDialogOpen(false);
      return;
    }

    console.log("Token:", token);

    const response = await fetch("http://localhost:3001/save-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, questions }),
    });

    if (response.ok) {
      setIsDialogOpen(true);
      toast.success("Quiz saved successfully!");
      setIsQuizSubmitted(true); // Active le téléchargement du PDF
    } else {
      const errorMessage = await response.text();
      console.error("Error response:", errorMessage);
      toast.error(`Error saving quiz: ${errorMessage}`);
    }
    setIsConfirmationDialogOpen(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: "center" });
    //name
    doc.setFontSize(12);
    doc.setFont("helvetica", "bolditalic");
    doc.text("Student Name: ______________________", 20, 40);

    //questions
    let yOffset = 60;
    questions.forEach((question, index) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Q${index + 1}: ${question.text}`, 20, yOffset);
      yOffset += 10;

      if (question.type === "multiple-choice") {
        question.choices.forEach((choice: any, choiceIndex: number) => {
          doc.text(`   ${choiceIndex + 1}. ${choice.text}`, 30, yOffset);
          yOffset += 6;
        });
      } else if (question.type === "typing-box") {
        doc.text(
          "   Answer: _____________________________________________________________",
          30,
          yOffset
        );
        yOffset += 12;
      }
      yOffset += 5;
    });

    // Save the PDF
    doc.save(`${title}.pdf`);
    setTitle("");
    setQuestions([]);
    setIsQuizSubmitted(false);
  };

  return (
    <ClientLayout>
      <section className="hero mt-16">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mx-auto text-center mt-28 mb-12">
          Let's start creating your Quiz
        </h1>

        <div className="grid grid-cols-3 gap-3">
          <Card className="col-span-2">
            <CardHeader>
              <TypographyH3>Create Your Quiz</TypographyH3>
            </CardHeader>
            <CardContent>
              <Input
                label="Quiz Title"
                placeholder="Enter Quiz Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-4"
              />
              {questions.map((question, index) => (
                <div key={index} className="mb-4">
                  {question.type === "multiple-choice" && (
                    <>
                      <hr className="my-2" />
                      <TypographyH4> {`Question ${index + 1}`} </TypographyH4>
                      <br />
                      <Input
                        label={`Question ${index + 1}`}
                        placeholder={`Enter Question ${index + 1}`}
                        value={question.text}
                        onChange={(e) =>
                          handleQuestionChange(index, e.target.value)
                        }
                      />
                      {question.choices.map(
                        (choice: any, choiceIndex: number) => (
                          <div
                            key={choiceIndex}
                            className="flex items-center mt-2"
                          >
                            <Input
                              placeholder={`Choice ${choiceIndex + 1}`}
                              value={choice.text}
                              onChange={(e) =>
                                handleChoiceChange(
                                  index,
                                  choiceIndex,
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            <Checkbox
                              checked={choice.isCorrect}
                              onCheckedChange={() =>
                                handleCorrectAnswerToggle(index, choiceIndex)
                              }
                              className="ml-2"
                            />
                          </div>
                        )
                      )}
                    </>
                  )}
                  {question.type === "typing-box" && (
                    <Input
                      label={`Question ${index + 1}`}
                      placeholder={`Enter Question ${index + 1}`}
                      value={question.text}
                      onChange={(e) =>
                        handleQuestionChange(index, e.target.value)
                      }
                      className="mt-2"
                    />
                  )}
                </div>
              ))}
              <div className="mt-4">
                <AlertDialog
                  open={isAlertDialogOpen}
                  onOpenChange={setIsAlertDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => addQuestion("multiple-choice")}
                    >
                      Add Multiple Choice Question
                    </Button>
                  </AlertDialogTrigger>
                  <span>&nbsp;</span>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="secondary"
                      onClick={() => addQuestion("typing-box")}
                    >
                      Add Typing Box Question
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {questionType === "multiple-choice"
                          ? "Number of Choices"
                          : "Box Size"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {questionType === "multiple-choice" ? (
                          <Input
                            type="number"
                            placeholder="Enter number of choices"
                            onChange={(e) =>
                              setNumChoices(Number(e.target.value))
                            }
                            className="mt-2"
                          />
                        ) : (
                          <Input
                            placeholder="Enter box size"
                            onChange={(e) =>
                              handleAddTypingBoxQuestion(e.target.value)
                            }
                            className="mt-2"
                          />
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <Button
                        variant="default"
                        onClick={() => setIsAlertDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      {questionType === "multiple-choice" ? (
                        <Button
                          variant="success"
                          onClick={handleAddMultipleChoiceQuestion}
                        >
                          Confirm
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          onClick={() => setIsAlertDialogOpen(false)}
                        >
                          Confirm
                        </Button>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <div className="text-center">
                <TypographyH3>{title}</TypographyH3>
              </div>
            </CardHeader>
            <CardContent>
              {!title || questions.length === 0 ? (
                <p className="text-center text-gray-500">
                  {title
                    ? "No questions available. Please add some questions."
                    : "Please enter a quiz title."}
                </p>
              ) : (
                questions.map((question, index) => (
                  <div key={index}>
                    <p>
                      Q{index + 1}: {question.text}
                    </p>
                  </div>
                ))
              )}
              <br></br>
              <div className=" mt-4 justify-center  ">
                <Button variant="outline" onClick={handleSubmitQuiz}>
                  Submit Quiz
                </Button>
                <span>&nbsp;</span>
                <Button
                  variant="outline"
                  onClick={generatePDF}
                  disabled={!isQuizSubmitted}
                >
                  Download as PDF
                </Button>
              </div>
              <AlertDialog
                open={isConfirmationDialogOpen}
                onOpenChange={setIsConfirmationDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to submit the quiz?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button
                      variant="default"
                      onClick={() => setIsConfirmationDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="success" onClick={handleConfirmSubmit}>
                      Confirm
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Quiz Submitted</AlertDialogTitle>
              <AlertDialogDescription>
                Your quiz has been submitted successfully.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="default" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </ClientLayout>
  );
};

export default CreateQuizPage;
