
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";
import type { IdPhotoOptions, BeautifyPhotoParams } from '../types';

const editModel = 'gemini-2.5-flash-image';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key chưa được thiết lập. Vui lòng nhấn nút 'API Key' trên thanh menu để chọn hoặc cấu hình biến môi trường API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

const fileToGenerativePart = (dataUrl: string): Part => {
  const [header, data] = dataUrl.split(',');
  if (!header || !data) throw new Error("Invalid data URL format");
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  return {
    inlineData: {
      data,
      mimeType,
    },
  };
};

const performImageEdit = async (prompt: string, ...images: string[]): Promise<string> => {
  if (images.length === 0) {
    throw new Error("At least one image must be provided.");
  }

  const ai = getAiClient();
  const imageParts = images.map(fileToGenerativePart);
  const textPart: Part = { text: prompt };

  const contents = {
    parts: [...imageParts, textPart]
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: editModel,
    contents: contents,
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const base64ImageBytes = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("No image was generated in the response. The model may have refused the request.");
};

export const editImageWithPrompt = (baseImage: string, prompt: string): Promise<string> => {
  const fullPrompt = `You are an expert AI image editor. Please edit the provided image based on the following instruction: "${prompt}". Preserve the parts of the image that are not related to the instruction. The final result should be a single, high-quality, edited image.`;
  return performImageEdit(fullPrompt, baseImage);
};

export const generateImageFromText = async (
  prompt: string,
  config: { aspectRatio: '1:1' | '16:9' | '9:16' | '3:4' | '4:3', numberOfImages: number }
): Promise<string[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: config.numberOfImages,
      outputMimeType: 'image/png',
      aspectRatio: config.aspectRatio,
    },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No image was generated. The prompt may have been refused.");
  }
  
  return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateImageFromSketch = (
    sketchImage: string, 
    userPrompt: string, 
    stylePrompt: string, 
    aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<string> => {
    const sizeDescription = {
        '1:1': 'a square aspect ratio',
        '9:16': 'a vertical portrait aspect ratio (9:16)',
        '16:9': 'a horizontal landscape aspect ratio (16:9)',
    }[aspectRatio];

    const prompt = `You are an AI art generator. You will be given a rough sketch and a text prompt. Your task is to transform the sketch into a complete, high-quality image.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the Sketch:** The sketch may contain handwritten notes, arrows, or labels meant as instructions. You MUST interpret these as annotations and **DO NOT** draw them in the final image.
2.  **Identify In-Scene Text:** If there is text that is clearly part of the intended scene (e.g., text on a sign, a logo on a shirt), you MUST include it in the final image.
3.  **Apply Style:** Redraw the entire scene in the following style: "${stylePrompt}".
4.  **Incorporate User Prompt:** Use the following description to guide the final composition and details: "${userPrompt}".
5.  **Final Image:** The output must be a single, polished image with ${sizeDescription}. It should be a creative realization of the sketch, not a literal copy.`;

    return performImageEdit(prompt, sketchImage);
};


export const editWithMask = (baseImage: string, maskImage: string, prompt: string): Promise<string> => {
    const fullPrompt = `You are an expert AI image editor. You will be given an image, a mask, and a text prompt.
Your task is to edit the area of the image that is WHITE on the mask, according to the text prompt.
The rest of the image (the area that is BLACK on the mask) must remain completely unchanged and preserved.
The final output should be a single, edited image with no mask visible.

Text Prompt: "${prompt}"`;
    return performImageEdit(fullPrompt, baseImage, maskImage);
};


export const changeBackground = (baseImage: string, backgroundPrompt: string): Promise<string> => {
  const prompt = `You are an expert photo editor. Your task is to realistically change the background of the provided image.
1.  **Segment:** Carefully identify and isolate the main subject(s) in the foreground.
2.  **Replace Background:** Create a new background based on the user's description: "${backgroundPrompt}".
3.  **Integrate Subject:** This is the most important step. Realistically place the foreground subject into the new background. You MUST adjust the subject to match the new environment. This includes:
    *   **Lighting:** Match the direction, intensity, and color of the light sources in the new background. Adjust highlights and shadows on the subject accordingly.
    *   **Color Grading:** Harmonize the subject's colors with the overall color palette and temperature of the new background.
    *   **Reflections:** If applicable, add subtle reflections from the new environment onto the subject.
    *   **Edges:** Ensure the edges of the subject are blended smoothly and naturally with the new background.
4.  **Final Output:** The final image should be a single, photorealistic composition where the subject looks like it was naturally part of the new scene. Do not just cut and paste the subject.`;
  return performImageEdit(prompt, baseImage);
};

export const changeOutfitWithPrompt = (baseImage: string, outfitPrompt: string): Promise<string> => {
  const prompt = `Change the outfit of the person in the image to: "${outfitPrompt}". Maintain the person's pose, face, and the original background as closely as possible.`;
  return performImageEdit(prompt, baseImage);
};

export const changeOutfitWithImage = (baseImage: string, outfitImages: string[]): Promise<string> => {
  const prompt = `You are an AI fashion assistant. You will be given several images. The first image is of a person. The subsequent images are articles of clothing or accessories.

Your task is to edit the first image by dressing the person in ALL the items from the other images. Combine them into a single cohesive outfit.

**Strict Instructions:**
1.  **Identify the person** in the first image.
2.  **Identify all clothing/accessory items** in the subsequent images.
3.  **Combine and replace the outfit:** Carefully and realistically place all the items onto the person in the first image, creating a complete outfit.
4.  **Preserve everything else:** Do NOT change the person's face, hair, pose, or the background from the first image. The only change should be the clothing.
5.  **Result:** The final output must be a single, edited image of the person from the first image wearing the new combined outfit.`;
  return performImageEdit(prompt, baseImage, ...outfitImages);
};

export const restorePhoto = (baseImage: string): Promise<string> => {
  const prompt = "Analyze this image. It appears to be an old or damaged photograph. Please restore it by enhancing details, correcting colors, removing scratches, dust, and creases, and improving the overall clarity and quality. Aim for a natural restoration, preserving the original character of the photo.";
  return performImageEdit(prompt, baseImage);
};

export const increaseResolution = (baseImage: string, resolution: 'Full HD' | '2K' | '4K' | '8K'): Promise<string> => {
  const resolutionText = {
    'Full HD': 'Full HD (1080p)',
    '2K': '2K',
    '4K': '4K',
    '8K': 'stunning 8K',
  }[resolution];

  const prompt = `You are an expert AI image upscaler. Your task is to increase the resolution and enhance the details of the provided image to a ${resolutionText} quality. Do not change the content, subject, or composition of the image. The goal is to make it sharper, clearer, and higher quality, as if it were taken with a better camera. Add realistic fine details, textures, and clarity. Reduce any compression artifacts, noise, or blurriness. The output must be a high-resolution version of the original image at the specified quality.`;
  return performImageEdit(prompt, baseImage);
};

export const expandImage = (canvasWithImage: string): Promise<string> => {
  const prompt = `This is a technique called "outpainting". The provided image contains a smaller picture placed within a larger transparent frame. Your task is to intelligently and seamlessly fill in the transparent areas, extending the content of the inner picture to create a complete, larger image. Maintain the original image's style, lighting, and content. The final output must be a single, complete image with no transparency.`;
  return performImageEdit(prompt, canvasWithImage);
};

export const changeStyle = (baseImage: string, stylePrompt: string): Promise<string> => {
  const prompt = `Redraw the subject(s) in this image in a completely new artistic style, described as: "${stylePrompt}". The new image should retain the original composition and poses but be rendered in the new style.`;
  return performImageEdit(prompt, baseImage);
};

export const compositeImages = (images: string[], prompt: string): Promise<string> => {
    const fullPrompt = `Combine the following images into a single, cohesive image based on this description: "${prompt}". Pay close attention to scale, lighting, shadows, and perspective to ensure the final result looks realistic. The first image is the primary image, and the others are to be integrated with it.`;
    return performImageEdit(fullPrompt, ...images);
};

export const removeObject = (baseImage: string, maskImage: string): Promise<string> => {
    const prompt = `You are a professional photo retoucher. Your task is to remove the object, person, or blemish indicated by the white area in the mask from the base image. You must then intelligently fill in the removed area by reconstructing the background and textures that were behind the object. The final result must be seamless, photorealistic, and look as if the object was never there. The area outside the mask (black area) must remain completely untouched.`;
    return editWithMask(baseImage, maskImage, prompt);
};

export const replicatePose = (subjectImage: string, poseImage: string): Promise<string> => {
    const prompt = `You are an expert AI image editor. You will be given two images.
Image 1 (Subject Image): Contains a person whose face, identity, and style must be preserved.
Image 2 (Pose Image): Contains a person in a specific pose that must be copied.

Your task is to generate a new, photorealistic image of the subject from Image 1, but in the exact pose shown in Image 2.

**CRITICAL INSTRUCTIONS:**
1.  **Preserve Identity:** The face, hair, body type, and clothing style of the subject from Image 1 MUST be accurately maintained in the new image.
2.  **Copy Pose:** The body posture, limb positions, and overall pose from Image 2 must be precisely replicated for the subject.
3.  **Seamless Integration:** The final image should be a natural and believable composition. If the background from Image 1 is visible, try to preserve it, but adjust it realistically if the new pose requires it.
4.  **Output:** The output must be a single, high-quality image of the person from Image 1 in the pose from Image 2.`;
    return performImageEdit(prompt, subjectImage, poseImage);
};

export const generateIdPhoto = (baseImage: string, options: IdPhotoOptions): Promise<string> => {
    const promptFragments: string[] = [];
    const images: string[] = [baseImage];
    const backgroundColor = options.backgroundColor === 'Trắng' ? 'white' : 'dark blue';

    // 1. Background
    promptFragments.push(`Replace the original background completely with a solid, uniform ${backgroundColor} color. There should be no shadows or patterns.`);

    // 2. Outfit
    switch (options.outfitChangeType) {
        case 'prompt':
            if (options.outfitPrompt) {
                promptFragments.push(`Change the person's outfit to: "${options.outfitPrompt}". The new outfit should fit naturally and look professional.`);
            }
            break;
        case 'image':
            if (options.outfitImage) {
                promptFragments.push(`Change the person's outfit to the one shown in the second image provided. The new outfit should fit naturally and look professional.`);
                images.push(options.outfitImage);
            }
            break;
        case 'none':
        default:
            promptFragments.push("The person's original outfit should be kept, but ensure it looks neat and professional.");
            break;
    }
    
    // 3. Hair
    if (options.hairDescription) {
        promptFragments.push(`Change the hair color and style to: "${options.hairDescription}". The hairstyle should be neat and appropriate for an ID photo.`);
    }

    // 4. Retouching
    const retouchingSteps: string[] = [];
    if (options.removeBlemishes) {
        retouchingSteps.push("remove any blemishes, acne, or freckles for a clear complexion, while maintaining natural skin texture");
    }
    if (options.autoAdjustLighting) {
        retouchingSteps.push("automatically balance the lighting and color for a professional, well-lit portrait with no harsh shadows");
    }
    if (options.autoAdjustFace) {
        retouchingSteps.push("subtly adjust facial features like eyes, nose, and chin to ensure the portrait is well-balanced and symmetrical");
    }

    if (retouchingSteps.length > 0) {
        promptFragments.push(`Perform the following retouching steps: ${retouchingSteps.join('; ')}.`);
    }

    // Sizing and Aspect Ratio
    let aspectRatioPrompt = '';
    switch (options.size) {
        case '3x4 cm':
            aspectRatioPrompt = 'The final image must be cropped to a 3:4 aspect ratio (portrait).';
            break;
        case '4x6 cm':
            aspectRatioPrompt = 'The final image must be cropped to a 2:3 aspect ratio (portrait).';
            break;
        case '2x2 inches (US Passport)':
            aspectRatioPrompt = 'The final image must be cropped to a 1:1 square aspect ratio.';
            break;
        default:
            aspectRatioPrompt = `The aspect ratio should be appropriate for a ${options.size} photo.`;
            break;
    }

    const prompt = `From the provided portrait image(s), create a professional ID photo. The final image must adhere strictly to the following specifications:
  1.  **Subject:** The person must be centered, facing directly forward, with a neutral facial expression. Only the head and shoulders should be visible.
  2.  **Adjustments:** Apply these changes sequentially: ${promptFragments.join(' ')}
  3.  **Quality:** The image must be high-resolution, clear, and well-lit, suitable for official documents.
  4.  **Cropping & Aspect Ratio:** ${aspectRatioPrompt} Do not add any borders or text. The final image should be tightly cropped around the head and shoulders according to the specified aspect ratio.`;
    
    return performImageEdit(prompt, ...images);
};

export const applyBeautification = (baseImage: string, params: BeautifyPhotoParams): Promise<string> => {
    const promptFragments: string[] = [];
    const { selections, hairColor, makeupStyle, lightingEffect, lightDirection, shootingAngle } = params;
  
    const mapping: Record<string, string> = {
      smoothSkin: 'smooth the skin, remove acne, blemishes, and dark spots while retaining natural texture',
      whitenTeeth: 'whiten the teeth',
      brightenEyes: 'brighten the eyes and reduce dark under-eye circles',
      slimFace: 'subtly slim the face for a V-line shape',
      adjustFeatures: 'subtly enhance facial features like making the nose bridge higher, lips fuller, and chin sharper',
      lipstickBlush: 'add natural-looking lipstick and blush',
      eyeMakeup: 'apply subtle eyeliner, mascara, and define the eyebrows',
      changeEyeColor: 'change the eye color to a natural new shade, like using virtual contact lenses',
      contouring: 'apply highlight and contour to sculpt the face',
      evenSkinTone: 'even out the skin tone and apply a brightening effect',
      thickerHair: 'make the hair appear thicker, fuller, and healthier',
      longerLegs: 'subtly elongate the legs to improve proportions',
      slimWaist: 'subtly slim the waist and shoulders for a more defined figure',
      adjustHeight: 'subtly increase the overall height while maintaining realistic proportions',
      straightenPosture: 'correct and straighten the posture for a more confident stance',
      skinFilter: 'apply a gentle filter for a smooth, clear, and radiant skin effect, like in professional portraits',
      blurBackground: 'apply a portrait mode effect by professionally blurring the background (bokeh) to make the subject stand out',
    };
  
    for (const key in selections) {
      if (selections[key] && mapping[key]) {
        promptFragments.push(mapping[key]);
      }
    }
  
    if (makeupStyle) {
      promptFragments.push(`apply a full makeup look in a '${makeupStyle}' style`);
    }
    if (hairColor) {
      promptFragments.push(`change the hair color and style to '${hairColor}'`);
    }
    if (lightingEffect) {
      promptFragments.push(`adjust the lighting to create a '${lightingEffect}' effect (e.g., natural sunlight, studio lighting)`);
    }
    if (lightDirection) {
        promptFragments.push(`change the main light source direction to be '${lightDirection}'`);
    }
    if (shootingAngle) {
        promptFragments.push(`change the camera angle to a '${shootingAngle}'`);
    }
    
    if (promptFragments.length === 0) {
        throw new Error("No beautification options were selected.");
    }
  
    const prompt = `Analyze the person and their body in this image. Perform a professional, high-quality retouching process. The result must look natural and realistic. Apply ONLY the following adjustments: ${promptFragments.join('; ')}. Do not make any other changes to the image.`;
    
    return performImageEdit(prompt, baseImage);
};


export const generateConceptPhoto = (baseImage: string, conceptPrompt: string, size: '1:1' | '9:16' | '16:9'): Promise<string> => {
    const sizeDescription = {
        '1:1': 'a square aspect ratio',
        '9:16': 'a vertical portrait aspect ratio (9:16)',
        '16:9': 'a horizontal landscape aspect ratio (16:9)',
    }[size];

    const prompt = `Take the primary subject (person or object) from the provided image. Recreate the subject in a completely new scene and style based on the following concept: "${conceptPrompt}". 
    - The subject's key features and general appearance should be preserved but integrated naturally into the new environment.
    - The final image must be a high-quality, photorealistic composition.
    - The composition must have ${sizeDescription}.
    - Do not include any text or watermarks.
    - The background should be completely replaced by the new concept.`;

    return performImageEdit(prompt, baseImage);
};

export const generateConsistentCharacterImage = (
    characterImages: string[],
    scenePrompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16',
    quality: 'Standard' | 'High'
): Promise<string> => {
    if (characterImages.length === 0) {
        throw new Error("At least one character image must be provided.");
    }

    const characterRefs = characterImages.map((_, index) => `- Image ${index + 1} is a reference for Character ${index + 1}.`).join('\n');
    
    const qualityPrompt = quality === 'High' ? 'The final image should be highly detailed, photorealistic, 8k resolution, and professional quality.' : '';
    const aspectRatioPrompt = `The final image must have a ${aspectRatio} aspect ratio.`;

    const fullPrompt = `You are an expert AI image generator specializing in creating scenes with consistent characters. You will be given several reference images, each defining a unique character, and a text prompt describing a scene.

**Reference Images:**
${characterRefs}

**Scene Description:** "${scenePrompt}"

**Your Task:**
Create a new, cohesive image that accurately depicts the scene described. The characters in the new image MUST be the same people from the reference images. Maintain their facial features, hair, and general appearance.

**CRITICAL INSTRUCTIONS:**
1.  Do not merge the characters into one person. Each character from the reference images should appear as a distinct individual in the final scene.
2.  Place the characters in the scene naturally, interacting with the environment and each other as described in the prompt.
3.  Preserve the identity of each character from their respective reference image.
4.  ${qualityPrompt}
5.  ${aspectRatioPrompt}
6.  The final output must be a single, complete image.`;

    return performImageEdit(fullPrompt, ...characterImages);
};

export const extractAccessory = (baseImage: string, itemPrompt: string): Promise<string> => {
  const prompt = `You are an expert AI product photographer. Analyze the provided image. Your task is to identify the specific item described by the user: "${itemPrompt}".
Once identified, you must generate a new, high-quality product photograph of ONLY that item.

**CRITICAL INSTRUCTIONS:**
1.  **Isolate the Item:** Find the "${itemPrompt}" in the image.
2.  **Recreate as Product Photo:** Generate a new image of the item. It should look brand new, complete, and professionally photographed.
3.  **Clean Background:** Place the item on a solid, neutral background (like white or light gray), suitable for an e-commerce website.
4.  **Remove Person/Original Background:** The final image MUST NOT contain the person from the original photo or any part of the original background.
5.  **Output:** The result is a single, clean product shot of the "${itemPrompt}".`;
  return performImageEdit(prompt, baseImage);
};

export const generatePoster = async (
  topic: string,
  slogan: string,
  posterType: 'Giáo dục' | 'Điện ảnh' | 'Tiếp thị',
  style: string,
  aspectRatio: '1:1' | '3:4' | '9:16' | '16:9',
  images: string[],
  mainImageIndex: number,
  styleImage: string | null,
): Promise<string> => {
    // Reorder images so main image is first
    const orderedImages = [...images];
    if (images.length > 0 && mainImageIndex < images.length) {
        const mainImage = orderedImages.splice(mainImageIndex, 1)[0];
        orderedImages.unshift(mainImage);
    }
    
    let fullPrompt = '';
    const allImages = [...orderedImages];

    const textInstructions: string[] = [];
    if (topic.trim()) {
        textInstructions.push(`- **Chủ đề chính:** "${topic}". Đây là nguồn cảm hứng cho hình ảnh và có thể được dùng làm tiêu đề phụ.`);
    }
    if (slogan.trim()) {
        textInstructions.push(`- **Khẩu hiệu (CỰC KỲ QUAN TRỌNG):** BẮT BUỘC phải hiển thị chính xác và nổi bật dòng chữ sau trên poster: "${slogan}". Đây là nội dung văn bản quan trọng nhất.`);
    }

    let textRequirement = '';
    if (textInstructions.length > 0) {
        textRequirement = `**YÊU CẦU VỀ VĂN BẢN:**
${textInstructions.join('\n')}
- **Kiểu chữ:** Chọn một phông chữ tiếng Việt đẹp, dễ đọc, và phù hợp với phong cách chung của poster. Đảm bảo hiển thị đúng dấu tiếng Việt.
- **Bố cục:** Sắp xếp văn bản ở vị trí hợp lý để tạo bố cục cân đối và thu hút. Khẩu hiệu (nếu có) phải là điểm nhấn.`;
    } else {
        textRequirement = `**YÊU CẦU VỀ VĂN BẢN:**
**KHÔNG VIẾT BẤT KỲ CHỮ NÀO LÊN POSTER.** Thay vào đó, hãy tạo ra các vùng trống có chủ đích để người dùng có thể tự chèn văn bản sau này.`;
    }


    if (styleImage) {
        allImages.push(styleImage);
        const contentImageInstructions = images.length > 0
            ? `- Tích hợp các hình ảnh nội dung được cung cấp (tất cả trừ ảnh cuối cùng). Ảnh 1 là ảnh chính, hãy đặt nó ở vị trí trung tâm và nổi bật nhất. Các ảnh còn lại là logo hoặc ảnh phụ, hãy lồng ghép chúng một cách tinh tế vào bố cục.`
            : `- Tự tạo hình ảnh đồ họa phù hợp với chủ đề, không cần dùng ảnh nội dung nào.`;
        
        const mainThemeDescriptionForStyleImage = topic || slogan || 'chủ đề tự do sáng tạo';

        fullPrompt = `Bạn là một chuyên gia thiết kế AI. Bạn sẽ nhận được một loạt ảnh. **Ảnh cuối cùng là ảnh MẪU PHONG CÁCH.** Các ảnh còn lại (nếu có) là ảnh NỘI DUNG.
Nhiệm vụ của bạn là tạo một poster chất lượng cao.

**YÊU CẦU QUAN TRỌNG:**
1.  **Phân tích phong cách:** Phân tích kỹ lưỡng phong cách, bảng màu, cảm giác về kiểu chữ, và bố cục của **ảnh MẪU PHONG CÁCH** (ảnh cuối cùng).
2.  **Tạo Poster:** Tạo một poster mới cho chủ đề "${mainThemeDescriptionForStyleImage}" **BẮT CHƯỚC THEO PHONG CÁCH** của ảnh mẫu.
3.  **Lồng ghép nội dung:**
    ${contentImageInstructions}

${textRequirement}

**YÊU CẦU CHUNG:**
- Loại poster: ${posterType}.
- Bố cục phải cân đối, chuyên nghiệp, và học hỏi từ ảnh mẫu.
- Phối màu hài hòa, thu hút, dựa trên ảnh mẫu.`;
    } else {
        let mainThemeDescription = 'chủ đề tự do sáng tạo';
        if (topic.trim()) {
            mainThemeDescription = `chủ đề chính là: "${topic}"`;
        } else if (slogan.trim()) {
            mainThemeDescription = `chủ đề xoay quanh khẩu hiệu: "${slogan}"`;
        }

        fullPrompt = `Tạo một poster chất lượng cao, bắt mắt với ${mainThemeDescription}.
Loại poster: ${posterType}.
Phong cách thiết kế: ${style}.

**YÊU CẦU VỀ BỐ CỤC VÀ HÌNH ẢNH:**
`;
        if (images.length > 0) {
            fullPrompt += `- Tích hợp các hình ảnh được cung cấp. Ảnh 1 là ảnh chính, hãy đặt nó ở vị trí trung tâm và nổi bật nhất. Các ảnh còn lại là logo hoặc ảnh phụ, hãy lồng ghép chúng một cách tinh tế vào bố cục (ví dụ: ở góc, hoặc làm mờ phía sau).\n`;
        } else {
            fullPrompt += `- Tự tạo hình ảnh nền và các yếu tố đồ họa phù hợp với chủ đề.\n`;
        }

        fullPrompt += `
${textRequirement}

**YÊU CẦU CHUNG:**
- Bố cục phải cân đối, chuyên nghiệp.
- Phối màu hài hòa, thu hút.
`;
        switch (posterType) {
            case 'Giáo dục':
                fullPrompt += '- Tông màu của poster nên tươi sáng, tích cực để khuyến khích tinh thần học tập và khám phá.';
                break;
            case 'Điện ảnh':
                fullPrompt += '- Poster phải tạo được cảm xúc mạnh mẽ, kịch tính, và bí ẩn, giống như một poster phim thực thụ.';
                break;
            case 'Tiếp thị':
                fullPrompt += '- Thiết kế phải làm nổi bật sản phẩm hoặc thương hiệu (nếu có ảnh), có điểm nhấn rõ ràng để thu hút khách hàng.';
                break;
        }
    }
    
    if (allImages.length > 0) {
        fullPrompt += `\nPoster cuối cùng phải có tỷ lệ khung hình là ${aspectRatio}.`;
        return performImageEdit(fullPrompt, ...allImages);
    } else {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio,
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("No image was generated. The prompt may have been refused.");
        }
        return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
    }
};

