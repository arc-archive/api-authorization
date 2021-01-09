import { defaultSignatureMethods } from '@advanced-rest-client/authorization-method/src/Oauth1MethodMixin.js';
import { dedupeMixin } from '@open-wc/dedupe-mixin';

export const initializeOauth1Model = Symbol('initializeOauth1Model');
export const preFillAmfData = Symbol('preFillAmfData');

/** @typedef {import('./ApiAuthorizationMethod').ApiAuthorizationMethod} ApiAuthorizationMethod */

/**
 * @param {ApiAuthorizationMethod} base
 */
const mxFunction = (base) => {
  class ApiOauth1MethodMixin extends base {
    [initializeOauth1Model]() {
      const { security } = this;
      if (!this._hasType(security, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
        this.signatureMethods = defaultSignatureMethods;
        return;
      }
      const shKey = this._getAmfKey(this.ns.aml.vocabularies.security.scheme);
      let scheme = security[shKey];
      if (!scheme) {
        return;
      }
      if (Array.isArray(scheme)) {
        [scheme] = scheme;
      }
      const type = this._getValue(scheme, this.ns.aml.vocabularies.security.type);
      const isOauth1 = type === 'OAuth 1.0';
      if (!isOauth1) {
        this.signatureMethods = defaultSignatureMethods;
        return;
      }
      const sKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
      let settings = scheme[sKey];
      if (Array.isArray(settings)) {
        [settings] = settings;
      }
      this[preFillAmfData](settings);
      this.requestUpdate();
    }

    /**
     * Reads API security definition and applies in to the view as predefined
     * values.
     *
     * @param {Object} model AMF model describing settings of the security
     * scheme
     */
    [preFillAmfData](model){
      if (!model) {
        return;
      }
      const sec = this.ns.aml.vocabularies.security;
      if (!this._hasType(model, sec.OAuth1Settings)) {
        return;
      }
      this.requestTokenUri = /** @type string */ (this._getValue(model, sec.requestTokenUri));
      this.authorizationUri = /** @type string */ (this._getValue(model, sec.authorizationUri));
      this.accessTokenUri = /** @type string */ (this._getValue(model, sec.tokenCredentialsUri));
      const signatures = /** @type string[] */ (this._getValueArray(model, sec.signature));
      if (!signatures || !signatures.length) {
        this.signatureMethods = defaultSignatureMethods;
      } else {
        this.signatureMethods = signatures;
      }
    }
  }
  return ApiOauth1MethodMixin;
}

/**
 * A mixin that adds support for OAuth 2 method with AMF model
 *
 * @mixin
 */
export const ApiOauth1MethodMixin = dedupeMixin(mxFunction);
