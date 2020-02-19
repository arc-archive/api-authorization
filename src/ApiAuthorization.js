import { html, LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@advanced-rest-client/api-authorization-method/api-authorization-method.js';
import styles from './Styles.js';
/**
 * @typedef BasicSettings
 * @property {String?} username
 * @property {String?} password
 */

/**
 * @typedef BearerSettings
 * @property {String?} token
 */

/**
 * @typedef BaseAmfSettings
 * @property {String?} type
 * @property {Object|Array<Object>} security
 */

/**
 * @extends LitElement
 * @mixes AmfHelperMixin
 */
export class ApiAuthorization extends AmfHelperMixin(LitElement) {
  get styles() {
    return [
      styles,
    ];
  }

  static get properties() {
    return {
      selected: { type: Number },
      /**
       * Enables compatibility with Anypoint platform
       */
      compatibility: { type: Boolean },
      /**
       * Enables material's outlined theme for inputs.
       */
      outlined: { type: Boolean },
      /**
       * Redirect URL for the OAuth2 authorization.
       */
      redirectUri: { type: Boolean },
    };
  }

  get security() {
    return this._security;
  }

  set security(value) {
    const old = this._security;
    if (old === value) {
      return;
    }
    this._security = value;
    this.requestUpdate();
    this._processModel();
  }

  constructor() {
    super();
    // for types
    this._security = null;
    this.redirectUri = null;
    this.compatibility = false;
    this.outlined = false;
  }

  _processModel() {
    if (this.__modelDebouncer) {
      return;
    }
    this.__modelDebouncer = true;
    setTimeout(() => {
      this.__modelDebouncer = false;
      this._applyModel();
    });
  }

  _applyModel() {
    const { security } = this;
    if (!security) {
      return;
    }
    this.methods = this._computeAuthMethods(security);
  }

  /**
   * Computes list of security schemes that can be applied to the element.
   *
   * @param {Array<Object>} securities A list of security schemes to process.
   * @return {Array<Object>} A list of authorization methods that can be applied to
   * the current endpoint. Each object secribes the list of security types
   * that can be applied to the editor. In OAS an auth method may be an union
   * of methods.
   */
  _computeAuthMethods(securities) {
    const result = [];
    const sec = this.ns.aml.vocabularies.security;
    const shsKey = this._getAmfKey(sec.schemes);
    const shKey = this._getAmfKey(sec.scheme);
    for (let i = 0, len = securities.length; i < len; i++) {
      const security = securities[i];
      const schemes = this._ensureArray(security[shsKey]);
      if (!schemes) {
        continue;
      }
      const item = {
        types: [],
        names: [],
      };
      for (let j = 0; j < schemes.length; j++) {
        const scheme = schemes[j];
        const scheme1 = this._ensureArray(scheme[shKey])[0];
        if (!scheme1) {
          continue;
        }
        const type = this._getValue(scheme1, sec.type);
        const name = this._getValue(scheme, this.ns.aml.vocabularies.core.name);
        item.types.push(type);
        item.names.push(name);
      }
      result.push(item);
    }
    return result;
  }

  render() {
    const { styles } = this;
    return html`
    <style>${styles}</style>
      <button>increment</button>
    `;
  }

  /**
   * Renders a template for Basic authorization.
   *
   * @param {BasicSettings|Object} [config={}] current configuration
   * @return {TemplateResult}
   */
  _basicAuthTemplate(config={}) {
    const {
      compatibility,
      outlined,
    } = this;
    const { username, password } = config;
    return html`<authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="basic"
      .username="${username}"
      .password="${password}"
    ></authorization-method>`;
  }

  /**
   * Renders a template for Bearer authorization (OAS).
   *
   * @param {BearerSettings|Object} [config={}] current configuration
   * @return {TemplateResult}
   */
  _bearerAuthTemplate(config={}) {
    const {
      compatibility,
      outlined,
    } = this;
    const { token } = config;
    return html`<authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="bearer"
      .token="${token}"
    ></authorization-method>`;
  }

  /**
   * Renders a template for OAuth 1 authorization.
   *
   * @param {BaseAmfSettings|Object} [config={}] current configuration
   * @return {TemplateResult}
   */
  _oa1AuthTemplate(config={}) {
    const {
      compatibility,
      outlined,
      redirectUri,
      amf,
    } = this;
    const {
      security
    } = config;
    return html`<authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="oauth 1"
      .redirectUri="${redirectUri}"
      .amf="${amf}"
      .security="${security}"
    ></authorization-method>`;
  }

  /**
   * Renders a template for OAuth 2 authorization.
   *
   * @param {BaseAmfSettings|Object} [config={}] current configuration
   * @return {TemplateResult}
   */
  _oa2AuthTemplate(config={}) {
    const {
      compatibility,
      outlined,
      redirectUri,
      amf,
    } = this;
    const {
      security,
    } = config;
    return html`<authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="oauth 2"
      .redirectUri="${redirectUri}"
      .amf="${amf}"
      .security="${security}"
    ></authorization-method>`;
  }

  /**
   * Renders a template for Api Keys authorization.
   *
   * @param {BaseAmfSettings|Object} [config={}] AMF configuration for API keys
   * @return {TemplateResult}
   */
  _apiKeyTemplate(config={}) {
    const {
      compatibility,
      outlined,
      amf,
    } = this;
    const { security, type } = config;
    return html`<api-authorization-method
      .amf="${amf}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .type="${type}"
      .security="${security}"
    ></api-authorization-method>
    `;
  }
}
