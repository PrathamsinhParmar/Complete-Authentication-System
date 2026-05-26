# Complete Authentication - Oneshot

A Node.js + Express + MongoDB authentication system with email-based OTP verification, JWT access tokens, refresh-token sessions, and Google OAuth2 mail delivery through Nodemailer.

## Features

- User registration with unique `username` and `email`
- Email verification using a 6-digit OTP
- Login only after email verification
- JWT access token generation
- Refresh token rotation with server-side session tracking
- Logout from the current device
- Logout from all devices
- MongoDB persistence with Mongoose models for users, sessions, and OTPs
- SMTP email delivery using Gmail OAuth2

## Tech Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- JSON Web Tokens
- bcrypt is installed, while the current implementation uses SHA-256 hashing for passwords and tokens
- Nodemailer with Gmail OAuth2
- cookie-parser
- morgan for request logging
- dotenv for environment configuration

## Project Structure

```text
server.js
src/
  app.js
  config/
    config.js
    db.js
  controllers/
    auth.controller.js
  models/
    otp.model.js
    session.model.js
    user.model.js
  routes/
    auth.routes.js
  services/
    email.service.js
  utils/
    otp.utils.js
```

## How It Works

1. A user registers with `username`, `email`, and `password`.
2. The server stores the user with `verified: false`.
3. A 6-digit OTP is generated, hashed, saved in MongoDB, and sent by email.
4. The user verifies the account using the OTP.
5. After verification, login is allowed.
6. Login returns an access token and sets a refresh-token cookie.
7. Refresh tokens are stored as hashes in the `session` collection so they can be revoked.
8. Logout revokes the current session; logout-all revokes every active session for the user.

## Environment Variables

Create a `.env` file in the project root with the following values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/your_database_name
JWT_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_google_oauth_refresh_token
GOOGLE_USER=your_gmail_address@gmail.com
```

### Notes

- `GOOGLE_*` values are required because email delivery uses Gmail OAuth2.
- `JWT_SECRET` is used to sign both access and refresh tokens.
- `MONGO_URI` must point to a reachable MongoDB instance.
- `PORT` is required by the app bootstrap.

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file using the variables listed above.

3. Start MongoDB locally or ensure your remote MongoDB instance is reachable.

4. Start the server:

```bash
npm run dev
```

For production:

```bash
npm start
```

## Running the Server

The application boots from `server.js`, connects to MongoDB, and starts listening on the configured port.

- Health check: `GET /`
- Auth base path: `/api/auth`

Example local URL:

```text
http://localhost:5000
```

## Authentication Endpoints

### Register a User

`POST /api/auth/register`

Request body:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "message": "User registered successfully!",
  "user": { ... }
}
```

Behavior:

- Rejects duplicate usernames or emails.
- Hashes the password before saving.
- Creates an OTP record and sends the OTP through email.

### Verify Email

`GET /api/auth/verify-email`

Request body:

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

Response:

```json
{
  "message": "User email verified successfully!",
  "user": { ... }
}
```

Behavior:

- Hashes the submitted OTP and compares it with the stored OTP hash.
- Marks the user as verified.
- Deletes OTP documents for that user after successful verification.

### Login

`POST /api/auth/login`

Request body:

```json
{
  "username": "john_doe",
  "password": "password123"
}
```

or:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "message": "User loggedin successfully!",
  "user": { ... },
  "accessToken": "eyJhbGciOi..."
}
```

Behavior:

- Requires `verified: true`.
- Creates a refresh-token session in MongoDB.
- Sets a `refreshToken` HTTP-only cookie.
- Returns a short-lived access token in the response body.

### Get Current User

`POST /api/auth/get-me`

Authorization options:

- `Authorization: Bearer <accessToken>`
- or a `token` cookie, if your client sets one

Response:

```json
{
  "message": "User fetched successfully!",
  "user": { ... }
}
```

### Refresh Access Token

`POST /api/auth/refresh-token`

Requirements:

- A valid `refreshToken` cookie.

Response:

```json
{
  "message": "Access token refershed successfully!",
  "accessToken": "eyJhbGciOi..."
}
```

Behavior:

- Validates the refresh token against the hashed session record.
- Issues a new access token.
- Rotates the refresh token and updates the stored session hash.

### Logout Current Device

`POST /api/auth/logout`

Requirements:

- A valid `refreshToken` cookie.

Response:

```json
{
  "message": "User Loggedout Successfully!"
}
```

Behavior:

- Finds the active session by refresh-token hash.
- Marks that session as revoked.
- Clears the refresh-token cookie.

### Logout All Devices

`POST /api/auth/logout-all`

Requirements:

- A valid `refreshToken` cookie.

Response:

```json
{
  "message": "User Logout From All Devices!"
}
```

Behavior:

- Verifies the refresh token.
- Revokes every active session for that user.
- Clears the refresh-token cookie.

## Data Models

### User

- `username` - unique, required
- `email` - unique, required
- `password` - required
- `verified` - boolean flag, defaults to `false`

### OTP

- `user` - reference to the user document
- `email` - email address used for verification
- `otpHash` - SHA-256 hash of the OTP

### Session

- `user` - reference to the user document
- `refreshToken` - SHA-256 hash of the refresh token
- `ip` - request IP
- `userAgent` - request user-agent header
- `revoked` - boolean flag, defaults to `false`

## Email Delivery

Email sending is handled in `src/services/email.service.js` using Gmail OAuth2.

The app verifies the transporter on startup and sends an HTML OTP message that includes the verification code and a short expiry notice.

## Important Implementation Notes

- Passwords are currently hashed with SHA-256 in the controller. The `bcrypt` dependency is installed, but not used in the active login/register flow.
- Refresh tokens are stored as hashes, not in plain text.
- The refresh-token cookie is configured as `httpOnly`, `secure`, and `sameSite: "strict"`.
- The verification route is registered as `GET /api/auth/verify-email`, while the controller reads `req.body`.
- The app is designed for HTTPS environments when using secure cookies.

## Example Flow

1. Register a user with `POST /api/auth/register`.
2. Check the mailbox for the OTP.
3. Verify the account with `GET /api/auth/verify-email`.
4. Log in with `POST /api/auth/login`.
5. Use the returned access token for authenticated requests.
6. Refresh the access token with `POST /api/auth/refresh-token` when needed.

## Troubleshooting

- If the server throws an environment error, check that all required `.env` keys are present.
- If email sending fails, verify the Gmail OAuth2 credentials and refresh token.
- If login fails with `Email not verified!`, complete the OTP verification step first.
- If refresh or logout requests fail, confirm the `refreshToken` cookie is being sent by the client.

## License

This project does not declare a license in `package.json`. Add one if you intend to distribute or reuse the code publicly.