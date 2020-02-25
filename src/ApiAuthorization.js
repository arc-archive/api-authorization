import { html, LitElement } from 'lit-element';
import { ifDefined } from 'lit-html/directives/if-defined';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-item/anypoint-item-body.js';
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
 * An HTML element that renders authorization option for applied AMD model.
 *
 * @extends LitElement
 * @mixes AmfHelperMixinConstructor
 * @mixes AmfHelperMixin
 * @class ApiAuthorization
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
      /**
       * A list of authorization methods read from the security definition.
       */
      methods: { type: Array },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set all controls are disabled in the form
       */
      disabled: { type: Boolean },
      /**
       * If set it renders a narrow layout
       */
      narrow: { type: Boolean, reflect: true },
      // Current HTTP method. Passed to digest method.
      httpMethod: { type: String },
      // Current request URL. Passed to digest method.
      requestUrl: { type: String },
      // Current request body. Passed to digest method.
      requestBody: { type: String },
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

  // get selected() {
  //   return this._selected;
  // }
  //
  // set selected(value) {
  //   const old = this._selected;
  //   if (old === value) {
  //     return;
  //   }
  //   this._selected = value;
  //   this.requestUpdate();
  //   this._applySelected();
  // }

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
    this.selected = undefined;
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
    this.selected = 0;
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
    for (let i = 0, len = securities.length; i < len; i++) {
      const security = securities[i];
      const schemes = this._ensureArray(security[shsKey]);
      if (!schemes) {
        continue;
      }
      const item = {
        types: [],
        names: [],
        schemes: [],
      };
      for (let j = 0; j < schemes.length; j++) {
        const [type, name] = this._listSchemeLabels(schemes[j]);
        if (!type || !name) {
          continue;
        }
        item.types.push(type);
        item.names.push(name);
        item.schemes.push(schemes[j]);
      }
      result.push(item);
    }
    return result;
  }

  /**
   * Reads authorization scheme's name and type from the AMF model.
   *
   * Note, OAS and RAML has different names for types. For example RAML's `Basic
   * Authorization` is `basic` in OAS. This function does not normalize this values.
   *
   * Note 2 (pawel): Because in OAS it is possible to declare multiple authorization methods to be
   * used for an andpoint with the same request the types can be duplicate
   * (common case with Api Key type). Because of that this element exposes the
   * name as defined in the API spec file, even though it is a variable used
   * to keep a reference to the security. Technically it is incorrect as this
   * probably tell nothing to the end user but I don't see other option right now.
   *
   * @param {Object} scheme Authorization scheme to process
   * @return {Array<String>} First item is the type and the second is the name.
   * May be undefined.
   */
  _listSchemeLabels(scheme) {
    const sec = this.ns.aml.vocabularies.security;
    const name = this._getValue(scheme, this.ns.aml.vocabularies.core.name);
    if (name === 'null') {
      // RAML allows to define a "null" scheme. This means that the authorization
      // for this endpoint is optional.
      return [name, 'No authorization'];
    }
    const shKey = this._getAmfKey(sec.scheme);
    const setKey = this._getAmfKey(sec.settings);
    const scheme1 = this._ensureArray(scheme[shKey])[0];
    if (!scheme1) {
      return [];
    }
    let type = this._getValue(scheme1, sec.type);
    if (type === 'http') {
      const settings = this._ensureArray(scheme1[setKey]);
      if (!settings) {
        return [];
      }
      type = this._getValue(settings[0], sec.scheme);
    }
    return [type, name]
  }

  _selectionHandler(e) {
    this.selected = e.target.selected;
  }

  // _applySelected() {
  //   const { selected } = this;
  //
  // }

  render() {
    const { styles } = this;
    return html`
    <style>${styles}</style>
    ${this._selectorTemplate()}
    ${this._methodsTemplate()}
    `;
  }

  _selectorTemplate() {
    const {
      outlined,
      compatibility,
      readOnly,
      disabled,
      selected,
    } = this;
    const items = this.methods || [];
    const size = items.length;
    if (!size) {
      return '';
    }
    const isSingle = size === 1;
    if (isSingle) {
      return this._selectorItem(items[0], { tabindex: -1 });
    }
    return html`
    <anypoint-dropdown-menu
      name="selected"
      .outlined="${outlined}"
      .compatibility="${compatibility}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
    >
      <label slot="label">Authorization method</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${selected}"
        @selected-changed="${this._selectionHandler}"
        .outlined="${outlined}"
        .compatibility="${compatibility}"
        .readOnly="${readOnly}"
        .disabled="${disabled}"
        attrForItemTitle="label"
      >
        ${items.map((item) => this._selectorItem(item))}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }

  _selectorItem(item, opts={}) {
    const { tabindex } = opts;
    const { types, names } = item;
    const { compatibility } = this;
    const nLabel = (names || []).join(', ');
    return html`
    <anypoint-item
      ?compatibility="${compatibility}"
      tabindex="${ifDefined(tabindex)}"
      label="${nLabel}"
    >
      <anypoint-item-body twoline>
        <div>${nLabel}</div>
        <div secondary>${(types || []).join(', ')}</div>
      </anypoint-item-body>
    </anypoint-item>`;
  }

  get selectedMethods() {
    const { selected, methods } = this;
    const method = (methods || [])[selected];
    return method ? method.types : undefined;
  }

  get selectedSchemes() {
    const { selected, methods } = this;
    const method = (methods || [])[selected];
    return method ? method.schemes : undefined;
  }

  _methodsTemplate() {
    const { selectedMethods } = this;
    if (!selectedMethods) {
      return '';
    }
    const selectedSchemes = this.selectedSchemes || [];
    const renderTitles = !!selectedSchemes.length && selectedSchemes.length > 1;
    return selectedMethods.map((item, index) => this._renderMethod(item, selectedSchemes[index], renderTitles));
  }

  _renderMethod(type, scheme, renderTitle) {
    switch (type) {
      case 'Basic Authentication':
      case 'basic':
        return this._basicAuthTemplate(scheme, renderTitle);
      case 'Digest Authentication':
        return this._digestAuthTemplate(scheme, renderTitle);
      case 'Pass Through':
        return this._passThroughAuthTemplate(scheme, renderTitle);
      case 'OAuth 2.0':
        return this._oa2AuthTemplate(scheme, renderTitle);
      case 'OAuth 1.0':
        return this._oa1AuthTemplate(scheme, renderTitle);
      case 'bearer':
        return this._bearerAuthTemplate(scheme, renderTitle);
      case 'Api Key':
        return this._apiKeyTemplate(scheme);
      default:
        if (String(type).indexOf('x-') === 0) {
          return this._ramlCustomAuthTemplate(scheme);
        }
    }
    return '';
  }

  _methodTitleTemplate(scheme) {
    const name = this._getValue(scheme, this.ns.aml.vocabularies.core.name);
    if (!name) {
      return '';
    }
    return html`<div
      role="heading"
      aria-level="3"
      class="auth-label"
    >${name}</div>`;
  }

  /**
   * Renders a template for Basic authorization.
   *
   * @param {?Object} security Security scheme
   * @param {?Boolean} renderTitle
   * @return {TemplateResult}
   */
  _basicAuthTemplate(security, renderTitle) {
    const {
      compatibility,
      outlined,
      amf,
    } = this;
    return html`
    ${renderTitle ? this._methodTitleTemplate(security) : ''}
    <api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="basic"
      .security="${security}"
      .amf="${amf}"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for Digest authorization.
   *
   * @param {?Object} security Security scheme
   * @param {?Boolean} renderTitle
   * @return {TemplateResult}
   */
  _digestAuthTemplate(security, renderTitle) {
    const {
      compatibility,
      outlined,
      amf,
    } = this;
    return html`
    ${renderTitle ? this._methodTitleTemplate(security) : ''}
    <api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .security="${security}"
      .amf="${amf}"
      type="digest"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for Digest authorization.
   *
   * @param {?Object} security Security scheme
   * @param {?Boolean} renderTitle
   * @return {TemplateResult}
   */
  _passThroughAuthTemplate(security, renderTitle) {
    const {
      compatibility,
      outlined,
      amf,
    } = this;
    return html`
    ${renderTitle ? this._methodTitleTemplate(security) : ''}
    <api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .security="${security}"
      .amf="${amf}"
      type="pass through"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for Digest authorization.
   *
   * @param {?Object} security Security scheme
   * @return {TemplateResult}
   */
  _ramlCustomAuthTemplate(security) {
    const {
      compatibility,
      outlined,
      amf,
    } = this;
    return html`<api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .security="${security}"
      .amf="${amf}"
      type="custom"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for Bearer authorization (OAS).
   *
   * @param {?Object} security Security scheme
   * @param {?Boolean} renderTitle
   * @return {TemplateResult}
   */
  _bearerAuthTemplate(security, renderTitle) {
    const {
      compatibility,
      outlined,
      amf,
    } = this;
    return html`
    ${renderTitle ? this._methodTitleTemplate(security) : ''}
    <api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="bearer"
      .amf="${amf}"
      .security="${security}"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for OAuth 1 authorization.
   *
   * @param {?Object} security Security scheme
   * @param {?Boolean} renderTitle
   * @return {TemplateResult}
   */
  _oa1AuthTemplate(security, renderTitle) {
    const {
      compatibility,
      outlined,
      redirectUri,
      amf,
    } = this;
    return html`
    ${renderTitle ? this._methodTitleTemplate(security) : ''}
    <api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="oauth 1"
      .redirectUri="${redirectUri}"
      .amf="${amf}"
      .security="${security}"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for OAuth 2 authorization.
   *
   * @param {?Object} security Security scheme
   * @param {?Boolean} renderTitle
   * @return {TemplateResult}
   */
  _oa2AuthTemplate(security, renderTitle) {
    const {
      compatibility,
      outlined,
      redirectUri,
      amf,
    } = this;
    return html`
    ${renderTitle ? this._methodTitleTemplate(security) : ''}
    <api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="oauth 2"
      .redirectUri="${redirectUri}"
      .amf="${amf}"
      .security="${security}"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for Api Keys authorization.
   *
   * @param {?Object} security Security scheme
   * @return {TemplateResult}
   */
  _apiKeyTemplate(security) {
    const {
      compatibility,
      outlined,
      amf,
    } = this;
    return html`<api-authorization-method
      .amf="${amf}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="api key"
      .security="${security}"
    ></api-authorization-method>
    `;
  }
}
