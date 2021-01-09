import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import {
  defaultSignatureMethods,
} from '@advanced-rest-client/authorization-method/src/Oauth1MethodMixin.js';
import { ApiViewModel } from '@api-components/api-forms';
import { AmfLoader } from './amf-loader.js';
import '../api-authorization-method.js';

/** @typedef {import('../index').ApiAuthorizationMethod} ApiAuthorizationMethod */

describe('OAuth 1', () => {
  /**
   * @return {Promise<ApiAuthorizationMethod>} 
   */
  async function basicFixture(amf, security) {
    return (fixture(html`<api-authorization-method
      type="oauth 1"
      .amf="${amf}"
      .security="${security}"
    ></api-authorization-method>`));
  }

  /**
   * @return {Promise<ApiAuthorizationMethod>} 
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
      describe('initialization', () => {
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

        it('can be initialized with document.createElement', () => {
          const element = document.createElement('api-authorization-method');
          assert.ok(element);
        });

        it('can be initialized in a template with model', async () => {
          const security = AmfLoader.lookupSecurityScheme(amf, '/oauth1', 'get');
          const element = await basicFixture(amf, security);
          await aTimeout(0);
          assert.ok(element);
        });

        it('can be initialized in a template without the model', async () => {
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

        it('sets requestTokenUri', async () => {
          const element = await modelFixture(amf, '/oauth1', 'get');
          assert.equal(element.requestTokenUri, 'http://api.domain.com/oauth1/request_token');
        });

        it('sets authorizationUri', async () => {
          const element = await modelFixture(amf, '/oauth1', 'get');
          assert.equal(element.authorizationUri, 'http://api.domain.com/oauth1/authorize');
        });

        it('sets accessTokenUri', async () => {
          const element = await modelFixture(amf, '/oauth1', 'get');
          assert.equal(element.accessTokenUri, 'http://api.domain.com/oauth1/access_token');
        });

        it('sets all supported signatureMethods', async () => {
          const element = await modelFixture(amf, '/oauth1', 'get');
          assert.deepEqual(element.signatureMethods, ["RSA-SHA1", "HMAC-SHA1"]);
        });

        it('sets api defined signature methods', async () => {
          const element = await modelFixture(amf, '/oauth1-signature', 'get');
          assert.deepEqual(element.signatureMethods, ["RSA-SHA1"]);
        });

        it('re-sets signature methods when changing scheme', async () => {
          const element = await modelFixture(amf, '/oauth1-signature', 'get');
          await nextFrame();
          const security = AmfLoader.lookupSecurityScheme(amf, '/basic', 'get');
          element.security = security;
          await nextFrame();
          assert.deepEqual(element.signatureMethods, defaultSignatureMethods);
        });

        it('re-sets signature when no signatures defined', async () => {
          const element = await modelFixture(amf, '/oauth1', 'get');
          await nextFrame();
          const security = AmfLoader.lookupSecurityScheme(amf, '/oauth1-nosignature', 'get');
          element.security = security;
          await nextFrame();
          assert.deepEqual(element.signatureMethods, defaultSignatureMethods);
        });

        it('ignores when no settings in the API model', async () => {
          await modelFixture(amf, '/oauth1-nosettings', 'get');
        });

        it('ignores when security has no scheme', async () => {
          const element = await basicFixture(amf);
          const security = AmfLoader.lookupSecurityScheme(amf, '/oauth1', 'get');
          const key = element._getAmfKey(element.ns.aml.vocabularies.security.scheme);
          delete security[key];
          element.security = security;
          await nextFrame();
        });
      })
    });
  });
});
