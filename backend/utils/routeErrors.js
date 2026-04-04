export const sendValidationError = (error, response) => {
    if (error.name !== 'ValidationError') {
        return false;
    }

    const errors = Object.values(error.errors).map((validationError) => ({
        field: validationError.path,
        message: validationError.message
    }));

    response.status(400).send({
        message: 'Validation failed',
        errors
    });
    return true;
};

export const sendDuplicateKeyError = (error, response) => {
    if (error.code !== 11000) {
        return false;
    }

    const duplicatedField = Object.keys(error.keyPattern ?? {})[0] ?? 'field';

    response.status(400).send({
        message: 'Duplicate value',
        errors: [
            {
                field: duplicatedField,
                message: `${duplicatedField} already exists`
            }
        ]
    });
    return true;
};
