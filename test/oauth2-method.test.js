import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import {
  oauth2GrantTypes,
} from '@advanced-rest-client/authorization/src/Oauth2MethodMixin.js';
import { ApiViewModel } from '@api-components/api-forms';
import { AmfLoader } from './amf-loader.js';
import '../api-authorization-method.js';

/** @typedef {import('../index').ApiAuthorizationMethod} ApiAuthorizationMethod */

describe('OAuth 2', () => {
  /**
   * @param {any} amf 
   * @param {any} security 
   * @returns {Promise<ApiAuthorizationMethod>}
   */
  async function basicFixture(amf, security) {
    return (fixture(html`<api-authorization-method
      type="oauth 2"
      .amf="${amf}"
      .security="${security}"
    ></api-authorization-method>`));
  }

  /**
   * @param {any} amf 
   * @param {string} endpoint 
   * @param {string} method 
   * @returns {Promise<ApiAuthorizationMethod>}
   */
  async function modelFixture(amf, endpoint, method) {
    const security = AmfLoader.lookupSecurityScheme(amf, endpoint, method);
    const element = await basicFixture(amf, security);
    await aTimeout(0);
    return element;
  }

  [
    ['Full model', false],
    ['Compact model', true]
  ].forEach(([label, compact]) => {
    describe(String(label), () => {
      const viewModel = new ApiViewModel();

      describe('initialization', () => {
        let amf;
        let factory = /** @type ApiViewModel */ (null);

        before(async () => {
          // @ts-ignore
          amf = await AmfLoader.load(Boolean(compact));
          factory = new ApiViewModel();
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('can be initialized with document.createElement', () => {
          const element = document.createElement('api-authorization-method');
          assert.ok(element);
        });

        it('can be initialized in a template with model', async () => {
          const security = AmfLoader.lookupSecurityScheme(amf, '/oauth2', 'post');
          const element = await basicFixture(amf, security);
          await aTimeout(0);
          assert.ok(element);
        });

        it('can be initialized in a template without the model', async () => {
          // @ts-ignore
          const element = await basicFixture();
          await aTimeout(0);
          assert.ok(element);
        });
      });

      describe('setting API data', () => {
        let amf;
        let factory = /** @type ApiViewModel */ (null);

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact));
          factory = new ApiViewModel();
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('sets default authorization grants', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.deepEqual(element.grantTypes, oauth2GrantTypes);
        });

        it('sets API defined grant types', async () => {
          const element = await modelFixture(amf, '/oauth2-with-grant-list', 'get');
          assert.deepEqual(element.grantTypes, [{
            type: 'authorization_code',
            label: 'Authorization code (server flow)'
          }]);
        });

        it('changes grant types list when endpoint changes', async () => {
          const element = await modelFixture(amf, '/oauth2-with-grant-list', 'get');
          const security = AmfLoader.lookupSecurityScheme(amf, '/oauth2', 'post');
          element.security = security;
          await nextFrame();
          assert.deepEqual(element.grantTypes, oauth2GrantTypes);
        });

        it('selects first available grant type', async () => {
          const element = await modelFixture(amf, '/oauth2-with-grant-list', 'get');
          assert.equal(element.grantType, 'authorization_code');
        });

        it('sets authorizationUri', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.equal(element.authorizationUri, 'https://auth.com');
        });

        it('sets accessTokenUri', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.equal(element.accessTokenUri, 'https://token.com');
        });

        it('sets scopes', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.deepEqual(element.scopes, ['profile', 'email']);
        });

        it('automatically hides advanced properties when filled', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          const node = element.shadowRoot.querySelector('.advanced-section');
          assert.isTrue(node.hasAttribute('hidden'));
        });

        it('should not show pkce checkbox if selected grant type is not authorization_code', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          /* Default grant type selected is Access Token for this endpoint */
          /* Check it just in case */
          assert.equal(element.grantType, 'implicit');
          const node = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.adv-toggle anypoint-switch'));
          node.click();
          await nextFrame();
          const pkceCheckbox = element.shadowRoot.querySelector('.advanced-section').querySelector('anypoint-checkbox');
          assert.notExists(pkceCheckbox);
        });

        it('should show pkce checkbox unchecked by default in advanced settings with authorization_code selected', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          element.grantType = 'authorization_code';
          const node = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.adv-toggle anypoint-switch'));
          node.click();
          await nextFrame();
          const pkceCheckbox = element.shadowRoot.querySelector('.advanced-section').querySelector('anypoint-checkbox');
          // @ts-ignore
          assert.isFalse(pkceCheckbox.checked);
        });

        it('does not render annotation inputs when are not defined', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          const node = element.shadowRoot.querySelector('.custom-data-field');
          assert.notOk(node);
        });

        it('renders annotation inputs when defined', async () => {
          const element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
          const nodes = element.shadowRoot.querySelectorAll('.custom-data-field');
          assert.lengthOf(nodes, 10);
        });

        it('sets oauthDeliveryMethod to header when available', async () => {
          const element = await modelFixture(amf, '/oauth2-header-delivery', 'get');
          assert.equal(element.oauthDeliveryMethod, 'header');
          assert.equal(element.oauthDeliveryName, 'token');
        });

        it('sets oauthDeliveryMethod to query when available', async () => {
          const element = await modelFixture(amf, '/oauth2-query-delivery', 'get');
          assert.equal(element.oauthDeliveryMethod, 'query');
          assert.equal(element.oauthDeliveryName, 'access_token');
        });

        it('sets default oauthDeliveryMethod', async () => {
          const element = await modelFixture(amf, '/oauth2-no-delivery', 'get');
          assert.equal(element.oauthDeliveryMethod, 'header');
          assert.equal(element.oauthDeliveryName, 'authorization');
        });

        it('resets state when incompatible settings', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          assert.deepEqual(element.grantTypes, oauth2GrantTypes, 'grant types are set');
          assert.equal(element.oauthDeliveryMethod, 'header', 'oauthDeliveryMethod is set');
          assert.equal(element.oauthDeliveryName, 'authorization', 'oauthDeliveryName is set');
        });
      });

      describe('annotation data changing', () => {
        let amf;
        let factory = /** @type ApiViewModel */ (null);
        let element;

        before(async () => {
          amf = await AmfLoader.load(Boolean(compact));
          factory = new ApiViewModel();
        });

        after(() => {
          factory = null;
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
          element.grantType = 'authorization_code';
          await nextFrame();
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('updates query parameter on authorization request', async () => {
          const input = element.shadowRoot.querySelector('api-form-item[name="numericParam"]');
          input.value = 10;
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.equal(info.customData.auth.parameters[1].value, '10');
        });

        it('updates array value', async () => {
          const input = element.shadowRoot.querySelector('api-form-item[name="repetableParam1"]');
          input.value = ['test'];
          input.dispatchEvent(new Event('change'));
          await nextFrame();
          const info = element.serialize();
          assert.deepEqual(info.customData.auth.parameters[1].value, ['test']);
        });

        it('updates query parameter on token request', async () => {
          const input = element.shadowRoot.querySelector('api-form-item[name="queryTokenResource"]');
          input.value = 'test';
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.equal(info.customData.token.parameters[0].value, 'test');
        });

        it('updates header on token request', async () => {
          const input = element.shadowRoot.querySelector('api-form-item[name="x-token-resource"]');
          input.value = '123';
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.equal(info.customData.token.headers[0].value, '123');
        });

        it('updates header on token request (other?)', async () => {
          const input = element.shadowRoot.querySelector('api-form-item[name="bodyTokenResource"]');
          input.value = 'test';
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.equal(info.customData.token.body[0].value, 'test');
        });
      });

      describe('serialize()', () => {
        let amf;
        let element = /** @type ApiAuthorizationMethod */ (null);

        before(async () => {
          // @ts-ignore
          amf = await AmfLoader.load(Boolean(compact));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
        });

        afterEach(() => {
          viewModel.clearCache();
        });

        it('serializes implicit data', async () => {
          element.grantType = 'implicit';
          await nextFrame();
          const info = element.serialize();
          assert.typeOf(info.customData.auth.parameters, 'array');
          assert.lengthOf(info.customData.auth.parameters, 1);
        });

        it('has no token properties for implicit data', async () => {
          element.grantType = 'implicit';
          await nextFrame();
          const info = element.serialize();
          assert.isUndefined(info.customData.token.parameters);
          assert.isUndefined(info.customData.token.headers);
          assert.isUndefined(info.customData.token.body);
        });

        it('serializes authorization code data', async () => {
          element.grantType = 'authorization_code';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-form-item[name="queryTokenResource"]');
          // @ts-ignore
          input.value = 'test';
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);

          assert.isUndefined(element.pkce, 'pkce is not set');
        });
        

        it('serializes client credentials data', async () => {
          element.grantType = 'client_credentials';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-form-item[name="queryTokenResource"]');
          // @ts-ignore
          input.value = 'test';
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);
        });

        it('serializes password data', async () => {
          element.grantType = 'password';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-form-item[name="queryTokenResource"]');
          // @ts-ignore
          input.value = 'test';
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);
        });

        it('serializes custom grant data', async () => {
          element.grantType = 'annotated_custom_grant';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-form-item[name="queryTokenResource"]');
          // @ts-ignore
          input.value = 'test';
          input.dispatchEvent(new Event('change'));
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);
        });
      });

      describe('documentation rendering', () => {
        let amf;
        let element = /** @type ApiAuthorizationMethod */ (null);

        before(async () => {
          // @ts-ignore
          amf = await AmfLoader.load(Boolean(compact));
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
        });

        afterEach(() => {
          viewModel.clearCache();
        });

        it('does not render documentation items by default', () => {
          const node = element.shadowRoot.querySelector('.custom-data-field .docs-container');
          assert.notOk(node);
        });

        it('renders documentation when activated', async () => {
          const button = element.shadowRoot.querySelector('.custom-data-field .hint-icon');
          /** @type HTMLElement */ (button).click();
          await nextFrame();
          const node = element.shadowRoot.querySelector('.custom-data-field .docs-container');
          assert.ok(node);
        });
      });

      describe('OAS grant types (flows)', () => {
        let amf;
        let element = /** @type ApiAuthorizationMethod */ (null);

        const fileName = 'oauth-flows';

        before(async () => {
          // @ts-ignore
          amf = await AmfLoader.load(Boolean(compact), fileName);
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/pets', 'patch');
        });

        afterEach(() => {
          viewModel.clearCache();
        });

        it('renders all defined grant types', () => {
          assert.deepEqual(element.grantTypes, oauth2GrantTypes);
        });

        it('initializes first flow by default', () => {
          assert.equal(element.grantType, 'implicit');
        });

        it('applies configuration when initializing', () => {
          assert.equal(
            element.authorizationUri,
            'https://api.example.com/oauth2/authorize',
            'authorizationUri is set'
          );
          assert.deepEqual(
            element.scopes,
            ['read_pets', 'write_pets'],
            'scopes is set'
          );
        });

        it('applies configuration on grant type change', async () => {
          element.grantType = 'authorization_code';
          await nextFrame();
          assert.equal(
            element.authorizationUri,
            '/oauth2/authorize',
            'authorizationUri is set'
          );
          assert.equal(
            element.accessTokenUri,
            '/oauth2/token',
            'accessTokenUri is set'
          );
          assert.deepEqual(
            element.scopes,
            ['all'],
            'scopes is set'
          );
        });

        it('restores configuration when grant type is selected', async () => {
          const security = AmfLoader.lookupSecurityScheme(amf, '/pets', 'patch');
          element = await basicFixture(amf);
          element.grantType = 'authorization_code';
          await nextFrame();
          element.security = security;
          await nextFrame();
          assert.equal(
            element.grantType,
            'authorization_code',
            'grantType is not changed'
          );
          assert.equal(
            element.authorizationUri,
            '/oauth2/authorize',
            'authorizationUri is set'
          );
          assert.equal(
            element.accessTokenUri,
            '/oauth2/token',
            'accessTokenUri is set'
          );
          assert.deepEqual(
            element.scopes,
            ['all'],
            'scopes is set'
          );
        });

        it('applies client credentials grant type', async () => {
          element.grantType = 'client_credentials';
          await nextFrame();
          assert.equal(element.accessTokenUri, '/oauth2/token-client', 'accessTokenUri is set');
          assert.deepEqual(element.scopes, ['write_pets', 'read_pets'], 'scopes is set');
        });

        it('applies password grant type', async () => {
          element.grantType = 'password';
          await nextFrame();
          assert.equal(element.accessTokenUri, '/oauth2/token-password', 'accessTokenUri is set');
          assert.deepEqual(element.scopes, ['read_pets'], 'scopes is set');
        });
      });
    
      describe('PKCE extension', () => {
        let amf;
        let element = /** @type ApiAuthorizationMethod */ (null);

        before(async () => {
          // @ts-ignore
          amf = await AmfLoader.load(Boolean(compact), 'oauth-pkce');
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/pkce', 'get');
        });

        afterEach(() => {
          viewModel.clearCache();
        });

        it('sets the `pkce` property to true', () => {
          assert.isTrue(element.pkce);
        });
      });
    });
  });
});