export const generateAffiliateImage = (
    modelImages: string[],
    products: { image: string, name: string }[],
    userPrompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16',
    quality: 'Standard' | 'High',
    imageType: 'Realistic' | 'Artistic'
): Promise<string> => {
    if (modelImages.length === 0 || products.length === 0) {
        throw new Error("At least one model and one product image must be provided.");
    }
    const productImages = products.map(p => p.image);
    const allImages = [...modelImages, ...productImages];
    const modelImageCount = modelImages.length;

    const qualityPrompt = quality === 'High' ? 'The final image should be highly detailed, photorealistic, 8k resolution, and professional quality.' : 'The final image should be good quality and clear.';
    const aspectRatioPrompt = `The final image must have a ${aspectRatio} aspect ratio.`;
    
    const stylePrompt = imageType === 'Realistic' 
      ? 'The final scene should look like a real, unedited photograph. Focus on natural lighting and a believable environment.'
      : 'The final scene should be artistic and visually stunning, suitable for an advertisement. Be creative with the background, lighting, and mood to make the product appealing.';

    const productDescriptions = products
        .map((p, i) => `- Image ${modelImageCount + 1 + i} is a photo of the product "${p.name || `Product ${i+1}`}".`)
        .join('\n');

    const fullPrompt = `You are an expert AI commercial photographer and retoucher. You will be given ${allImages.length} images and a text prompt.
- The first ${modelImageCount} image(s) are photo(s) of a person/people (KOL/model).
- The remaining images are photos of the following products:
${productDescriptions}

Your task is to create a new, professional image for an affiliate marketing post or product review.

**CRITICAL INSTRUCTIONS:**
1.  **Isolate the Products:** You **MUST** perfectly and precisely cut out the products from their respective images. The products themselves **MUST NOT** be altered, redrawn, or changed in any way. They must be the exact products from the photos.
2.  **Create Scene:** Create a new scene featuring the person/people from the model image(s).
3.  **Combine Subjects:** Place the **cut-out products** from step 1 into the new scene, showing the person/people interacting with them as described by the user. The names of the products are provided above; use them for context.
4.  **Follow User Prompt:** The interaction and scene must be based on the user's description: "${userPrompt}".
5.  **Preserve Identity:** The person/people in the final image MUST be the same person/people from the model image(s). Maintain their facial features, hair, and general appearance.
6.  **Style:** ${stylePrompt}
7.  **Integration:** The products must be integrated seamlessly. Pay close attention to lighting, shadows, and reflections to make it look like the products were physically in the scene with the person/people.
8.  **Quality and Aspect Ratio:** ${qualityPrompt} ${aspectRatioPrompt}
9.  **Output:** The final output must be a single, professional, cohesive image.`;

    return performImageEdit(fullPrompt, ...allImages);
};

