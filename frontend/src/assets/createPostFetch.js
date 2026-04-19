import { client } from '../api/client.js';

export const createPost = (postData) =>
    client.post('/posts', postData, 'Error creating post');
