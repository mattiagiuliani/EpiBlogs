Giorno 1 (settimana 1)
Inizializzato il progetto (includendo un file .env)
Visualizzato gli autori del blog (authors)
Struttura risorsa author
{
    _id
    email
    password
    tokenGoogle
    firstName
    lastName
    birthDate
    avatar
}

Rotte backend
GET /api/v1/authors (ritorna la lista degli autori)
GET /api/v1/authors/:authorId (ritorna i dettagli di un singolo autore)
POST /api/v1/authors (Crea un nuovo autore, verrà modificato successivamente con l'aggiunta dell'hash dell password)
PUT /api/v1/authors/:authorId (modifica l'autore con l'id associato)
DELETE /api/v1/authors/:authorId (cancella l'autore con l'id associato)

Frontend
Impostata la gestione del CORS

Installata la libreria:

npm i cors
E in server.js aggiunto:

import cors from "cors";

server.use(cors());

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Giorno 2 (settimana 1)
Fatte tutte le CRUD per i posts
Paginate le GET lista di authors e posts

Struttura risorsa post
{
    _id
    category
    title
    cover
    readTime: {
        value
        unit
    }
    author
    content
}

Rotte backend
GET /api/v1/posts (aggiungendo il supporto al parametro di ricerca ?title=parola-di-ricerca, se presente l'endpoint restituisce solo i post che nel titolo contengono la parola di ricerca)
GET /api/v1/posts/:postId
POST /api/v1/posts
PUT /api/v1/posts/:postId
DELETE /api/v1/posts/:postId
GET /api/v1/authors/:authorId/posts (mostra tutti i post di uno specifico autore)

Frontend
Fatto funzionare il form di creazione di un post
Visualizzata la lista dei post in homepage
Sviluppata funzionalità di ricerca post