export const generateProductBackgroundImage = (
  products: { image: string; name: string }[],
  backgroundPrompt: string,
  backgroundImage: string | null,
  aspectRatio: '1:1' | '16:9' | '9:16',
  quality: 'Standard' | 'High',
  imageType: 'Realistic' | 'Artistic'
): Promise<string> => {
  if (products.length === 0) {
    throw new Error("At least one product image must be provided.");
  }
  const allImages = [...products.map(p => p.image)];
  if (backgroundImage) {
    allImages.push(backgroundImage);
  }

  const productDescriptions = products
    .map((p, i) => `- Image ${i + 1} is a photo of the product "${p.name || `Product ${i+1}`}".`)
    .join('\n');
  
  let backgroundInstruction = '';
  if (backgroundImage && backgroundPrompt) {
    backgroundInstruction = `Create a new background that combines the style and mood of the last image (the background reference) with the user's description: "${backgroundPrompt}".`;
  } else if (backgroundImage) {
    backgroundInstruction = `Use the last image provided as the new background, or as a strong style and mood reference for generating a new background.`;
  } else if (backgroundPrompt) {
    backgroundInstruction = `Create a new background based on the user's description: "${backgroundPrompt}".`;
  } else {
    backgroundInstruction = `Analyze the product(s) and automatically create a professional, visually appealing background suitable for advertising. The background should complement the product and make it stand out.`;
  }

  const qualityPrompt = quality === 'High' ? 'The final image should be highly detailed, photorealistic, 8k resolution, and professional quality.' : 'The final image should be good quality and clear.';
  const aspectRatioPrompt = `The final image must have a ${aspectRatio} aspect ratio.`;
  const stylePrompt = imageType === 'Realistic' 
    ? 'The final scene should look like a real, unedited photograph. Focus on natural lighting and a believable environment.'
    : 'The final scene should be artistic and visually stunning, suitable for an advertisement. Be creative with the background, lighting, and mood to make the product appealing.';

  const fullPrompt = `You are an expert AI product photographer. Your task is to create a professional advertisement image.

**Provided Assets:**
${productDescriptions}
${backgroundImage ? `- The last image is a reference for the background.` : ''}

**CRITICAL INSTRUCTIONS:**
1.  **Isolate Product(s):** Automatically and perfectly remove the background from the product image(s). The products themselves **MUST NOT** be altered or redrawn.
2.  **Create New Background:** ${backgroundInstruction}
3.  **Combine and Integrate:** Place the isolated product(s) into the newly created background. The integration must be seamless and professional. Pay close attention to realistic lighting, shadows, reflections, and perspective to make it look like the product was photographed in that scene.
4.  **Style and Quality:** ${stylePrompt} ${qualityPrompt}
5.  **Final Output:** The result must be a single, professional, cohesive advertisement image with a ${aspectRatio} aspect ratio.`;

  return performImageEdit(fullPrompt, ...allImages);
};


