"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [results, setResults] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!files) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResults(JSON.stringify(response.data.extractedData, null, 2));
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  return (
    <div>
      <h1>Upload MCQ Answer Sheets</h1>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {results && (
        <div>
          <h2>Extracted Data</h2>
          <pre>{results}</pre>
        </div>
      )}
    </div>
  );
}
