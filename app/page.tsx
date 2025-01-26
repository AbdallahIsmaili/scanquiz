"use client";

import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { isAuthenticated } from "./(auth)/api/check-auth"; // Ensure the path is correct
import { Button } from "@/components/ui/button";
import { Navbar, NavbarBrand, NavbarContent } from "@/components/navbar";
import Link from "next/link";

const HomePage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const authUser = isAuthenticated();
    setUser(authUser);

    if (authUser && authUser.fullname) {
      toast(`Hello ${authUser.fullname}!`, {
        icon: "👏",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    } else {
      toast(
        (t) => (
          <span>
            Hi there! Please <b>login</b> or <b>register</b>.
            <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
          </span>
        ),
        {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }
      );
    }
  }, []);

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar>
        <NavbarBrand>QuizScan</NavbarBrand>
        <NavbarContent>
          {user ? (
            <>
              <span>Welcome, {user.fullname}!</span>
              <Link href="/create-qcm">
                <Button>Créer un Quiz</Button>
              </Link>
            </>
          ) : (
            <>
              <Button href="/login">Login</Button>
              <Button href="/register">Register</Button>
            </>
          )}
        </NavbarContent>
      </Navbar>
      <main>
        <section className="hero">
          <h1>Welcome to QuizScan</h1>
          <p>Your ultimate solution for creating and scanning quizzes.</p>
          <Button href="/about">Learn More</Button>
        </section>
        <section className="features">
          <h2>Features</h2>
          <ul>
            <li>Create custom quizzes easily.</li>
            <li>Scan and grade quizzes automatically.</li>
            <li>Generate detailed reports and analytics.</li>
          </ul>
        </section>
      </main>
      <style jsx>{`
        .hero {
          text-align: center;
          padding: 2rem;
          background: #f5f5f5;
        }
        .features {
          padding: 2rem;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
