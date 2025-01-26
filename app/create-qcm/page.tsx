/*"use client";

import { useState } from "react";
import userApi from "@/app/(auth)/api/auth";
import jsPDF from "jspdf";

export default function CreateQCMPage() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: [""], correctOption: 0 },
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: "", options: [""], correctOption: 0 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, qIndex) => qIndex !== index));
  };

  const handleAddOption = (index: number) => {
    const newQuestions = [...questions];
    newQuestions[index].options.push("");
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(optIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    try {
      const response = await userApi.post("/create-qcm", { title, questions });
      alert(response.data);
    } catch (err) {
      console.error("Erreur lors de la création du QCM:", err);
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    doc.text(`Titre du QCM: ${title}`, 10, 10);
    questions.forEach((q, index) => {
      doc.text(`${index + 1}. ${q.text}`, 10, 20 + index * 10);
      q.options.forEach((opt, optIndex) => {
        doc.text(
          `   ${optIndex + 1}. ${opt}`,
          10,
          25 + index * 10 + optIndex * 5
        );
      });
    });
    doc.save(`${title}.pdf`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Créer un QCM</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium">Titre du QCM</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
        />
      </div>
      {questions.map((q, index) => (
        <div key={index} className="mb-4 border p-4 rounded-md">
          <label className="block text-sm font-medium">
            Question {index + 1}
          </label>
          <input
            type="text"
            value={q.text}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[index].text = e.target.value;
              setQuestions(newQuestions);
            }}
            className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
          />
          {q.options.map((option, optIndex) => (
            <div key={optIndex} className="mt-2 flex items-center">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[index].options[optIndex] = e.target.value;
                  setQuestions(newQuestions);
                }}
                className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
              />
              <button
                onClick={() => handleRemoveOption(index, optIndex)}
                className="ml-2 px-3 py-1 bg-red-500 text-white rounded-md"
              >
                Supprimer
              </button>
            </div>
          ))}
          <button
            onClick={() => handleAddOption(index)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Ajouter une option
          </button>
          <label className="block text-sm font-medium mt-2">
            Option correcte
          </label>
          <select
            value={q.correctOption}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[index].correctOption = parseInt(e.target.value);
              setQuestions(newQuestions);
            }}
            className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
          >
            {q.options.map((_, optIndex) => (
              <option key={optIndex} value={optIndex}>
                Option {optIndex + 1}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleRemoveQuestion(index)}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Supprimer la question
          </button>
        </div>
      ))}
      <button
        onClick={handleAddQuestion}
        className="px-4 py-2 bg-blue-500 text-white rounded-md mt-4"
      >
        Ajouter une question
      </button>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-green-500 text-white rounded-md mt-4 ml-2"
      >
        Sauvegarder le QCM
      </button>
      <button
        onClick={handleGeneratePDF}
        className="px-4 py-2 bg-purple-500 text-white rounded-md mt-4 ml-2"
      >
        Télécharger le QCM en PDF
      </button>
    </div>
  );
}
*/
"use client";

import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

export default function CreateQCMPage() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: [{ text: "", isCorrect: false }] },
  ]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: [{ text: "", isCorrect: false }] },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, qIndex) => qIndex !== index));
  };

  const handleAddOption = (index) => {
    const newQuestions = [...questions];
    newQuestions[index].options.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(optIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token"); // Utilisation du token pour l'authentification
      const response = await axios.post(
        "http://localhost:3001/create-qcm",
        { title, questions },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("QCM créé avec succès !");
    } catch (err) {
      console.error("Erreur lors de la création du QCM:", err);
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    doc.text(`Titre du QCM: ${title}`, 10, 10);
    questions.forEach((q, index) => {
      doc.text(`${index + 1}. ${q.text}`, 10, 20 + index * 10);
      q.options.forEach((opt, optIndex) => {
        doc.text(
          `   ${optIndex + 1}. ${opt.text} ${
            opt.isCorrect ? "(Correcte)" : ""
          }`,
          10,
          25 + index * 10 + optIndex * 5
        );
      });
    });
    doc.save(`${title}.pdf`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Créer un QCM</h1>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Titre du QCM
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 block w-full border border-gray-300 p-3 rounded-lg focus:ring focus:ring-blue-300"
            placeholder="Entrez le titre du QCM"
          />
        </div>
        {questions.map((q, index) => (
          <div
            key={index}
            className="mb-6 border border-gray-300 p-4 rounded-lg bg-gray-50"
          >
            <label className="block text-sm font-medium text-gray-700">
              Question {index + 1}
            </label>
            <input
              type="text"
              value={q.text}
              onChange={(e) => {
                const newQuestions = [...questions];
                newQuestions[index].text = e.target.value;
                setQuestions(newQuestions);
              }}
              className="mt-2 block w-full border border-gray-300 p-2 rounded-lg focus:ring focus:ring-blue-300"
              placeholder="Entrez la question"
            />
            {q.options.map((option, optIndex) => (
              <div key={optIndex} className="mt-4 flex items-center gap-4">
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[index].options[optIndex].text = e.target.value;
                    setQuestions(newQuestions);
                  }}
                  className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring focus:ring-blue-300"
                  placeholder="Entrez une option"
                />
                <input
                  type="checkbox"
                  checked={option.isCorrect}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[index].options[optIndex].isCorrect =
                      e.target.checked;
                    setQuestions(newQuestions);
                  }}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                />
                <button
                  onClick={() => handleRemoveOption(index, optIndex)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Supprimer
                </button>
              </div>
            ))}
            <button
              onClick={() => handleAddOption(index)}
              className="mt-4 mr-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Ajouter une option
            </button>
            <button
              onClick={() => handleRemoveQuestion(index)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Supprimer la question
            </button>
          </div>
        ))}
        <div className="flex gap-4">
          <button
            onClick={handleAddQuestion}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Ajouter une question
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Sauvegarder le QCM
          </button>
          <button
            onClick={handleGeneratePDF}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Télécharger le QCM en PDF
          </button>
        </div>
      </div>
    </div>
  );
}
