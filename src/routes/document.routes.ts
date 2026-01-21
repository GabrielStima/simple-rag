import { Router, Request, Response } from 'express';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import { upload } from '../config/multer.config.js';
import { vectorStoreService } from '../services/vectorStore.service.js';

const router = Router();

router.post('/upload', upload.single('pdf'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const pdfPath = req.file.path;

  try {
    const pdfData = new PDFParse({ url: pdfPath });
    const data = (await pdfData.getText()).text;

    await vectorStoreService.createFromText(data);

    res.status(200).json({ message: 'File processed successfully' });

  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).send('Error processing file.');
  } finally {
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
  }
});

export default router;
