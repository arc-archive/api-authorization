import { css } from 'lit-element';

export default css`
:host {
  display: block;
}

.field-value {
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: center;
}

api-form-item {
  flex: 1;
  margin: 16px 0;
}

.subtitle {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 12px 8px;
}

.section-title {
  margin: 20px 8px 0px 8px;
  display: block;
}

.docs-container {
  margin-bottom: 8px;
}

arc-marked {
  background-color: var(--inline-documentation-background-color, #FFF3E0);
  padding: 4px;
}
`;
