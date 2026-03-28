import { Router } from 'express'; 
import { isValidObjectId } from 'mongoose';
import Post from '../models/Post.js'; 
import Author from '../models/Author.js';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import mailer from '../middlewares/mailer.js';

const postRouter = Router(); 

postRouter.get('/api/v1/posts', async function(request, response, next) {
   try {
      const search = request.query.search ?? request.query.title ?? '';
      const filter = search
         ? { title: { $regex: search, $options: 'i' } }
         : {};
      const posts = await Post.find(filter); 
      response.send(posts);
   } catch (error) {
      console.log(error);
      response.status(400).send({ message: error.message });
   }
});

postRouter.get('/api/v1/posts/:postId', async (request, response, next) => {
    if (!isValidObjectId(request.params.postId)) {
        return response.status(400).send({ message: 'Invalid postId' });
    }
    const thePost = await Post.findById(request.params.postId);
    if (!thePost) response.status(404).send({ message: 'Not found'});
    else response.send(thePost);
    });

postRouter.post('/api/v1/posts', async (request, response, next) => {
      try {
         if (!isValidObjectId(request.body.author)) {
            return response.status(400).send({ message: 'Invalid authorId' });
         }
         const author = await Author.findById(request.body.author);
         if (!author) {
            return response.status(404).send({ message: 'Author not found' });
         }
         const newPost = await Post.create(request.body);
         mailer.sendMail({
            from: process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim(),
            to: [author.email],
            subject: 'Your post has been published',
            text: `Hi ${author.firstName}, your new blog post "${newPost.title}" has been published.`,
            html: `<h1>Hi ${author.firstName}, your new blog post "${newPost.title}" has been published.</h1>`
         }).catch((error) => console.log('Email send failed:', error));
         response.send(newPost);
      } catch (error) {
         console.log(error);
         response.status(400).send({ message: error.message });
      }
});

postRouter.patch('/api/v1/posts/:postId/cover', uploadCloudinary.single('cover'), async (request, response, next) => {
   try {
      if (!isValidObjectId(request.params.postId)) {
         return response.status(400).send({ message: 'Invalid postId' });
      }
      if (!request.file) {
         return response.status(400).send({ message: 'Cover file is required' });
      }
      const postModified = await Post.findByIdAndUpdate(
         request.params.postId,
         { cover: request.file.path },
         { new: true }
      );
      if (!postModified) {
         return response.status(404).send({ message: 'Post not found' });
      }
      else response.send(postModified);
   } catch (error) {
      console.log(error);
      response.status(400).send({ message: error.message });
   }
});

postRouter.put('/api/v1/posts/:postId', async (request, response, next) => {
   try {
      if (!isValidObjectId(request.params.postId)) {
         return response.status(400).send({ message: 'Invalid postId' });
      }
      const postModified = await Post.findByIdAndUpdate(
         request.params.postId,
         request.body,
         { new: true }
      );
      if (!postModified) {
         return response.status(404).send({ message: 'Post not found' });
      }
      else response.send(postModified);
   } catch (error) {
      console.log(error);
      response.status(400).send({ message: error.message });
   }
});

postRouter.delete('/api/v1/posts/:postId', async (request, response, next) => {
      if (!isValidObjectId(request.params.postId)) {
         return response.status(400).send({ message: 'Invalid postId' });
      }
      const postDeleted = await Post.findByIdAndDelete(request.params.postId);
      if (!postDeleted) {
         return response.status(404).send({ message: 'Post not found' });
      }
      response.send({ message: 'post deleted' });
});

postRouter.get('/api/v1/authors/:authorId/posts', async (request, response, next) => {
   try {
      if (!isValidObjectId(request.params.authorId)) {
         return response.status(400).send({ message: 'Invalid authorId' });
      }
      const posts = await Post.find({ author: request.params.authorId });
      response.send(posts);
   } catch (error) {
      console.log(error);
      response.status(400).send({ message: error.message });
   }
});

export default postRouter;
