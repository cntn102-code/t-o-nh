export enum Feature {
  ChangeBackground = 'CHANGE_BACKGROUND',
  ChangeOutfit = 'CHANGE_OUTFIT',
  RestorePhoto = 'RESTORE_PHOTO',
  ExpandImage = 'EXPAND_IMAGE',
  ChangeStyle = 'CHANGE_STYLE',
  CompositeImages = 'COMPOSITE_IMAGES',
  GenerateIdPhoto = 'GENERATE_ID_PHOTO',
  BeautifyPhoto = 'BEAUTIFY_PHOTO',
  GenerateConceptPhoto = 'GENERATE_CONCEPT_PHOTO',
  GenerateFromIdea = 'GENERATE_FROM_IDEA',
  ReplicatePose = 'REPLICATE_POSE',
  IncreaseResolution = 'INCREASE_RESOLUTION',
  GenerateConsistentCharacter = 'GENERATE_CONSISTENT_CHARACTER',
  ExtractAccessory = 'EXTRACT_ACCESSORY',
  GeneratePoster = 'GENERATE_POSTER',
  GenerateAffiliateImage = 'GENERATE_AFFILIATE_IMAGE',
}

export interface OutfitChangeOptions {
  type: 'prompt' | 'image';
  promptValue: string;
  imageValue: string[];
}

export interface IdPhotoOptions {
    size: string;
    backgroundColor: 'Trắng' | 'Xanh';
    outfitChangeType: 'none' | 'prompt' | 'image';
    outfitPrompt: string;
    outfitImage: string | null;
    hairDescription: string;
    removeBlemishes: boolean;
    autoAdjustLighting: boolean;
    autoAdjustFace: boolean;
}

export interface ConceptPhotoOptions {
  numberOfImages: number;
  size: '1:1' | '9:16' | '16:9';
}

export interface GenerateFromIdeaOptions {
  inputType: 'prompt' | 'sketch';
  prompt: string;
  sketchImage: string | null;
  outputType: 'photo' | 'drawing';
  drawingStyle: 'pencil' | 'ink' | 'none' | 'blue_ballpoint' | 'red_ballpoint';
  aspectRatio: '1:1' | '16:9' | '9:16';
  numberOfImages: number;
}


// New types for session history
export interface BackgroundChangerParams {
  prompt: string;
  numberOfImages: number;
}

export interface OutfitChangerParams {
  options: OutfitChangeOptions;
  numberOfImages: number;
}

export interface RestorePhotoParams {}

export interface IncreaseResolutionParams {
  resolution: 'Full HD' | '2K' | '4K' | '8K';
}

export interface ExpandImageParams {
  numberOfImages: number;
}

export interface StyleChangerParams {
  movement: string;
  material: string;
  illustrativeStyle: string;
  numberOfImages: number;
}

export interface CompositeImagesParams {
  prompt: string;
  numberOfImages: number;
  additionalImages: string[];
}

export interface IdPhotoGeneratorParams {
  options: IdPhotoOptions;
}

export interface BeautifyPhotoParams {
  selections: Record<string, boolean>;
  hairColor?: string;
  makeupStyle?: string;
  lightingEffect?: string;
  lightDirection?: string;
  shootingAngle?: string;
}

export interface ConceptGeneratorParams {
  prompt: string;
  options: ConceptPhotoOptions;
}

export interface GenerateFromIdeaParams {
  options: GenerateFromIdeaOptions;
}

export interface ReplicatePoseParams {
  poseImage: string;
  numberOfImages: number;
}

export interface ConsistentCharacterParams {
  prompt: string;
  characterImages: string[];
  aspectRatio: '1:1' | '16:9' | '9:16';
  quality: 'Standard' | 'High';
  numberOfImages: number;
}

export interface ExtractAccessoryParams {
  prompt: string;
  numberOfImages: number;
}

export interface PosterGeneratorParams {
  topic: string;
  slogan: string;
  posterType: 'Giáo dục' | 'Điện ảnh' | 'Tiếp thị';
  style: 'Hiện đại' | 'Cổ điển' | 'Tối giản' | 'Năng động' | 'Nghệ thuật' | 'Dễ thương' | 'Ảnh mẫu';
  styleImage?: string | null;
  aspectRatio: '1:1' | '3:4' | '9:16' | '16:9';
  images: string[];
  mainImageIndex: number;
  numberOfImages: number;
}

export interface AffiliateImageGeneratorParams {
  mode: 'kol' | 'product';
  prompt: string;
  modelImages: string[];
  products: { image: string; name: string }[];
  backgroundImage?: string | null;
  aspectRatio: '1:1' | '16:9' | '9:16';
  quality: 'Standard' | 'High';
  numberOfImages: number;
  imageType: 'Realistic' | 'Artistic';
}

export type FeatureParams =
  | BackgroundChangerParams
  | OutfitChangerParams
  | RestorePhotoParams
  | ExpandImageParams
  | StyleChangerParams
  | CompositeImagesParams
  | IdPhotoGeneratorParams
  | BeautifyPhotoParams
  | ConceptGeneratorParams
  | GenerateFromIdeaParams
  | ReplicatePoseParams
  | IncreaseResolutionParams
  | ConsistentCharacterParams
  | ExtractAccessoryParams
  | PosterGeneratorParams
  | AffiliateImageGeneratorParams;


export interface Session {
  id: number; // using timestamp for simplicity
  featureId: Feature;
  featureTitle: string;
  originalImage: string;
  resultImages: string[];
  parameters: FeatureParams;
  timestamp: string; // ISO string
}