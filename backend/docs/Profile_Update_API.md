# My Profile API

Base URL: `http://localhost:4000/api/v1`. Register/login first; send `Authorization: Bearer <accessToken>` with both requests.

## Load saved fields

`GET /me` (200) returns `id`, `email`, `firstName`, `lastName`, `phone`, `role`, `youtubeProfileUrl`, `facebookProfileUrl`, `instagramProfileUrl`, `linkedInProfileUrl`, `marketingConsent`, `createdAt`, and `lastLoginAt`.

The app should prefill the profile screen with this response. Email/name/phone use the registration values. Social URLs initially return null and can be entered later.

## Update profile

`PATCH /me`, JSON body:

```json
{
  "email": "customer@example.com",
  "firstName": "App",
  "lastName": "User",
  "phone": "+27821234567",
  "youtubeProfileUrl": "https://www.youtube.com/@example",
  "facebookProfileUrl": "https://www.facebook.com/example",
  "instagramProfileUrl": "https://www.instagram.com/example/",
  "linkedInProfileUrl": "https://www.linkedin.com/in/example/"
}
```

Only send fields being changed. Response (200) is the updated profile in the same format as `GET /me`. Omitted fields keep their saved values. Send null to clear phone or any social URL; send null rather than an empty string when a URL input is cleared. Email cannot be null. Name fields must be 1–80 characters; phone follows the registration phone format. URLs must be valid HTTP/HTTPS URLs including the scheme, maximum 2048 characters. Email is trimmed/lowercased and must be a valid email with maximum 254 characters. `marketingConsent` remains an optional boolean.

An email change resets email verification. Future logins use the new email. Duplicate email returns 409 with code `EMAIL_IN_USE`. Invalid fields return 400; missing/invalid access token returns 401. User identity comes from the token, so no userId is accepted in the body.

This change extends the existing profile endpoints. Registration request fields stay the same. The mobile app renders the screen; these APIs provide its saved values and update operation.

Import [Profile Postman collection](postman/ChangeCars_Profile_Update.postman_collection.json). Configure credentials for a test account. The sample update changes phone/social URLs; edit the body before running it.
