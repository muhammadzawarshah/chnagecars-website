import { CustomerDocumentsService } from './customer-documents';

describe('customer documents', () => {
  const row = { id: 'doc', userId: 'user-a', type: 'DRIVING_LICENSE', status: 'PENDING', storageKey: 'private/customers/user-a/documents/doc.pdf', size: 12, contentType: 'application/pdf', fileName: 'license.pdf' };
  function setup() {
    const db = { findFirst: jest.fn().mockResolvedValue(row), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn() };
    const storage = { presignUpload: jest.fn().mockResolvedValue('upload'), presignDownload: jest.fn().mockResolvedValue('download'), head: jest.fn(), delete: jest.fn() };
    return { db, storage, service: new CustomerDocumentsService({ customerDocument: db } as any, storage as any) };
  }
  it('returns all six empty categories for newly registered users', async () => {
    const { service } = setup();
    const result = await service.list('user-a');
    expect(result.categories).toHaveLength(6);
    expect(result.canSubmit).toBe(false);
    expect(result.categories.every(item => !item.uploaded && !item.documents.length)).toBe(true);
  });
  it('denies documents owned by another user before touching storage', async () => {
    const { service, db, storage } = setup();
    db.findFirst.mockResolvedValue(null);
    await expect(service.view('user-b', 'doc')).rejects.toThrow('Document not found');
    expect(db.findFirst).toHaveBeenCalledWith({ where: { id: 'doc', userId: 'user-b' } });
    expect(storage.presignDownload).not.toHaveBeenCalled();
  });
  it('requires actual upload and validates metadata before completing', async () => {
    const { service, storage, db } = setup();
    storage.head.mockResolvedValue(null);
    await expect(service.complete('user-a', 'doc')).rejects.toThrow('Upload the file');
    storage.head.mockResolvedValue({ size: 20, contentType: 'application/pdf' });
    await expect(service.complete('user-a', 'doc')).rejects.toThrow('does not match');
    expect(db.updateMany).not.toHaveBeenCalled();
    storage.head.mockResolvedValue({ size: 12, contentType: 'application/pdf' });
    db.findFirst.mockResolvedValueOnce(row).mockResolvedValueOnce({ ...row, status: 'UPLOADED' });
    expect(await service.complete('user-a', 'doc')).toMatchObject({ status: 'UPLOADED' });
    expect(db.updateMany).toHaveBeenCalledWith({ where: { id: 'doc', userId: 'user-a', status: 'PENDING' }, data: { status: 'UPLOADED' } });
  });
  it('creates only private keys and excludes them from screen metadata', async () => {
    const { service, db } = setup();
    const result = await service.upload('user-a', { type: row.type, fileName: row.fileName, contentType: row.contentType, size: 12 });
    expect(result).toMatchObject({ uploadUrl: 'upload', method: 'PUT', expiresIn: 600 });
    expect(db.create.mock.calls[0][0].data.storageKey).toMatch(/^private\/customers\/user-a\/documents\//);
    db.findMany.mockResolvedValue([{ ...row, status: 'UPLOADED' }]);
    const list = await service.list('user-a');
    expect(list.canSubmit).toBe(true);
    expect(list.categories[0].documents[0]).not.toHaveProperty('storageKey');
  });
  it('submits only completed documents of the authenticated user and rejects empty submissions', async () => {
    const { service, db } = setup();
    expect(await service.submit('user-a')).toMatchObject({ submitted: true, count: 1 });
    expect(db.updateMany.mock.calls[0][0].where).toEqual({ userId: 'user-a', status: 'UPLOADED' });
    db.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.submit('user-a')).rejects.toThrow('at least one');
  });
});
