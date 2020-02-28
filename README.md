# api-authorization

A custom element that renders and manages authorization state in AMF powered application.

After applying the AMF model and security scheme for an operation the element decides
which method to render, list of possible methods, manages state when the user
change any of the values, and provides validation methods for the UI.

If authorization method operates on headers or query parameters this component
dispatches corresponding change event so other component can update the sate.

More complex authorization schemes like OAuth 1or OAuth 2 first require obtaining
access token. Once the token is obtained then validation state is updated and corresponding
delivery method is used (header or query parameter).

This element support security description for both RAML and OAS.

-   OAuth 2
-   OAuth 2 with annotation (see [RAML's docs](https://github.com/raml-org/raml-annotations/tree/master/annotations/security-schemes))
-   OAuth 1
-   RAML custom scheme
-   Pass Through
-   Api Key (OAS)
-   Bearer (OAS)

Note, Digest authorization method is not supported at the time. If you are interested in this method, please, let us know.

## Usage

### Installation

```bash
npm install --save @advanced-rest-client/api-authorization
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/api-authorization/api-authorization.js';
    </script>
  </head>
  <body>
    <api-authorization-method redirecturi="..."></api-authorization-method>
    <script>
    (async () => {
      const model = await getAmfModel();
      const security = getSecurity(model, '/endpoint', 'get');
      const element = document.querySelector('api-authorization');
      element.amf = model;
      element.security = security;
    })();
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/api-authorization/api-authorization.js';

class SampleElement extends LitElement {
  static get properties() {
    return {
      amfModel: { type: Array },
      endpoint: { type: String },
      method: { type: String },
    };
  }

  get security() {
    const { amfModel, endpoint, method } = this;
    return this.readSecurityFor(amfModel, endpoint, method);
  }

  readSecurityFor(amf, endpoint, method) {
    // implement me
  }

  render() {
    const { amfModel, security } = this;
    return html`
    <api-authorization
      .amf="${amfModel}"
      .security="${security}"
    ></api-authorization-method>`;
  }
}
customElements.define('sample-element', SampleElement);
```

### Applying AMF model

First step is to pass the generated AMF model to the `amf` property. It is required to properly resolve internal model dependencies and to read keys in [JSON+LD compact model](https://w3c.github.io/json-ld-syntax/#compact-iris).

Second step is to extract the correct security definition for an operation. It is added to a `http://a.ml/vocabularies/apiContract#supportedOperation` object. It should be an array of all supported by the operation methods.

An example script that applies the values can look like the following.

```html
<api-authorization-method type="OAuth 2" id="auth"></api-authorization-method>
<script>
(async () => {
  const model = await getAmfModelSomehow();
  const security = readSecurityFor(model, '/endpoint', 'GET');
  const method = document.getElementById('auth');
  method.amf = model;
  method.security = security;
})();
</script>
```

The `getAmfModelSomehow()` function can download pre-generated model or run AMF parser directly from RAML or OAS specification.
Then the `readSecurityFor()` function looks for security definition in `/endpoint` endpoint, inside `GET` method.
When ready the values are applied to the element.

The order of setting `amf` and `security` parameters doesn't matter as the data processing starts asynchronously.

A note on clearing `settings` property. When an `undefined` or any incompatible value is set to the `settings` property, the component renders nothing and sets `aria-hidden` attribute.

### Authorization settings

An API may define more than one authorization method to be applied to a request. This is possible with OAS defined APIs, RAML has no such concept. Because of that the `settings` getter (or `serialize()` function) returns an array of applied authorization settings.

Each object has `type` and `valid` properties. The `type` is one of supported by the `api-authorization-method` values for `type` attribute. The `valid` is a result of validating the element that provides the UI for the authorization method.
Additionally each object contains `settings` property that contains user entered values and configuration read from the API. The properties for this object depends on selected authorization method and it is a result of calling `serialize()` function on `api-authorization-method`.

### Applying authorization settings

The component does not propagate changes to the headers or query parameters.
This should be done before the request is being executed. For that call `createAuthParams()` method to generate a list of parameters to apply to the request object.

### Additional steps

#### Digest, NTLM

Digest and NTLM authorization methods interacts with the request in a way that makes it impossible to apply the settings to the request before initializing the connection. It requires a series of request / response managed on the same connection. Because of that for this two methods the component produces authorization settings only. The hosting application must always check for current authorization settings and if either method is used then perform the authorization when connection is made.

#### OAuth 1

OAuth 1 authorization is based on signing the request data: HTTP method and the URL. This may change after the authorization is set up.
Because of that the application that host this element must sign the request with the authorization header as described in [this document](https://oauth1.wp-api.org/docs/basics/Signing.html). Use `settings` getter to get current settings.

Example

```javascript
const settings = node.serialize();
const oauth1 = settings.find((item) => item.type === 'oauth 1');
if (oauth1 && oauth1.valid) {
  signRequest(oauth1.settings, request.url, request.method);
}
```

The `@advanced-rest-client/oauth-authorization` component has `signRequest(request, auth)` method to sign a request for OAuth 1 protocol.

## Development

```sh
git clone https://github.com/advanced-rest-client/api-authorization
cd api-authorization
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests
```sh
npm test
```
