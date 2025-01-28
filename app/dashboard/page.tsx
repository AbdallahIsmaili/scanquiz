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
import toast, { Toaster } from "react-hot-toast";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
  Row,
  RowSelectionState,
  Table as ReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Quiz {
  id: number;
  title: string;
  user_id: number;
}

interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: string;
  box_size: string | null;
}

const DashboardPage: FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [isDeleteQuizOpen, setIsDeleteQuizOpen] = useState(false);
  const [isUpdateQuizOpen, setIsUpdateQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  // Explicitly type the states
  const [sorting, setSorting] = useState<SortingState>([]); // Fix here
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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

  const fetchQuizData = async (url, setData, setError) => {
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
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    }
  };

  // Use Effects
  useEffect(() => {
    if (selectedQuiz) {
      const url = `http://localhost:3001/api/quizzes/${selectedQuiz}/questions`;
      fetchQuizData(url, setQuestions, setError);
    }
  }, [selectedQuiz, questionText]); // Ensure consistent dependencies array

  useEffect(() => {
    if (isUpdateQuizOpen && selectedQuiz) {
      const url = `http://localhost:3001/api/quizzes/${selectedQuiz}`;
      fetchQuizData(url, (data) => setQuizTitle(data.title), setError);
    }
  }, [isUpdateQuizOpen, selectedQuiz]);

  const handleSelectChange = (value: string) => {
    setSelectedQuiz(value);
  };

  const handleTextUpdate = (newText) => {
    setQuestionText(newText);
  };

  const handleDeleteQuiz = () => {
    // Flag to prevent multiple calls
    let isDeleting = false;

    if (isDeleting) return; // Prevent multiple calls

    isDeleting = true; // Set flag to true

    toast.promise(
      fetch(`http://localhost:3001/api/quizzes/${selectedQuiz}`, {
        method: "DELETE",
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
        .then(() => {
          setQuizzes((prevQuizzes) =>
            prevQuizzes.filter((q) => q.id !== selectedQuiz)
          );
          setIsDeleteQuizOpen(false); // Hide the delete confirmation modal
          isDeleting = false; // Reset the flag
          window.location.reload(); // Refresh the page
        })
        .catch((err) => {
          isDeleting = false; // Reset the flag in case of error
          console.error("Error deleting quiz:", err);
          throw err;
        }),
      {
        loading: "Deleting quiz...",
        success: "Quiz deleted successfully!",
        error: "Failed to delete quiz.",
      }
    );
  };

  const handleUpdateQuiz = () => {
    const updatedQuiz = { title: quizTitle, newQuestion };

    fetch(`http://localhost:3001/api/quizzes/${selectedQuiz}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(updatedQuiz),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            const error = JSON.parse(text);
            return Promise.reject(new Error(error.error));
          });
        }
        return res.json();
      })
      .then((data) => {
        setQuizzes((prevQuizzes) =>
          prevQuizzes.map((quiz) => (quiz.id === data.id ? data : quiz))
        );
        setIsUpdateQuizOpen(false);
        window.location.reload();
        toast.success("Quiz updated successfully!"); // Show success toast here
      })
      .catch((err) => {
        if (
          err.message ===
          "A question with the same text already exists in this quiz"
        ) {
          toast.error(err.message);
        } else {
          toast.error("Failed to update quiz.");
        }
      });
  };



  const columns: ColumnDef<Question>[] = [
    {
      id: "select",
      header: ({ table }: { table: ReactTable<Question> }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: Row<Question> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "question_text",
      header: "Question Text",
      cell: ({ row }: { row: Row<Question> }) => (
        <div>{row.getValue("question_text")}</div>
      ),
    },
    {
      accessorKey: "question_type",
      header: ({ column }: { column: Column<Question> }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Question Type
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }: { row: Row<Question> }) => (
        <div>{row.getValue("question_type")}</div>
      ),
    },
    {
      accessorKey: "box_size",
      header: "Box Size",
      cell: ({ row }: { row: Row<Question> }) => (
        <div>{row.getValue("box_size")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: Row<Question> }) => {
        const question = row.original;
        const [isOpen, setIsOpen] = useState(false);
        const [isDeleteOpen, setIsDeleteOpen] = useState(false);
        const [questionDetails, setQuestionDetails] = useState<Question | null>(
          null
        );

        const handleViewDetails = () => {
          toast.promise(
            fetch(`http://localhost:3001/api/questions/${question.id}`, {
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
              .then((data) => {
                setQuestionDetails(data);
                setIsOpen(true);
              }),
            {
              loading: "Loading question details...",
              success: "Question details loaded!",
              error: "Failed to load question details.",
            }
          );
        };

        const handleDelete = () => {
          let isDeleting = false;

          if (isDeleting) return; // Prevent multiple calls

          isDeleting = true; // Set flag to true

          toast.promise(
            fetch(`http://localhost:3001/api/questions/${question.id}`, {
              method: "DELETE",
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
              .then(() => {
                setQuestions((prevQuestions) =>
                  prevQuestions.filter((q) => q.id !== question.id)
                );
                setIsDeleteOpen(false); // Hide the delete confirmation modal
              })
              .finally(() => {
                isDeleting = false; // Reset the flag
              })
              .catch((err) => {
                console.error("Error deleting question:", err);
                throw err;
              }),
            {
              loading: "Deleting question...",
              success: "Question deleted successfully!",
              error: "Failed to delete question.",
            }
          );
        };

        const handleSave = () => {
          // Check if there's a duplicate question text in the same quiz
          const duplicateQuestion = questions.find(
            (q) =>
              q.question_text === questionDetails.question_text &&
              q.id !== question.id
          );

          if (duplicateQuestion) {
            toast.error(
              "A question with the same text already exists in this quiz."
            );
            return;
          }

          // Check for duplicate answers within the same question
          const duplicateAnswer = questionDetails.choices.some(
            (choice, index, array) =>
              array.findIndex((c) => c.choice_text === choice.choice_text) !==
              index
          );

          if (duplicateAnswer) {
            toast.error(
              "Duplicate answers are not allowed within the same question."
            );
            return;
          }

          if (questionDetails.question_text !== questionText) {
            handleTextUpdate(questionDetails.question_text);
          }

          toast.promise(
            fetch(`http://localhost:3001/api/questions/${question.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(questionDetails),
            })
              .then((res) => {
                if (!res.ok) {
                  return res.text().then((text) => {
                    throw new Error(text);
                  });
                }
                return res.json();
              })
              .then((data) => {
                setQuestionDetails(data);
                setQuestions((prevQuestions) =>
                  prevQuestions.map((q) => (q.id === data.id ? data : q))
                );
                setIsOpen(false);
              })
              .catch((err) => {
                console.error("Error saving question details:", err);
                throw err;
              }),
            {
              loading: "Saving changes...",
              success: "Changes saved successfully!",
              error: "Failed to save changes.",
            }
          );
        };

        const handleQuestionTypeChange = (value: string) => {
          setQuestionDetails((prev) => {
            if (!prev) return prev;

            if (value === "short-answer") {
              // Save current choices before switching to short-answer
              return {
                ...prev,
                question_type: value,
                savedChoices: prev.choices || [], // Temporarily store choices
                choices: [], // Clear choices for short-answer
              };
            } else if (value === "multiple-choice") {
              // Restore saved choices when switching back to multiple-choice
              return {
                ...prev,
                question_type: value,
                choices: prev.savedChoices || [], // Restore saved choices
                savedChoices: [], // Clear temporary storage
              };
            }

            return { ...prev, question_type: value };
          });

          toast.success(
            value === "multiple-choice"
              ? "Multiple-choice type selected. Choices restored."
              : "Short-answer type selected. Choices cleared."
          );
        };

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleViewDetails}>
                  View question details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                  Delete question
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit Question Details</AlertDialogTitle>

                  {questionDetails && (
                    <>
                      <AlertDialogDescription>
                        Provide details for the question below.
                      </AlertDialogDescription>

                      <div>
                        <div>
                          <label
                            htmlFor="question_text"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Question Text
                          </label>
                          <Input
                            id="question_text"
                            value={questionDetails?.question_text || ""}
                            onChange={(e) =>
                              setQuestionDetails({
                                ...questionDetails,
                                question_text: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="question_type"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Question Type
                          </label>
                          <Select
                            value={
                              questionDetails?.question_type ||
                              "multiple-choice"
                            }
                            onValueChange={handleQuestionTypeChange}
                          >
                            <SelectTrigger className="mt-1 block w-full">
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple-choice">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="short-answer">
                                Short Answer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {questionDetails.question_type !==
                          "multiple-choice" && (
                          <div>
                            <label
                              htmlFor="box_size"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Box Size
                            </label>
                            <Input
                              id="box_size"
                              value={questionDetails?.box_size || ""}
                              onChange={(e) =>
                                setQuestionDetails({
                                  ...questionDetails,
                                  box_size: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                        {questionDetails.question_type ===
                          "multiple-choice" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Answers
                            </label>
                            {questionDetails.choices.map((choice, index) => (
                              <div
                                key={index}
                                className="flex items-center mt-2"
                              >
                                <Input
                                  value={choice.choice_text}
                                  onChange={(e) =>
                                    setQuestionDetails((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            choices: prev.choices.map((c, i) =>
                                              i === index
                                                ? {
                                                    ...c,
                                                    choice_text: e.target.value,
                                                  }
                                                : c
                                            ),
                                          }
                                        : prev
                                    )
                                  }
                                  className="mr-2"
                                />
                                <Checkbox
                                  checked={choice.is_correct}
                                  onCheckedChange={(e) =>
                                    setQuestionDetails((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            choices: prev.choices.map((c, i) =>
                                              i === index
                                                ? { ...c, is_correct: e }
                                                : c
                                            ),
                                          }
                                        : prev
                                    )
                                  }
                                  aria-label="Correct answer"
                                />
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    setQuestionDetails((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            choices: prev.choices.filter(
                                              (_, i) => i !== index
                                            ),
                                          }
                                        : prev
                                    )
                                  }
                                  className="ml-2"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={() =>
                                setQuestionDetails((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        choices: [
                                          ...prev.choices,
                                          {
                                            choice_text: "",
                                            is_correct: false,
                                          },
                                        ],
                                      }
                                    : prev
                                )
                              }
                              className="mt-2"
                            >
                              Add Answer
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button onClick={handleSave}>Save</Button>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <p>Are you sure you want to delete this question?</p>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];

  const data = questions;

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

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
            <Button
              variant="secondary"
              onClick={() => setIsUpdateQuizOpen(true)}
            >
              Update Quiz
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteQuizOpen(true)}
            >
              Delete this Quiz
            </Button>
          </>
        )}

        <AlertDialog open={isUpdateQuizOpen} onOpenChange={setIsUpdateQuizOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Quiz</AlertDialogTitle>
            </AlertDialogHeader>
            <Input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="New Quiz Title"
            />
            <Input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Add New Question"
            />
            <AlertDialogFooter>
              <Button onClick={handleUpdateQuiz}>Save</Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteQuizOpen} onOpenChange={setIsDeleteQuizOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <p>
                Are you sure you want to delete this quiz? This action cannot be
                undone.
              </p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="destructive" onClick={handleDeleteQuiz}>
                Delete
              </Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50">
            QCM Exam Overview
          </div>
          <div className="aspect-video rounded-xl bg-muted/50">
            Exam Results
          </div>
          <div className="aspect-video rounded-xl bg-muted/50">Scan Exams</div>
        </div>

        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
          <div className="w-full">
            <div className="flex items-center py-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
