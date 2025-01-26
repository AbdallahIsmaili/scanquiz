// pages/quizzes/[id].tsx

import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TypographyH1, TypographyP } from "@/components/Typography";
import { Button } from "@/components/ui/button";

interface QuizProps {
  quizData: any; // Define the shape of quiz data according to your application's needs
}

const QuizPage: React.FC<QuizProps> = ({ quizData }) => {
  const router = useRouter();
  const { id } = router.query;

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <section className="hero mt-16 flex justify-center items-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <TypographyH1>Quiz: {id}</TypographyH1>
        </CardHeader>
        <CardContent>
          <TypographyP>{quizData.description}</TypographyP>
          {/* Render quiz questions and options here */}
          <Button className="mt-4" onClick={() => router.push("/quizzes")}>
            Back to Quizzes
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Fetch quiz IDs from your data source
  const quizIds = ["1", "2", "3"];
  const paths = quizIds.map((id) => ({
    params: { id },
  }));

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { id } = context.params!;
  // Fetch quiz data based on the id
  const quizData = { id, description: `Description for quiz ${id}` };

  return {
    props: { quizData },
  };
};

export default QuizPage;
