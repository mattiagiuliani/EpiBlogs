import { Router } from 'express'; 
import { isValidObjectId } from 'mongoose';
import Author from '../models/Author.js'; 
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import mailer from '../middlewares/mailer.js';

const authorRouter = Router(); 

authorRouter.get('/api/v1/authors', async function(request, response) {
   const authors = await Author.find({}); 
   response.send(authors);
});

authorRouter.get('/api/v1/authors/:authorId', async (request, response, next) => {
    if (!isValidObjectId(request.params.authorId)) {
        return response.status(400).send({ message: 'Invalid authorId' });
    }
    const theAuthor = await Author.findById(request.params.authorId);
    if (!theAuthor) response.status(404).send({ message: 'Not found'});
    else response.send(theAuthor);
    });


authorRouter.post('/api/v1/authors', async (request, response, next) => {
   try {
      const newAuthor = await Author.create(request.body);
      const authorName = newAuthor.firstName ?? 'user';
      mailer.sendMail({
         from: process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim(),
         to: [newAuthor.email],
         subject: 'Welcome to our platform',
         text: `Thank you for joining us, ${authorName}!`,
         html: `<h1>Thank you for joining us, ${authorName}!</h1>`
      }).catch((error) => console.log('Email send failed:', error));
      response.send(newAuthor);
   } catch (error) {
      console.log(error);
      response.status(400).send({ message: error.message });
   }
});

authorRouter.patch('/api/v1/authors/:authorId/avatar', uploadCloudinary.single('avatar')
, async (request, response, next) => {
   try {
      if (!isValidObjectId(request.params.authorId)) {
         return response.status(400).send({ message: 'Invalid authorId' });
      }
      if (!request.file) {
         return response.status(400).send({ message: 'Avatar file is required' });
      }
      const authorModified = await Author.findByIdAndUpdate(
         request.params.authorId,
         { avatar: request.file.path },
         { new: true }
      );
      if (!authorModified) {
         return response.status(404).send({ message: 'Author not found' });
      }
      else response.send(authorModified);
   } catch (error) {
      console.log(error);
      response.status(400).send({ message: error.message });
   }
});

authorRouter.put('/api/v1/authors/:authorId', async (request, response, next) => {
   try {
      if (!isValidObjectId(request.params.authorId)) {
         return response.status(400).send({ message: 'Invalid authorId' });
      }
      const authorModified = await Author.findByIdAndUpdate(
         request.params.authorId,
         request.body,
         { new: true }
      );
      if (!authorModified) {
         return response.status(404).send({ message: 'Author not found' });
      }
      else response.send(authorModified);
   } catch (error) {
      console.log(error);
      response.status(400).send({ message: error.message });
   }
});

authorRouter.delete('/api/v1/authors/:authorId', async (request, response, next) => {
      if (!isValidObjectId(request.params.authorId)) {
         return response.status(400).send({ message: 'Invalid authorId' });
      }
      const authorDeleted = await Author.findByIdAndDelete(request.params.authorId);
      if (!authorDeleted) {
         return response.status(404).send({ message: 'Author not found' });
      }
      response.send({ message: 'author deleted' });
});

export default authorRouter;
