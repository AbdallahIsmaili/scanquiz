{
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: Row<Question> }) => {
        const question = row.original;
        const [isOpen, setIsOpen] = useState(false);
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
                <DropdownMenuItem onClick={handleViewDetails}>
                  Delete question
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit Question Details</AlertDialogTitle>

                  questionDetails
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button onClick={handleSave}>Save</Button>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },