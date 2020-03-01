import { html, fixture, assert, aTimeout, nextFrame } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { default as sinon } from 'sinon';

import '../api-authorization.js';

describe('ApiAuthorization OAS tests', () => {

  async function basicFixture(amf, security) {
    return (await fixture(html`<api-authorization
      .amf="${amf}"
      .security="${security}"
    ></api-authorization>`));
  }

  async function modelFixture(amf, endpoint, method) {
    const security = AmfLoader.lookupSecurity(amf, endpoint, method);
    const element = await basicFixture(amf, security);
    await aTimeout();
    return element;
  }

  describe('Signle vs multiple', () => {
    [
      ['Full model', false],
      ['Compact model', true]
    ].forEach(([label, compact]) => {
      const fileName = 'oas-demo';

      describe(`Single method - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/single', 'get');
        });

        it('has single method definition', () => {
          const { methods } = element;
          assert.lengthOf(methods, 1);
        });

        it('has no selector', () => {
          const node = element.shadowRoot.querySelector('anypoint-dropdown-menu');
          assert.notOk(node);
        });

        it('renders scheme label', () => {
          const node = element.shadowRoot.querySelector('.auth-selector-label');
          assert.ok(node);
        });
      });

      describe(`Multiple with union - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/and-and-or-union', 'get');
        });

        it('has all methods definitions', () => {
          const { methods } = element;
          assert.lengthOf(methods, 2);
        });

        it('has method selector', () => {
          const node = element.shadowRoot.querySelector('anypoint-dropdown-menu');
          assert.ok(node);
        });

        it('has no scheme label', () => {
          const node = element.shadowRoot.querySelector('.auth-selector-label');
          assert.notOk(node);
        });

        it('renders combined label', () => {
          const node = element.shadowRoot.querySelector('anypoint-item[label="ApiKeyQuery, ApiKeyAuth"]');
          assert.ok(node);
        });

        it('renders label with names and types', () => {
          const node = element.shadowRoot.querySelector('anypoint-item[label="ApiKeyQuery, ApiKeyAuth"]');
          const parts = node.textContent.trim().split('\n').map((item) => item.trim());
          assert.equal(parts[0], 'ApiKeyQuery, ApiKeyAuth');
          assert.equal(parts[1], 'Api Key, Api Key');
        });

        it('renders editors for each method', () => {
          const nodes = element.shadowRoot.querySelectorAll('api-authorization-method');
          assert.lengthOf(nodes, 2);
        });
      });

      describe(`Multiple unions - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/cross-union', 'get');
        });

        it('has all methods definitions', () => {
          const { methods } = element;
          assert.lengthOf(methods, 3);
        });

        it('has method selector', () => {
          const node = element.shadowRoot.querySelector('anypoint-dropdown-menu');
          assert.ok(node);
        });

        it('has no scheme label', () => {
          const node = element.shadowRoot.querySelector('.auth-selector-label');
          assert.notOk(node);
        });

        it('does not render method labels for API Key', () => {
          const nodes = element.shadowRoot.querySelectorAll('.auth-label');
          assert.lengthOf(nodes, 0);
        });

        it('renders method labels for other methods', async () => {
          element.selected = 1;
          await nextFrame();
          const nodes = element.shadowRoot.querySelectorAll('.auth-label');
          assert.lengthOf(nodes, 2);
        });
      });
    });
  });

  describe('Api Key method', () => {
    [
      ['Full model', false],
      ['Compact model', true]
    ].forEach(([label, compact]) => {
      const fileName = 'api-keys';

      describe(`Basic tests - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/query', 'get');
        });

        afterEach(() => {
          element.shadowRoot.querySelector('api-authorization-method').clearApiKeyCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Api Key']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['clientQuery']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.updateQueryParameter('client_id', 'test')
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
          form.updateQueryParameter('client_id', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateQueryParameter('client_id', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'api key', 'type is set');
          assert.typeOf(settings.settings, 'object');
          const aset = settings.settings;
          assert.typeOf(aset.queryParameters, 'object', 'queryParameters is set');
        });

        it('creates params with createAuthParams() (params)', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateQueryParameter('client_id', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {}, 'has no headers');
          assert.deepEqual(result.params, {
            client_id: 'test'
          }, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Junction of methods - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/junction', 'get');
        });

        afterEach(() => {
          element.shadowRoot.querySelector('api-authorization-method').clearApiKeyCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Api Key', 'Api Key']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['clientQuery', 'clientMulti']);
        });

        it('creates params with createAuthParams()', async () => {
          const forms = element.shadowRoot.querySelectorAll('api-authorization-method');
          forms[0].updateQueryParameter('client_id', 'test-param');
          forms[1].updateHeader('client_multi', 'test-multi');
          forms[0].dispatchEvent(new CustomEvent('change'));
          forms[1].dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            client_multi: 'test-multi'
          }, 'has headers');
          assert.deepEqual(result.params, {
            client_id: 'test-param'
          }, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Separate methods - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/split', 'get');
        });

        afterEach(() => {
          element.shadowRoot.querySelector('api-authorization-method').clearApiKeyCache();
        });

        it('has 2 methods', () => {
          const { methods } = element;
          assert.lengthOf(methods, 2);
        });

        it('has "types" in the authorization objects', () => {
          assert.deepEqual(element.methods[0].types, ['Api Key']);
          assert.deepEqual(element.methods[1].types, ['Api Key']);
        });

        it('has "names" in the authorization objects', () => {
          assert.deepEqual(element.methods[0].names, ['clientQuery']);
          assert.deepEqual(element.methods[1].names, ['clientMulti']);
        });
      });
    });
  });

  describe('Bearer method', () => {
    [
      ['Full model', false],
      ['Compact model', true]
    ].forEach(([label, compact]) => {
      const fileName = 'oas-bearer';

      describe(`Basic tests - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/bearer', 'get');
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['bearer']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['bearerAuth']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.token = 'test';
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
          form.token = 'test';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.token = 'test';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'bearer', 'type is set');
          assert.typeOf(settings.settings, 'object');
          const aset = settings.settings;
          assert.equal(aset.token, 'test', 'token is set');
        });

        it('creates params with createAuthParams()', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.token = 'test';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            authorization: 'Bearer test',
          }, 'has headers');
          assert.deepEqual(result.params, {}, 'has no params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });
    });
  });

  describe('Multiple authorization header', () => {
    [
      ['Full model', false],
      ['Compact model', true]
    ].forEach(([label, compact]) => {
      const fileName = 'oas-demo';
      let amf;

      before(async () => {
        amf = await AmfLoader.load({ fileName, compact });
      });

      function updateForms(element) {
        const basicForm = element.shadowRoot.querySelector('api-authorization-method[type=basic]');
        basicForm.username = 'test-username';
        basicForm.dispatchEvent(new CustomEvent('change'));
        const bearerForm = element.shadowRoot.querySelector('api-authorization-method[type=bearer]');
        bearerForm.token = 'test-token';
        bearerForm.dispatchEvent(new CustomEvent('change'));
      }

      it('creates authorization header with both values', async () => {
        const element = await modelFixture(amf, '/multi-auth-header', 'get');
        updateForms(element);
        await nextFrame();
        const result = element.createAuthParams();
        assert.deepEqual(result.headers, {
          authorization: 'Basic dGVzdC11c2VybmFtZTo=, Bearer test-token',
        }, 'has headers');
        assert.deepEqual(result.params, {}, 'has no params');
        assert.deepEqual(result.cookies, {}, 'has no cookies');
      });

      it('add basic header value to existing header', async () => {
        const element = await modelFixture(amf, '/multi-auth-header', 'post');
        updateForms(element);
        await nextFrame();
        const result = element.createAuthParams();
        assert.deepEqual(result.headers, {
          authorization: 'Bearer test-token, Basic dGVzdC11c2VybmFtZTo=',
        }, 'has headers');
        assert.deepEqual(result.params, {}, 'has no params');
        assert.deepEqual(result.cookies, {}, 'has no cookies');
      });
    });
  });
});
