import { TemplateResult } from "lit-html";
import { AmfFormItem } from "@advanced-rest-client/arc-types/src/forms/FormTypes";
import { RamlCustomSetting } from './types';

export declare const initializeCustomModel: unique symbol;
export declare const renderCustom: unique symbol;
export declare const validateCustom: unique symbol;
export declare const serializeCustom: unique symbol;
export declare const restoreCustom: unique symbol;
export declare const updateQueryParameterCustom: unique symbol;
export declare const updateHeaderCustom: unique symbol;
export declare const clearCustom: unique symbol;
export declare const createViewModel: unique symbol;
export declare const readParamsProperties: unique symbol;
export declare const headersTemplate: unique symbol;
export declare const queryTemplate: unique symbol;
export declare const formListTemplate: unique symbol;
export declare const formItemTemplate: unique symbol;
export declare const toggleDocumentation: unique symbol;
export declare const formItemHelpButtonTemplate: unique symbol;
export declare const formItemHelpTemplate: unique symbol;
export declare const inputHandler: unique symbol;
export declare const headersParam: unique symbol;
export declare const queryParametersParam: unique symbol;
export declare const titleTemplate: unique symbol;
export declare const updateModelValue: unique symbol;
export declare const restoreModelValue: unique symbol;

declare function CustomMethodMixin<T extends new (...args: any[]) => {}>(base: T): T & CustomMethodMixinConstructor;
export declare interface CustomMethodMixinConstructor {
  new(...args: any[]): CustomMethodMixin;
}


export declare interface CustomMethodMixin {
  /**
     * Updates query parameter value, if defined in the model.
     */
    [updateQueryParameterCustom](name: string, newValue: string): void;

    /**
     * Updates header value, if defined in the model.
     */
    [updateHeaderCustom](name: string, newValue: string): void;

    /**
     * Updates header or query parameters value, if defined in the model.
     */
    [updateModelValue](type: string, name: string, newValue: string): void;

    /**
     * Restores previously serialized values
     */
    [restoreCustom](settings: RamlCustomSetting): void;

    [restoreModelValue](type: string, restored: RamlCustomSetting): void;

    [clearCustom](): void;

    [serializeCustom](): RamlCustomSetting;

    [validateCustom]():boolean;
    [initializeCustomModel](): void;

    /**
     * Generates view model using the transformer.
     */
    [createViewModel](type: string, model: any): Promise<void>;

    /**
     * Reads definition of properties for query parameters which can be either a
     * `parameter` or a `queryString`.
     *
     * @param scheme Security `scheme` model.
     * @return A list of parameters, if any.
     */
    [readParamsProperties](scheme: any): any[]|undefined;

    /**
     * Handler for the `value-changed` event dispatched by input element.
     * Dispatches 'request-header-changed' or 'query-parameter-changed'
     * event. Other components can update their state when the value change.
     */
    [inputHandler](e: CustomEvent): void;

    [renderCustom](): TemplateResult|string;

    [titleTemplate](): TemplateResult|string;

    [headersTemplate](): TemplateResult|string;

    [queryTemplate](): TemplateResult|string;

    /**
     * Returns a TemplateResult for form items.
     * @param items List of form items to render
     * @param type Items type. Either `query` or `header`
     */
    [formListTemplate](items: AmfFormItem[], type: string): TemplateResult|string;

    /**
     * Returns a TemplateResult for a form input item
     */
    [formItemTemplate](item: AmfFormItem, index: number, outlined: boolean, compatibility: boolean, readOnly: boolean, disabled: boolean, type: string): TemplateResult;

    /**
     * Returns a TemplateResult for docs toggle icon for a form item when the item has docs.
     */
    [formItemHelpButtonTemplate](hasDocs: boolean, type: string, index: number): TemplateResult|string;
    
    /**
     * Returns a TemplateResult for docs for a form item when the item has docs and is opened.
     */
    [formItemHelpTemplate](hasDocs: boolean, opened: boolean, docs: string): TemplateResult|string;

    /**
     * Toggles documentation for custom property.
     */
    [toggleDocumentation](e: Event): void;
}
