# Login API

Local base URL: `http://localhost:4000/api/v1`.

## Register and login

`POST /auth/register` (201), JSON body:

```json
{
  "email": "customer@example.com",
  "password": "Example123!",
  "firstName": "App",
  "lastName": "User",
  "acceptTerms": true
}
```

`POST /auth/login` (200), JSON body:

```json
{ "email": "customer@example.com", "password": "Example123!" }
```

Both return `{tokenType, accessToken, expiresIn, refreshToken, refreshTokenExpiresAt, user}`. `expiresIn` is seconds. Store tokens securely; pass `Authorization: Bearer <accessToken>` for user-specific requests. Credentials must belong to a registered account; the example above does not create an account until registration is called.

`POST /auth/refresh` with `{ "refreshToken": "<refreshToken>" }` returns new tokens. Replace both stored tokens on refresh (rotation). `GET /auth/me` returns the current user; `POST /auth/logout` revokes the session and returns 204.

## Postman

Import [ChangeCars_Login_Favourites.postman_collection.json](postman/ChangeCars_Login_Favourites.postman_collection.json). Set `baseUrl`, `email` and `password`. For a new account, run the optional registration request first; then run Login. The collection stores access and refresh tokens automatically.

For saving cars after login, see [Favourites_API.md](Favourites_API.md).
