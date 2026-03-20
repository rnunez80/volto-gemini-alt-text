import { GoogleGenAI } from '@google/genai';

class describeImage {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.RAZZLE_GEMINI_API_KEY,
    });
    this.model = process.env.RAZZLE_GEMINI_API_MODEL;
  }

  /**
   * Describe an image using Google Generative AI.
   * @param {File} image - The image file object.
   * @param {string} [siteTitle] - Optional site/navroot title for context.
   * @returns {Promise<{title: string, description: string}>} - A promise resolving to the description of the image.
   */
  async processImage(image, siteTitle) {
    try {
      const base64String = await this.resizeFile(image);

      const contents = [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64String,
          },
        },
        {
          text: `${siteTitle ? `This image is being uploaded to the "${siteTitle}" webpage. Use this context to generate more relevant alt text. ` : ''}Respond only in valid JSON. The JSON object you return should match the following schema return it as a text only:
            {"title": "string", "description": "string"}
            Where title of the photo to be used as its alt text, between 30-60 characters, and description of the photo between 50 to 160 characters.`,
        },
      ];

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents,
      });

      const result = this.ConstructResult(response.text);
      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Resize an image file using the browser Canvas API.
   * @param {File} file - The image file to resize.
   * @returns {Promise<string>} - Base64 string (without data URL prefix).
   */
  resizeFile(file) {
    return new Promise((resolve, reject) => {
      const maxSize = 1000;
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get base64 without the "data:image/jpeg;base64," prefix
          const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  ConstructResult(text) {
    const markdownJsonRegex = /```json\s*(.*?)\s*```/s;
    const fallbackJsonRegex = /\s*(\{[\s\S]*\})\s*/;

    const markdownMatch = markdownJsonRegex.exec(text);
    const fallbackMatch = fallbackJsonRegex.exec(text);

    let imageData = {
      title: '',
      description: '',
    };

    if (markdownMatch) {
      const jsonContent = markdownMatch[1];
      try {
        imageData = JSON.parse(jsonContent);
      } catch (error) {
        console.error('Invalid JSON in markdown block:', error);
      }
    } else if (fallbackMatch) {
      try {
        imageData = JSON.parse(fallbackMatch[1]);
      } catch (error) {
        console.error('Invalid JSON in fallback match:', error);
      }
    } else {
      console.log('No JSON content found.');
    }

    return imageData;
  }
}

export default describeImage;
