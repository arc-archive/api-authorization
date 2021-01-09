import { AmfFormItem } from "@advanced-rest-client/arc-types/src/forms/FormTypes";
import { TemplateResult } from "lit-html";
import { ApiKeySettings } from "./types";

export const restoreApiKey: unique symbol;
export const serializeApiKey: unique symbol;
export const validateApiKey: unique symbol;
export const initializeApiKeyModel: unique symbol;
export const renderApiKey: unique symbol;
export const updateQueryParameterApiKey: unique symbol;
export const updateHeaderApiKey: unique symbol;
export const updateCookieApiKey: unique symbol;
export const clearApiKey: unique symbol;
declare const createViewModel: unique symbol;
declare const headersParam: unique symbol;
declare const queryParam: unique symbol;
declare const cookiesParam: unique symbol;
declare const titleTemplate: unique symbol;
declare const headersTemplate: unique symbol;
declare const queryTemplate: unique symbol;
declare const cookieTemplate: unique symbol;
declare const formListTemplate: unique symbol;
declare const formItemTemplate: unique symbol;
declare const inputHandler: unique symbol;
declare const restoreModelValue: unique symbol;
declare const updateModelValue: unique symbol;

declare function ApiKeyMethodMixin<T extends new (...args: any[]) => {}>(base: T): T & ApiKeyMethodMixinConstructor;
export declare interface ApiKeyMethodMixinConstructor {
  new(...args: any[]): ApiKeyMethodMixin;
}


export declare interface ApiKeyMethodMixin {
  /**
   * Clears previously set values in the cache storage.
   */
  clearApiKeyCache(): void;
  /**
   * Updates query parameter value, if defined in the model.
   * @param name
   * @param newValue
   */
  [updateQueryParameterApiKey](name: string, newValue: string): void;

  /**
   * Updates header value, if defined in the model.
   * @param name
   * @param newValue
   */
  [updateHeaderApiKey](name: string, newValue: string): void;

  /**
   * Updates cookie value, if defined in the model.
   * @param name
   * @param newValue
   */
  [updateCookieApiKey](name: string, newValue: string): void;

  /**
   * Updates header or query parameters value, if defined in the model.
   * @param model Current model for the parameter
   */
  [updateModelValue](model: AmfFormItem[], name: string, newValue: string): void;

  /**
   * Restores previously serialized values
   */
  [restoreApiKey](settings: ApiKeySettings): void;

  /**
   * Restores previously serialized values on a model
   * @param model The model to add values to
   * @param restored Previously serialized values
   */
  [restoreModelValue](model: AmfFormItem[], restored: Record<string, string>): void;

  /**
   * Serializes current values to a settings object
   */
  [serializeApiKey](): ApiKeySettings;

  [clearApiKey](): void;

  /**
   * Performs a validation of current form.
   * By calling this function invalid field are going to be marked as invalid.
   *
   * In the implementation it calls `validate()` function on each input element
   * that is inserted into the DOM.
   */
  [validateApiKey](): boolean;

  /**
   * Processes AMF model and generates the view.
   *
   * Note, this function clears previously set parameters.
   */
  [initializeApiKeyModel](): Promise<void>;

  /**
   * Generates view model for Api Key method.
   */
  [createViewModel](model: any): void;

  /**
   * Handler for the `value-changed` event dispatched by input element.
   * Dispatches 'request-header-changed' or 'query-parameter-changed'
   * event. Other components can update their state when the value change.
   */
  [inputHandler](e: CustomEvent): void;

  /**
   * Method that renders the view for Api Key security scheme
   */
  [renderApiKey](): TemplateResult;

  /**
   * Method that renders scheme's title
   */
  [titleTemplate](): TemplateResult;

  /**
   * Method that renders headers, if any
   *
   * @return Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  [headersTemplate](): TemplateResult;

  /**
   * Method that renders query parameters, if any
   *
   * @return Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  [queryTemplate](): TemplateResult;

  /**
   * Method that renders cookies, if any
   *
   * @return Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  [cookieTemplate](): TemplateResult;

  /**
   * Returns a TemplateResult for form items.
   * @param items List of form items to render
   * @param type Items type. Either `query` or `header`
   */
  [formListTemplate](items: AmfFormItem[], type: string): TemplateResult|string;

  [formItemTemplate](item: AmfFormItem, index: number, outlined: boolean, compatibility: boolean, readOnly: boolean, disabled: boolean, type: string): TemplateResult;
}
