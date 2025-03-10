import React, { useState, useEffect, useRef } from "react";
import { AlertTitle, AlertDescription } from "./ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { logout } from "@/app/(auth)/api/auth";
import { toast } from "react-hot-toast";
import Link from "next/link";

const DynamicIslandNavbar = ({ user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleLogout = () => {
    logout();
    toast.success("You have successfully logged out.");
  };

  return (
    <>
      <nav
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 md:w-full max-w-xl p-4 transition-all duration-300 rounded-xl shadow-xl ${
          isScrolled
            ? "bg-gray-100 text-gray-800 shadow-lg" // Light background and dark text when scrolled
            : "bg-black text-white" // Dark background and white text initially
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="text-xl font-extrabold">QuizScan</div>
          <div className="hidden md:flex text-lg">
            <ul className="flex space-x-4">
              <li className="font-medium">
                <Link
                  href="/"
                  className={`hover:text-gray-600 transition duration-300 ${
                    isScrolled ? "text-gray-800" : "text-white"
                  }`}
                >
                  Home
                </Link>
              </li>
              <li className="font-medium">
                <a
                  href="#"
                  className={`hover:text-gray-600 transition duration-300 ${
                    isScrolled ? "text-gray-800" : "text-white"
                  }`}
                >
                  Features
                </a>
              </li>
              <li className="font-medium">
                <a
                  href="#"
                  className={`hover:text-gray-600 transition duration-300 ${
                    isScrolled ? "text-gray-800" : "text-white"
                  }`}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div className="hidden md:flex space-x-4">
            {user ? (
              <span className="font-medium">
                <button
                  onClick={toggleModal}
                  className={`${
                    isScrolled ? "text-gray-800" : "text-white"
                  } hover:text-gray-600 transition duration-300`}
                >
                  {user.fullname}
                </button>
              </span>
            ) : (
              <>
                <Button
                  variant="link"
                  className={`${
                    isScrolled ? "text-gray-800" : "text-white"
                  } hover:text-gray-600 transition ease-in-out duration-300`}
                >
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className={`${
                isScrolled ? "text-gray-800" : "text-white"
              } hover:text-gray-600 transition duration-300`}
            >
              {isMenuOpen ? <span>&#x2715;</span> : <span>&#9776;</span>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 text-lg font-semibold"
            >
              <ul className="flex flex-col items-center space-y-4">
                {user && (
                  <li className="font-semibold">
                    <button
                      onClick={toggleModal}
                      className={`${
                        isScrolled ? "text-gray-800" : "text-white"
                      } hover:text-gray-600 transition duration-300`}
                    >
                      {user.fullname}!
                    </button>
                  </li>
                )}
                <li className="font-semibold">
                  <a
                    href="#"
                    className={`${
                      isScrolled ? "text-gray-800" : "text-white"
                    } hover:text-gray-600 transition duration-300`}
                  >
                    Home
                  </a>
                </li>
                <li className="font-semibold">
                  <a
                    href="#"
                    className={`${
                      isScrolled ? "text-gray-800" : "text-white"
                    } hover:text-gray-600 transition duration-300`}
                  >
                    Features
                  </a>
                </li>
                <li className="font-semibold">
                  <a
                    href="#"
                    className={`${
                      isScrolled ? "text-gray-800" : "text-white"
                    } hover:text-gray-600 transition duration-300`}
                  >
                    Contact
                  </a>
                </li>
                {!user && (
                  <>
                    <li>
                      <a
                        href="/login"
                        className={`${
                          isScrolled ? "text-gray-800" : "text-white"
                        } hover:text-gray-600 transition duration-300`}
                      >
                        Login
                      </a>
                    </li>
                    <li>
                      <a
                        href="/register"
                        className={`${
                          isScrolled ? "text-gray-800" : "text-white"
                        } hover:text-gray-600 transition duration-300`}
                      >
                        Register
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed md:top-[270%] top-[85%] inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md"
            >
              <motion.div
                ref={modalRef}
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                exit={{ y: 50 }}
                transition={{ duration: 0.3 }}
                className={`p-10 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto ${
                  isScrolled
                    ? "bg-gray-100 text-gray-800" // Light background and dark text when scrolled
                    : "bg-black text-white" // Dark background and white text initially
                }`}
              >
                <AlertTitle className="w-2/3 mx-auto text-center text-lg mb-6">
                  Where would you like to be navigated dear user, select an
                  action
                </AlertTitle>
                <AlertDescription className="space-y-4 text-center">
                  <ul className="w-2/3 mx-auto text-center flex justify-between items-align">
                    <li>
                      <Button
                        variant="link"
                        className={`${
                          isScrolled ? "text-gray-800" : "text-white"
                        } hover:text-gray-600 transition ease-in-out duration-300`}
                      >
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                    </li>

                    <li>
                      <Button
                        variant="link"
                        className={`${
                          isScrolled ? "text-gray-800" : "text-white"
                        } hover:text-gray-600 transition ease-in-out duration-300`}
                      >
                        Settings
                      </Button>
                    </li>
                    <li>
                      <Button variant="destructive" onClick={handleLogout}>
                        Log out
                      </Button>
                    </li>
                  </ul>
                </AlertDescription>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default DynamicIslandNavbar;
