/**
 * Represents the cookie's 'SameSite' status:
 * https://tools.ietf.org/html/draft-west-first-party-cookies
 *
 * @public
 */
export type CookieSameSite = 'Strict' | 'Lax' | 'None';

/**
 * Represents the cookie's 'Priority' status:
 * https://tools.ietf.org/html/draft-west-cookie-priority-00
 *
 * @public
 */
export type CookiePriority = 'Low' | 'Medium' | 'High';

/**
 * Represents the source scheme of the origin that originally set the cookie. A value of
 * "Unset" allows protocol clients to emulate legacy cookie scope for the scheme.
 * This is a temporary ability and it will be removed in the future.
 *
 * @public
 */
export type CookieSourceScheme = 'Unset' | 'NonSecure' | 'Secure';

/**
 * Represents a cookie object.
 *
 * @public
 */
export interface Cookie {
  /**
   * Cookie name.
   */
  name: string;
  /**
   * Cookie value.
   */
  value: string;
  /**
   * Cookie domain.
   */
  domain: string;
  /**
   * Cookie path.
   */
  path: string;
  /**
   * Cookie expiration date as the number of seconds since the UNIX epoch. Set to `-1` for
   * session cookies
   */
  expires: number;
  /**
   * Cookie size.
   */
  size: number;
  /**
   * True if cookie is http-only.
   */
  httpOnly: boolean;
  /**
   * True if cookie is secure.
   */
  secure: boolean;
  /**
   * True in case of session cookie.
   */
  session: boolean;
  /**
   * Cookie SameSite type.
   */
  sameSite?: CookieSameSite;
  /**
   * Cookie Priority
   */
  priority?: CookiePriority;
  /**
   * True if cookie is SameParty.
   */
  sameParty?: boolean;
  /**
   * Cookie source scheme type.
   */
  sourceScheme?: CookieSourceScheme;
  /**
   * Cookie source port. Valid values are \{-1, [1, 65535]\}, -1 indicates an unspecified
   * port. An unspecified port value allows protocol clients to emulate legacy cookie
   * scope for the port. This is a temporary ability and it will be removed in the future.
   */
  sourcePort?: number;
  /**
   * Cookie partition key. The site of the top-level URL the browser was visiting at the
   * start of the request to the endpoint that set the cookie.
   */
  partitionKey?: string;
  /**
   * True if cookie partition key is opaque.
   */
  partitionKeyOpaque?: boolean;
}
