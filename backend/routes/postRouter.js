import { Router } from 'express'; 
import { isValidObjectId } from 'mongoose';
import Post from '../models/Post.js'; 
import Author from '../models/Author.js';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import mailer from '../middlewares/mailer.js';

const postRouter = Router(); 

const getPostById = async (postId) => Post.findById(postId); 

const getCommentById = (post, commentId) => post.comments.id(commentId); 

const validatePostId = (postId, response) => {
   if (!isValidObjectId(postId)) {
      response.status(400).send({ message: 'Invalid postId' });
      return false;
   }
   return true;   
};

const validateCommentId = (commentId, response) => {
   if (!isValidObjectId(commentId)) {
      response.status(400).send({ message: 'Invalid commentId' });
      return false;
   }
   return true; 
};

const validateCommentBody = (request, response) => {
   if (typeof request.body.comment !== 'string' || !request.body.comment?.trim()) {
      response.status(400).send({ message: 'Comment is required' });
      return false;
   }
   return true;
}; 

const sendValidationError = (error, response) => {
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

const listComments = async (request, response) => {
   try {
      const postId = request.params.postId ?? request.params.id;
      if (!validatePostId(postId, response)) {
         return;
      }
      const post = await getPostById(postId);
      if (!post) {
         return response.status(404).send({ message: 'Post not found' });
      }
      response.send(post.comments);
   } catch (error) {
      console.log(error);
      response.status(500).send({ message: error.message });
   }
};

const getSingleComment = async (request, response) => {
   try {
      const postId = request.params.postId ?? request.params.id;
      const { commentId } = request.params;
      if (!validatePostId(postId, response) || !validateCommentId(commentId, response)) {
         return;
      }
      const post = await getPostById(postId);
      if (!post) {
         return response.status(404).send({ message: 'Post not found' });
      }
      const comment = getCommentById(post, commentId);
      if (!comment) {
         return response.status(404).send({ message: 'Comment not found' });
      }
      response.send(comment);
   } catch (error) {
      console.log(error);
      response.status(500).send({ message: error.message });
   }
};

const createComment = async (request, response) => {
   try {
      const postId = request.params.postId ?? request.params.id;
      if (!validatePostId(postId, response) || !validateCommentBody(request, response)) {
         return;
      }
      const post = await getPostById(postId);
      if (!post) {
         return response.status(404).send({ message: 'Post not found' });
      }
      post.comments.push({ comment: request.body.comment.trim() });
      await post.save();
      response.status(201).send(post.comments[post.comments.length - 1]);
   } catch (error) {
      console.log(error);
      response.status(500).send({ message: error.message });
   }
};

const updateComment = async (request, response) => {
   try {
      const postId = request.params.postId ?? request.params.id;
      const { commentId } = request.params;
      if (
         !validatePostId(postId, response)
         || !validateCommentId(commentId, response)
         || !validateCommentBody(request, response)
      ) {
         return;
      }
      const post = await getPostById(postId);
      if (!post) {
         return response.status(404).send({ message: 'Post not found' });
      }
      const comment = getCommentById(post, commentId);
      if (!comment) {
         return response.status(404).send({ message: 'Comment not found' });
      }
      comment.comment = request.body.comment.trim();
      await post.save();
      response.send(comment);
   } catch (error) {
      console.log(error);
      response.status(500).send({ message: error.message });
   }
};

const deleteComment = async (request, response) => {
   try {
      const postId = request.params.postId ?? request.params.id;
      const { commentId } = request.params;
      if (!validatePostId(postId, response) || !validateCommentId(commentId, response)) {
         return;
      }
      const post = await getPostById(postId);
      if (!post) {
         return response.status(404).send({ message: 'Post not found' });
      }
      const comment = getCommentById(post, commentId);
      if (!comment) {
         return response.status(404).send({ message: 'Comment not found' });
      }
      comment.deleteOne();
      await post.save();
      response.send({ message: 'Comment deleted' });
   } catch (error) {
      console.log(error);
      response.status(500).send({ message: error.message });
   }
};

postRouter.get('/api/v1/posts', async function(request, response, next) {
   try {
      const search = request.query.search ?? request.query.title ?? '';
      const filter = search
         ? { title: { $regex: search, $options: 'i' } }  // case-insensitive regex  search on title, regex is used to allow partial matches
         : {};
      const posts = await Post.find(filter); 
      response.send(posts);
   } catch (error) {
      console.log(error);
      response.status(500).send({ message: error.message });
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
         const newPost = await Post.create({
            category: request.body.category,
            title: request.body.title,
            cover: request.body.cover,
            readTime: request.body.readTime,
            author: author._id,
            authorEmail: author.email,
            content: request.body.content
         });
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
         if (sendValidationError(error, response)) {
            return;
         }
         response.status(500).send({ message: error.message });
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
      if (sendValidationError(error, response)) {
         return;
      }
      response.status(500).send({ message: error.message });
   }
});

postRouter.put('/api/v1/posts/:postId', async (request, response, next) => {
   try {
      if (!isValidObjectId(request.params.postId)) {
         return response.status(400).send({ message: 'Invalid postId' });
      }
      const updateData = { ...request.body };
      if (updateData.author) {
         if (!isValidObjectId(updateData.author)) {
            return response.status(400).send({ message: 'Invalid authorId' });
         }
         const author = await Author.findById(updateData.author);
         if (!author) {
            return response.status(404).send({ message: 'Author not found' });
         }
         updateData.author = author._id;
         updateData.authorEmail = author.email;
      }
      const postModified = await Post.findByIdAndUpdate(
         request.params.postId,
         updateData,
         { new: true, runValidators: true }
      );
      if (!postModified) {
         return response.status(404).send({ message: 'Post not found' });
      }
      else response.send(postModified);
   } catch (error) {
      console.log(error);
      response.status(500).send({ message: error.message });
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
      response.status(500).send({ message: error.message });
   }
});

[
   '/api/v1/posts/:postId',
   '/blogPosts/:id'
].forEach((basePath) => {
   postRouter.get(`${basePath}/comments`, listComments);
   postRouter.get(`${basePath}/comments/:commentId`, getSingleComment);
   postRouter.post(basePath, createComment);
   postRouter.put(`${basePath}/comment/:commentId`, updateComment);
   postRouter.delete(`${basePath}/comment/:commentId`, deleteComment);
}); // This loop is used to register the same comment-related routes for both /api/v1/posts/:postId and /blogPosts/:id paths, allowing comments to be managed under either route structure.

export default postRouter;
