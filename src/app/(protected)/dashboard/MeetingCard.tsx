import { Calendar, UploadCloud } from "lucide-react";
import React, { useState } from "react";
import Dropzone from "react-dropzone";
import { uploadFile } from "@/lib/firebase";

const MeetingCard = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async (acceptedFiles: File[]) => {
    setError(null);
    setUploadedUrl(null);
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      const file = acceptedFiles[0];
      if (!file) {
        throw new Error("No file provided.");
      }
      const url = await uploadFile(file, setProgress);
      setUploadedUrl(url);
    } catch (err: any) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div>
      {/* Meeting Upload Card */}
      <div className="bg-card border-muted-foreground flex h-96 flex-col rounded-2xl border p-6 shadow-lg transition-all hover:shadow-xl">
        <div className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
          <Calendar className="h-5 w-5" />
          <span>Upload Meeting</span>
        </div>
        <div className="text-muted-foreground bg-muted border-primary/20 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
          <Dropzone
            onDrop={handleDrop}
            multiple={false}
            accept={{
              "audio/*": [],
              "video/*": [],
              "application/pdf": [],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
              "application/msword": [],
            }}
            disabled={uploading}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <section>
                <div
                  {...getRootProps()}
                  className={`flex flex-col items-center justify-center cursor-pointer transition border-2 border-dashed rounded-lg p-4 ${
                    isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30"
                  }`}
                  tabIndex={0}
                  aria-label="File upload area"
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mb-2 h-8 w-8 text-primary/60" />
                  <p className="font-medium">
                    {isDragActive
                      ? "Drop the file here..."
                      : "Drag & drop a meeting file here, or click to select"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Supported: audio, video, PDF, DOCX
                  </span>
                  {progress !== null && (
                    <div className="mt-2 w-full">
                      <div className="h-2 w-full rounded bg-muted-foreground/20">
                        <div
                          className="h-2 rounded bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-primary">{progress}%</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-2 text-xs text-destructive">{error}</div>
                  )}
                  {uploadedUrl && (
                    <div className="mt-2 text-xs text-green-600">
                      File uploaded!{" "}
                      <a
                        href={uploadedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        View file
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}
          </Dropzone>
        </div>
        <button
          className="bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary/40 mt-6 self-end rounded-lg px-5 py-2 text-sm font-semibold shadow-md transition hover:shadow-lg focus:ring-2 focus:outline-none active:scale-95 disabled:opacity-60"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Schedule Meeting"}
        </button>
      </div>
    </div>
  );
};

export default MeetingCard;
