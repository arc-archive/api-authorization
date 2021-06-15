/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
import { html } from 'lit-element';
import { notifyChange, } from '@advanced-rest-client/authorization/src/Utils.js';
import { dedupeMixin } from '@open-wc/dedupe-mixin';
import '@api-components/api-forms/api-form-item.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */
/** @typedef {import('./ApiAuthorizationMethod').ApiAuthorizationMethod} ApiAuthorizationMethod */
/** @typedef {import('./types').ApiKeySettings} ApiKeySettings */

const createViewModel = Symbol('createViewModel');
const headersParam = Symbol('headersParam');
const queryParam = Symbol('queryParam');
const cookiesParam = Symbol('cookiesParam');
const titleTemplate = Symbol('titleTemplate');
const headersTemplate = Symbol('headersTemplate');
const queryTemplate = Symbol('queryTemplate');
const cookieTemplate = Symbol('cookieTemplate');
const formListTemplate = Symbol('formListTemplate');
const formItemTemplate = Symbol('formItemTemplate');
const inputHandler = Symbol('inputHandler');
const restoreModelValue = Symbol('restoreModelValue');
const updateModelValue = Symbol('updateModelValue');
export const restoreApiKey = Symbol('restoreApiKey');
export const serializeApiKey = Symbol('serializeApiKey');
export const validateApiKey = Symbol('validateApiKey');
export const initializeApiKeyModel = Symbol('initializeApiKeyModel');
export const renderApiKey = Symbol('renderApiKey');
export const updateQueryParameterApiKey = Symbol('updateQueryParameterApiKey');
export const updateHeaderApiKey = Symbol('updateHeaderApiKey');
export const updateCookieApiKey = Symbol('updateCookieApiKey');
export const clearApiKey = Symbol('clearApiKey');

/**
 * @type {Object}
 */
const CACHE = {
  header: {},
  query: {},
  cookie: {},
};

/**
 * @param {ApiAuthorizationMethod} base
 */
