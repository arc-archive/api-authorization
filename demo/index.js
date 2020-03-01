import { html, LitElement } from 'lit-element';
import { ApiDemoPageBase } from '@advanced-rest-client/arc-demo-helper/ApiDemoPage.js';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@advanced-rest-client/oauth-authorization/oauth2-authorization.js';
import '@advanced-rest-client/oauth-authorization/oauth1-authorization.js';
import '@api-components/api-navigation/api-navigation.js';
import '../api-authorization.js';

class DemoElement extends AmfHelperMixin(LitElement) {}
window.customElements.define('demo-element', DemoElement);

class DemoPage extends ApiDemoPageBase {
  constructor() {
    super();
    this.initObservableProperties([
      'demoState',
      'compatibility',
      'outlined',
      'security',
    ]);
    this._componentName = 'api-authorization';
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this.demoState = 0;
    this.oauth2redirect = 'http://auth.advancedrestclient.com/arc.html';
    this.authorizationUri = `${location.protocol}//${location.host}${location.pathname}oauth-authorize.html`;

    this._demoStateHandler = this._demoStateHandler.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
  }

  _toggleMainOption(e) {
    const { name, checked } = e.target;
    this[name] = checked;
  }

  _demoStateHandler(e) {
    const state = e.detail.value;
    this.demoState = state;
    this.outlined = state === 1;
    this.compatibility = state === 2;
  }

  get helper() {
    if (!this.__helper) {
      this.__helper = document.getElementById('helper');
    }
    return this.__helper;
  }

  _navChanged(e) {
    const { selected, type } = e.detail;
    this.mainChangesCounter = 0;
    if (type === 'method') {
      this.setData(selected);
      this.hasData = true;
    } else {
      this.hasData = false;
    }
  }

  setData(selected) {
    const helper = this.helper;
    const sec = helper.ns.aml.vocabularies.security;
    const webApi = helper._computeWebApi(this.amf);
    const method = helper._computeMethodModel(webApi, selected);
    const key = helper._getAmfKey(sec.security);
    const security = helper._ensureArray(method[key]);
    this.security = security;
  }

  _apiListTemplate() {
    return [
      ['demo-api', 'Demo API'],
      ['oas-demo', 'OAS Demo API'],
      ['api-keys', 'API key'],
      ['oauth-flows', 'OAS OAuth Flow'],
      ['oas-bearer', 'OAS Bearer'],
    ].map(([file, label]) => html`
      <paper-item data-src="${file}-compact.json">${label} - compact model</paper-item>
      <paper-item data-src="${file}.json">${label}</paper-item>
      `);
  }


  _demoTemplate() {
    const {
      demoStates,
      darkThemeActive,
      compatibility,
      outlined,
      security,
      amf,
      demoState,
      oauth2redirect,
    } = this;
    return html`
      <section class="documentation-section">
        <h3>Interactive demo</h3>
        <p>
          This demo lets you preview the API authorization element with various
          configuration options.
        </p>
        <arc-interactive-demo
          .states="${demoStates}"
          .selectedState="${demoState}"
          @state-chanegd="${this._demoStateHandler}"
          ?dark="${darkThemeActive}"
        >

          <api-authorization
            ?compatibility="${compatibility}"
            ?outlined="${outlined}"
            .security="${security}"
            .amf="${amf}"
            .redirectUri="${oauth2redirect}"
            slot="content"
          ></api-authorization>

        </arc-interactive-demo>
      </section>
    `;
  }

  contentTemplate() {
    const { amf } = this;
    return html`
      <oauth2-authorization></oauth2-authorization>
      <oauth1-authorization></oauth1-authorization>
      <demo-element id="helper" .amf="${amf}"></demo-element>

      <h2>API authorization</h2>
      ${this._demoTemplate()}
    `;
  }
}

const instance = new DemoPage();
instance.render();
window._demo = instance;
