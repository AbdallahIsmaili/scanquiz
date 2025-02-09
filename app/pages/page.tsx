"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
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
import "jspdf-autotable";
import {
  Trash,
  MoreVertical,
  FileText,
  CheckCircle,
  Download,
} from "lucide-react";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const QuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(50),
  questions: z
    .array(
      z.union([
        z.object({
          type: z.literal("multiple-choice"),
          text: z.string().min(5, "Question text too short"),
          choices: z
            .array(
              z.object({
                text: z.string().min(1, "Choice text required"),
                isCorrect: z.boolean(),
              })
            )
            .min(2, "At least 2 choices required")
            .refine(
              (choices) => choices.some((c) => c.isCorrect),
              "At least one correct answer required"
            ),
        }),
        z.object({
          type: z.literal("typing-box"),
          text: z.string().min(5, "Question text too short"),
          boxSize: z
            .string()
            .refine(
              (val) => !isNaN(Number(val)) && Number(val) > 0,
              "Invalid box size"
            ),
        }),
      ])
    )
    .min(1, "At least one question required")
    .refine((questions) => {
      const texts = questions.map((q) => q.text);
      return new Set(texts).size === texts.length;
    }, "Duplicate questions detected"),
});

type PreviewContextType = {
  generatePDFs: () => Promise<{ quizBlob: Blob; answerBlob: Blob }>;
};

//const PreviewContext = createContext<PreviewContextType | null>(null);

const PreviewContext = createContext<PreviewContextType>({
  generatePDFs: () => Promise.reject("Context not initialized"),
});

const ConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone.",
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          Confirm
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const QuestionActions = ({ onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <MoreVertical className="w-5 h-5 text-muted-foreground" />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem className="text-red-500" onClick={onDelete}>
        <Trash className="w-4 h-4 mr-2" />
        Delete Question
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const QuizForm = ({ title, questions, setTitle, setQuestions }) => {
  const [questionType, setQuestionType] = useState<string | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [dialogInput, setDialogInput] = useState("");

  const handleAddQuestion = (type: string) => {
    setQuestionType(type);
    setIsAlertDialogOpen(true);
  };
  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddMultipleChoiceQuestion = () => {
    // Convertir dialogInput en nombre
    const numChoices = parseInt(dialogInput, 10);
    if (isNaN(numChoices) || numChoices < 2 || numChoices > 5) {
      toast.error("Please enter a number between 2 and 5");
      setDialogInput("");
      return;
    }
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
    setDialogInput("");
  };

  const handleAddTypingBoxQuestion = () => {
    const boxSize = parseInt(dialogInput, 10);
    if (isNaN(boxSize) || boxSize < 1 || boxSize > 10) {
      toast.error("Please enter a valid number between 1 and 10");
      setDialogInput("");
      return;
    }
    const newQuestion = {
      type: "typing-box",
      text: "",
      boxSize: boxSize.toString(),
    };
    setQuestions([...questions, newQuestion]);
    setIsAlertDialogOpen(false);
    setDialogInput("");
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

  return (
    <Card>
      <CardHeader>
        <TypographyH3>Quiz Builder</TypographyH3>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input pour le titre du quiz */}
        <Input
          placeholder="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Boucle sur les questions */}
        {questions.map((question, index) => (
          <div key={index} className="space-y-4 border p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <TypographyH4>{`Question ${index + 1}`}</TypographyH4>
              <QuestionActions onDelete={() => handleDeleteQuestion(index)} />
            </div>

            {question.type === "multiple-choice" && (
              <>
                <Input
                  placeholder={`Enter Question ${index + 1}`}
                  value={question.text}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                />

                {question.choices.map((choice: any, choiceIndex: number) => (
                  <div
                    key={choiceIndex}
                    className="flex items-center mt-2 gap-2"
                  >
                    <Input
                      placeholder={`Enter Choice ${choiceIndex + 1}`}
                      value={choice.text}
                      onChange={(e) =>
                        handleChoiceChange(index, choiceIndex, e.target.value)
                      }
                    />
                    <Checkbox
                      checked={choice.isCorrect}
                      onCheckedChange={() =>
                        handleCorrectAnswerToggle(index, choiceIndex)
                      }
                    />
                  </div>
                ))}
              </>
            )}

            {question.type === "typing-box" && (
              <Input
                placeholder={`Enter Question ${index + 1}`}
                value={question.text}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddQuestion("multiple-choice")}
          >
            Add Multiple Choice
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddQuestion("typing-box")}
          >
            Add Typing Box
          </Button>
        </div>

        {/* Fenêtre modale de confirmation pour ajouter une question */}
        <ConfirmationDialog
          open={isAlertDialogOpen}
          onOpenChange={setIsAlertDialogOpen}
          onConfirm={
            questionType === "multiple-choice"
              ? handleAddMultipleChoiceQuestion
              : handleAddTypingBoxQuestion
          }
          title={
            questionType === "multiple-choice"
              ? "Number of Choices"
              : "Box Size Configuration"
          }
          description={
            <Input
              type={questionType === "multiple-choice" ? "number" : "number"}
              placeholder={
                questionType === "multiple-choice"
                  ? "Enter number of choices (2-5)"
                  : "Enter box size (1-10 lines)"
              }
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              className="mt-2"
            />
          }
        />
      </CardContent>
    </Card>
  );
};

const QuizPreview = ({
  title,
  questions,
  onSubmitQuiz,
  onPublish,
  isPublishDisabled,
  isSaveDisabled,
}) => {
  const previewContext = useContext(PreviewContext);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState({
    quizUrl: null,
    answerUrl: null,
  });

  const handlePreview = async () => {
    try {
      if (!previewContext) {
        toast.error("Preview context not available");
        return;
      }

      const { quizBlob, answerBlob } = await previewContext.generatePDFs();
      setPreviewData({
        quizUrl: URL.createObjectURL(quizBlob),
        answerUrl: URL.createObjectURL(answerBlob),
      });
      setIsPreviewModalOpen(true);
    } catch (error) {
      toast.error("Error generating preview");
    }
  };

  return (
    <Card className="sticky top-4 col-span-1">
      <CardHeader>
        <TypographyH3>Preview & Actions</TypographyH3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-t pt-4">
          <TypographyH4>Current Quiz: {title || "Untitled Quiz"}</TypographyH4>
          <br></br>
          {questions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No questions added yet
            </p>
          ) : (
            <div className="space-y-2 ">
              <br></br>
              {questions.map((question, index) => (
                <div key={index} className="text-sm">
                  Q{index + 1}: {question.text || "New question"}
                </div>
              ))}
            </div>
          )}
        </div>
        <br></br>
        <div className="space-y-2 border-t pt-4">
          <Button className="w-full" onClick={handlePreview}>
            <FileText className="w-4 h-4 mr-2" />
            Preview PDFs
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            onClick={onSubmitQuiz}
            disabled={isSaveDisabled}
          >
            <Download className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          <Button
            className="w-full"
            variant="destructive"
            onClick={onPublish}
            disabled={isPublishDisabled}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Publish Quiz
          </Button>
        </div>

        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>PDF Preview</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="quiz">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="answers">Answer Sheet</TabsTrigger>
              </TabsList>
              <TabsContent value="quiz" className="h-[60vh]">
                {previewData.quizUrl && (
                  <iframe
                    src={`${previewData.quizUrl}#view=fitH`}
                    className="w-full h-full"
                  />
                )}
              </TabsContent>
              <TabsContent value="answers" className="h-[60vh]">
                {previewData.answerUrl && (
                  <iframe
                    src={`${previewData.answerUrl}#view=fitH`}
                    className="w-full h-full"
                  />
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const CreateQuizPage: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (questions.length > 0 || title) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup: supprime l'écouteur quand le composant est démonté
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [questions, title]); // Déclenche une mise à jour quand ces variables changent

  const generatePDFs = async () => {
    try {
      if (!title || questions.length === 0) {
        throw new Error("Cannot generate empty quiz");
      }
      const quizDoc = new jsPDF();
      if (title.length > 40) {
        quizDoc.setFontSize(14);
      } else {
        quizDoc.setFontSize(16);
      }
      const zip = new JSZip();
      // En-tête du Quiz
      quizDoc.setFontSize(16);
      quizDoc.setFont("helvetica", "bold");
      quizDoc.text(title, 105, 20, { align: "center" });

      // Section Informations Étudiant
      quizDoc.setFontSize(11);
      quizDoc.setFont("helvetica", "bold");
      const studentFields = [
        { label: "Family name:", x: 20, y: 40 },
        { label: "First name:", x: 20, y: 48 },
        { label: "CIN:", x: 110, y: 40 },
        { label: "Class:", x: 110, y: 48 },
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
          //const boxSize = (question.boxSize) || 1;
          const boxSize = parseInt(String(question.boxSize), 10) || 1; // Force la conversion en string
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

      // Feuille de réponses
      const answerSheet = new jsPDF();

      // En-tête centré
      answerSheet.setFontSize(16);
      answerSheet.setFont("helvetica", "bold");
      answerSheet.text(title, 105, 20, { align: "center" });
      answerSheet.text("FEUILLE DE RÉPONSES", 105, 30, { align: "center" });

      // Informations Étudiant
      answerSheet.setFontSize(10);
      answerSheet.setFont("helvetica", "bold");

      const studentFields1 = [
        { label: "Family name:", x: 20, y: 40 },
        { label: "First name:", x: 20, y: 48 },
        { label: "CIN:", x: 110, y: 40 },
        { label: "Class:", x: 110, y: 48 },
      ];

      studentFields1.forEach((field) => {
        answerSheet.text(field.label, field.x, field.y);
      });

      answerSheet.setLineWidth(0.5);
      answerSheet.line(20, 50, 190, 50);
      answerSheet.text(
        "Réponses (Ne rien écrire en dehors des cases)",
        105,
        55,
        {
          align: "center",
        }
      );

      // Configuration dynamique
      const maxChoices = questions.reduce(
        (max, q) =>
          q.type === "multiple-choice" ? Math.max(max, q.choices.length) : max,
        0
      );

      // Configuration du tableau
      (answerSheet as any).autoTable({
        startY: 60,
        head: [
          [
            "Question",
            ...Array.from({ length: maxChoices }, (_, i) =>
              String.fromCharCode(65 + i)
            ),
          ],
        ],
        body: questions
          .filter((q) => q.type === "multiple-choice")
          .map((q, index) => [
            `Q${index + 1}`,
            ...Array.from({ length: maxChoices }, (_, i) =>
              i < q.choices.length ? "" : ""
            ),
          ]),
        styles: {
          fontSize: 10,
          cellPadding: 3,
          valign: "middle",
          halign: "center",
        },
        headStyles: {
          fillColor: [41, 128, 185], // Couleur bleue pour l'en-tête
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          textColor: 0,
          fillColor: 255, // Fond blanc pour les lignes
        },
        columnStyles: {
          0: {
            // Style colonne "Question"
            halign: "left",
            cellWidth: 25,
            fontStyle: "bold",
          },
          // Style pour les colonnes de réponses
          ...Object.fromEntries(
            Array.from({ length: maxChoices }).map((_, i) => [
              i + 1,
              {
                cellWidth: 15,
                halign: "center",
              },
            ])
          ),
        },
        theme: "grid", // Théma simple avec bordures
        margin: { left: 20 },
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

      // Ajouter une limite de pages
      if (quizDoc.getNumberOfPages() > 10) {
        toast.error("Quiz too long, maximum 10 pages");
        throw new Error("Page limit exceeded");
      }

      const quizBlob = quizDoc.output("blob");
      const answerBlob = answerSheet.output("blob");

      return {
        quizBlob: quizDoc.output("blob"),
        answerBlob: answerSheet.output("blob"),
      };
    } catch (error) {
      toast.error("Error generating PDFs");
      throw error;
    }
  };

  const handleConfirmSubmit = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Authorization token not found. Please log in again.");
      //setIsConfirmationDialogOpen(false);
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
      //setIsDialogOpen(true);
      toast.success("Quiz saved successfully!");
    } else {
      const errorMessage = await response.text();
      console.error("Error response:", errorMessage);
      toast.error(`Error saving quiz: ${errorMessage}`);
    }
    //setIsConfirmationDialogOpen(false);
  };
  const handleSubmitQuiz = async () => {
    try {
      // Validation du schéma
      QuizSchema.parse({ title, questions });
      await handleConfirmSubmit();
      setIsSaved(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error("Error submitting quiz");
      }
    }
  };

  const handlePublish = async () => {
    try {
      const validated = QuizSchema.parse({ title, questions });
      setIsConfirmationOpen(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  const handleConfirmPublish = async () => {
    try {
      setIsLoading(true);

      // 1. Génération des PDFs
      const { quizBlob, answerBlob } = await generatePDFs();

      // 2. Création du ZIP
      const zip = new JSZip();
      zip.file(`${title}_Quiz.pdf`, quizBlob);
      zip.file(`${title}_Answers.pdf`, answerBlob);
      const content = await zip.generateAsync({ type: "blob" });

      // 3. Téléchargement
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${title}_Quiz.zip`;
      link.click();

      setTitle("");
      setQuestions([]);
      setIsSaved(false);
    } catch (error) {
      console.error("Publishing failed:", error);
      toast.error(`Publication failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ClientLayout>
      <PreviewContext.Provider value={{ generatePDFs }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mx-auto text-center mt-28 mb-12">
            Let's start creating your Quiz
          </h1>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <QuizForm
                  title={title}
                  questions={questions}
                  setTitle={setTitle}
                  setQuestions={setQuestions}
                />
              )}
            </div>

            <div className="col-span-1">
              <QuizPreview
                title={title}
                questions={questions}
                onSubmitQuiz={handleSubmitQuiz}
                onPublish={handlePublish}
                isPublishDisabled={!isSaved}
                isSaveDisabled={isSaved}
              />
            </div>
          </div>

          <ConfirmationDialog
            open={isConfirmationOpen}
            onOpenChange={setIsConfirmationOpen}
            onConfirm={handleConfirmPublish}
            title="Confirm Publication"
            description="This will generate PDF files and make the quiz available."
          />
        </div>
      </PreviewContext.Provider>
    </ClientLayout>
  );
};

export default CreateQuizPage;
