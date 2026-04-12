const allowedPostFields = [
    'author',
    'category',
    'content',
    'cover',
    'readTime',
    'title'
];

export const pickPostInput = (data = {}) => {
    return allowedPostFields.reduce((postData, field) => {
        if (Object.hasOwn(data, field)) {
            postData[field] = data[field];
        }

        return postData;
    }, {});
};
