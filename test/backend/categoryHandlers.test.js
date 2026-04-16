import { beforeEach, describe, expect, it, vi } from 'vitest';

const categoryFindMock = vi.fn();

vi.mock('../../backend/models/Category.js', () => ({
    default: {
        find: categoryFindMock
    }
}));

const { listCategories } = await import('../../backend/routes/categories/handlers.js');

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

describe('category handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns all categories sorted alphabetically', async () => {
        const sorted = [
            { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
            { name: 'Cybersecurity',            slug: 'cybersecurity' },
            { name: 'Web Development',          slug: 'web-development' }
        ];

        categoryFindMock.mockReturnValue({
            sort: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue(sorted)
        });

        const response = createResponse();
        await listCategories({}, response);

        expect(categoryFindMock).toHaveBeenCalledWith();
        expect(response.send).toHaveBeenCalledWith(sorted);
    });

    it('sorts by name ascending', async () => {
        const sortMock = vi.fn().mockReturnThis();
        categoryFindMock.mockReturnValue({
            sort: sortMock,
            lean: vi.fn().mockResolvedValue([])
        });

        const response = createResponse();
        await listCategories({}, response);

        expect(sortMock).toHaveBeenCalledWith({ name: 1 });
    });

    it('returns 500 on database error', async () => {
        categoryFindMock.mockReturnValue({
            sort: vi.fn().mockReturnThis(),
            lean: vi.fn().mockRejectedValue(new Error('DB failure'))
        });

        const response = createResponse();
        await listCategories({}, response);

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.send).toHaveBeenCalledWith({ message: 'DB failure' });
    });
});
