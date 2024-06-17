
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
class describeImage {
  constructor() {
    this.vision = new ChatGoogleGenerativeAI({
      apiKey:  process.env.RAZZLE_GEMINI_API_KEY,
      modelName: "gemini-pro-vision",
      maxOutputTokens: 2048,
    });
  }

  /**
   * Describe an image using Google Generative AI.
   * @param {string} image - The image file in base64 format.
   * @returns {Promise<string>} - A promise resolving to the description of the image.
   */
  async processImage(image) {
    try {
      const input = [
        new HumanMessage({
          content: [
            {
              type: "text",
          text: `Respond only in valid JSON. The JSON object you return should match the following schema return it as a text only:
                {title: "string", description "string" }
                Where title of the photo to be in it's alt and no more than 5 words and decription of the photo in one sentence`
            },
            {
              type: "image_url",
              image_url: `data:image/png;base64,${image}`,
            },
          ],
        }),
      ];

      const response = await this.vision.invoke(input);
      const result=this.ConstructResult(response.content)

      return result;
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  }

  ConstructResult(text) {
    const regex = /```json\s*(.*?)\s*```/s;
    // Use regex to extract the content
    const match = regex.exec(text);
    let imageData ={
        title: "",
        description: ""
      };
    if (match) {
      const jsonContent = match[1]; // Extracted JSON content
      try {
        imageData = JSON.parse(jsonContent);
      } catch (error) {
        console.error('Invalid JSON:', error);
      }
      } else {
      console.log('No JSON content found.');
      }
    
    return imageData;
  }
}


export default describeImage;
