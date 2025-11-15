import React, { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';
import LoadingSpinner from '../LoadingSpinner';
import FeatureContainer from './FeatureContainer';
import UndoRedoControls from '../UndoRedoControls';
import SendToFeature from '../SendToFeature';
import ResultEditor from '../ResultEditor';
import { extractAccessory, editImageWithPrompt } from '../../services/geminiService';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import type { Session, ExtractAccessoryParams } from '../../types';
import { Feature } from '../../types';

interface AccessoryExtractorProps {
  sessionToLoad: Session | null;
  onSaveSession: (sessionData: Omit<Session, 'id' | 'timestamp' | 'featureId' | 'featureTitle'>) => void;
  imageToLoad: string | null;
  onSendImage: (image: string, featureId: Feature) => void;
}

const AccessoryExtractor: React.FC<AccessoryExtractorProps> = ({ sessionToLoad, onSaveSession, imageToLoad, onSendImage }) => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const {
    state: resultImages,
    setState: setResultImages,
    resetState: resetResultImages,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (imageToLoad) {
      setBaseImage(imageToLoad);
      resetResultImages([]);
    }
  }, [imageToLoad]);

  useEffect(() => {
    if (sessionToLoad && sessionToLoad.featureId === Feature.ExtractAccessory) {
      setBaseImage(sessionToLoad.originalImage);
      resetResultImages(sessionToLoad.resultImages);
      const params = sessionToLoad.parameters as ExtractAccessoryParams;
      setPrompt(params.prompt);
      setNumberOfImages(params.numberOfImages);
    }
  }, [sessionToLoad]);
  
  const handleImageUpload = (image: string) => {
    setBaseImage(image);
    resetResultImages([]);
  };

  const handleSubmit = async () => {
    if (!baseImage || !prompt) {
      setError('Vui lòng tải lên một ảnh và mô tả món đồ cần tách.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const results: string[] = [];
    try {
      for (let i = 0; i < numberOfImages; i++) {
        setLoadingMessage(`Đang tạo ảnh ${i + 1} trên ${numberOfImages}...`);
        const newImage = await extractAccessory(baseImage, prompt);
        results.push(newImage);
      }
      setResultImages(results);
      onSaveSession({
        originalImage: baseImage,
        resultImages: results,
        parameters: { prompt, numberOfImages },
      });
    } catch (e) {
      setError(`Đã xảy ra lỗi: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleEditImage = async (prompt: string, index: number) => {
    if (editingIndex !== null) return;
    setEditingIndex(index);
    setError(null);
    try {
        const imageToEdit = resultImages[index];
        const newImage = await editImageWithPrompt(imageToEdit, prompt);
        
        const updatedResultImages = [...resultImages];
        updatedResultImages[index] = newImage;
        
        setResultImages(updatedResultImages);
    } catch (e) {
        setError(`Lỗi khi chỉnh sửa ảnh: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
        setEditingIndex(null);
    }
  };

  return (
    <>
      <FeatureContainer
        title="Tách trang phục & phụ kiện"
        description="Tải lên ảnh chân dung và mô tả món đồ (áo, mũ, đồng hồ...) để AI tạo ảnh sản phẩm cho món đồ đó."
        onSubmit={handleSubmit}
        isLoading={isLoading}
        canSubmit={!!baseImage && !!prompt}
      >
        <ImageUploader id="accessory-extractor-img" onImageUpload={handleImageUpload} value={baseImage} title="1. Tải lên ảnh chân dung"/>
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">2. Mô tả món đồ cần tách</label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: đồng hồ, mũ, áo sơ mi, váy, nhẫn..."
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="num-images" className="block text-sm font-medium text-gray-300">3. Số lượng ảnh kết quả</label>
          <select 
              id="num-images"
              value={numberOfImages}
              onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-700 border-slate-600 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
          >
              <option value={1}>1 ảnh</option>
              <option value={2}>2 ảnh</option>
              <option value={3}>3 ảnh</option>
              <option value={4}>4 ảnh</option>
          </select>
        </div>
      </FeatureContainer>

      {isLoading && (
          <div className="mt-8 flex flex-col items-center justify-center">
            <LoadingSpinner />
            {loadingMessage && <p className="text-lg text-gray-300 mt-2">{loadingMessage}</p>}
          </div>
      )}
      {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      
      {resultImages.length > 0 && (
        <div className="mt-8">
            <h3 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500">Kết quả</h3>
             <UndoRedoControls
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {resultImages.map((image, index) => (
                    <div key={index} className="bg-slate-800 p-2 rounded-lg flex flex-col gap-2">
                        <div className="relative">
                            {editingIndex === index && (
                                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-md z-10">
                                    <LoadingSpinner />
                                </div>
                            )}
                            <img 
                              src={image} 
                              alt={`Extracted item ${index + 1}`} 
                              className="w-full h-auto object-contain rounded-md bg-white cursor-zoom-in"
                              onClick={() => window.dispatchEvent(new CustomEvent('imageZoomRequest', { detail: image }))} 
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <a
                                href={image}
                                download={`extracted-item-${index + 1}.png`}
                                className="w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                            >
                                Tải xuống
                            </a>
                            <SendToFeature 
                                image={image} 
                                currentFeatureId={Feature.ExtractAccessory} 
                                onSend={onSendImage}
                                className="text-sm"
                            />
                        </div>
                         <ResultEditor 
                            onEdit={(prompt) => handleEditImage(prompt, index)}
                            isEditing={editingIndex === index}
                        />
                    </div>
                ))}
            </div>
        </div>
      )}
    </>
  );
};

export default AccessoryExtractor;
