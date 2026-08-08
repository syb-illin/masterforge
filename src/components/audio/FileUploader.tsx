import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FileUploaderProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUploader({ isDragging, onDragOver, onDragLeave, onDrop, onFileInput }: FileUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
        ${isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900'}
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileInput} 
        className="hidden" 
        multiple 
        accept="audio/*,.wav" 
      />
      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
        <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
      </div>
      <h3 className="text-lg font-medium mb-2">{t("upload_title")}</h3>
      <p className="text-gray-500 text-sm">{t("upload_desc")}</p>
    </div>
  );
}