export const suggestSlogans = async (topic: string): Promise<string[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 3 short, catchy slogans in Vietnamese for a poster about "${topic}".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    slogans: {
                        type: Type.ARRAY,
                        description: 'A list of 3 slogan strings.',
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });
    
    try {
        const json = JSON.parse(response.text);
        return json.slogans || [];
    } catch (e) {
        console.error("Failed to parse slogan suggestions:", e);
        // Fallback parsing if JSON is malformed but text is present
        const text = response.text;
        const lines = text.split('\n').map(line => line.trim().replace(/^- /, '')).filter(Boolean);
        if (lines.length > 0) return lines;
        return [];
    }
};

export const suggestPrompts = async (
    context: string,
    image?: string | null,
    currentText?: string | null,
): Promise<string[]> => {
    const parts: Part[] = [];

    if (image) {
        parts.push(fileToGenerativePart(image));
    }

    let userInstruction = `You are a creative assistant. Your task is to generate 3 creative, detailed, and inspiring prompts in Vietnamese.`;

    if (currentText && image) {
        userInstruction += ` The user has provided an image and a starting idea: "${currentText}". Based on both, suggest prompts for the following context: ${context}. The suggestions should enhance or build upon the user's idea in relation to the image.`;
    } else if (image) {
        userInstruction += ` The user has provided an image. Analyze the image and suggest prompts for the following context: ${context}.`;
    } else if (currentText) {
        userInstruction += ` The user has provided a starting idea: "${currentText}". Based on this, suggest more detailed prompts for the following context: ${context}.`;
    } else {
         userInstruction += ` Suggest general, popular, and interesting prompts for the following context: ${context}.`;
    }
    
    parts.push({ text: userInstruction });

    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prompts: {
                        type: Type.ARRAY,
                        description: 'A list of 3 detailed prompt suggestions in Vietnamese.',
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    try {
        const json = JSON.parse(response.text);
        return json.prompts || [];
    } catch (e) {
        console.error("Failed to parse prompt suggestions:", e);
        const text = response.text;
        const lines = text.split('\n').map(line => line.trim().replace(/^- /, '').replace(/"/g, '')).filter(Boolean);
        if (lines.length > 0) return lines;
        return [];
    }
};


export const suggestProductBackgrounds = async (productImage: string, productName: string): Promise<string[]> => {
    const imagePart = fileToGenerativePart(productImage);
    const textPart = { text: `You are a creative director. Analyze this image of a product named "${productName || 'this product'}". Based on the image, generate 3 short, creative background ideas in Vietnamese for an advertisement. The ideas should be suitable for showcasing the product effectively.` };
    
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        description: 'A list of 3 background suggestion strings in Vietnamese.',
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    try {
        const json = JSON.parse(response.text);
        return json.suggestions || [];
    } catch (e) {
        console.error("Failed to parse background suggestions:", e);
        const text = response.text;
        const lines = text.split('\n').map(line => line.trim().replace(/^- /, '').replace(/"/g, '')).filter(Boolean);
        if (lines.length > 0) return lines;
        return [];
    }
};
