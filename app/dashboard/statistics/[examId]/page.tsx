"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Histogram,
  LineChart,
  Line,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

interface ExamData {
  exam_info: {
    title: string;
    exam_id: string;
    max_score: number;
  };
  students: {
    student_info?: {
      Name?: string;
      CIN?: string;
      Class?: string;
    };
    score: number;
    answers?: {
      question: string;
      selectedChoices: string[];
      isCorrect: boolean;
      correctAnswers: string[];
    }[];
  }[];
}

export default function ExamStatisticsPage() {
  const { examId } = useParams(); // Get examId from the URL
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxScore, setMaxScore] = useState(20); // Default max score

  // Fetch exam data
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/exam/${examId}?maxScore=${maxScore}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch exam data");
        }
        const data = await response.json();
        setExamData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examId, maxScore]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!examData || !examData.students) {
    return <div>No data found for this exam.</div>;
  }

  // Calculate statistics
  const totalStudents = examData.students.length;

  // Top 5 Students by Score
  const topStudents = examData.students
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((student) => ({
      name: student.student_info?.Name || "Unknown",
      score: student.score,
    }));

  // Score Distribution by Class
  const scoreByClass = examData.students.reduce((acc, student) => {
    const className = student.student_info?.Class || "Unknown";
    if (!acc[className]) {
      acc[className] = { totalScore: 0, count: 0 };
    }
    acc[className].totalScore += student.score || 0;
    acc[className].count += 1;
    return acc;
  }, {});

  const classDistribution = Object.keys(scoreByClass).map((className) => ({
    class: className,
    averageScore: (
      scoreByClass[className].totalScore / scoreByClass[className].count
    ).toFixed(2),
  }));

  // Pass/Fail Distribution
  const passFailData = [
    {
      name: "Pass",
      value: examData.students.filter(
        (student) => student.score >= maxScore / 2
      ).length,
    },
    {
      name: "Fail",
      value: examData.students.filter((student) => student.score < maxScore / 2)
        .length,
    },
  ];

  const COLORS = ["#10b981", "#ef4444"]; // Green for Pass, Red for Fail

  // Score Distribution Histogram
  const scoreDistribution = examData.students.map((student) => ({
    score: student.score,
  }));

  // Most Difficult Questions
  const questionDifficulty =
    examData.students[0]?.answers?.map((answer, index) => {
      const correct = examData.students.filter(
        (student) => student.answers?.[index]?.isCorrect
      ).length;
      const incorrect = examData.students.filter(
        (student) => !student.answers?.[index]?.isCorrect
      ).length;
      return {
        question: `Q${index + 1}`,
        correct,
        incorrect,
        difficulty: (incorrect / (correct + incorrect)) * 100, // Difficulty percentage
      };
    }) || [];

  const mostDifficultQuestions = questionDifficulty
    .sort((a, b) => b.difficulty - a.difficulty)
    .slice(0, 5); // Top 5 most difficult questions

  // Total Correct vs. Incorrect Answers
  const totalCorrect = examData.students.reduce(
    (sum, student) =>
      sum + (student.answers?.filter((answer) => answer.isCorrect).length || 0),
    0
  );
  const totalIncorrect = examData.students.reduce(
    (sum, student) =>
      sum +
      (student.answers?.filter((answer) => !answer.isCorrect).length || 0),
    0
  );

  const correctIncorrectData = [
    { name: "Correct", value: totalCorrect },
    { name: "Incorrect", value: totalIncorrect },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard/correction">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Correction
          </Button>
        </Link>

        {/* Max Score Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Max Score
          </label>
          <Input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
            className="mt-1 w-40"
            min="1"
          />
        </div>

        {/* Exam Title and ID */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {examData.exam_info.title}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Exam ID: {examData.exam_info.exam_id}
            </p>
          </CardHeader>
        </Card>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Max Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{maxScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Passing Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{maxScore / 2}</p>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Students by Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Students by Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topStudents}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, maxScore]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution by Class */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Average Score by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classDistribution}>
                <XAxis dataKey="class" />
                <YAxis domain={[0, maxScore]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass/Fail Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Pass/Fail Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={passFailData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {passFailData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution Histogram */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="score" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Difficult Questions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Most Difficult Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostDifficultQuestions}>
                <XAxis dataKey="question" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="difficulty" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total Correct vs. Incorrect Answers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Correct vs. Incorrect Answers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={correctIncorrectData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {correctIncorrectData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
