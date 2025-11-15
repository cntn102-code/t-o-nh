
import React from 'react';

interface HeaderProps {
  onHomeClick: () => void;
  onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, onHistoryClick }) => {
  const handleApiKeyClick = async () => {
    // @ts-ignore
    if (window.aistudio) {
        try {
            // @ts-ignore
            await window.aistudio.openSelectKey();
        } catch (error) {
            console.error("Error selecting API key:", error);
        }
    } else {
        alert("Tính năng này chỉ khả dụng trên môi trường Google AI Studio / IDX hoặc khi 'window.aistudio' được hỗ trợ. Vui lòng cấu hình API_KEY trong biến môi trường.");
    }
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-700">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={onHomeClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104l-2.286 9.144a3.75 3.75 0 003.75 4.498h3.393a3.75 3.75 0 003.75-4.498L14.25 3.104M3 13.5h18" />
          </svg>
          <span className="text-xl font-bold text-white">AI Image Editor Pro</span>
        </div>
        <div className="flex gap-4">
           <button
            onClick={handleApiKeyClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 transition-colors"
            aria-label="Cài đặt API Key"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            API Key
          </button>
           <button
            onClick={onHistoryClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 transition-colors"
            aria-label="Xem lịch sử chỉnh sửa"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lịch sử
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
