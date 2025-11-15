
import React, { useRef, useEffect } from 'react';

interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  id: string;
  title?: string;
  value: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, id, title = "Tải ảnh lên", value }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAreaClick = () => {
      fileInputRef.current?.click();
  }
  
  useEffect(() => {
    // This allows re-uploading the same file after the value has been cleared.
    if (!value && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [value]);

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{title}</label>
      <div 
        onClick={handleAreaClick}
        className="w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex justify-center items-center text-center cursor-pointer hover:border-purple-400 hover:bg-slate-800/50 transition-colors"
      >
        <input
          id={id}
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {value ? (
          <img src={value} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
        ) : (
          <div className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Nhấp hoặc kéo và thả để tải ảnh lên</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;