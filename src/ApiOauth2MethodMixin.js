/* eslint-disable arrow-body-style */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
import { html } from 'lit-element';
import { dedupeMixin } from '@open-wc/dedupe-mixin';
import {
  oauth2GrantTypes,
  oauth2CustomPropertiesTemplate,
  autoHide,
  serializeOauth2Auth,
} from '@advanced-rest-client/authorization/src/Oauth2MethodMixin.js';
import {
  notifyChange,
} from '@advanced-rest-client/authorization/src/Utils.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import { ApiViewModel } from '@api-components/api-forms';
import '@api-components/api-forms/api-form-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';

/** @typedef {import('./ApiAuthorizationMethod').ApiAuthorizationMethod} ApiAuthorizationMethod */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */
/** @typedef {import('@advanced-rest-client/authorization/src/Oauth2MethodMixin').GrantType} GrantType */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2CustomParameter} OAuth2CustomParameter */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.TokenInfo} TokenInfo */
/** @typedef {import('@api-components/api-forms/src/types').ProcessOptions} ProcessOptions */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */

export const initializeOauth2Model = Symbol('initializeOauth2Model');
export const setupOAuthDeliveryMethod = Symbol('setupOAuthDeliveryMethod');
export const getOauth2DeliveryMethod = Symbol('getOauth2DeliveryMethod');
export const updateGrantTypes = Symbol('updateGrantTypes');
export const preFillAmfData = Symbol('preFillAmfData');
export const preFillFlowData = Symbol('preFillFlowData');
export const readSecurityScopes = Symbol('readSecurityScopes');
export const amfCustomSettingsKey = Symbol('amfCustomSettingsKey');
export const applyAnnotationGrants = Symbol('applyAnnotationGrants');
export const setupAnnotationParameters = Symbol('setupAnnotationParameters');
export const setupAuthRequestQueryParameters = Symbol('setupAuthRequestQueryParameters');
export const setupTokenRequestQueryParameters = Symbol('setupTokenRequestQueryParameters');
export const setupTokenRequestHeaders = Symbol('setupTokenRequestHeaders');
export const setupTokenRequestBody = Symbol('setupTokenRequestBody');
export const createViewModel = Symbol('createViewModel');
export const computeGrantList = Symbol('computeGrantList');
export const modelForCustomType = Symbol('modelForCustomType');
export const toggleDocumentation = Symbol('toggleDocumentation');
export const templateForCustomArray = Symbol('templateForCustomArray');
export const templateForCustomItem = Symbol('templateForCustomItem');
export const computeAuthCustomData = Symbol('computeAuthCustomData');
export const computeTokenCustomData = Symbol('computeTokenCustomData');
export const computeCustomParameters = Symbol('computeCustomParameters');
export const authQueryParameters = Symbol('authQueryParameters');
export const tokenQueryParameters = Symbol('tokenQueryParameters');
export const tokenHeaders = Symbol('tokenHeaders');
export const tokenBody = Symbol('tokenBody');
export const customValueHandler = Symbol('customValueHandler');
export const flowForType = Symbol('flowForType');
export const readFlowScopes = Symbol('readFlowScopes');
export const readFlowsTypes = Symbol('readFlowsTypes');
export const applyFlow = Symbol('applyFlow');
export const securityScheme = Symbol('securityScheme');
export const isRamlFlow = Symbol('isRamlFlow');
export const readPkceValue = Symbol('readPkceValue');

/**
 * @param {ApiAuthorizationMethod} base
 */
