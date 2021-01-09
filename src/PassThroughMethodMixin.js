/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { html } from 'lit-element';
import { dedupeMixin } from '@open-wc/dedupe-mixin';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@api-components/api-forms/api-form-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import { notifyChange } from '@advanced-rest-client/authorization-method/src/Utils.js';
import { ApiViewModel } from '@api-components/api-forms';

export const headersParam = Symbol('headersParam');
export const queryParametersParam = Symbol('queryParametersParam');
export const createViewModel = Symbol('createViewModel');
export const readParamsProperties = Symbol('readParamsProperties');
export const inputHandler = Symbol('inputHandler');
export const headersTemplate = Symbol('headersTemplate');
export const queryTemplate = Symbol('queryTemplate');
export const formListTemplate = Symbol('formListTemplate');
export const formItemTemplate = Symbol('formItemTemplate');
export const toggleDocumentation = Symbol('toggleDocumentation');
export const formItemHelpButtonTemplate = Symbol('formItemHelpButtonTemplate');
export const formItemHelpTemplate = Symbol('formItemHelpTemplate');
export const titleTemplate = Symbol('titleTemplate');
export const updateModelValue = Symbol('updateModelValue');
export const restoreModelValue = Symbol('restoreModelValue');
export const restorePassThrough = Symbol('restorePassThrough');
export const serializePassThrough = Symbol('serializePassThrough');
export const validatePassThrough = Symbol('validatePassThrough');
export const initializePassThroughModel = Symbol('initializePassThroughModel');
export const renderPassThrough = Symbol('renderPassThrough');
export const updateQueryParameterPassThrough = Symbol('updateQueryParameterPassThrough');
export const updateHeaderPassThrough = Symbol('updateHeaderPassThrough');
export const clearPassThrough = Symbol('clearPassThrough');

/** @typedef {import('./ApiAuthorizationMethod').ApiAuthorizationMethod} ApiAuthorizationMethod */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */
/** @typedef {import('./types').PassThroughSetting} PassThroughSetting */

/**
 * @param {ApiAuthorizationMethod} base
 */
