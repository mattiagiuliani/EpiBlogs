export const validateAuthBody = (request, response) => {
    const { email, password } = request.body;

    if (typeof email !== 'string' || !email.trim()) {
        response.status(400).send({ message: 'Email is required' });
        return false;
    }

    if (typeof password !== 'string' || password.length < 6) {
        response.status(400).send({ message: 'Password must be at least 6 characters long' });
        return false;
    }

    return true;
};