const mxFunction = (base) => {
  class ApiOauth2MethodMixinImpl extends base {
    get grantType() {
      return super.grantType;
    }

    set grantType(value) {
      const old = super.grantType;
      super.grantType = value;
      if (old !== value) {
        this[applyFlow](value);
      }
    }

    get [securityScheme]() {
      const { security } = this;
      const shKey = this._getAmfKey(this.ns.aml.vocabularies.security.scheme);
      let scheme = security && security[shKey];
      /* istanbul ignore if */
      if (!scheme) {
        return null;
      }
      /* istanbul ignore else */
      if (scheme && Array.isArray(scheme)) {
        [scheme] = scheme;
      }
      return scheme;
    }

    [initializeOauth2Model]() {
      const { security } = this;
      if (!this._hasType(security, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
        this[setupOAuthDeliveryMethod]();
        this[updateGrantTypes]();
        return;
      }
      const scheme = this[securityScheme];
      /* istanbul ignore if */
      if (!scheme) {
        return;
      }
      const type = this._getValue(scheme, this.ns.aml.vocabularies.security.type);
      const isOauth2 = type === 'OAuth 2.0';
      if (!isOauth2) {
        this[setupOAuthDeliveryMethod]();
        this[updateGrantTypes]();
        return;
      }
      this[setupOAuthDeliveryMethod](scheme);
      const sKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
      let settings = scheme[sKey];
      /* istanbul ignore else */
      if (Array.isArray(settings)) {
        [settings] = settings;
      }
      this[preFillAmfData](settings);
      this[autoHide]();
      this.requestUpdate();
    }

    /**
     * @returns {OAuth2Authorization}
     */
    [serializeOauth2Auth]() {
      const result = super[serializeOauth2Auth]();
      result.customData = {
        auth: {},
        token: {},
      };
      const { grantType } = result;
      switch (grantType) {
        case 'implicit':
          this[computeAuthCustomData](result);
          break;
        case 'authorization_code':
          this[computeAuthCustomData](result);
          this[computeTokenCustomData](result);
          break;
        case 'client_credentials':
        case 'password':
          this[computeTokenCustomData](result);
          break;
        default:
          this[computeAuthCustomData](result);
          this[computeTokenCustomData](result);
          break;
      }
      return result;
    }

    /**
     * Adds `customData` property values that can be applied to the
     * authorization request.
     *
     * @param {OAuth2Authorization} detail Token request detail object. The object is passed
     * by reference so no need for return value
     */
    [computeAuthCustomData](detail) {
      const params = this[authQueryParameters];
      if (params) {
        detail.customData.auth.parameters = this[computeCustomParameters](params);
      }
    }

    /**
     * Adds `customData` property values that can be applied to the
     * token request.
     *
     * @param {OAuth2Authorization} detail Token request detail object. The object is passed
     * by reference so no need for return value
     */
    [computeTokenCustomData](detail) {
      const tqp = this[tokenQueryParameters];
      const th = this[tokenHeaders];
      const tb = this[tokenBody];
      if (tqp) {
        detail.customData.token.parameters =
          this[computeCustomParameters](tqp);
      }
      if (th) {
        detail.customData.token.headers =
          this[computeCustomParameters](th);
      }
      if (tb) {
        detail.customData.token.body =
          this[computeCustomParameters](tb);
      }
    }

    /**
     * Computes list of parameter values from current model.
     *
     * This function ignores empty values if they are not required.
     * Required property are always included, even if the value is not set.
     *
     * @param {AmfFormItem[]} params Model for form inputs.
     * @return {OAuth2CustomParameter[]|undefined} Array of objects with `name` and `value`
     * properties or undefined if `params` is empty or no values are available.
     */
    [computeCustomParameters](params) {
      if (!params || !params.length) {
        return undefined;
      }
      const result = /** @type OAuth2CustomParameter[] */ ([]);
      params.forEach((item) => {
        const { value, schema } = item;
        if (!schema.required) {
          const type = typeof value;
          if (type === 'number') {
            if (!value && value !== 0) {
              return;
            }
          } else if (type === 'string') {
            if (!value) {
              return;
            }
          } else if (Array.isArray(value)) {
            if (!value[0]) {
              return;
            }
          } else if (type === 'undefined') {
            return;
          }
        }
        result.push({
          name: item.name,
          value: item.value || ''
        });
      });
      if (result.length === 0) {
        return undefined;
      }
      return result;
    }

    [setupOAuthDeliveryMethod](scheme) {
      const info = this[getOauth2DeliveryMethod](scheme);
      if (this.oauthDeliveryMethod !== info.method) {
        this.oauthDeliveryMethod = info.method;
      }
      if (this.oauthDeliveryName !== info.name) {
        this.oauthDeliveryName = info.name;
      }
    }

    /**
     * Determines placement of OAuth authorization token location.
     * It can be either query parameter or header. This function
     * reads API spec to get this information or provides default if
     * not specifies.
     *
     * @param {any} info Security AMF model
     * @return {Object}
     */
    [getOauth2DeliveryMethod](info) {
      const result = {
        method: 'header',
        name: 'authorization'
      };
      if (!info) {
        return result;
      }
      const hKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.header);
      const pKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.parameter);
      const nKey = this._getAmfKey(this.ns.aml.vocabularies.core.name);
      let header = info[hKey];
      /* istanbul ignore else */
      if (Array.isArray(header)) {
        [header] = header;
      }
      if (header) {
        const headerName = /** @type string */ (this._getValue(header, nKey));
        if (headerName) {
          result.name = headerName;
          return result;
        }
      }
      let parameter = info[pKey];
      /* istanbul ignore else */
      if (Array.isArray(parameter)) {
        [parameter] = parameter;
      }
      if (parameter) {
        const paramName = /** @type string */ (this._getValue(parameter, nKey));
        if (paramName) {
          result.name = paramName;
          result.method = 'query';
          return result;
        }
      }
      return result;
    }

    /**
     * Updates list of OAuth grant types supported by current endpoint.
     * The information should be available in RAML file.
     *
     * @param {string[]=} supportedTypes List of supported types. If empty
     * or not set then all available types will be displayed.
     */
    [updateGrantTypes](supportedTypes) {
      const available = this[computeGrantList](supportedTypes);
      this.grantTypes = available;
      // check if current selection is still available
      const current = this.grantType;
      const hasCurrent = current ?
        available.some((item) => item.type === current) : false;
      if (!hasCurrent) {
        this.grantType = available[0].type;
      } else if (available.length === 1) {
        this.grantType = available[0].type;
      } else {
        this[applyFlow](current);
      }
    }

    /**
     * Computes list of grant types to render in the form.
     *
     * @param {string[]=} allowed List of types allowed by the
     * component configuration or API spec applied to this element. If empty
     * or not set then all OAuth 2.0 default types are returned.
     * @return {GrantType[]}
     */
    [computeGrantList](allowed) {
      let defaults = Array.from(oauth2GrantTypes);
      if (!allowed || !allowed.length) {
        return defaults;
      }
      allowed = Array.from(allowed);
      for (let i = defaults.length - 1; i >= 0; i--) {
        const index = allowed.indexOf(defaults[i].type);
        if (index === -1) {
          defaults.splice(i, 1);
        } else {
          allowed.splice(index, 1);
        }
      }
      if (allowed.length) {
        // @ts-ignore
        allowed = allowed.map((item) => {
          return {
            label: item,
            type: item
          };
        });
        // @ts-ignore
        defaults = defaults.concat(allowed);
      }
      return defaults;
    }

    /**
     * It's quite a bit naive approach to determine whether given model is RAML's
     * or OAS'. There is a significant difference of how to treat grant types
     * (in OAS it is called flows). While in OAS it is mandatory to define a grant type
     * (a flow) RAML has no such requirement. By default this component assumes that
     * all standard (OAuth 2 defined) grant types are supported when grant types are not
     * defined. So it is possible to not define them and the component will work.
     * However, in the AMF model there's always at least one grant type (a flow) whether
     * it's RAML's or OAS' and whether grant type is defined or not.
     *
     * To apply correct settings this component needs to know how to process the data.
     * If it's OAS then when changing grant type it also changes current settings
     * (like scopes, auth uri, etc). If the model is RAML's then change in current grant type
     * won't trigger settings setup.
     *
     * Note, this function returns true when there's no flows whatsoever. It's not
     * really what it means but it is consistent with component's logic.
     *
     * Current method is deterministic and when AMF model change this most probably stop
     * working. It tests whether there's a single grant type and this grant type
     * has no AMF's `security:flow` property.
     *
     * @param {any} flows List of current flows loaded with the AMF model.
     * @return {boolean} True if current model should be treated as RAML's model.
     */
    [isRamlFlow](flows) {
      if (!Array.isArray(flows)) {
        return true;
      }
      let result = false;
      if (flows.length === 1) {
        const type = this._getValue(flows[0], this.ns.aml.vocabularies.security.flow);
        if (!type) {
          result = true;
        }
      }
      return result;
    }

    /**
     * Reads API security definition and applies in to the view as predefined
     * values.
     *
     * @param {any} model AMF model describing settings of the security
     * scheme
     */
    [preFillAmfData](model){
      if (!model) {
        return;
      }
      const sec = this.ns.aml.vocabularies.security;
      if (!this._hasType(model, sec.OAuth2Settings)) {
        return;
      }
      const flows = this._getValueArray(model, sec.flows);
      if (Array.isArray(flows) && !this[isRamlFlow](flows)) {
        this[preFillFlowData](flows);
        return;
      }

      const flow = flows && flows.length ? flows[0] : model;
      // @ts-ignore
      this.authorizationUri = this._getValue(flow, sec.authorizationUri) || '';
      // @ts-ignore
      this.accessTokenUri = this._getValue(flow, sec.accessTokenUri) || '';
      this.scopes = this[readSecurityScopes](flow[this._getAmfKey(sec.scope)]);
      const apiGrants = /** @type string[] */ (this._getValueArray(model, sec.authorizationGrant));
      // TODO check if this also needs to come from `possibleFlowsNode`
      const annotationKey = this[amfCustomSettingsKey](model);
      // TODO check if this also needs to come from `possibleFlowsNode`
      const annotation = annotationKey ? model[annotationKey] : undefined;
      const grants = this[applyAnnotationGrants](apiGrants, annotation);
      if (grants && Array.isArray(grants) && grants.length) {
        const index = grants.indexOf('code');
        if (index !== -1) {
          grants[index] = 'authorization_code';
        }
        this[updateGrantTypes](grants);
      } else {
        this[updateGrantTypes]();
      }
      this[setupAnnotationParameters](annotation);
      this.pkce = this[readPkceValue](model);
    }

    /**
     * Pre-fills authorization data with OAS' definition of a grant type
     * which they call a flow. This method populates form with the information
     * find in the model.
     *
     * It tries to match a flow to currently selected `grantType`. When no match
     * then it takes first flow.
     *
     * Note, flow data are applied when `grantType` change.
     *
     * @param {any[]} flows List of flows in the authorization description.
     */
    [preFillFlowData](flows) {
      // first step is to select the right flow.
      // If the user already selected a grant type before then it this looks
      // for a flow for already selected grant type. If its not present then
      // it uses first available flow.
      let flow = this[flowForType](flows, this.grantType);
      if (!flow) {
        [flow] = flows;
      }
      // finally sets grant types from flows
      const grantTypes = this[readFlowsTypes](flows);
      this[updateGrantTypes](grantTypes);
    }

    /**
     * Searches for a flow in the list of flows for given name.
     *
     * @param {any[]} flows List of flows to search in.
     * @param {string=} type Grant type
     * @return {any|undefined}
     */
    [flowForType](flows, type) {
      if (!type) {
        return undefined;
      }
      for (let i = 0, len = flows.length; i < len; i++) {
        const flow = flows[i];
        const flowType = this._getValue(flow, this.ns.aml.vocabularies.security.flow);
        if (flowType === type) {
          // true for `implicit`, `password`
          return flow;
        }
        if (type === 'authorization_code' && flowType === 'authorizationCode') {
          return flow;
        }
        if (type === 'client_credentials' && flowType === 'clientCredentials') {
          return flow;
        }
      }
      return undefined;
    }

    /**
     * Reads list of scopes from a flow.
     *
     * @param {Object} flow A flow to process.
     * @return {string[]} List of scopes required by an endpoint / API.
     */
    [readFlowScopes](flow) {
      const { security } = this;
      const scopeKey = this._getAmfKey(this.ns.aml.vocabularies.security.scope);
      let scopes = this[readSecurityScopes](flow[scopeKey]);
      if (scopes || !security) {
        return scopes;
      }
      // if scopes are not defined in the operation then they may be defined in
      // security settings.
      const sKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
      let settings = security[sKey];
      /* istanbul ignore else */
      if (Array.isArray(settings)) {
        [settings] = settings;
      }
      let mainFlow = this._getValueArray(settings, this.ns.aml.vocabularies.security.flows);
      /* istanbul ignore else */
      if (Array.isArray(mainFlow)) {
        // @ts-ignore
        [mainFlow] = mainFlow;
      }
      if (mainFlow) {
        scopes = this[readSecurityScopes](mainFlow[scopeKey]);
      }
      return scopes;
    }

    /**
     * Reads list of grant types from the list of flows.
     *
     * @param {object[]} flows List of flows to process.
     * @return {string[]} Grant types supported by this authorization.
     */
    [readFlowsTypes](flows) {
      const sec = this.ns.aml.vocabularies.security;
      const grants = [];
      flows.forEach((flow) => {
        let type = this._getValue(flow, sec.flow);
        if (type === 'authorizationCode') {
          type = 'authorization_code';
        } else if (type === 'clientCredentials') {
          type = 'client_credentials';
        }
        grants[grants.length] = type;
      });
      return grants;
    }

    /**
     * Applies settings from a flow to current properties.
     * OAS' flows may define different configuration for each flow.
     * This function is called each time a grant type change. If current settings
     * does not contain flows then this is ignored.
     *
     * @param {string=} name Set grant type
     */
    [applyFlow](name) {
      if (!name) {
        return;
      }
      const scheme = this[securityScheme];
      if (!scheme) {
        return;
      }
      const sKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
      let settings = scheme[sKey];
      /* istanbul ignore else */
      if (Array.isArray(settings)) {
        [settings] = settings;
      }
      const sec = this.ns.aml.vocabularies.security;
      const flows = /** @type any[] */ (this._getValueArray(settings, sec.flows));
      if (!Array.isArray(flows) || this[isRamlFlow](flows)) {
        return;
      }
      if (name === 'client_credentials') {
        name = 'clientCredentials';
      } else if (name === 'authorization_code') {
        name = 'authorizationCode';
      }
      const flow = flows.find((team) => this._getValue(team, sec.flow) === name);
      // sets basic oauth properties.
      this.scopes = flow ? this[readFlowScopes](flow) : [];
      this.authorizationUri = /** @type string */ (this._getValue(flow, sec.authorizationUri)) || '';
      this.accessTokenUri = /** @type string */ (this._getValue(flow, sec.accessTokenUri)) || '';
    }

    /**
     * Extracts scopes list from the security definition
     * @param {any[]} model
     * @return {string[]|undefined}
     */
    [readSecurityScopes](model) {
      model = this._ensureArray(model);
      if (!model) {
        return undefined;
      }
      const result = [];
      model.forEach((item) => {
        const value = this._getValue(item, this.ns.aml.vocabularies.core.name);
        if (value) {
          result.push(value);
        }
      });
      if (!result.length) {
        return undefined;
      }
      return result;
    }

    /**
     * Finds a key for Custom settings
     * @param {any} model Security scheme settings object.
     * @return {string|undefined}
     */
    [amfCustomSettingsKey](model) {
      const keys = Object.keys(model);
      const { data } = this.ns.aml.vocabularies;
      const settingsKeys = [
        this._getAmfKey(`${data}authorizationSettings`),
        this._getAmfKey(`${data}authorizationGrants`),
        this._getAmfKey(`${data}accessTokenSettings`)
      ];
      return keys.find((key) => {
        const node = model[key];
        return node[settingsKeys[0]] || node[settingsKeys[1]] || node[settingsKeys[2]];
      });
    }

    /**
     * Applies `authorizationGrants` from OAuth2 settings annotation.
     *
     * @param {string[]=} [grants=[]] OAuth spec grants available for the endpoint
     * @param {any=} annotation Read annotation.
     * @return {string[]} List of grants to apply.
     */
    [applyAnnotationGrants](grants=[], annotation) {
      if (!annotation) {
        return grants;
      }
      const d = this.ns.aml.vocabularies.data;
      let model = annotation[this._getAmfKey(`${d}authorizationGrants`)];
      model = this._ensureArray(model);
      /* istanbul ignore if */
      if (!model || !model.length) {
        return grants;
      }
      const list = model[0][this._getAmfKey(this.ns.w3.rdfSchema.member)];
      const addedGrants = [];
      list.forEach((item) => {
        const v = this._getValue(item, `${d}value`);
        /* istanbul ignore if */
        if (!v) {
          return;
        }
        addedGrants.push(v);
      });
      /* istanbul ignore if */
      if (!addedGrants.length) {
        return grants;
      }
      const ignoreKey = `${d}ignoreDefaultGrants`;
      /* istanbul ignore if */
      if (typeof annotation[this._getAmfKey(ignoreKey)] !== 'undefined') {
        grants = [];
      }
      grants = grants.concat(addedGrants);
      return grants;
    }

    /**
     * Sets up annotation supported variables to apply form view for:
     * - authorization query parameters
     * - authorization headers
     * - token query parameters
     * - token headers
     * - token body
     *
     * @param {Object} annotation Annotation applied to the OAuth settings
     */
    [setupAnnotationParameters](annotation) {
      /* istanbul ignore if */
      if (this[authQueryParameters]) {
        this[authQueryParameters] = undefined;
      }
      /* istanbul ignore if */
      if (this[tokenQueryParameters]) {
        this[tokenQueryParameters] = undefined;
      }
      /* istanbul ignore if */
      if (this[tokenHeaders]) {
        this[tokenHeaders] = undefined;
      }
      /* istanbul ignore if */
      if (this[tokenBody]) {
        this[tokenBody] = undefined;
      }
      /* istanbul ignore if */
      if (!annotation) {
        return;
      }
      const d = this.ns.aml.vocabularies.data;
      // these are non standard data properties and therefore
      // the namespace has no information  about them.
      const qpKey = this._getAmfKey(`${d}queryParameters`);
      let authSettings = annotation[this._getAmfKey(`${d}authorizationSettings`)];
      let tokenSettings = annotation[this._getAmfKey(`${d}accessTokenSettings`)];
      /* istanbul ignore else */
      if (authSettings) {
        /* istanbul ignore else */
        if (Array.isArray(authSettings)) {
          [authSettings] = authSettings;
        }
        const qp = authSettings[qpKey];
        /* istanbul ignore else */
        if (qp) {
          this[setupAuthRequestQueryParameters](qp);
        }
      }
      /* istanbul ignore else */
      if (tokenSettings) {
        /* istanbul ignore else */
        if (Array.isArray(tokenSettings)) {
          [tokenSettings] = tokenSettings;
        }
        const qp = tokenSettings[qpKey];
        const headers = tokenSettings[this._getAmfKey(`${d}headers`)];
        const body = tokenSettings[this._getAmfKey(`${d}body`)];
        /* istanbul ignore else */
        if (qp) {
          this[setupTokenRequestQueryParameters](qp);
        }
        /* istanbul ignore else */
        if (headers) {
          this[setupTokenRequestHeaders](headers);
        }
        /* istanbul ignore else */
        if (body) {
          this[setupTokenRequestBody](body);
        }
      }
    }

    /**
     * Sets up query parameters to be used with authorization request.
     *
     * @param {any[]} params List of parameters from the annotation.
     */
    [setupAuthRequestQueryParameters](params) {
      const model = this[createViewModel](params);
      /* istanbul ignore if */
      if (!model) {
        return;
      }
      this[authQueryParameters] = model;
    }

    /**
     * Sets up query parameters to be used with token request.
     *
     * @param {any[]} params List of parameters from the annotation.
     */
    [setupTokenRequestQueryParameters](params) {
      const model = this[createViewModel](params);
      /* istanbul ignore if */
      if (!model) {
        return;
      }
      this[tokenQueryParameters] = model;
    }

    /**
     * Sets up headers to be used with token request.
     *
     * @param {any[]} params List of parameters from the annotation.
     */
    [setupTokenRequestHeaders](params) {
      const model = this[createViewModel](params);
      /* istanbul ignore if */
      if (!model) {
        return;
      }
      this[tokenHeaders] = model;
    }

    /**
     * Sets up body parameters to be used with token request.
     *
     * @param {any[]} params List of parameters from the annotation.
     */
    [setupTokenRequestBody](params) {
      const model = this[createViewModel](params);
      /* istanbul ignore if */
      if (!model) {
        return;
      }
      this[tokenBody] = model;
    }

    /**
     * Creates a form view model for type items.
     *
     * @param {any} param Property or list of properties to process.
     * @param {ProcessOptions=} modelOptions
     * @return {AmfFormItem[]|undefined} Form view model or undefined if not set.
     */
    [createViewModel](param, modelOptions) {
      /* istanbul ignore if */
      if (!param) {
        return undefined;
      }
      /* istanbul ignore else */
      if (Array.isArray(param)) {
        [param] = param;
      }
      const factory = new ApiViewModel({
        amf: this.amf,
      });
      factory.amf = this.amf;
      return factory.modelForRawObject(param, modelOptions);
    }

    /**
     * @param {Event} e 
     */
    [customValueHandler](e) {
      const { target } = e;
      const node = /** @type HTMLInputElement */ (target);
      const index = Number(node.dataset.index);
      const { type } = node.dataset;
      /* istanbul ignore if */
      if (Number.isNaN(index) || !type) {
        return;
      }
      const { value } = node;
      const model = this[modelForCustomType](type);
      model[index].value = value;
      notifyChange(this);
    }

    /**
     * @param {string} type 
     * @returns {AmfFormItem[]}
     */
    [modelForCustomType](type) {
      let model;
      if (type === 'auth-query') {
        model = this[authQueryParameters];
      } else if (type === 'token-query') {
        model = this[tokenQueryParameters];
      } else if (type === 'token-headers') {
        model = this[tokenHeaders];
      } else {
        model = this[tokenBody];
      }
      return model;
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
      const model = this[modelForCustomType](type);
      // @ts-ignore
      model[index].docsOpened = !model[index].docsOpened;
      this.requestUpdate();
    }

    /**
     * Checks whether the security scheme is annotated with the `pkce` annotation.
     * This annotation is published at https://github.com/raml-org/raml-annotations/tree/master/annotations/security-schemes
     * @param {any} model Model for the security settings
     * @returns {boolean|undefined} True if the security settings are annotated with PKCE extension
     */
    [readPkceValue](model) {
      const key = this._getAmfKey(this.ns.aml.vocabularies.document.customDomainProperties);
      if (typeof model[key] === 'undefined') {
        return undefined;
      }
      const values = this._ensureArray(model[key]);
      for (let i = 0, len = values.length; i < len; i++) {
        let id = /** @type string */ (this._getValue(values[i], '@id'));
        if (!id.startsWith('amf://id')) {
          id = `amf://id${id}`;
        }
        const node = model[id];
        const extensionNameKey = this._getAmfKey(this.ns.aml.vocabularies.core.extensionName);
        if (this._getValue(node, extensionNameKey) === 'pkce') {
          return this._getValue(node, this.ns.aml.vocabularies.data.value) === 'true';
        }
      }
      return undefined;
    }

    [oauth2CustomPropertiesTemplate]() {
      const aqp = this[authQueryParameters];
      const tqp = this[tokenQueryParameters];
      const th = this[tokenHeaders];
      const tb = this[tokenBody];
      return html`
      ${aqp && aqp.length ?
        html`<div class="subtitle">Authorization request query parameters</div>
        ${this[templateForCustomArray](aqp, 'auth-query')}` : ''}
      ${tqp && tqp.length ?
        html`<div class="subtitle">Token request query parameters</div>
        ${this[templateForCustomArray](tqp, 'token-query')}` : ''}
      ${th && th.length ?
        html`<div class="subtitle">Token request headers</div>
        ${this[templateForCustomArray](th, 'token-headers')}` : ''}
      ${tb && tb.length ?
        html`<div class="subtitle">Token request body</div>
        ${this[templateForCustomArray](tb, 'token-body')}` : ''}
      `;
    }

    /**
     * 
     * @param {AmfFormItem[]} items 
     * @param {string} type 
     */
    [templateForCustomArray](items, type) {
      return items.map((item, index) => this[templateForCustomItem](item, index, type));
    }

    /**
     * @param {AmfFormItem} item 
     * @param {number} index 
     * @param {string} type 
     * @returns {TemplateResult} The template for a custom item
     */
    [templateForCustomItem](item, index, type) {
      const { outlined, compatibility, readOnly, disabled } = this;
      const { schema={} } = item;
      // @ts-ignore
      const { docsOpened } = item;
      return html`
      <div class="custom-data-field">
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
            @change="${this[customValueHandler]}"
          ></api-form-item>
          ${schema.description ? html`<anypoint-icon-button
            class="hint-icon"
            title="Toggle description"
            aria-label="Press to toggle description"
            data-type="${type}"
            data-index="${index}"
            @click="${this[toggleDocumentation]}"
          >
            <arc-icon icon="help"></arc-icon>
          </anypoint-icon-button>` : ''}
        </div>
      ${schema.description && docsOpened ? html`<div class="docs-container">
        <arc-marked .markdown="${item.schema.description}" sanitize>
          <div slot="markdown-html" class="markdown-body"></div>
        </arc-marked>
      </div>` : ''}
    </div>`
    }
  }
  return ApiOauth2MethodMixinImpl;
}

/**
 * A mixin that adds support for OAuth 2 method with AMF model
 *
 * @mixin
 */
export const ApiOauth2MethodMixin = dedupeMixin(mxFunction);
