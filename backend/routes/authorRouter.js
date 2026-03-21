import { Router } from 'express'; 
import Author from '../models/Author.js'; 

const authorRouter = Router(); 

authorRouter.get('/api/v1/authors', async function(request, response) {
   const authors = await Author.find({}); 
   response.send(authors);
});

authorRouter.get('/api/v1/authors/:authorId', async (request, response, next) => {
    const theAuthor = await Author.findById(request.params.authorId);
    if (!theAuthor) response.status(404).send({ message: 'Not found'});
    else response.send(theAuthor);
    });


authorRouter.post('/api/v1/authors', async (request, response, next) => {
      try {
         const newAuthor = await Author.create(request.body);
         response.send(newAuthor);
      } catch (error) {
         console.log(error);
         next(400);
      }
});

authorRouter.put('/api/v1/authors/:authorId', async (request, response, next) => {
   try {
      const authorModified = await Author.findByIdAndUpdate(
         request.params.authorId,
         request.body,
         { new: true }
      );
      if (!authorModified) next(404);
      else response.send(authorModified);
   } catch (error) {
      console.log(error);
      next(400);
   }
});

authorRouter.delete('/api/v1/authors/:authorId', async (request, response, next) => {
      const authorDeleted = await Author.findByIdAndDelete(request.params.authorId);
      response.send({ message: 'author deleted' });
});



export default authorRouter;