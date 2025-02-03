

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
