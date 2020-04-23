import { html } from 'lit-element';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@advanced-rest-client/oauth-authorization/oauth2-authorization.js';
import '@advanced-rest-client/oauth-authorization/oauth1-authorization.js';
import '../api-authorization.js';

class DemoPage extends ApiDemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'demoState',
      'compatibility',
      'outlined',
      'security',
    ]);
    this.componentName = 'api-authorization';
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this.demoState = 0;
    this.oauth2redirect = 'http://auth.advancedrestclient.com/arc.html';
    this.authorizationUri = `${location.protocol}//${location.host}${location.pathname}oauth-authorize.html`;
  }

  _demoStateHandler(e) {
    const state = e.detail.value;
    this.demoState = state;
    this.outlined = state === 1;
    this.compatibility = state === 2;
    this._updateCompatibility();
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
    const sec = this.ns.aml.vocabularies.security;
    const webApi = this._computeWebApi(this.amf);
    const method = this._computeMethodModel(webApi, selected);
    const key = this._getAmfKey(sec.security);
    const security = this._ensureArray(method[key]);
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
      <anypoint-item data-src="${file}-compact.json">${label} - compact model</anypoint-item>
      <anypoint-item data-src="${file}.json">${label}</anypoint-item>
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
    return html`
      <oauth2-authorization></oauth2-authorization>
      <oauth1-authorization></oauth1-authorization>

      <h2>API authorization</h2>
      ${this._demoTemplate()}
    `;
  }
}

const instance = new DemoPage();
instance.render();
window._demo = instance;