const mxFunction = (base) => {
  class PassThroughMethodMixin extends base {
    /**
     * Updates query parameter value, if defined in the model.
     * @param {string} name
     * @param {string} newValue
     */
    [updateQueryParameterPassThrough](name, newValue) {
      this[updateModelValue]('query', name, newValue);
    }

    /**
     * Updates header value, if defined in the model.
     * @param {string} name
     * @param {string} newValue
     */
    [updateHeaderPassThrough](name, newValue) {
      this[updateModelValue]('header', name, newValue);
    }

    /**
     * Updates header or query parameters value, if defined in the model.
     * @param {string} type
     * @param {string} name
     * @param {string} newValue
     */
    [updateModelValue](type, name, newValue) {
      const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
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
     * @param {PassThroughSetting} settings
     */
    [restorePassThrough](settings) {
      if (!settings) {
        return;
      }
      this[restoreModelValue]('headers', settings.headers);
      this[restoreModelValue]('query', settings.params);
      this.requestUpdate();
    }

    /**
     * @param {string} type 
     * @param {Record<string, string>} restored 
     */
    [restoreModelValue](type, restored) {
      if (!restored) {
        return;
      }
      const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
      if (!model || !model.length) {
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
     * @returns {PassThroughSetting}
     */
    [serializePassThrough]() {
      const headers = this[headersParam];
      const queryParameters = this[queryParametersParam];
      const result = /** @type PassThroughSetting */ ({});
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
      return result;
    }

    [clearPassThrough]() {
      const headers = this[headersParam];
      const queryParameters = this[queryParametersParam];
      if (Array.isArray(headers)) {
        headers.forEach((header) => {header.value = ''});
      }
      if (Array.isArray(queryParameters)) {
        queryParameters.forEach((parameter) => {parameter.value = ''});
      }
    }

    [validatePassThrough]() {
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

    [initializePassThroughModel]() {
      const { security } = this;
      if (!this._hasType(security, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
        return;
      }
      const shKey = this._getAmfKey(this.ns.aml.vocabularies.security.scheme);
      let scheme = security[shKey];
      if (!scheme) {
        return;
      }
      let type;
      if (scheme) {
        if (Array.isArray(scheme)) {
          [scheme] = scheme;
        }
        type = this._getValue(scheme, this.ns.aml.vocabularies.security.type);
      }
      if (!type || !String(type).startsWith('Pass Through')) {
        return;
      }
      const hKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.header);
      this[createViewModel]('header', this._ensureArray(scheme[hKey]));
      const params = this[readParamsProperties](scheme);
      this[createViewModel]('parameter', params);
      this.schemeName = this._getValue(security, this.ns.aml.vocabularies.core.name);
      this.schemeDescription = /** @type string */ (this._getValue(scheme, this.ns.aml.vocabularies.core.description));
      this.requestUpdate();
    }

    /**
     * Generates view model using the transformer.
     *
     * @param {string} type Param type. Either `header` or `parameter`.
     * @param {any} model
     */
    async [createViewModel](type, model) {
      if (!model) {
        return;
      }
      const factory = new ApiViewModel({
        amf: this.amf,
      });
      const data = factory.computeViewModel(model);
      if (!data) {
        return;
      }
      if (type === 'header') {
        this[headersParam] = data;
      } else if (type === 'parameter') {
        this[queryParametersParam] = data;
      }
      await this.updateComplete;
      notifyChange(this);
    }

    /**
     * Reads definition of properties for query parameters which can be either a
     * `parameter` or a `queryString`.
     *
     * @param {any} scheme Security `scheme` model.
     * @return {any[]|undefined} A list of parameters, if any.
     */
    [readParamsProperties](scheme) {
      const pKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.parameter);
      let result = this._ensureArray(scheme[pKey]);
      if (result) {
        return result;
      }
      const qKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.queryString);
      result = this._ensureArray(scheme[qKey]);
      if (result) {
        [result] = result;
      }
      return result;
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
      const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
      const { value } = input;
      model[index].value = value;
      notifyChange(this);
    }

    [renderPassThrough]() {
      const {
        styles,
      } = this;
      return html`
      <style>${styles}</style>
      ${this[titleTemplate]()}
      <form autocomplete="on" class="passthrough-auth">
        ${this[headersTemplate]()}
        ${this[queryTemplate]()}
      </form>
      `;
    }

    [titleTemplate]() {
      const {
        schemeName,
        schemeDescription,
        compatibility,
        descriptionOpened,
      } = this;
      if (!schemeName) {
        return '';
      }
      return html`
      <div class="subtitle">
        <span>Scheme: ${schemeName}</span>
        ${schemeDescription ? html`<anypoint-icon-button
          class="hint-icon"
          title="Toggle description"
          aria-label="Activate to toggle the description"
          ?compatibility="${compatibility}"
          @click="${this.toggleDescription}"
        >
          <arc-icon icon="help"></arc-icon>
        </anypoint-icon-button>` : ''}
      </div>
      ${schemeDescription && descriptionOpened ? html`<div class="docs-container">
        <arc-marked .markdown="${schemeDescription}" main-docs sanitize>
          <div slot="markdown-html" class="markdown-body"></div>
        </arc-marked>
      </div>` : ''}`;
    }

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

    [queryTemplate]() {
      let result = this[formListTemplate](this[queryParametersParam], 'query');
      if (result !== '') {
        result = html`
        <label class="section-title">Query parameters</label>
        ${result}
        `;
      }
      return result;
    }

    /**
     * Returns a TemplateResult for form items.
     * @param {AmfFormItem[]} items List of form items to render
     * @param {string} type Items type. Either `query` or `header`
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
      const { schema } = item;
      const docs = schema.extendedDescription || schema.description;
      const hasDocs = !!docs;
      // @ts-ignore
      const { docsOpened } = item;
      return html`
      <div class="field-value">
        <api-form-item
          .model="${item}"
          .value="${item.value}"
          name="${item.name}"
          ?readonly="${readOnly}"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          ?disabled="${disabled}"
          data-type="${type}"
          data-index="${index}"
          @input="${this[inputHandler]}"
          @change="${this[inputHandler]}"
        ></api-form-item>
        ${this[formItemHelpButtonTemplate](hasDocs, type, index)}
      </div>
      ${this[formItemHelpTemplate](hasDocs, docsOpened, docs)}`;
    }

    /**
     * Returns a TemplateResult for docs toggle icon for a form item when the item has docs.
     * @param {boolean} hasDocs
     * @param {string} type
     * @param {number} index
     * @return {TemplateResult|string}
     */
    [formItemHelpButtonTemplate](hasDocs, type, index) {
      if (!hasDocs) {
        return '';
      }
      return html`<anypoint-icon-button
        class="hint-icon"
        title="Toggle description"
        aria-label="Press to toggle description"
        data-type="${type}"
        data-index="${index}"
        @click="${this[toggleDocumentation]}"
      >
        <arc-icon icon="help"></arc-icon>
      </anypoint-icon-button>`;
    }
    
    /**
     * Returns a TemplateResult for docs for a form item when the item has docs and is opened.
     * @param {boolean} hasDocs
     * @param {boolean} opened
     * @param {string} docs
     * @return {TemplateResult|string}
     */
    [formItemHelpTemplate](hasDocs, opened, docs) {
      if (!hasDocs || !opened) {
        return '';
      }
      return html`
      <div class="docs-container">
        <arc-marked .markdown="${docs}" sanitize>
          <div slot="markdown-html" class="markdown-body"></div>
        </arc-marked>
      </div>`;
    }

    /**
     * Toggles documentation for custom property.
     *
     * @param {CustomEvent} e
     */
    [toggleDocumentation](e) {
      const node = /** @type HTMLElement */ (e.currentTarget);
      const index = Number(node.dataset.index);
      const { type } = node.dataset;
      if (Number.isNaN(index) || !type) {
        return;
      }
      const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
      // @ts-ignore
      model[index].docsOpened = !model[index].docsOpened;
      this.requestUpdate();
    }
  }
  return PassThroughMethodMixin;
}

/**
 * A mixin that adds support for PassThrough method with AMF model
 *
 * @mixin
 */
export const PassThroughMethodMixin = dedupeMixin(mxFunction);
