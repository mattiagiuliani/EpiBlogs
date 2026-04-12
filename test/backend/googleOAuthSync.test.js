import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
const findOneMock = vi.fn();

vi.mock('../../backend/models/Author.js', () => ({
    default: {
        create: createMock,
        findOne: findOneMock
    }
}));

const { syncGoogleAuthor } = await import('../../backend/utils/googleOAuth.js');

describe('syncGoogleAuthor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a new author from the Google profile when no account exists', async () => {
        findOneMock.mockReturnValue({
            select: vi.fn().mockResolvedValue(null)
        });
        createMock.mockResolvedValue({ _id: 'author-id' });

        const result = await syncGoogleAuthor({
            id: 'google-1',
            emails: [{ value: 'Author@example.com ' }],
            name: { givenName: 'Ada', familyName: 'Lovelace' },
            photos: [{ value: 'https://cdn.example/avatar.jpg' }]
        });

        expect(createMock).toHaveBeenCalledWith({
            avatar: 'https://cdn.example/avatar.jpg',
            email: 'author@example.com',
            firstName: 'Ada',
            googleId: 'google-1',
            lastName: 'Lovelace'
        });
        expect(result).toEqual({ _id: 'author-id' });
    });

    it('links googleId once by email without overwriting existing identity or profile data', async () => {
        const saveMock = vi.fn().mockResolvedValue(undefined);
        const author = {
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Existing',
            lastName: 'Name',
            avatar: 'https://cdn.example/existing.jpg',
            googleId: undefined,
            save: saveMock
        };

        findOneMock
            .mockReturnValueOnce({
                select: vi.fn().mockResolvedValue(author)
            });

        const result = await syncGoogleAuthor({
            id: 'google-1',
            emails: [{ value: 'author@example.com' }],
            name: { givenName: 'Google', familyName: 'Profile' },
            photos: [{ value: 'https://cdn.example/google.jpg' }]
        });

        expect(author.googleId).toBe('google-1');
        expect(author.firstName).toBe('Existing');
        expect(author.lastName).toBe('Name');
        expect(author.avatar).toBe('https://cdn.example/existing.jpg');
        expect(saveMock).toHaveBeenCalledOnce();
        expect(createMock).not.toHaveBeenCalled();
        expect(result).toBe(author);
    });

    it('is idempotent for an already linked Google account', async () => {
        const saveMock = vi.fn().mockResolvedValue(undefined);
        const author = {
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Existing',
            lastName: 'Name',
            avatar: 'https://cdn.example/existing.jpg',
            googleId: 'google-1',
            save: saveMock
        };

        findOneMock
            .mockReturnValueOnce({
                select: vi.fn().mockResolvedValue(author)
            });

        const result = await syncGoogleAuthor({
            id: 'google-1',
            emails: [{ value: 'author@example.com' }],
            name: { givenName: 'Updated', familyName: 'Profile' },
            photos: [{ value: 'https://cdn.example/new.jpg' }]
        });

        expect(saveMock).not.toHaveBeenCalled();
        expect(createMock).not.toHaveBeenCalled();
        expect(result).toBe(author);
    });
});
