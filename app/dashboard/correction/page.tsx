"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TypographyH2 } from "@/components/Typography";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Allowed file types
  const allowedFileTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/zip",
    "application/x-rar-compressed",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast.error("Please select files to upload.");
      return;
    }

    // Check file types
    for (let i = 0; i < files.length; i++) {
      if (!allowedFileTypes.includes(files[i].type)) {
        toast.error(
          `Invalid file type: ${files[i].name}. Only images, PDFs, ZIPs, and RARs are allowed.`
        );
        return;
      }
    }

    setLoading(true);
    toast.loading("Uploading files...");

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
      setResults(response.data);
      toast.success("Files uploaded and processed successfully!");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files.");
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  return (
    <div className="flex justify-center min-h-screen p-6">
      <Card className="w-full p-6 border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-700">
            Upload MCQ Answer Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid items-center w-full max-w-4xl mx-auto grid-cols-12 gap-2 ">
            <Label
              htmlFor="file-upload"
              className="text-gray-600 text-center font-medium col-span-2"
            >
              Choose files
            </Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              className="col-span-7 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf,.zip,.rar"
            />
            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all col-span-3"
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
          {results && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-300">
              <TypographyH2>Extracted Data</TypographyH2>
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Full Name:</strong>{" "}
                  {results.extractedData[0].studentInfo?.fullName}
                </p>
                <p>
                  <strong>Class:</strong>{" "}
                  {results.extractedData[0].studentInfo?.class}
                </p>
                <p>
                  <strong>CIN:</strong>{" "}
                  {results.extractedData[0].studentInfo?.cin}
                </p>
                <h3 className="mt-4 font-semibold">Extracted Text:</h3>
                <pre className="overflow-x-auto whitespace-pre-wrap bg-white p-2 border rounded">
                  {results.extractedData[0].text}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
