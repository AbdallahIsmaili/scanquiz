"use client";

import React, { useEffect, useState } from "react";
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
import { Trash } from "lucide-react";
import JSZip from "jszip";
// Ajoutez ces imports shadcn/ui supplémentaires
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [previewData, setPreviewData] = useState<{
    quizBlob: Blob | null;
    answerBlob: Blob | null;
    quizUrl: string | null;
    answerUrl: string | null;
  }>({
    quizBlob: null,
    answerBlob: null,
    quizUrl: null,
    answerUrl: null,
  });
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleDelete = (id) => {
    setQuestions(questions.filter((question) => question.id !== id));
  };
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
  const handlePreviewPDF = async () => {
    try {
      const { quizBlob, answerBlob } = await generatePDFs();
      setPreviewData({
        quizBlob,
        answerBlob,
        quizUrl: URL.createObjectURL(quizBlob),
        answerUrl: URL.createObjectURL(answerBlob),
      });
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (previewData.quizUrl) URL.revokeObjectURL(previewData.quizUrl);
      if (previewData.answerUrl) URL.revokeObjectURL(previewData.answerUrl);
    };
  }, [previewData]);

  const generatePDFs = async () => {
    try {
      const zip = new JSZip();

      // Création du document principal (Quiz)
      const quizDoc = new jsPDF();

      // En-tête du Quiz
      quizDoc.setFontSize(16);
      quizDoc.setFont("helvetica", "bold");
      quizDoc.text(title, 105, 20, { align: "center" });

      // Section Informations Étudiant
      quizDoc.setFontSize(11);
      quizDoc.setFont("helvetica", "bold");
      const studentFields = [
        { label: "Nom: ______________________", x: 20, y: 40 },
        { label: "Prénom: ____________________", x: 20, y: 48 },
        { label: "CIN: ______________________", x: 110, y: 40 },
        { label: "Classe: ____________________", x: 110, y: 48 },
      ];

      studentFields.forEach((field) => {
        quizDoc.text(field.label, field.x, field.y);
      });
      // Ligne de séparation
      quizDoc.setLineWidth(0.5);
      quizDoc.line(15, 58, 195, 58);

      // Configuration des questions
      let yOffset = 65;
      const pageWidth = 180;
      const margin = 20;

      questions.forEach((question, index) => {
        if (yOffset > 270) {
          quizDoc.addPage();
          yOffset = 30;
        }

        // Gestion du préfixe "Q1:"
        quizDoc.setFontSize(12);
        quizDoc.setFont("helvetica", "bold");
        const questionPrefix = `Q${index + 1}: `;
        const prefixWidth = quizDoc.getTextWidth(questionPrefix);

        // Affichage du préfixe
        quizDoc.text(questionPrefix, margin, yOffset);

        // Découpage et justification du texte
        const availableWidth = pageWidth - prefixWidth - 5;
        const questionLines = quizDoc.splitTextToSize(
          question.text,
          availableWidth
        );

        quizDoc.setFont("helvetica", "normal");
        questionLines.forEach((line: string, i: number) => {
          const xPosition = margin + prefixWidth + 2;
          quizDoc.text(line, xPosition, yOffset + i * 5, {
            maxWidth: availableWidth,
            align: "justify",
          });
        });

        yOffset += 3 * questionLines.length;

        // Réponses
        if (question.type === "multiple-choice") {
          quizDoc.setFontSize(11);
          question.choices.forEach((choice: any, choiceIndex: number) => {
            const prefix = `${String.fromCharCode(65 + choiceIndex)}. `;
            const choiceLines = quizDoc.splitTextToSize(
              prefix + choice.text,
              pageWidth - 20
            );

            choiceLines.forEach((line: string, i: number) => {
              quizDoc.text(line, margin + 15, yOffset + 5 + i * 5);
            });

            yOffset += 5 + choiceLines.length * 5;
          });
        } else if (question.type === "typing-box") {
          const boxSize = parseInt(question.boxSize) || 1;
          const lineYStart = yOffset + 4;

          for (let i = 0; i < boxSize; i++) {
            quizDoc.setLineWidth(0.1);
            quizDoc.line(
              margin + 10,
              lineYStart + i * 12,
              margin + pageWidth - 10,
              lineYStart + i * 12
            );
            yOffset += 12;
          }
        }

        yOffset += 15;
      });

      // Footer
      const pageCount = quizDoc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        quizDoc.setPage(i);
        quizDoc.text(`Page ${i} / ${pageCount}`, 105, 285, { align: "center" });
      }

      // Feuille de réponses améliorée
      const answerSheet = new jsPDF();

      // En-tête centré
      answerSheet.setFontSize(16);
      answerSheet.setFont("helvetica", "bold");
      answerSheet.text(title, 105, 20, { align: "center" });
      answerSheet.text("FEUILLE DE RÉPONSES", 105, 30, { align: "center" });

      // Informations Étudiant
      answerSheet.setFontSize(10);
      answerSheet.setFont("helvetica", "bold");
      answerSheet.text(
        "Nom/Prénom: __________________________________   Classe: ___________   CIN: ______________",
        20,
        45
      );
      answerSheet.setLineWidth(0.5);
      answerSheet.line(20, 50, 190, 50);

      // Configuration dynamique
      const maxChoices = questions.reduce(
        (max, q) =>
          q.type === "multiple-choice" ? Math.max(max, q.choices.length) : max,
        0
      );

      const startY = 60; // Position verticale de départ du tableau

      const tableConfig = {
        colWidth: 18,
        rowHeight: 14,
        header: [
          "Question",
          ...Array.from({ length: maxChoices }, (_, i) =>
            String.fromCharCode(65 + i)
          ),
        ],
      };

      // Calcul de positionnement précis
      const totalTableWidth = tableConfig.colWidth * tableConfig.header.length;
      const startX =
        (answerSheet.internal.pageSize.width - totalTableWidth) / 2;

      // En-têtes alignés
      answerSheet.setFont("helvetica", "bold");
      tableConfig.header.forEach((header, i) => {
        const xPos = startX + i * tableConfig.colWidth;

        // Alignement différent pour "Question"
        if (i === 0) {
          answerSheet.text(header, xPos + tableConfig.colWidth - 2, startY, {
            align: "right", // Alignement à droite pour correspondre aux Q1, Q2
          });
        } else {
          answerSheet.text(header, xPos + tableConfig.colWidth / 2, startY, {
            align: "center", // Centrage pour les lettres
          });
        }
      });

      // Cases à cocher
      questions.forEach((question, index) => {
        if (question.type !== "multiple-choice") return;

        const y = startY + (index + 1) * tableConfig.rowHeight;

        // Positionnement du numéro de question
        answerSheet.text(
          `Q${index + 1}`,
          startX + tableConfig.colWidth - 8, // Alignement coordonné avec l'en-tête
          y + 4,
          { align: "right" }
        );

        // Cases alignées sous les lettres
        for (let i = 0; i < question.choices.length; i++) {
          const xPos =
            startX +
            (i + 1) * tableConfig.colWidth + // Décalage pour la colonne Question
            tableConfig.colWidth / 2 -
            4;
          answerSheet.rect(xPos, y - 1, 8, 8);
        }
      });
      // Après avoir généré le tableau dans la feuille de réponses
      const answerPageCount = answerSheet.getNumberOfPages();
      for (let i = 1; i <= answerPageCount; i++) {
        answerSheet.setPage(i);
        answerSheet.text(
          `Page ${i} / ${answerPageCount}`,
          105,
          285, // Position Y identique au quiz
          { align: "center" }
        );
      }
      const quizBlob = quizDoc.output("blob"); // <-- Décommenté
      const answerBlob = answerSheet.output("blob"); // <-- Décommenté
      return { quizBlob, answerBlob }; // Retournez les Blobs générés
    } catch (error) {
      toast.error("Erreur lors de la génération des PDF");
      throw error;
    }
  };
  const createAndDownloadZip = async (quizBlob: Blob, answerBlob: Blob) => {
    try {
      const zip = new JSZip();
      zip.file(`${title}_Quiz.pdf`, quizBlob);
      zip.file(`${title}_Feuille_Reponses.pdf`, answerBlob);

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${title}_Quiz_Package.zip`;
      link.click();

      // Nettoyage
      URL.revokeObjectURL(link.href);
      setTitle("");
      setQuestions([]);
      setIsQuizSubmitted(false);
    } catch (error) {
      console.error("Error generating ZIP:", error);
      toast.error("Erreur lors du téléchargement");
    }
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
                      <div className="flex items-center mt-2">
                        <Input
                          label={`Question ${index + 1}`}
                          placeholder={`Enter Question ${index + 1}`}
                          value={question.text}
                          onChange={(e) =>
                            handleQuestionChange(index, e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 bg-gray-100 hover:bg-red-100 ml-2 "
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash className="w-5 h-5" />
                        </Button>
                      </div>
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
                    <div className="flex items-center mt-2">
                      <Input
                        label={`Question ${index + 1}`}
                        placeholder={`Enter Question ${index + 1}`}
                        value={question.text}
                        onChange={(e) =>
                          handleQuestionChange(index, e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 bg-gray-100 hover:bg-red-100 ml-2 "
                        onClick={() => handleDelete(question.id)}
                      >
                        <Trash className="w-5 h-5" />
                      </Button>
                    </div>
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
                  onClick={handlePreviewPDF}
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
      {/*Placez ce code juste avant le dernier*/}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Aperçu des PDFs</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="quiz">
            <TabsList className="grid grid-cols-2 w-1/2 mb-4">
              <TabsTrigger value="quiz">Questionnaire</TabsTrigger>
              <TabsTrigger value="answers">Feuille de réponses</TabsTrigger>
            </TabsList>

            <TabsContent value="quiz" className="flex-1">
              {previewData.quizUrl && (
                <iframe
                  src={`${previewData.quizUrl}#view=fitH`}
                  className="w-full h-full min-h-[500px]"
                />
              )}
            </TabsContent>

            <TabsContent value="answers" className="flex-1">
              {previewData.answerUrl && (
                <iframe
                  src={`${previewData.answerUrl}#view=fitH`}
                  className="w-full h-full min-h-[500px]"
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (previewData.quizBlob && previewData.answerBlob) {
                  createAndDownloadZip(
                    previewData.quizBlob,
                    previewData.answerBlob
                  );
                  setIsPreviewModalOpen(false);
                }
              }}
            >
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
};

export default CreateQuizPage;
