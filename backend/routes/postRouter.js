import { Router } from 'express'; 
import Post from '../models/Post.js'; 

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
      next(400);
   }
});

postRouter.get('/api/v1/posts/:postId', async (request, response, next) => {
    const thePost = await Post.findById(request.params.postId);
    if (!thePost) response.status(404).send({ message: 'Not found'});
    else response.send(thePost);
    });

postRouter.post('/api/v1/posts', async (request, response, next) => {
      try {
         const newPost = await Post.create(request.body);
         response.send(newPost);
      } catch (error) {
         console.log(error);
         next(400);
      }
});

postRouter.put('/api/v1/posts/:postId', async (request, response, next) => {
   try {
      const postModified = await Post.findByIdAndUpdate(
         request.params.postId,
         request.body,
         { new: true }
      );
      if (!postModified) next(404);
      else response.send(postModified);
   } catch (error) {
      console.log(error);
      next(400);
   }
});

postRouter.delete('/api/v1/posts/:postId', async (request, response, next) => {
      const postDeleted = await Post.findByIdAndDelete(request.params.postId);
      response.send({ message: 'post deleted' });
});

postRouter.get('/api/v1/authors/:authorId/posts', async (request, response, next) => {
   try {
      const posts = await Post.find({ author: request.params.authorId });
      response.send(posts);
   } catch (error) {
      console.log(error);
      next(400);
   }
});

export default postRouter;
