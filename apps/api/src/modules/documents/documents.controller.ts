import { Request, Response } from 'express';
import { DocumentsService } from './documents.service.js';
import { uploadDocumentSchema } from './documents.schema.js';

const service = new DocumentsService();

export class DocumentsController {
  async upload(req: Request, res: Response) {
    try {
      const parsed = uploadDocumentSchema.parse(req.body);
      const doc = await service.upload(parsed.medicalRecordId, parsed.fileUrl, parsed.fileType, req.user!.id);
      res.status(201).json(doc);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to upload document' });
    }
  }

  async listByRecord(req: Request, res: Response) {
    const docs = await service.findByMedicalRecord(req.params.recordId);
    res.json(docs);
  }
}
