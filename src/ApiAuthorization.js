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

  get securedBy() {
    return this._securedBy;
  }

  set securedBy(value) {
    const old = this._securedBy;
    if (old === value) {
      return;
    }
    this._securedBy = value;
    this.requestUpdate();
    this._processModel();
  }

  constructor() {
    super();
    this._securedBy = null;
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
