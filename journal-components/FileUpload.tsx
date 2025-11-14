
import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  file: File | null;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onFileClear, file, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const dragDropClasses = isDragging
    ? 'border-primary bg-primary/10'
    : 'border-border hover:border-primary';

  return (
    <div className="bg-surface rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-text mb-4">Step 1: Upload Your Excel File</h2>
      
      {!file ? (
        <>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200 ${dragDropClasses}`}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
             <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="mt-2 text-sm font-medium text-text">
                  <span className="text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-text-secondary">XLSX or XLS files</p>
            </div>
            {isProcessing && <div className="absolute inset-0 bg-surface/50 flex items-center justify-center"><p>Processing...</p></div>}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between bg-background p-3 rounded-md border border-border">
          <div className="flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium text-sm">{file.name}</span>
          </div>
          <button
            onClick={onFileClear}
            className="text-text-secondary hover:text-error transition-colors p-1 rounded-full"
            title="Remove file"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};
