export const normalizeEmail = (email) => {
    return typeof email === 'string'
        ? email.trim().toLowerCase()
        : email;
};

export const withNormalizedEmail = (data = {}) => ({
    ...data,
    email: normalizeEmail(data.email)
});

const allowedAuthorFields = [
    'avatar',
    'birthDate',
    'email',
    'firstName',
    'lastName',
    'password',
    'profile'
];

export const pickAuthorInput = (data = {}) => {
    const normalizedData = withNormalizedEmail(data);

    return allowedAuthorFields.reduce((authorData, field) => {
        if (Object.hasOwn(normalizedData, field)) {
            authorData[field] = normalizedData[field];
        }

        return authorData;
    }, {});
};
