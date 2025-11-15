
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onHomeClick: () => void;
  onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, onHistoryClick }) => {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [storedKey, setStoredKey] = useState<string | null>(null);

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    setStoredKey(key);
    if (key) {
      setApiKeyInput(key);
    }
  }, [isApiKeyModalOpen]);

  const handleApiKeyClick = () => {
    setIsApiKeyModalOpen(true);
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('gemini_api_key', apiKeyInput.trim());
      setStoredKey(apiKeyInput.trim());
      setIsApiKeyModalOpen(false);
      // Reload page to ensure new key is used by the service
      window.location.reload();
    }
  };

  const handleDeleteApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setStoredKey(null);
    setApiKeyInput('');
    setIsApiKeyModalOpen(false);
    // Reload page to clear the key from memory/service
    window.location.reload();
  };

  return (
    <>
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

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Cấu hình API Key</h3>
            <p className="text-gray-400 text-sm mb-4">
              Nhập Google Gemini API Key của bạn. Key sẽ được lưu trong trình duyệt của bạn để sử dụng cho các tính năng AI.
            </p>
            <div className="mb-6">
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                id="api-key-input"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Dán API Key của bạn vào đây..."
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3">
               <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                Đóng
              </button>
              {storedKey && (
                <button
                  onClick={handleDeleteApiKey}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Xóa Key
                </button>
              )}
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                Lưu Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
