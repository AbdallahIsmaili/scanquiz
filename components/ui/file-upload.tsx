import { useCallback } from "react";

interface FileUploadProps {
  id: string;
  accept: string;
  onFileChange: (file: File | null) => void;
}

export function FileUpload({ id, accept, onFileChange }: FileUploadProps) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      onFileChange(file);
    },
    [onFileChange]
  );

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor={id}
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
      >
        <div className="text-sm text-gray-500">
          Drag & drop or <span className="text-blue-500">browse</span> your file
        </div>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
