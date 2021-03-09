import { BasicAuthorization, BearerAuthorization, DigestAuthorization, OAuth1Authorization, OAuth2Authorization } from "@advanced-rest-client/arc-types/src/authorization/Authorization";

/**
 * Authorization configuration for the request.
 */
export declare interface ApiAuthorizationSettings {
  /**
   * Authorization configuration
   */
  config: BasicAuthorization|BearerAuthorization|DigestAuthorization|OAuth1Authorization|OAuth2Authorization|ApiKeySettings|PassThroughSetting;
  /**
   * The name of the authorization
   */
  type: string;
  /**
   * Whether the authorization is valid.
   */
  valid: boolean;
}

export declare interface AuthorizationParams {
  headers: Record<string, string>;
  params: Record<string, string>;
  cookies: Record<string, string>;
}

export declare interface ApiKeySettings extends AuthorizationParams {
}

export declare interface PassThroughSetting {
  /**
   * List of headers to apply to the request
   */
  headers?: Record<string, string>;
  /**
   * List of query parameters to apply to the request
   */
  params?: Record<string, string>;
}

export declare interface RamlCustomSetting extends PassThroughSetting {
}

export declare interface CredentialSource {
  grantType: string
  credentials: Array<Source>
}

export declare interface Source {
  name: string
  clientId: string | undefined
  clientSecret: string | undefined
}
