import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = Router();

// Simple in-memory folder/file store until a real model is added
// In production this would use a File model + cloud storage

// GET /api/files/folders
router.get('/folders', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const folders = [
    { id: 'f1', name: 'Company Documents', parentId: null, icon: '🏢' },
    { id: 'f2', name: 'HR Files', parentId: null, icon: '👥' },
    { id: 'f3', name: 'Projects', parentId: null, icon: '📁' },
    { id: 'f4', name: 'Certificates', parentId: null, icon: '🏆' },
    { id: 'f5', name: 'Shared', parentId: null, icon: '🔗' },
    { id: 'f6', name: 'Staff Contracts', parentId: 'f2', icon: '📄' },
    { id: 'f7', name: 'Payroll Records', parentId: 'f2', icon: '💰' },
  ];
  ResponseFormatter.success(res, folders);
}));

// POST /api/files/folders
router.post('/folders', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name, parentId } = req.body;
  if (!name) return ResponseFormatter.error(res, 'Folder name is required', 400);
  const folder = { id: uuidv4(), name, parentId: parentId || null, icon: '📁', createdAt: new Date() };
  ResponseFormatter.success(res, folder, 'Folder created', 201);
}));

// GET /api/files
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { folderId, search } = req.query;
  const sampleFiles = [
    { id: '1', name: 'Employee Handbook 2025.pdf', size: 2456789, mimeType: 'application/pdf', folderId: 'f2', uploadedBy: 'HR Team', createdAt: new Date('2025-01-15') },
    { id: '2', name: 'Company Policy.docx', size: 345678, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', folderId: 'f1', uploadedBy: 'Admin', createdAt: new Date('2025-01-10') },
    { id: '3', name: 'Q1 2025 Report.xlsx', size: 1234567, mimeType: 'application/vnd.ms-excel', folderId: 'f1', uploadedBy: 'Finance', createdAt: new Date('2025-03-31') },
    { id: '4', name: 'MaxHub Logo.png', size: 89012, mimeType: 'image/png', folderId: 'f1', uploadedBy: 'Admin', createdAt: new Date('2025-01-01') },
  ];

  let files = folderId ? sampleFiles.filter(f => f.folderId === folderId) : sampleFiles;
  if (search) files = files.filter(f => f.name.toLowerCase().includes((search as string).toLowerCase()));

  ResponseFormatter.success(res, files);
}));

// POST /api/files/upload
router.post('/upload', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, base64Content, folderId, mimeType } = req.body;
  if (!name) return ResponseFormatter.error(res, 'File name is required', 400);

  const file = {
    id: uuidv4(),
    name, folderId, mimeType,
    size: base64Content ? Math.round(base64Content.length * 0.75) : 0,
    uploadedBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    url: base64Content ? `data:${mimeType};base64,${base64Content}` : null,
    createdAt: new Date(),
  };
  ResponseFormatter.success(res, file, 'File uploaded', 201);
}));

// DELETE /api/files/:id
router.delete('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  ResponseFormatter.success(res, null, 'File deleted');
}));

// PATCH /api/files/:id/rename
router.patch('/:id/rename', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return ResponseFormatter.error(res, 'New name is required', 400);
  ResponseFormatter.success(res, { id: req.params.id, name }, 'File renamed');
}));

// POST /api/files/:id/share
router.post('/:id/share', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { emails } = req.body;
  ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));

export default router;
