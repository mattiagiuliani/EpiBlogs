export const normalizeEmail = (email) => {
    return typeof email === 'string'
        ? email.trim().toLowerCase()
        : email;
};

export const withNormalizedEmail = (data = {}) => ({
    ...data,
    email: normalizeEmail(data.email)
});
