import { Calendar, UploadCloud, X, CheckCircle, AlertCircle } from "lucide-react";
import React, { useState, useCallback, useEffect } from "react";
import Dropzone from "react-dropzone";
import { uploadFile, testFirebaseConnection, testUpload } from "@/lib/firebase";

const MeetingCard = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setUploadedUrl(null);
    setProgress(null);
    setSelectedFile(null);
  }, []);

  const handleDrop = async (acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log('=== handleDrop called ===');
    console.log('Accepted files:', acceptedFiles.length);
    console.log('Rejected files:', rejectedFiles.length);
    
    resetState();
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      console.log('File rejection details:', rejection);
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 100MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('File type not supported. Please upload audio, video, PDF, DOCX, or text files.');
      } else {
        setError('File rejected. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length === 0) {
      console.log('No accepted files');
      return;
    }
    
    const file = acceptedFiles[0];
    if (!file) {
      console.log('No file found in accepted files');
      return;
    }
    
    console.log('Processing file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    setSelectedFile(file);
    setUploading(true);
    
    try {
      console.log('Calling uploadFile...');
      const url = await uploadFile(file, setProgress);
      console.log('Upload completed, URL:', url);
      setUploadedUrl(url);
    } catch (err: any) {
      console.error('=== Upload error in handleDrop ===');
      console.error('Error details:', err);
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      console.log('Setting uploading to false');
      setUploading(false);
      setProgress(null);
    }
  };

  const handleRemoveFile = () => {
    resetState();
  };

  const handleTestUpload = async () => {
    setError(null);
    setUploadedUrl(null);
    setUploading(true);
    
    try {
      console.log('Starting test upload...');
      const url = await testUpload();
      setUploadedUrl(url);
      console.log('Test upload completed successfully');
    } catch (err: any) {
      console.error('Test upload error:', err);
      setError(err.message || "Test upload failed. Please check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('word') || file.type.includes('document')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Test Firebase connection on component mount
  useEffect(() => {
    testFirebaseConnection().then((isConnected) => {
      if (!isConnected) {
        setError('Firebase connection failed. Please check your configuration.');
      }
    });
  }, []);

  return (
    <div>
      {/* Meeting Upload Card */}
      <div className="bg-card border-muted-foreground flex h-96 flex-col rounded-2xl border p-6 shadow-lg transition-all hover:shadow-xl">
        <div className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
          <Calendar className="h-5 w-5" />
          <span>Upload Meeting</span>
        </div>
        
        <div className="text-muted-foreground bg-muted border-primary/20 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
          {selectedFile && !uploading && !uploadedUrl && (
            <div className="mb-4 w-full">
              <div className="flex items-center justify-between rounded-lg bg-background p-3 border">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getFileIcon(selectedFile)}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <Dropzone
            onDrop={handleDrop}
            multiple={false}
            maxSize={100 * 1024 * 1024} // 100MB
            accept={{
              "audio/*": [],
              "video/*": [],
              "application/pdf": [],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
              "application/msword": [],
              "text/plain": [],
              "application/zip": [],
              "application/x-zip-compressed": [],
            }}
            disabled={uploading}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <section className="w-full">
                <div
                  {...getRootProps()}
                  className={`flex flex-col items-center justify-center cursor-pointer transition border-2 border-dashed rounded-lg p-6 ${
                    isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30"
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  tabIndex={0}
                  aria-label="File upload area"
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mb-2 h-8 w-8 text-primary/60" />
                  <p className="font-medium">
                    {isDragActive
                      ? "Drop the file here..."
                      : uploading 
                        ? "Uploading..."
                        : "Drag & drop a meeting file here, or click to select"}
                  </p>
                  <span className="text-xs text-muted-foreground mt-1">
                    Supported: audio, video, PDF, DOCX, text files (max 100MB)
                  </span>
                  
                  {progress !== null && (
                    <div className="mt-4 w-full">
                      <div className="h-2 w-full rounded bg-muted-foreground/20">
                        <div
                          className="h-2 rounded bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-primary font-medium">{progress}%</span>
                        <span className="text-xs text-muted-foreground">Uploading...</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </Dropzone>

          {/* Error Display */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Display */}
          {uploadedUrl && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>File uploaded successfully!</span>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                View file
              </a>
            </div>
          )}
        </div>

        <button
          className="bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary/40 mt-6 self-end rounded-lg px-5 py-2 text-sm font-semibold shadow-md transition hover:shadow-lg focus:ring-2 focus:outline-none active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={uploading || !uploadedUrl}
        >
          {uploading ? "Uploading..." : uploadedUrl ? "Schedule Meeting" : "Upload a file first"}
        </button>
        
        {/* Test Upload Button for Debugging */}
        <button
          onClick={handleTestUpload}
          disabled={uploading}
          className="bg-blue-500 hover:bg-blue-600 text-white mt-2 self-end rounded-lg px-4 py-2 text-sm font-medium shadow-md transition hover:shadow-lg focus:ring-2 focus:outline-none active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? "Testing..." : "Test Upload"}
        </button>
        
        {/* Test Connection Button for Debugging */}
        <button
          onClick={async () => {
            try {
              const isConnected = await testFirebaseConnection();
              if (isConnected) {
                alert('Firebase connection successful!');
              } else {
                alert('Firebase connection failed. Check console for details.');
              }
            } catch (error) {
              console.error('Connection test error:', error);
              alert('Connection test failed. Check console for details.');
            }
          }}
          className="bg-green-500 hover:bg-green-600 text-white mt-2 self-end rounded-lg px-4 py-2 text-sm font-medium shadow-md transition hover:shadow-lg focus:ring-2 focus:outline-none active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Test Connection
        </button>
      </div>
    </div>
  );
};

export default MeetingCard;
