import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password, storedHash) => {
    if (typeof storedHash !== 'string' || !storedHash) {
        return false;
    }
    return bcrypt.compare(password, storedHash);
};
