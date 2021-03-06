---
id: page-plugin
title: Plugins - JWT
header_title: JWT
header_icon: /assets/images/icons/plugins/jwt.png
breadcrumbs:
  Plugins: /plugins
nav:
  - label: Getting Started
    items:
      - label: Terminology
      - label: Configuration
  - label: Documentation
    items:
      - label: Create a Consumer
      - label: Create a JWT credential
      - label: Delete a JWT credential
      - label: List JWT credentials
      - label: Craft a JWT with a secret (HS256)
      - label: Send a request with the JWT
      - label: (Optional) Verified claims
      - label: (Optional) Base64 encoded secret
      - label: Craft a JWT with public/private keys (RS256)
      - label: Generate public/private keys
      - label: Using the JWT plugin with Auth0
      - label: Upstream Headers
---

Verify requests containing HS256 or RS256 signed JSON Web Tokens (as specified in [RFC 7519][rfc-jwt]). Each of your Consumers will have JWT credentials (public and secret keys) which must be used to sign their JWTs. A token can then be passed through the Authorization header or in the request's URI and Kong will either proxy the request to your upstream services if the token's signature is verified, or discard the request if not. Kong can also perform verifications on some of the registered claims of RFC 7519 (exp and nbf).

----

## Terminology

- `API`: your upstream service, for which Kong proxies requests to.
- `Plugin`: a plugin executes actions inside Kong during the request/response lifecycle.
- `Consumer`: a developer or service using the API. When using Kong, a Consumer authenticates itself with Kong which proxies every call to the upstream API.
- `Credential`: in the JWT plugin context, a pair of unique values consisting of a public key and a secret, used to sign and verify a JWT, and associated to a Consumer.

----

## Configuration

Configuring the plugin is straightforward, you can add it on top of an [API][api-object] by executing the following request on your Kong server:

```bash
$ curl -X POST http://kong:8001/apis/{api}/plugins \
    --data "name=jwt"
```

- `api`: The `id` or `name` of the API that this plugin configuration will target

