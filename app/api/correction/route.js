import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";

const extractTextFromPDF = async (buffer) => {
  const data = await pdf(buffer);
  return data.text;
};

const extractTextFromImage = async (buffer) => {
  const {
    data: { text },
  } = await Tesseract.recognize(buffer, "eng");
  return text;
};

const extractFullName = (text) => {
  const nameRegex = /Full Name:\s*(.*)/i;
  const match = text.match(nameRegex);
  return match && match[1] ? match[1].trim() : "Name not found";
};

const extractClass = (text) => {
  const classRegex = /Class:\s*(.*)/i;
  const match = text.match(classRegex);
  return match && match[1] ? match[1].trim() : "Class not found";
};

const extractCIN = (text) => {
  const cinRegex = /CIN:\s*(\d+)/i;
  const match = text.match(cinRegex);
  return match && match[1] ? match[1].trim() : "CIN not found";
};

const extractAnswers = (text) => {
  const answers = {};
  const answerRegex = /Q(\d+):\s*([A-D])/gi;
  let match;
  while ((match = answerRegex.exec(text)) !== null) {
    const questionNumber = `Q${match[1]}`;
    const answer = match[2].toUpperCase();
    answers[questionNumber] = answer;
  }
  return answers;
};

const correctAnswers = {
  Q1: "B",
  Q2: "D",
  Q3: "A",
  Q4: "C",
  Q5: "B",
  Q6: "A",
  Q7: "D",
  Q8: "C",
  Q9: "A",
  Q10: "B",
};

const calculateScore = (answers) => {
  let score = 0;
  for (const [question, answer] of Object.entries(answers)) {
    if (correctAnswers[question] === answer) {
      score++;
    }
  }
  return score;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("file");

    const results = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let text = "";
        if (file.type === "application/pdf") {
          text = await extractTextFromPDF(buffer);
        } else {
          text = await extractTextFromImage(buffer);
        }

        const fullName = extractFullName(text);
        const className = extractClass(text);
        const cin = extractCIN(text);
        const answers = extractAnswers(text);
        const score = calculateScore(answers);

        return {
          fullName,
          className,
          cin,
          answers,
          score,
        };
      })
    );

    res.status(200).json({ results });
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).json({ error: "Error processing files" });
  }
}
