import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCheck, AlertTriangle, Plus, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Pub } from '../context/PubDataContext';
import FileTypeDialog from './FileTypeDialog';
import FilePreview from './FilePreview';
import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';

interface FileUploaderProps {
  onFileLoaded: (data: Pub[], type: string, fileName: string) => void;
  className?: string;
  isLoaded: boolean;
  onDeadlineSet?: (date: string) => void;
  uploadedFiles: {
    type: string;
    name: string;
    count: number;
    priority: number;
    deadline?: string;
    color: string;
    fileName?: string;
  }[];
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileLoaded, 
  className = '',
  isLoaded,
  onDeadlineSet,
  uploadedFiles
}) => {
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setError(null);
    
    // If no files uploaded yet, automatically set as masterhouse
    if (uploadedFiles.length === 0) {
      processFile(file, 'masterhouse');
    } else {
      setShowTypeDialog(true);
    }
  }, [uploadedFiles]);

  const processFile = useCallback((file: File, type: string, deadline?: string) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Pub>(worksheet);

        // Pass data to parent component
        onFileLoaded(jsonData, type, file.name);
        
        if (deadline && onDeadlineSet) {
          onDeadlineSet(deadline);
        }

        setShowTypeDialog(false);
        setSelectedFile(null);
        setError(null);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setError('Error parsing Excel file. Please check the format and try again.');
      }
    };

    reader.readAsBinaryString(file);
  }, [onFileLoaded, onDeadlineSet]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  return (
    <div className="space-y-4">
      <FilePreview 
        files={uploadedFiles}
        onEdit={() => {}} // Implement edit functionality if needed
      />

      <div 
        {...getRootProps()} 
        className={clsx(
          "animated-border relative overflow-hidden",
          isDragActive 
            ? 'bg-gradient-to-r from-neon-purple/20 via-neon-pink/20 to-neon-blue/20' 
            : 'bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90',
          "backdrop-blur-sm rounded-lg p-4 text-center cursor-pointer",
          "transition-all duration-300 hover:shadow-neon-purple",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center gap-3">
          {uploadedFiles.length === 0 ? (
            <>
              <ArrowDown className="h-6 w-6 text-neon-pink animate-bounce" />
              <div>
                <p className="font-medium text-eggplant-100">
                  Start by uploading your Masterhouse list
                </p>
                <p className="text-sm text-eggplant-200">
                  Drop Excel file or click to browse
                </p>
              </div>
            </>
          ) : (
            <>
              <Plus className="h-6 w-6 text-neon-pink" />
              <div>
                <p className="font-medium text-eggplant-100">
                  Add another list
                </p>
                <p className="text-sm text-eggplant-200">
                  Drop Excel file or click to browse
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <FileTypeDialog
        isOpen={showTypeDialog}
        onClose={() => setShowTypeDialog(false)}
        onSubmit={(type, deadline, priorityLevel, followUpDays) => {
          if (selectedFile) {
            processFile(selectedFile, type, deadline);
          }
        }}
        error={error}
        setError={setError}
      />
    </div>
  );
};

export default FileUploader;