You can also apply it for every API using the `http://kong:8001/plugins/` endpoint. Read the [Plugin Reference](/docs/latest/admin-api/#add-plugin) for more information.

form parameter                          | default | description
---                                     | ---     | ---
`name`                                  |         | The name of the plugin to use, in this case: `jwt`.
`config.uri_param_names`<br>*optional*  | `jwt`   | A list of querystring parameters that Kong will inspect to retrieve JWTs.
`config.claims_to_verify`<br>*optional* |         | A list of registered claims (according to [RFC 7519][rfc-jwt]) that Kong can verify as well. Accepted values: `exp`, `nbf`.
`config.key_claim_name`<br>*optional*   | `iss`   | The name of the claim in which the `key` identifying the secret **must** be passed.
`config.secret_is_base64`<br>*optional* | `false` | If true, the plugin assumes the credential's `secret` to be base64 encoded. You will need to create a base64 encoded secret for your Consumer, and sign your JWT with the original secret.
`config.anonymous`<br>*optional*        | ``      | An optional string (consumer uuid) value to use as an "anonymous" consumer if authentication fails. If empty (default), the request will fail with an authentication failure `4xx`. Please note that this value must refer to the Consumer `id` attribute which is internal to Kong, and **not** its `custom_id`.
`config.run_on_preflight`<br>*optional* | `true`  | A boolean value that indicates whether the plugin should run (and try to authenticate) on `OPTIONS` preflight requests, if set to `false` then `OPTIONS` requests will always be allowed.

<div class="alert alert-warning">
    <center>The option `config.run_on_preflight` is only available from version `0.11.1` and later</center>
</div>

----

## Documentation

In order to use the plugin, you first need to create a Consumer and associate one or more credentials to it. The Consumer represents a developer using the final service/API, and a JWT credential holds the public and private keys used to verify a crafted token.

### Create a Consumer

You need to associate a credential to an existing [Consumer][consumer-object] object. The Consumer is an entity consuming the API. To create a [Consumer][consumer-object] you can execute the following request:

```bash
$ curl -X POST http://kong:8001/consumers \
    --data "username=<USERNAME>" \
    --data "custom_id=<CUSTOM_ID>"
HTTP/1.1 201 Created
```

form parameter                  | default | description
---                             | ---     | ---
`username`<br>*semi-optional*   |         | The username for this Consumer. Either this field or `custom_id` must be specified.
`custom_id`<br>*semi-optional*  |         | A custom identifier used to map the Consumer to an external database. Either this field or `username` must be specified.

A [Consumer][consumer-object] can have many JWT credentials.

### Create a JWT credential

You can provision a new HS256 JWT credential by issuing the following HTTP request:

```bash
$ curl -X POST http://kong:8001/consumers/{consumer}/jwt -H "Content-Type: application/x-www-form-urlencoded"
HTTP/1.1 201 Created

{
    "consumer_id": "7bce93e1-0a90-489c-c887-d385545f8f4b",
    "created_at": 1442426001000,
    "id": "bcbfb45d-e391-42bf-c2ed-94e32946753a",
    "key": "a36c3049b36249a3c9f8891cb127243c",
    "secret": "e71829c351aa4242c2719cbfbe671c09"
}
```

- `consumer`: The `id` or `username` property of the [Consumer][consumer-object] entity to associate the credentials to.

form parameter                 | default         | description
---                            | ---             | ---
`key`<br>*optional*            |                 | A unique string identifying the credential. If left out, it will be auto-generated.
`algorithm`<br>*optional*      | `HS256`         | The algorithm used to verify the token's signature. Can be `HS256`, `RS256`, or `ES256`.
`rsa_public_key`<br>*optional* |                 | If `algorithm` is `RS256` or `ES256`, the public key (in PEM format) to use to verify the token's signature.
`secret`<br>*optional*         |                 | If `algorithm` is `HS256` or `ES256`, the secret used to sign JWTs for this credential. If left out, will be auto-generated.

### Delete a JWT credential

You can remove a Consumer's JWT credential by issuing the following HTTP
request:

```bash
$ curl -X DELETE http://kong:8001/consumers/{consumer}/jwt/{id}
HTTP/1.1 204 No Content
```

- `consumer`: The `id` or `username` property of the [Consumer][consumer-object] entity to associate the credentials to.
- `id`: The `id` of the JWT credential.

### List JWT credentials

You can list a Consumer's JWT credentials by issuing the following HTTP
request:

```bash
$ curl -X GET http://kong:8001/consumers/{consumer}/jwt
HTTP/1.1 200 OK
```

- `consumer`: The `id` or `username` property of the
  [Consumer][consumer-object] entity to list credentials for.

```json
{
    "data": [
        {
            "rsa_public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgK .... -----END PUBLIC KEY-----",
            "consumer_id": "39f52333-9741-48a7-9450-495960d91684",
            "id": "3239880d-1de5-4dbc-bccf-78f7a4280f33",
            "created_at": 1491430568000,
            "key": "c5a55906cc244f483226e02bcff2b5e",
            "algorithm": "RS256",
            "secret": "b0970f7fc9564e65xklfn48930b5d08b1"
        }
    ],
    "total": 1
}
```

### Craft a JWT with a secret (HS256)

Now that your Consumer has a credential, and assuming we want to sign it using `HS256`, the JWT should be crafted as follows (according to [RFC 7519][rfc-jwt]):

First, its header must be:

```json
{
    "typ": "JWT",
    "alg": "HS256"
}
```

Secondly, the claims **must** contain the secret's `key` in the configured claim (from `config.key_claim_name`). That claim is `iss` (issuer field) by default. Set its value to our previously created credential's `key`. The claims may contain other values.

```json
{
    "iss": "a36c3049b36249a3c9f8891cb127243c"
}
```

Using the JWT debugger at https://jwt.io with the header (HS256), claims (iss, etc), and `secret` associated with this `key` (e71829c351aa4242c2719cbfbe671c09), you'll end up with a JWT token of:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhMzZjMzA0OWIzNjI0OWEzYzlmODg5MWNiMTI3MjQzYyIsImV4cCI6MTQ0MjQzMDA1NCwibmJmIjoxNDQyNDI2NDU0LCJpYXQiOjE0NDI0MjY0NTR9.AhumfY35GFLuEEjrOXiaADo7Ae6gt_8VLwX7qffhQN4
```

### Send a request with the JWT

The JWT can now be included in a request to Kong by adding it to the `Authorization` header:

```bash
$ curl http://kong:8000/{api path} \
    -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhMzZjMzA0OWIzNjI0OWEzYzlmODg5MWNiMTI3MjQzYyIsImV4cCI6MTQ0MjQzMDA1NCwibmJmIjoxNDQyNDI2NDU0LCJpYXQiOjE0NDI0MjY0NTR9.AhumfY35GFLuEEjrOXiaADo7Ae6gt_8VLwX7qffhQN4'
```

Or as a querystring parameter, if configured in `config.uri_param_names` (which contains `jwt` by default):

```bash
$ curl http://kong:8000/{api path}?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhMzZjMzA0OWIzNjI0OWEzYzlmODg5MWNiMTI3MjQzYyIsImV4cCI6MTQ0MjQzMDA1NCwibmJmIjoxNDQyNDI2NDU0LCJpYXQiOjE0NDI0MjY0NTR9.AhumfY35GFLuEEjrOXiaADo7Ae6gt_8VLwX7qffhQN4
```

The request will be inspected by Kong, whose behavior depends on the validity of the JWT:

request                        | proxied to upstream API  | response status code
--------                       |--------------------------|---------------------
has no JWT                     | no                       | 401
missing or invalid `iss` claim | no                       | 401
invalid signature              | no                       | 403
valid signature                | yes                      | from the upstream service
valid signature, invalid verified claim (**option**) | no                       | 403

<div class="alert alert-warning">
  <strong>Note:</strong> When the JWT is valid and proxied to the API, Kong makes no modification to the request other than adding headers identifying the Consumer. The JWT will be forwarded to your upstream service, which can assume its validity. It is now the role of your service to base64 decode the JWT claims and make use of them.
</div>

### (**Optional**) Verified claims

Kong can also perform verification on registered claims, as defined in [RFC 7519][rfc-jwt]. To perform verification on a claim, add it to the `config.claims_to_verify` property:

```bash
# This adds verification for both nbf and exp claims:
$ curl -X PATCH http://kong:8001/apis/{api}/plugins/{jwt plugin id} \
    --data "config.claims_to_verify=exp,nbf"
```

Supported claims:

claim name | verification
-----------|-------------
`exp`      | identifies the expiration time on or after which the JWT must not be accepted for processing.
`nbf`      | identifies the time before which the JWT must not be accepted for processing.

### (**Optional**) Base64 encoded secret

If your secret contains binary data, you can store them as base64 encoded in Kong. Enable this option in the plugin's configuration:

```bash
$ curl -X PATCH http://kong:8001/apis/{api}/plugins/{jwt plugin id} \
    --data "config.secret_is_base64=true"
```

Then, base64 encode your consumers' secrets:

```bash
# secret is: "blob data"
$ curl -X POST http://kong:8001/consumers/{consumer}/jwt \
  --data "secret=YmxvYiBkYXRh"
```

And sign your JWT using the original secret ("blob data").

### Craft a JWT with public/private keys (RS256 or ES256)

If you wish to use RS256 or ES256 to verify your JWTs, then when creating a JWT credential, select `RS256` or `ES256` as the `algorithm`, and explicitly upload the public key in the `rsa_public_key` field (including for ES256 signed tokens). For example:

```bash
$ curl -X POST http://kong:8001/consumers/{consumer}/jwt \
      -F "rsa_public_key=@/path/to/public_key.pem" \
HTTP/1.1 201 Created

{
    "consumer_id": "7bce93e1-0a90-489c-c887-d385545f8f4b",
    "created_at": 1442426001000,
    "id": "bcbfb45d-e391-42bf-c2ed-94e32946753a",
    "key": "a36c3049b36249a3c9f8891cb127243c",
    "rsa_public_key": "-----BEGIN PUBLIC KEY----- ..."
}
```

When creating the signature, make sure that the header is:

```json
{
    "typ": "JWT",
    "alg": "RS256"
}
```

Secondly, the claims **must** contain the secret's `key` field (this **isn't** your private key used to generate the token, but just an identifier for this credential) in the configured claim (from `config.key_claim_name`). That claim is `iss` (issuer field) by default. Set its value to our previously created credential's `key`. The claims may contain other values.

```json
{
    "iss": "a36c3049b36249a3c9f8891cb127243c"
}
```

Then create the signature using your private keys. Using the JWT debugger at https://jwt.io, set the right header (RS256), the claims (iss, etc), and the associated public key. Then append the resulting value in the `Authorization` header, for example:

```bash
$ curl http://kong:8000/{api path} \
    -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxM2Q1ODE0NTcyZTc0YTIyYjFhOWEwMDJmMmQxN2MzNyJ9.uNPTnDZXVShFYUSiii78Q-IAfhnc2ExjarZr_WVhGrHHBLweOBJxGJlAKZQEKE4rVd7D6hCtWSkvAAOu7BU34OnlxtQqB8ArGX58xhpIqHtFUkj882JQ9QD6_v2S2Ad-EmEx5402ge71VWEJ0-jyH2WvfxZ_pD90n5AG5rAbYNAIlm2Ew78q4w4GVSivpletUhcv31-U3GROsa7dl8rYMqx6gyo9oIIDcGoMh3bu8su5kQc5SQBFp1CcA5H8sHGfYs-Et5rCU2A6yKbyXtpHrd1Y9oMrZpEfQdgpLae0AfWRf6JutA9SPhst9-5rn4o3cdUmto_TBGqHsFmVyob8VQ'
```

### Generate public/private keys

To create a brand new pair of public/private keys, you can run the following command:

```bash
$ openssl genrsa -out private.pem 2048
```

This private key must be kept secret. To generate a public key corresponding to the private key, execute:

```bash
$ openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

If you run the commands above, the public key will be written in `public.pem`, while the private key will be written in `private.pem`.

### Using the JWT plugin with Auth0

[Auth0](https://auth0.com/) is a popular solution for Authorization, and relies
heavily on JWTs. Auth0 relies on RS256, does not base64 encode, and publically
hosts the public key certificate used to sign tokens. Account name is referred
to "COMPANYNAME" for the sake of the guide.

To get started, create an API. _Note: Auth0 does not use base64 encoded
secrets._

```bash
$ curl -i -X POST http://localhost:8001/apis \
    --data "name={api}" \
    --data "hosts=example.com" \
    --data "upstream_url=http://httpbin.org"
```

Add the JWT Plugin:

```bash
$ curl -X POST http://localhost:8001/apis/{api}/plugins \
    --data "name=jwt"
```

Download your Auth0 account's X509 Certificate:

```bash
$ curl -o {COMPANYNAME}.pem https://{COMPANYNAME}.auth0.com/pem
```

Extract the public key from the X509 Certificate:

```bash
$ openssl x509 -pubkey -noout -in {COMPANYNAME}.pem > pubkey.pem
```

Create a Consumer with the Auth0 public key:

```bash
$ curl -i -X POST http://kong:8001/consumers \
    --data "username=<USERNAME>" \
    --data "custom_id=<CUSTOM_ID>"

$ curl -i -X POST http://localhost:8001/consumers/{consumer}/jwt \
    -F "algorithm=RS256" \
    -F "rsa_public_key=@./pubkey.pem" \
    -F "key=https://{COMPAYNAME}.auth0.com/" # the `iss` field
```

The JWT plugin by default validates the `key_claim_name` against the `iss`
field in the token. Keys issued by Auth0 have their `iss` field set to
`http://{COMPANYNAME}.auth0.com/`. You can use [jwt.io](https://jwt.io) to
validate the `iss` field for the `key` parameter when creating the
Consumer.

Send requests through, only tokens signed by Auth0 will work:

```bash
$ curl -i http://localhost:8000 \
    -H "Host:example.com" \
    -H "Authorization:Bearer {{TOKEN}}"
```

Success!

### Upstream Headers

When a JWT is valid, a Consumer has been authenticated, the plugin will append some headers to the request before proxying it to the upstream API/service, so that you can identify the Consumer in your code:

* `X-Consumer-ID`, the ID of the Consumer on Kong
* `X-Consumer-Custom-ID`, the `custom_id` of the Consumer (if set)
* `X-Consumer-Username`, the `username` of the Consumer (if set)
* `X-Anonymous-Consumer`, will be set to `true` when authentication failed, and the 'anonymous' consumer was set instead.

You can use this information on your side to implement additional logic. You can use the `X-Consumer-ID` value to query the Kong Admin API and retrieve more information about the Consumer.

[rfc-jwt]: https://tools.ietf.org/html/rfc7519
[api-object]: /docs/latest/admin-api/#api-object
[configuration]: /docs/latest/configuration
[consumer-object]: /docs/latest/admin-api/#consumer-object
[faq-authentication]: /about/faq/#how-can-i-add-an-authentication-layer-on-a-microservice/api?
