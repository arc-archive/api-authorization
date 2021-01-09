export declare const initializeOauth1Model: unique symbol;
export declare const preFillAmfData: unique symbol;

declare function ApiOauth1MethodMixin<T extends new (...args: any[]) => {}>(base: T): T & ApiOauth1MethodMixinConstructor;
export declare interface ApiOauth1MethodMixinConstructor {
  new(...args: any[]): ApiOauth1MethodMixin;
}


export declare interface ApiOauth1MethodMixin {
  [initializeOauth1Model](): void;

  /**
   * Reads API security definition and applies in to the view as predefined
   * values.
   *
   * @param model AMF model describing settings of the security scheme
   */
  [preFillAmfData](model: any): void;
}