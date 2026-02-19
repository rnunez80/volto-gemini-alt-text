import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import Resizer from 'react-image-file-resizer';

class describeImage {
  constructor() {
    this.vision = new ChatGoogleGenerativeAI({
      apiKey: process.env.RAZZLE_GEMINI_API_KEY,
      model: 'gemini-3-flash',
      maxOutputTokens: 2048,
    });
  }

  /**
   * Describe an image using Google Generative AI.
   * @param {File} image - The image file object.
   * @returns {Promise<{title: string, description: string}>} - A promise resolving to the description of the image.
   */
  async processImage(image) {
    try {
      const compimage = await this.resizeFile(image);
      const base64String = compimage.split(',')[1];
      const input = [
        new HumanMessage({
          content: [
            {
              type: "text",
              text: `Respond only in valid JSON. The JSON object you return should match the following schema return it as a text only:
                {title: "string", description "string" }
                Where title of the photo to be in it's alt and between 30-60 characters and description of the photo between 50 to 160 characters`
            },
            {
              type: "image_url",
              image_url: `data:image/png;base64,${base64String}`,
            },
          ],
        }),
      ];

      const response = await this.vision.invoke(input);
      const result = this.ConstructResult(response.content)

      return result;
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  }


  async resizeFile(file) {
    return new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        300,
        300,
        "JPEG",
        100,
        0,
        (uri) => {
          resolve(uri);
        },
        "base64"
      );
    });
  }


  ConstructResult(text) {
    const markdownJsonRegex = /```json\s*(.*?)\s*```/s;
    const fallbackJsonRegex = /\s*(\{[\s\S]*\})\s*/;

    const markdownMatch = markdownJsonRegex.exec(text);
    const fallbackMatch = fallbackJsonRegex.exec(text);

    let imageData = {
      title: "",
      description: ""
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
