import { html, fixture, assert, aTimeout, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import { ApiViewModel } from '@api-components/api-forms';
import { AmfLoader } from './amf-loader.js';
import { clearCache } from '../index.js';
import '../api-authorization.js';

/** @typedef {import('../index').ApiAuthorization} ApiAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BasicAuthorization} BasicAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth1Authorization} OAuth1Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.DigestAuthorization} DigestAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BearerAuthorization} BearerAuthorization */
/** @typedef {import('../src/types').ApiKeySettings} ApiKeySettings */
/** @typedef {import('../src/types').PassThroughSetting} PassThroughSetting */
/** @typedef {import('../src/types').RamlCustomSetting} RamlCustomSetting */

describe('ApiAuthorization RAML tests', () => {
  /**
   * @return {Promise<ApiAuthorization>} 
   */
  async function basicFixture(amf, security) {
    return (fixture(html`<api-authorization
      .amf="${amf}"
      .security="${security}"
    ></api-authorization>`));
  }

  /**
   * @return {Promise<ApiAuthorization>} 
   */
  async function modelFixture(amf, endpoint, method) {
    const security = AmfLoader.lookupSecurity(amf, endpoint, method);
    const element = await basicFixture(amf, security);
    await aTimeout(0);
    return element;
  }

  describe('Initialization', () => {
    it('can be initialized using web APIs', () => {
      document.createElement('api-authorization');
    });

    it('can be initialized with a template without the model', async () => {
      await basicFixture();
    });

    it('has default #selectedMethods', async () => {
      const element = await basicFixture();
      assert.equal(element.selectedMethods, null);
    });

    it('has default #selectedSchemes', async () => {
      const element = await basicFixture();
      assert.equal(element.selectedSchemes, null);
    });
  });

  describe('RAML tests', () => {
    [
      ['Full model', false],
      ['Compact model', true]
    ].forEach(([label, compact]) => {
      const fileName = 'demo-api';

      describe(`applying AMF model - ${label}`, () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        it('sets single authorization method', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          assert.typeOf(element.methods, 'array', 'methods is an array');
          assert.lengthOf(element.methods, 1, 'methods has single item');
        });

        it('sets multiple authorization methods', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          assert.typeOf(element.methods, 'array', 'methods is an array');
          assert.lengthOf(element.methods, 6, 'methods has 6 items');
        });

        it('sets default selection', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          assert.equal(element.selected, 0);
        });

        it('does not render scheme selector for single method', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          const node = element.shadowRoot.querySelector('anypoint-dropdown-menu');
          assert.notOk(node);
        });

        it('renders scheme label for single method', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          const node = element.shadowRoot.querySelector('.auth-selector-label');
          assert.ok(node);
        });

        it('renders scheme selector for multi method', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          const node = element.shadowRoot.querySelector('anypoint-dropdown-menu');
          assert.ok(node);
        });

        it('does not render scheme label for multi method', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          const node = element.shadowRoot.querySelector('.auth-selector-label');
          assert.notOk(node);
        });
      });

      describe(`Basic method - ${label}`, () => {
        const username = 'uname';
        let amf;
        let element = /** @type ApiAuthorization */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/basic', 'get');
        });

        afterEach(() => {
          clearCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Basic Authentication']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['basic']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is not invalid before calling validation method', () => {
          assert.isUndefined(element.invalid);
        });

        it('element is invalid without username', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with username', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const { settings } = element;
          assert.deepEqual(settings, [{
            valid: true,
            type: 'basic',
            config: {
              username,
              password: ''
            }
          }]);
        });

        it('creates params with createAuthParams()', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            authorization: 'Basic dW5hbWU6',
          }, 'has headers');
          assert.deepEqual(result.params, {}, 'has no params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });

        it('ignores createAuthParams() when not valid', async () => {
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {}, 'has no headers');
          assert.deepEqual(result.params, {}, 'has no params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Digest method - ${label}`, () => {
        const username = 'uname';
        let amf;
        let element = /** @type ApiAuthorization */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/digest', 'get');
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Digest Authentication']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['digest']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is not invalid before calling validation method', () => {
          assert.isUndefined(element.invalid);
        });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with required values', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.realm = 'realm';
          form.nonce = 'nonce';
          form.qop = 'auth';
          form.opaque = 'opaque';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          element.httpMethod = 'GET';
          element.requestUrl = 'https://api.domain.com/endpoint';
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.realm = 'realm';
          form.nonce = 'nonce';
          form.qop = 'auth';
          form.opaque = 'opaque';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'digest', 'type is set');
          assert.typeOf(settings.config, 'object');
          const aSettings = /** @type DigestAuthorization */ (settings.config);
          assert.equal(aSettings.algorithm, 'MD5', 'algorithm is set');
          assert.equal(aSettings.nc, '00000001', 'nc is set');
          assert.typeOf(aSettings.cnonce, 'string', 'cnonce is set');
          assert.typeOf(aSettings.response, 'string', 'response is set');
          assert.equal(aSettings.nonce, 'nonce', 'nonce is set');
          assert.equal(aSettings.opaque, 'opaque', 'opaque is set');
          assert.equal(aSettings.password, '', 'password is set');
          assert.equal(aSettings.qop, 'auth', 'qop is set');
          assert.equal(aSettings.realm, 'realm', 'realm is set');
          assert.equal(aSettings.username, username, 'username is set');
          assert.equal(aSettings.uri, '/endpoint', 'uri is set');
        });

        it('creates params with createAuthParams()', async () => {
          element.httpMethod = 'GET';
          element.requestUrl = 'https://api.domain.com/endpoint';
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.realm = 'realm';
          form.nonce = 'nonce';
          form.qop = 'auth';
          form.opaque = 'opaque';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {}, 'has no headers');
          assert.deepEqual(result.params, {}, 'has no params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Pass through method - ${label}`, () => {
        let amf;
        let element = /** @type ApiAuthorization */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/passthrough', 'get');
        });

        afterEach(() => {
          const model = new ApiViewModel();
          model.clearCache();
          clearCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Pass Through']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['passthrough']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        // This method form dispatched `changed` event (that triggers validation)
        // right after the model is loaded and form value changes. Therefore it's
        // practically always validated.
        // it('element is not invalid before calling validation method', () => {
        //   assert.isUndefined(element.invalid);
        // });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with required values', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'pass through', 'type is set');
          assert.typeOf(settings.config, 'object');
          const aSet = /** @type PassThroughSetting */ (settings.config);
          assert.typeOf(aSet.headers, 'object', 'headers is set');
          assert.typeOf(aSet.params, 'object', 'queryParameters is set');
        });

        it('creates params with createAuthParams()', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            api_key: 'test',
          }, 'has headers');
          assert.deepEqual(result.params, {
            query: 'my-value'
          }, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`RAML Custom method - ${label}`, () => {
        let amf;
        let element = /** @type ApiAuthorization */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/custom1', 'get');
        });

        afterEach(() => {
          const model = new ApiViewModel();
          model.clearCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['x-my-custom']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['custom1']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is not invalid without required values', () => {
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isNotTrue(element.invalid, 'is not invalid');
        });

        it('element is valid with required values', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'custom', 'type is set');
          assert.typeOf(settings.config, 'object');
          const aSet = /** @type RamlCustomSetting */ (settings.config);
          assert.typeOf(aSet.headers, 'object', 'headers is set');
          assert.typeOf(aSet.params, 'object', 'queryParameters is set');
        });

        it('creates params with createAuthParams()', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            SpecialTokenHeader: 'test',
          }, 'has headers');
          assert.deepEqual(result.params, {
            booleanTokenParam: 'true'
          }, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Oauth 2 method - ${label}`, () => {
        describe('Basics', () => {
          let amf;
          let element = /** @type ApiAuthorization */ (null);

          before(async () => {
            amf = await AmfLoader.load(Boolean(compact), String(fileName));
          });

          beforeEach(async () => {
            element = await modelFixture(amf, '/oauth2', 'post');
          });

          afterEach(() => {
            const model = new ApiViewModel();
            model.clearCache();
            clearCache();
          });

          it('has "types" in the authorization object', () => {
            const { types } = element.methods[0];
            assert.deepEqual(types, ['OAuth 2.0']);
          });

          it('has "names" in the authorization object', () => {
            const { names } = element.methods[0];
            assert.deepEqual(names, ['oauth2']);
          });

          it('has "schemes" in the authorization object', () => {
            const { schemes } = element.methods[0];
            assert.typeOf(schemes[0], 'object');
          });

          it('notifies changes when panel value change', () => {
            const form = element.shadowRoot.querySelector('api-authorization-method');
            const spy = sinon.spy();
            element.addEventListener('change', spy);
            form.clientId = 'test';
            form.dispatchEvent(new CustomEvent('change'));
            assert.isTrue(spy.called);
          });

          it('element is invalid without required values', () => {
            const result = element.validate();
            assert.isFalse(result, 'validation result is false');
            assert.isTrue(element.invalid, 'is invalid');
          });

          it('element is valid with required values', async () => {
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = 'test-client-id';
            form.accessToken = 'test-token';
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.validate();
            assert.isTrue(result, 'validation result is true');
            assert.isFalse(element.invalid, 'is not invalid');
          });

          it('produces authorization settings', async () => {
            element.redirectUri = 'https://rdr.com';
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = 'test-client-id';
            form.accessToken = 'test-token';
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const settings = element.settings[0];
            assert.isTrue(settings.valid, 'valid is true');
            assert.equal(settings.type, 'oauth 2', 'type is set');
            assert.typeOf(settings.config, 'object');

            const aSet = /** @type OAuth2Authorization */ (settings.config);
            assert.equal(aSet.grantType, 'implicit', 'grantType is set');
            assert.equal(aSet.clientId, 'test-client-id', 'clientId is set');
            assert.equal(aSet.accessToken, 'test-token', 'accessToken is set');
            assert.equal(aSet.tokenType, 'Bearer', 'tokenType is set');
            assert.deepEqual(aSet.scopes, ['profile', 'email'], 'scopes is set');
            assert.equal(aSet.deliveryMethod, 'header', 'deliveryMethod is set');
            assert.equal(aSet.deliveryName, 'Authorization', 'deliveryName is set');
            assert.equal(aSet.authorizationUri, 'https://auth.com', 'authorizationUri is set');
            assert.equal(aSet.redirectUri, element.redirectUri, 'redirectUri is set');
          });
        });

        describe('createAuthParams()', () => {
          let amf;
          const accessToken = 'test-token';
          const clientId = 'test-client-id';

          before(async () => {
            amf = await AmfLoader.load(Boolean(compact), String(fileName));
          });

          afterEach(() => {
            clearCache();
          });

          it('creates params with createAuthParams()', async () => {
            const element = await modelFixture(amf, '/oauth2', 'post');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {
              authorization: `Bearer ${  accessToken}`,
            }, 'has headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('ignores auth param in createAuthParams() when no token', async () => {
            const element = await modelFixture(amf, '/oauth2', 'post');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {}, 'has no headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('respects delivery method (query)', async () => {
            const element = await modelFixture(amf, '/oauth2-query-delivery', 'get');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.clientSecret = 'test';
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {}, 'has no headers');
            assert.deepEqual(result.params, {
              access_token: `Bearer ${  accessToken}`,
            }, 'has params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('respects delivery method (header)', async () => {
            const element = await modelFixture(amf, '/oauth2-header-delivery', 'get');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.clientSecret = 'test';
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {
              token: `Bearer ${  accessToken}`,
            }, 'has no headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('uses default delivery', async () => {
            const element = await modelFixture(amf, '/oauth2-no-delivery', 'get');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.clientSecret = 'test';
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {
              authorization: `Bearer ${  accessToken}`,
            }, 'has no headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });
        });
      });

      describe(`OAuth 1 method - ${label}`, () => {
        let amf;
        let element = /** @type ApiAuthorization */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth1', 'get');
        });

        afterEach(() => {
          const model = new ApiViewModel();
          model.clearCache();
          clearCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['OAuth 1.0']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['oauth1']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.consumerKey = 'test';
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('does not create params with createAuthParams()', async () => {
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {}, 'has headers');
          assert.deepEqual(result.params, {}, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Combo types - ${label}`, () => {
        let amf;
        let element = /** @type ApiAuthorization */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/combo-types', 'get');
        });

        it('has all "methods"', () => {
          const { methods } = element;
          assert.lengthOf(methods, 6);
        });

        it('has "types" in all authorization objects', () => {
          assert.deepEqual(element.methods[0].types, ['Basic Authentication']);
          assert.deepEqual(element.methods[1].types, ['Digest Authentication']);
          assert.deepEqual(element.methods[2].types, ['Pass Through']);
          assert.deepEqual(element.methods[3].types, ['x-my-custom']);
          assert.deepEqual(element.methods[4].types, ['OAuth 2.0']);
          assert.deepEqual(element.methods[5].types, ['OAuth 1.0']);
        });

        it('has "names" in the authorization object', () => {
          assert.deepEqual(element.methods[0].names, ['basic']);
          assert.deepEqual(element.methods[1].names, ['digest']);
          assert.deepEqual(element.methods[2].names, ['passthroughQueryString']);
          assert.deepEqual(element.methods[3].names, ['custom1']);
          assert.deepEqual(element.methods[4].names, ['oauth2']);
          assert.deepEqual(element.methods[5].names, ['oauth1']);
        });

        it('has "schemes" in the authorization object', () => {
          assert.typeOf(element.methods[0].schemes[0], 'object');
          assert.typeOf(element.methods[1].schemes[0], 'object');
          assert.typeOf(element.methods[2].schemes[0], 'object');
          assert.typeOf(element.methods[3].schemes[0], 'object');
          assert.typeOf(element.methods[4].schemes[0], 'object');
          assert.typeOf(element.methods[5].schemes[0], 'object');
        });

        it('has default selection', () => {
          assert.equal(element.selected, 0);
        });

        it('renders selected editor type', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(form.type, 'basic');
        });

        it('changes editor type programmatically', async () => {
          element.selected = 1;
          await nextFrame();
          const form = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(form.type, 'digest');
        });

        it('changes editor type with user interaction', async () => {
          const node = /** @type HTMLElement */ (element.shadowRoot.querySelector('anypoint-item[label="custom1"]'));
          node.click();
          await nextFrame();
          const form = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(form.type, 'custom');
        });
      });

      describe(`RAML null method - ${label}`, () => {
        let amf;
        let element = /** @type ApiAuthorization */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/nil-oauth2', 'get');
        });

        it('does not render authorization method', () => {
          const node = element.shadowRoot.querySelector('api-authorization-method');
          assert.notOk(node);
        });

        it('has no settings', () => {
          const { settings } = element;
          assert.deepEqual(settings, []);
        });
      });

      describe(`onchange - ${label}`, () => {
        let element = /** @type ApiAuthorization */ (null);
        let amf;

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/basic', 'get');
        });

        function makeChange(elm) {
          const form = elm.shadowRoot.querySelector('api-authorization-method');
          form.username = 'test';
          form.dispatchEvent(new CustomEvent('change'));
        }

        it('Getter returns previously registered handler', () => {
          assert.isUndefined(element.onchange);
          const f = () => {};
          element.onchange = f;
          assert.isTrue(element.onchange === f);
        });

        it('Calls registered function', () => {
          let called = false;
          const f = () => {
            called = true;
          };
          element.onchange = f;
          makeChange(element);
          element.onchange = null;
          assert.isTrue(called);
        });

        it('Unregisters old function', () => {
          let called1 = false;
          let called2 = false;
          const f1 = () => {
            called1 = true;
          };
          const f2 = () => {
            called2 = true;
          };
          element.onchange = f1;
          element.onchange = f2;
          makeChange(element);
          element.onchange = null;
          assert.isFalse(called1);
          assert.isTrue(called2);
        });
      });

      describe(`forceAuthorization() - ${label}`, () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        it('returns false when method has no authorize() function', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          const result = await element.forceAuthorization(undefined);
          assert.isFalse(result);
        });

        it('ignores calling authorize when validation failed', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          const node = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy(node, 'authorize');
          const result = await element.forceAuthorization(true);
          assert.isFalse(spy.called, 'function is not called');
          assert.isFalse(result, 'result is false');
        });

        it('returns true when valid', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.authorize = () => Promise.resolve(true);
          form.username = 'test';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = await element.forceAuthorization(true);
          assert.isTrue(result);
        });
      });

      describe('Cashing values', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact), String(fileName));
        });

        it('caches values between types', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          // sets values for basic
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = 'test-username';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          element.selected = 2;
          await nextFrame();
          element.selected = 0;
          await nextFrame();
          const node = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(node.username, 'test-username');
        });

        it('clears the cache for AMF model instance', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          // sets values for basic
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = 'test-username';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          element.selected = 2;
          await nextFrame();
          element.clearCache();
          element.selected = 0;
          await nextFrame();
          const node = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(node.username, '');
        });

        it('caches values between endpoints', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          // sets values for basic
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = 'test-username';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          element.security = AmfLoader.lookupSecurity(amf, '/combo-types', 'get');;
          await aTimeout(0);
          const node = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(node.username, 'test-username');
        });
      });
    });
  });
});
