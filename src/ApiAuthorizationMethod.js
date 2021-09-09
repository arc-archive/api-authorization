/* eslint-disable no-param-reassign */
import { AuthorizationMethodElement as AuthorizationMethod } from '@advanced-rest-client/authorization';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin';
import {
  normalizeType,
  METHOD_OAUTH2,
  METHOD_OAUTH1,
} from '@advanced-rest-client/authorization/src/Utils.js';
import {
  serializeOauth2Auth,
} from '@advanced-rest-client/authorization/src/Oauth2MethodMixin.js';
import {
  CustomMethodMixin,
  initializeCustomModel,
  renderCustom,
  validateCustom,
  serializeCustom,
  restoreCustom,
  updateQueryParameterCustom,
  updateHeaderCustom,
  clearCustom,
} from './CustomMethodMixin.js';
import {
  PassThroughMethodMixin,
  renderPassThrough,
  initializePassThroughModel,
  restorePassThrough,
  serializePassThrough,
  validatePassThrough,
  updateQueryParameterPassThrough,
  updateHeaderPassThrough,
  clearPassThrough,
} from './PassThroughMethodMixin.js';
import {
  ApiOauth1MethodMixin,
  initializeOauth1Model,
} from './ApiOauth1MethodMixin.js';
import {
  ApiOauth2MethodMixin,
  initializeOauth2Model,
} from './ApiOauth2MethodMixin.js';
import styles from './styles/Method.styles.js';
import {
  ApiKeyMethodMixin,
  initializeApiKeyModel,
  validateApiKey,
  serializeApiKey,
  restoreApiKey,
  renderApiKey,
  updateQueryParameterApiKey,
  updateHeaderApiKey,
  updateCookieApiKey,
  clearApiKey,
} from './ApiKeyMethodMixin.js';

export const METHOD_CUSTOM = 'custom';
export const METHOD_PASS_THROUGH = 'pass through';
export const METHOD_API_KEY = 'api key';

/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BasicAuthorization} BasicAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth1Authorization} OAuth1Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.DigestAuthorization} DigestAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BearerAuthorization} BearerAuthorization */
/** @typedef {import('./types').ApiAuthorizationSettings} ApiAuthorizationSettings */

