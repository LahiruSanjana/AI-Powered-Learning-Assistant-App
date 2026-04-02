import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';


export const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
        const textResult = await parser.getText();
        const infoResult = await parser.getInfo();

        await parser.destroy();

        return {
            text: textResult.text,
            numPages: infoResult.total,
            info: infoResult.info,
            metadata: infoResult.metadata
        };
    } catch (error) {
        throw new Error('Error extracting text from PDF: ' + error.message);
    }   
};