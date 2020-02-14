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
