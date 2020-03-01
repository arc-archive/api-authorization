import { html, LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-item/anypoint-item-body.js';
import '@advanced-rest-client/api-authorization-method/api-authorization-method.js';
import styles from './Styles.js';

/**
 * @typedef AuthorizationParams
 * @property {Object} headers
 * @property {Object} params
 * @property {Object} cookies
 */
/**
 * @typedef AuthorizationSettings
 * @property {String} type
 * @property {Boolean} valid
 * @property {Object} settings
 */

function mapAuthName(name) {
  switch (name) {
    case 'basic': return 'Basic authorization';
    case 'bearer': return 'Bearer';
    default: return name;
  }
}

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
      /**
       * Currently selected method relative to `#selectedMethods` property.
       */
      selected: { type: Number },
      /**
       * Enables compatibility with Anypoint platform.
       */
      compatibility: { type: Boolean },
      /**
       * Enables material's outlined theme for inputs.
       */
      outlined: { type: Boolean },
      /**
       * Redirect URL for the OAuth2 authorization.
       */
      redirectUri: { type: String },
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
      // Current HTTP method. Passed by digest method.
      httpMethod: { type: String },
      // Current request URL. Passed by digest method.
      requestUrl: { type: String },
      // Current request body. Passed by digest method.
      requestBody: { type: String },
      /**
       * Whether or not the element is invalid. The validation state changes
       * when settings change or when the `validate()` function is called.
       */
      invalid: { type: Boolean, reflect: true }
    };
  }

  get security() {
    return this._security;
  }

  set security(value) {
    const old = this._security;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._security = value;
    this.requestUpdate();
    this._processModel();
  }

  /**
   * @return {Array<String>|null} List of authorization methods to be rendered
   */
  get selectedMethods() {
    const { selected, methods } = this;
    const method = (methods || [])[selected];
    return method ? method.types : null;
  }

  /**
   * @return {Array<Object>|null} List of authorization schemes
   */
  get selectedSchemes() {
    const { selected, methods } = this;
    const method = (methods || [])[selected];
    return method ? method.schemes : null;
  }

  /**
   * In effect the same as calling the `serialize()` method
   * @return {Array<AuthorizationSettings>} List of authorization settings.
   */
  get settings() {
    return this.serialize();
  }

  /**
   * @return {Function} Previously registered handler for `changed` event
   */
  get onchange() {
    return this._onchange;
  }

  /**
   * Registers a callback function for `changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onchange(value) {
    if (this._onchange) {
      this.removeEventListener('change', this._onchange);
    }
    if (typeof value !== 'function') {
      this._onchange = null;
      return;
    }
    this._onchange = value;
    this.addEventListener('change', this._onchange);
  }

  constructor() {
    super();
    // for types
    this._security = null;
    this.redirectUri = null;
    this.compatibility = false;
    this.outlined = false;
  }

  /**
   * Creates a list of configuration by calling the `serialize()` function on each
   * currently rendered authorization form.
   *
   * @return {Array<AuthorizationSettings>} List of authorization settings.
   */
  serialize() {
    const nodes = this.shadowRoot.querySelectorAll('api-authorization-method');
    const result = [];
    for (let i = 0, len = nodes.length; i < len; i++) {
      result.push(this._createSettings(nodes[i]));
    }
    return result;
  }

  /**
   * Validates state of the editor. It sets `invalid` property when called.
   *
   * Exception: OAuth 2 form reports valid even when the `accessToken` is not
   * set. This adjust for this and reports invalid when `accessToken` for OAuth 2
   * is missing.
   *
   * @return {Boolean} True when the form has valid data.
   */
  validate() {
    const nodes = this.shadowRoot.querySelectorAll('api-authorization-method');
    let valid = true;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const node = nodes[i];
      const result = node.validate();
      if (!result) {
        valid = result;
        break;
      } else if (node.type === 'oauth 2' && !node.accessToken) {
        valid = false;
        break;
      }
    }
    this.invalid = !valid;
    return valid;
  }

  /**
   * Executes `authorize()` method on each auth method currently rendered.
   *
   * @param {Boolean} validate By default validation is not performed before calling
   * the `authorize()` method. Set this property to enable validation. The `authorize()`
   * function then won't be called if the form is not valid.
   * @return {Boolean} True if at least one function call returned `true`
   */
  forceAuthorization(validate=false) {
    let result = false;
    const nodes = this.shadowRoot.querySelectorAll('api-authorization-method');
    for (let i = 0, len = nodes.length; i < len; i++) {
      if (validate) {
        if (!nodes[i].validate()) {
          continue;
        }
      }
      const nodeResult = nodes[i].authorize();
      if (!result && nodeResult) {
        result = nodeResult;
      }
    }
    return result;
  }

  /**
   * Creates an authorization settings object for passed authorization panel.
   * @param {Node} target api-authorization-method instance
   * @return {AuthorizationSettings}
   */
  _createSettings(target) {
    const settings = target.serialize();
    let valid = target.validate();
    const { type } = target;
    if (type === 'oauth 2' && !settings.accessToken) {
      valid = false;
    }
    return {
      type,
      valid,
      settings,
    };
  }

  /**
   * A function called when the `security` property change.
   * It calls `_applyModel()` in a debouncer so `amf` should be set regardles
   * of the order of applying the model and security.
   */
  _processModel() {
    /* istanbul ignore if */
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

  /**
   * Reads list of authorization methods from the model.
   * This function resets current selection.
   */
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
      /* istanbul ignore if */
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
        /* istanbul ignore if */
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
    /* istanbul ignore if */
    if (!scheme1) {
      return [];
    }
    let type = this._getValue(scheme1, sec.type);
    if (type === 'http') {
      const settings = this._ensureArray(scheme1[setKey]);
      /* istanbul ignore if */
      if (!settings) {
        return [];
      }
      type = this._getValue(settings[0], sec.scheme);
    }
    return [type, name]
  }

  /**
   * Handler for authorization method change.
   * The setter for the `selected` computes current method to render.
   *
   * @param {Event} e
   */
  _selectionHandler(e) {
    this.selected = e.target.selected;
  }

  /**
   * A function called each time anything change in the editor.
   * Revalidates the component and dispatches `change` event.
   */
  _changeHandler() {
    this.validate();
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * Creates a map of parameters to be applied to the request.
   * This is a convenience method to gather request parameters for current request.
   * @return {AuthorizationParams}
   */
  createAuthParams() {
    const { settings } = this;
    const target = {
      headers: {},
      params: {},
      cookies: {},
    };
    for (let i = 0, len = settings.length; i < len; i++) {
      const auth = settings[i];
      this._applyAuthParams(auth, target);
    }
    return target;
  }

  /**
   * Collects parameters for an authorization method.
   * @param {AuthorizationSettings} auth
   * @param {Object} target An object to apply values.
   */
  _applyAuthParams(auth, target) {
    switch (auth.type) {
      case 'basic':
        this._applyBasicParams(auth, target);
        break;
      case 'pass through':
        this._applyPtParams(auth, target);
        break;
      case 'oauth 2':
        this._applyOa2Params(auth, target);
        break;
      case 'bearer':
        this._applyBearerParams(auth, target);
        break;
      case 'api key':
        this._applyApiKeyParams(auth, target);
        break;
      case 'custom':
        this._applyRamlCustomParams(auth, target);
        break;
    }
  }

  /**
   * Collects parameters for Basic method.
   * @param {AuthorizationSettings} auth
   * @param {Object} target An object to apply values.
   */
  _applyBasicParams(auth, target) {
    if (!auth.valid) {
      return;
    }
    const { settings } = auth;
    const { username, password } = settings;
    const hash = btoa(`${username}:${password}`);
    const value = `Basic ${hash}`;
    if (target.headers.authorization) {
      target.headers.authorization += `, ${value}`;
    } else {
      target.headers.authorization = value;
    }
  }

  /**
   * Applies values to the headers object.
   * @param {Object} headers Map of headers
   * @param {Object} target The target object to apply values to
   */
  _applyHeaderParams(headers, target) {
    const keys = Object.keys(headers);
    if (!keys.length) {
      return;
    }
    keys.forEach((key) => {
      const value = headers[key];
      if (value === undefined) {
        return;
      }
      if (target.headers[key]) {
        target.headers[key] += `, ${value}`;
      } else {
        target.headers[key] = value;
      }
    });
  }

  /**
   * Applies values to the query parameters object.
   * @param {Object} params Map of parameters
   * @param {Object} target The target object to apply values to
   */
  _applyQueryParams(params, target) {
    const keys = Object.keys(params);
    if (!keys.length) {
      return;
    }
    keys.forEach((key) => {
      const value = params[key];
      if (value === undefined) {
        return;
      }
      target.params[key] = value;
    });
  }

  /**
   * Collects parameters for Pass through method.
   * @param {AuthorizationSettings} auth
   * @param {Object} target An object to apply values.
   */
  _applyPtParams(auth, target) {
    const { settings={} } = auth;
    const { headers={}, queryParameters={} } = settings;
    this._applyHeaderParams(headers, target);
    this._applyQueryParams(queryParameters, target);
  }

  /**
   * Collects parameters for OAuth 2 method.
   * @param {AuthorizationSettings} auth
   * @param {Object} target An object to apply values.
   */
  _applyOa2Params(auth, target) {
    const { settings={} } = auth;
    const { accessToken, deliveryMethod='header', deliveryName='authorization', tokenType='Bearer' } = settings;
    if (!accessToken) {
      return;
    }
    const isHeader = deliveryMethod === 'header';
    const finalDeliveryName = isHeader ? deliveryName.toLowerCase() : deliveryName;
    const value = `${tokenType} ${accessToken}`;
    const obj = {};
    obj[finalDeliveryName] = value;
    if (isHeader) {
      this._applyHeaderParams(obj, target);
    } else {
      this._applyQueryParams(obj, target);
    }
  }

  /**
   * Collects parameters for Bearer method.
   * @param {AuthorizationSettings} auth
   * @param {Object} target An object to apply values.
   */
  _applyBearerParams(auth, target) {
    const { settings={}, valid } = auth;
    if (!valid) {
      return;
    }
    const { token } = settings;
    this._applyHeaderParams({
      authorization: `Bearer ${token}`
    }, target);
  }

  /**
   * Collects parameters for Api Key method.
   * @param {AuthorizationSettings} auth
   * @param {Object} target An object to apply values.
   */
  _applyApiKeyParams(auth, target) {
    const { settings={} } = auth;
    const { headers={}, queryParameters={} } = settings; /* , cookies={} */
    this._applyHeaderParams(headers, target);
    this._applyQueryParams(queryParameters, target);
  }

  /**
   * Collects parameters for RAML's custom scheme method.
   * @param {AuthorizationSettings} auth
   * @param {Object} target An object to apply values.
   */
  _applyRamlCustomParams(auth, target) {
    const { settings={} } = auth;
    const { headers={}, queryParameters={} } = settings;
    this._applyHeaderParams(headers, target);
    this._applyQueryParams(queryParameters, target);
  }

  render() {
    const { styles } = this;
    return html`
    <style>${styles}</style>
    ${this._selectorTemplate()}
    ${this._methodsTemplate()}
    `;
  }

  /**
   * Produces a `TemplateResult` instance for method selector.
   *
   * Is renders only a method label if there is only single method.
   *
   * @return {Object}
   */
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
      return this._singleItemTemplate(items[0]);
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

  /**
   * Renders template for the title when method selector is
   * not rendered. This happens when there's only single method to render.
   * @param {Object} auth
   * @return {TemplateResult}
   */
  _singleItemTemplate(auth) {
    const { types } = auth;
    const label = (types || []).map((item) => mapAuthName(item)).join(', ');
    return html`<div class="auth-selector-label">${label}</div>`;
  }

  /**
   * Creates a template for an authorization selector method.
   * @param {Object} item
   * @return {TemplateResult}
   */
  _selectorItem(item) {
    const { types, names } = item;
    const { compatibility } = this;
    const nLabel = (names || []).join(', ');
    return html`
    <anypoint-item
      ?compatibility="${compatibility}"
      label="${nLabel}"
    >
      <anypoint-item-body twoline>
        <div>${nLabel}</div>
        <div secondary>${(types || []).join(', ')}</div>
      </anypoint-item-body>
    </anypoint-item>`;
  }

  /**
   * @return {TemplateResult} Template for authorization methods
   * that should be rendered with current selection.
   */
  _methodsTemplate() {
    const { selectedMethods } = this;
    if (!selectedMethods) {
      return '';
    }
    const selectedSchemes = this.selectedSchemes || [];
    const renderTitles = !!selectedSchemes.length && selectedSchemes.length > 1;
    return selectedMethods.map((item, index) => this._renderMethod(item, selectedSchemes[index], renderTitles));
  }

  /**
   * Renders authorization method form.
   * @param {String} type A type of the method read from API spec. This supports both RAML and OAS vocabulary.
   * @param {Object} scheme Authorization scheme to be applied to the method
   * @param {Boolean} renderTitle Whether or not a title over the method should be rendered.
   * @return {TemplateResult|String}
   */
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

  /**
   * Renders title to be rendered above authorization method
   * @param {Object} scheme Authorization scheme to be applied to the method
   * @return {TemplateResult|String}
   */
  _methodTitleTemplate(scheme) {
    const name = this._getValue(scheme, this.ns.aml.vocabularies.core.name);
    if (!name) {
      return '';
    }
    return html`<div
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
      @change="${this._changeHandler}"
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
      httpMethod,
      requestUrl,
      requestBody,
    } = this;
    return html`
    ${renderTitle ? this._methodTitleTemplate(security) : ''}
    <api-authorization-method
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .security="${security}"
      .amf="${amf}"
      .httpMethod="${httpMethod}"
      .requestUrl="${requestUrl}"
      .requestBody="${requestBody}"
      type="digest"
      @change="${this._changeHandler}"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for Pass through authorization.
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
      @change="${this._changeHandler}"
    ></api-authorization-method>`;
  }

  /**
   * Renders a template for RAML custom authorization.
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
      @change="${this._changeHandler}"
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
      @change="${this._changeHandler}"
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
      @change="${this._changeHandler}"
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
      @change="${this._changeHandler}"
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
      @change="${this._changeHandler}"
    ></api-authorization-method>
    `;
  }
}
