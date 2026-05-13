# API de Pets (CRUD + Adoção) – Backend

Backend em Node.js/Express com MongoDB (Mongoose), autenticação JWT e upload de imagens (Multer).

## Tecnologias
- Node.js
- Express
- MongoDB + Mongoose
- JWT
- Multer

## Como executar
1. Suba o MongoDB local (ex.: `mongodb://localhost:27017/getpet`)
2. No diretório `backend/`:

```bash
npm install
npm run dev
```

O servidor sobe em `http://localhost:5000`.

## Autenticação (JWT)
Use o header:

`Authorization: Bearer SEU_TOKEN`

Rotas:
- `POST /users/register`
- `POST /users/login`
- `GET /users/checkuser`
- `PATCH /users/edit/:id` (com upload `image`)

## Rotas de Pets
- `POST /pets/create` (JWT + `multipart/form-data` com `images`)
- `GET /pets`
- `GET /pets/mypets` (JWT)
- `GET /pets/myadoptions` (JWT)
- `GET /pets/:id`
- `PATCH /pets/:id` (JWT + opcional `images`)
- `DELETE /pets/:id` (JWT)
- `PATCH /pets/schedule/:id` (JWT)
- `PATCH /pets/conclude/:id` (JWT – apenas dono do pet)

## Postman
Arquivo: `postman_collection.json` (na raiz do projeto).
