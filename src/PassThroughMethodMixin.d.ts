import { AmfFormItem } from "@advanced-rest-client/arc-types/src/forms/FormTypes";
import { TemplateResult } from "lit-html";
import { PassThroughSetting } from "./types";

export declare const headersParam: unique symbol;
export declare const queryParametersParam: unique symbol;
export declare const createViewModel: unique symbol;
export declare const readParamsProperties: unique symbol;
export declare const inputHandler: unique symbol;
export declare const headersTemplate: unique symbol;
export declare const queryTemplate: unique symbol;
export declare const formListTemplate: unique symbol;
export declare const formItemTemplate: unique symbol;
export declare const toggleDocumentation: unique symbol;
export declare const formItemHelpButtonTemplate: unique symbol;
export declare const formItemHelpTemplate: unique symbol;
export declare const titleTemplate: unique symbol;
export declare const updateModelValue: unique symbol;
export declare const restoreModelValue: unique symbol;
export declare const restorePassThrough: unique symbol;
export declare const serializePassThrough: unique symbol;
export declare const validatePassThrough: unique symbol;
export declare const initializePassThroughModel: unique symbol;
export declare const renderPassThrough: unique symbol;
export declare const updateQueryParameterPassThrough: unique symbol;
export declare const updateHeaderPassThrough: unique symbol;
export declare const clearPassThrough: unique symbol;

declare function PassThroughMethodMixin<T extends new (...args: any[]) => {}>(base: T): T & PassThroughMethodMixinConstructor;
export declare interface PassThroughMethodMixinConstructor {
  new(...args: any[]): PassThroughMethodMixin;
}


export declare interface PassThroughMethodMixin {
  /**
     * Updates query parameter value, if defined in the model.
     */
    [updateQueryParameterPassThrough](name: string, newValue: string): void;

    /**
     * Updates header value, if defined in the model.
     */
    [updateHeaderPassThrough](name: string, newValue: string): void;

    /**
     * Updates header or query parameters value, if defined in the model.
     */
    [updateModelValue](type: string, name: string, newValue: string): void;

    /**
     * Restores previously serialized values
     */
    [restorePassThrough](settings: PassThroughSetting): void;

    [restoreModelValue](type: string, restored: Record<string, string>): void;

    [serializePassThrough](): PassThroughSetting;

    [clearPassThrough](): void;

    [validatePassThrough](): boolean;

    [initializePassThroughModel](): void;

    /**
     * Generates view model using the transformer.
     *
     * @param type Param type. Either `header` or `parameter`.
     */
    [createViewModel](type: string, model: any): Promise<void>;

    /**
     * Reads definition of properties for query parameters which can be either a
     * `parameter` or a `queryString`.
     *
     * @param scheme Security `scheme` model.
     * @returns A list of parameters, if any.
     */
    [readParamsProperties](scheme: any): any[]|undefined;

    /**
     * Handler for the `value-changed` event dispatched by input element.
     * Dispatches 'request-header-changed' or 'query-parameter-changed'
     * event. Other components can update their state when the value change.
     */
    [inputHandler](e: CustomEvent): void;

    [renderPassThrough](): TemplateResult;

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
    [toggleDocumentation](e: CustomEvent): void;
}