const mxFunction = (base) => {
  class ApiKeyMethodMixinImpl extends base {
    /**
     * Clears previously set values in the cache storage.
     */
    clearApiKeyCache() {
      CACHE.header = {};
      CACHE.query = {};
      CACHE.cookie = {};
    }

    /**
     * Updates query parameter value, if defined in the model.
     * @param {string} name
     * @param {string} newValue
     */
    [updateQueryParameterApiKey](name, newValue) {
      this[updateModelValue](this[queryParam], name, newValue);
    }

    /**
     * Updates header value, if defined in the model.
     * @param {string} name
     * @param {string} newValue
     */
    [updateHeaderApiKey](name, newValue) {
      this[updateModelValue](this[headersParam], name, newValue);
    }

    /**
     * Updates cookie value, if defined in the model.
     * @param {string} name
     * @param {string} newValue
     */
    [updateCookieApiKey](name, newValue) {
      this[updateModelValue](this[cookiesParam], name, newValue);
    }

    /**
     * Updates header or query parameters value, if defined in the model.
     * @param {AmfFormItem[]} model Current model for the parameter
     * @param {string} name
     * @param {string} newValue
     */
    [updateModelValue](model, name, newValue) {
      if (!model || !model.length) {
        return;
      }
      for (let i = 0, len = model.length; i < len; i++) {
        const item = model[i];
        if (item.name === name) {
          item.value = newValue;
          this.requestUpdate();
          return;
        }
      }
    }

    /**
     * Restores previously serialized values
     * @param {ApiKeySettings} settings
     */
    [restoreApiKey](settings) {
      if (!settings) {
        return;
      }
      this[restoreModelValue](this[headersParam], settings.headers);
      this[restoreModelValue](this[queryParam], settings.params);
      this[restoreModelValue](this[cookiesParam], settings.cookies);
      this.requestUpdate();
    }

    /**
     * Restores previously serialized values on a model
     * @param {AmfFormItem[]} model The model to add values to
     * @param {Record<string, string>} restored Previously serialized values
     */
    [restoreModelValue](model, restored) {
      if (!restored || !model || !model.length) {
        return;
      }
      Object.keys(restored).forEach((name) => {
        const item = model.find((i) => i.name === name);
        if (item) {
          item.value = restored[name];
        }
      });
    }

    /**
     * Serializes current values to a settings object
     * @return {ApiKeySettings}
     */
    [serializeApiKey]() {
      const headers = this[headersParam];
      const queryParameters = this[queryParam];
      const cookieParameters = this[cookiesParam];
      const result = /** @type ApiKeySettings */ ({});
      // Note, in API model, headers and params are unique. They may have array
      // value but they are always unique.
      if (headers && headers.length) {
        result.headers = {};
        headers.forEach((header) => {result.headers[header.name] = header.value});
      }
      if (queryParameters && queryParameters.length) {
        result.params = {};
        queryParameters.forEach((parameter) => {result.params[parameter.name] = parameter.value});
      }
      if (cookieParameters && cookieParameters.length) {
        result.cookies = {};
        cookieParameters.forEach((parameter) => {result.cookies[parameter.name] = parameter.value});
      }
      return /** @type ApiKeySettings */ (result);
    }

    [clearApiKey]() {
      const headers = this[headersParam];
      const queryParams = this[queryParam];
      const cookieParameters = this[cookiesParam];
      if (Array.isArray(headers)) {
        headers.forEach((header) => {header.value = ''});
      }
      if (Array.isArray(queryParams)) {
        queryParams.forEach((parameter) => {parameter.value = ''});
      }
      if (Array.isArray(cookieParameters)) {
        cookieParameters.forEach((cookie) => {cookie.value = ''});
      }
    }

    /**
     * Performs a validation of current form.
     * By calling this function invalid field are going to be marked as invalid.
     *
     * In the implementation it calls `validate()` function on each input element
     * that is inserted into the DOM.
     *
     * @return {boolean} validation
     */
    [validateApiKey]() {
      const nodes = this.shadowRoot.querySelectorAll('api-form-item');
      let validationResult = true;
      for (let i = 0, len = nodes.length; i < len; i++) {
        const node = nodes[i];
        const result = node.validate();
        if (validationResult && !result) {
          validationResult = result;
        }
      }
      return validationResult;
    }

    /**
     * Processes AMF model and generates the view.
     *
     * Note, this function clears previously set parameters.
     *
     * @return {Promise<void>}
     */
    async [initializeApiKeyModel]() {
      this[headersParam] = /** @type AmfFormItem[] */ ([]);
      this[queryParam] = /** @type AmfFormItem[] */ ([]);
      this[cookiesParam] = /** @type AmfFormItem[] */ ([]);

      let { security } = this;
      if (!security) {
        return;
      }
      if (!Array.isArray(security)) {
        security = [security];
      }
      const shKey = this._getAmfKey(this.ns.aml.vocabularies.security.scheme);
      for (let i = 0, len = security.length; i < len; i++) {
        const item = security[i];
        if (!this._hasType(item, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
          continue;
        }
        let scheme = item[shKey];
        if (!scheme) {
          continue;
        }
        if (Array.isArray(scheme)) {
          [scheme] = scheme;
        }
        const type = this._getValue(scheme, this.ns.aml.vocabularies.security.type);
        if (!type || !String(type).startsWith('Api Key')) {
          continue;
        }
        this[createViewModel](scheme);
      }
      this.requestUpdate();
      await this.updateComplete;
      notifyChange(this);
    }

    /**
     * Generates view model for Api Key method.
     *
     * @param {any} model
     */
    [createViewModel](model) {
      if (!model) {
        return;
      }
      const settingsKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
      let settings = model[settingsKey];
      if (!settings) {
        return;
      }
      if (Array.isArray(settings)) {
        [settings] = settings;
      }
      const name = /** @type string */ (this._getValue(settings, this.ns.aml.vocabularies.core.name));
      const binding = /** @type string */ (this._getValue(settings, this.ns.aml.vocabularies.security.in));

      let result = /** @type AmfFormItem */ (CACHE[binding][name]);
      if (!result) {
        result = /** @type AmfFormItem */ ({
          name,
          value: '',
          enabled: true,
          schema: {
            required: true,
            description: '',
            apiType: 'string',
            inputLabel: `The value of the ${binding}`,
            inputType: 'text',
            isEnum: false,
            isArray: false,
            isBool: false,
            isFile: false,
            isObject: false,
            isNillable: false,
            isUnion: false,
          }
        });
        CACHE[binding][name] = result;
      }
      switch (binding) {
        case 'query':
          this[queryParam].push(result);
        break;
        case 'header':
          this[headersParam].push(result);
        break;
        case 'cookie':
          this[cookiesParam].push(result);
        break;
        default:
      }
    }

    /**
     * Handler for the `value-changed` event dispatched by input element.
     * Dispatches 'request-header-changed' or 'query-parameter-changed'
     * event. Other components can update their state when the value change.
     *
     * @param {Event} e
     */
    [inputHandler](e) {
      if (e.composedPath && e.composedPath()[0] !== e.target) {
        return;
      }
      const input = /** @type HTMLInputElement */ (e.target);
      const index = Number(input.dataset.index);
      const { type } = input.dataset;
      if (Number.isNaN(index) || !type) {
        return;
      }
      let model;
      switch (type) {
        case 'query': model = this[queryParam]; break;
        case 'header': model = this[headersParam]; break;
        case 'cookie': model = this[cookiesParam]; break;
        default:
      }
      const { value } = input;
      model[index].value = value;
      notifyChange(this);
    }

    /**
     * Method that renders the view for Api Key security scheme
     *
     * @return {TemplateResult}
     */
    [renderApiKey]() {
      const {
        styles,
      } = this;
      return html`
      <style>${styles}</style>
      ${this[titleTemplate]()}
      <form autocomplete="on" class="custom-auth">
        ${this[headersTemplate]()}
        ${this[queryTemplate]()}
        ${this[cookieTemplate]()}
      </form>
      `;
    }

    /**
     * Method that renders scheme's title
     *
     * @return {TemplateResult}
     */
    [titleTemplate]() {
      return html`
      <div class="subtitle">
        <span>Scheme: Api Key</span>
      </div>`;
    }

    /**
     * Method that renders headers, if any
     *
     * @return {TemplateResult|string} Empty string is returned when the section
     * should not be rendered, as documented in `lit-html` library.
     */
    [headersTemplate]() {
      let result = this[formListTemplate](this[headersParam], 'header');
      if (result !== '') {
        result = html`
        <label class="section-title">Headers</label>
        ${result}
        `;
      }
      return result;
    }

    /**
     * Method that renders query parameters, if any
     *
     * @return {TemplateResult|string} Empty string is returned when the section
     * should not be rendered, as documented in `lit-html` library.
     */
    [queryTemplate]() {
      let result = this[formListTemplate](this[queryParam], 'query');
      if (result !== '') {
        result = html`
        <label class="section-title">Query parameters</label>
        ${result}
        `;
      }
      return result;
    }

    /**
     * Method that renders cookies, if any
     *
     * @return {TemplateResult|string} Empty string is returned when the section
     * should not be rendered, as documented in `lit-html` library.
     */
    [cookieTemplate]() {
      let result = this[formListTemplate](this[cookiesParam], 'cookie');
      if (result !== '') {
        result = html`
        <label class="section-title">Cookies</label>
        ${result}
        `;
      }
      return result;
    }

    /**
     * Returns a TemplateResult for form items.
     * @param {AmfFormItem[]} items List of form items to render
     * @param {String} type Items type. Either `query` or `header`
     * @return {TemplateResult|string}
     */
    [formListTemplate](items, type) {
      if (!items || !items.length) {
        return '';
      }
      const {
        outlined,
        compatibility,
        readOnly,
        disabled,
      } = this;

      return html`
      ${items.map((item, index) =>
      this[formItemTemplate](item, index, outlined, compatibility, readOnly, disabled, type))}`;
    }

    /**
     * Returns a TemplateResult for a form input item
     *
     * @param {AmfFormItem} item
     * @param {number} index
     * @param {boolean} outlined
     * @param {boolean} compatibility
     * @param {boolean} readOnly
     * @param {boolean} disabled
     * @param {string} type
     * @return {TemplateResult}
     */
    [formItemTemplate](item, index, outlined, compatibility, readOnly, disabled, type) {
      return html`<div class="field-value">
        <api-form-item
          .model="${item}"
          .value="${item.value}"
          name="${item.name}"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          ?readonly="${readOnly}"
          ?disabled="${disabled}"
          required
          data-type="${type}"
          data-index="${index}"
          @input="${this[inputHandler]}"
          @change="${this[inputHandler]}"
        ></api-form-item>
      </div>`;
    }
  }
  return ApiKeyMethodMixinImpl;
}
/**
 * A mixin that adds support for API keys method with AMF model
 *
 * @mixin
 */
export const ApiKeyMethodMixin = dedupeMixin(mxFunction);