export class ApiAuthorizationMethod extends AmfHelperMixin(
  ApiOauth2MethodMixin(
    ApiOauth1MethodMixin(
      CustomMethodMixin(
        PassThroughMethodMixin(
          ApiKeyMethodMixin(AuthorizationMethod)))))) {

  // @ts-ignore
  get styles() {
    return [
      super.styles,
      styles,
    ];
  }

  static get properties() {
    return {
      /**
       * A security model generated by the AMF parser.
       */
      security: { type: Object },
      /**
       * When set the "description" of the security definition is rendered.
       */
      descriptionOpened: { type: Boolean }
    };
  }

  constructor() {
    super()
    this._handleInformationChanged = this._handleInformationChanged.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('securitysettingsinfochanged', this._handleInformationChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('securitysettingsinfochanged', this._handleInformationChanged);
  }

  updated(changed) {
    if (changed.has('security') || changed.has('type')) {
      // the `updated()` is called asynchronously anyway so no need to
      // call `__apiPropHandler()`
      this._processSecurity();
    }
  }

  /**
   * Overrides `AmfHelperMixin.__amfChanged`
   */
  async __amfChanged() {
    this.__apiPropHandler();
  }

  async __apiPropHandler() {
    if (this.__schemeDebouncer) {
      return;
    }
    // This ensures that the `type` and `security` properties are reflected
    // from the attribute, if set.
    await this.updateComplete;
    this.__schemeDebouncer = true;
    setTimeout(() => {
      this.__schemeDebouncer = false;
      this._processSecurity();
    });
  }

  _handleInformationChanged(e) {
    const { detail } = e;
    const serialized = this.serialize();
    this.restore({ ...serialized, ...detail });
  }

  _processSecurity() {
    const type = normalizeType(this.type);
    switch (type) {
      case METHOD_CUSTOM: this[initializeCustomModel](); break;
      case METHOD_OAUTH2: this[initializeOauth2Model](); break;
      case METHOD_OAUTH1: this[initializeOauth1Model](); break;
      case METHOD_PASS_THROUGH: this[initializePassThroughModel](); break;
      case METHOD_API_KEY: this[initializeApiKeyModel](); break;
      default:
    }
  }

  /**
   * Toggles value of `descriptionOpened` property.
   *
   * This is a utility method for UI event handling. Use `descriptionOpened`
   * attribute directly instead of this method.
   */
  toggleDescription() {
    this.descriptionOpened = !this.descriptionOpened;
  }

  /**
   * Validates current method.
   * @return {boolean}
   */
  validate() {
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM: return this[validateCustom]();
      case METHOD_PASS_THROUGH: return this[validatePassThrough]();
      case METHOD_API_KEY: return this[validateApiKey]();
      default: return super.validate();
    }
  }

  /**
   * Clears settings of currently selected method.
   */
  clear() {
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM: this[clearCustom](); break;
      case METHOD_PASS_THROUGH: this[clearPassThrough](); break;
      case METHOD_API_KEY: this[clearApiKey](); break;
      default: super.clear(); break;
    }
  }

  /**
   * Creates a settings object with user provided data for current method.
   *
   * @return {Object} User provided data
   */
  serialize() {
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM: return this[serializeCustom]();
      case METHOD_OAUTH2: return this[serializeOauth2Auth]();
      case METHOD_PASS_THROUGH: return this[serializePassThrough]();
      case METHOD_API_KEY: return this[serializeApiKey]();
      default: return super.serialize();
    }
  }

  /**
   * Restores previously serialized settings.
   * A method type must be selected before calling this function.
   *
   * @param {any} settings Depends on current type.
   * @return {any}
   */
  restore(settings) {
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM: return this[restoreCustom](settings);
      case METHOD_PASS_THROUGH: return this[restorePassThrough](settings);
      case METHOD_API_KEY: return this[restoreApiKey](settings);
      default: return super.restore(settings);
    }
  }

  // @ts-ignore
  render() {
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM: return this[renderCustom]();
      case METHOD_PASS_THROUGH: return this[renderPassThrough]();
      case METHOD_API_KEY: return this[renderApiKey]();
      default: return super.render();
    }
  }

  /**
   * Updates, if applicable, query parameter value.
   * This is supported for RAML custom scheme and Pass Through
   * that operates on query parameters model which is only an internal
   * model.
   *
   * This does nothing if the query parameter has not been defined for current
   * scheme.
   *
   * @param {string} name The name of the changed parameter
   * @param {string} newValue A value to apply. May be empty but must be defined.
   */
  updateQueryParameter(name, newValue) {
    if (newValue === null || newValue === undefined) {
      newValue = '';
    }
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM:
        this[updateQueryParameterCustom](name, newValue);
        break;
      case METHOD_PASS_THROUGH:
        this[updateQueryParameterPassThrough](name, newValue);
        break;
      case METHOD_API_KEY:
        this[updateQueryParameterApiKey](name, newValue);
        break;
      default:
    }
  }

  /**
   * Updates, if applicable, header value.
   * This is supported for RAML custom scheme and Pass Through
   * that operates on headers model which is only an internal model.
   *
   * This does nothing if the header has not been defined for current
   * scheme.
   *
   * @param {string} name The name of the changed header
   * @param {string} newValue A value to apply. May be empty but must be defined.
   */
  updateHeader(name, newValue) {
    if (newValue === null || newValue === undefined) {
      newValue = '';
    }
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM:
        this[updateHeaderCustom](name, newValue);
        break;
      case METHOD_PASS_THROUGH:
        this[updateHeaderPassThrough](name, newValue);
        break;
      case METHOD_API_KEY:
        this[updateHeaderApiKey](name, newValue);
        break;
      default:
    }
  }

  /**
   * Updates, if applicable, cookie value.
   * This is supported in OAS' Api Key.
   *
   * This does nothing if the cookie has not been defined for current
   * scheme.
   *
   * @param {string} name The name of the changed cookie
   * @param {string} newValue A value to apply. May be empty but must be defined.
   */
  updateCookie(name, newValue) {
    if (newValue === null || newValue === undefined) {
      newValue = '';
    }
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_API_KEY:
        this[updateCookieApiKey](name, newValue);
        break;
      default:
    }
  }
}
