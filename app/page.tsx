"use client";

import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { isAuthenticated } from "./(auth)/api/auth"; // Ensure the path is correct
import { Button } from "@/components/ui/button";
import DynamicIslandNavbar from "@/components/dynamicIslandNavbar";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authUser = await isAuthenticated();
        console.log("Authenticated user:", authUser); // Debugging log
        setUser(authUser);

        if (authUser?.fullname) {
          const toastShown = sessionStorage.getItem("toastShown");

          if (!toastShown) {
            toast.success(`Hello ${authUser.fullname}! 👏`, {
              duration: 4000,
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            });
            sessionStorage.setItem("toastShown", "true");
          }
        } else {
          toast(
            (t) => (
              <span>
                Hi there! Please <b>login</b> or <b>register</b>.
                <button
                  className="ml-2 text-blue-300 hover:text-blue-500"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Dismiss
                </button>
              </span>
            ),
            {
              duration: 5000,
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            }
          );
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      }
    };

    checkAuth();
  }, []);

  const handleCreateClick = () => {
    if (user) {
      router.push("/pages");
    } else {
      toast.error("Please login first to create your MCQ Quiz!", {
        duration: 4000,
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      router.push("/login");
    }
  };

  return (
    <div className="relative min-h-screen text-white flex flex-col items-center justify-center">
      <Toaster position="top-right" reverseOrder={false} />
      <DynamicIslandNavbar user={user} />

      <main className="text-center px-6">
        <h3 className="py-4 text-2xl font-bold bg-gradient-to-br from-purple-200 to-purple-500 text-transparent bg-clip-text [text-shadow:_0_1px_2px_rgb(255_255_255_/_40%)]">
          Free MCQ Generator
        </h3>

        <h1 className="text-8xl font-extrabold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text tracking-tighter leading-[1.2] [text-shadow:_0_1px_2px_rgb(255_255_255_/_40%)]">
          Multiple Choice <br /> Question Generator
        </h1>

        <p className="text-gray-300 mt-4 text-xl max-w-2xl mx-auto [text-shadow:_0_1px_2px_rgb(255_255_255_/_40%)]">
          Create multiple-choice quizzes easily by uploading your questions.
          Export the quizzes, import answer sheets for grading, and receive
          detailed results.
        </p>

        <Button
          className="animate-pulseClick mt-10 px-8 py-6 bg-purple-600 hover:bg-purple-700 text-lg font-semibold rounded-md shadow-lg transition [text-shadow:_0_1px_2px_rgb(255_255_255_/_40%)]"
          onClick={handleCreateClick}
        >
          Create Your MCQ Quiz Now!
        </Button>

        <p className="text-gray-400 mt-2 text-sm [text-shadow:_0_1px_2px_rgb(255_255_255_/_40%)]">
          Start using now!
        </p>
      </main>
    </div>
  );
};

export default HomePage;
