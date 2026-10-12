/**
 * PubSub topics the host (frontcontainer) subscribes to. Remotes talk to the
 * host only through these topics (pubsub-js, shared window-level bus).
 *
 * | Topic            | Payload                    | Host reaction                     |
 * |------------------|----------------------------|-----------------------------------|
 * | loading          | boolean                    | shows/hides the global loader     |
 * | error            | string or error payload    | error toast                       |
 * | success          | string                     | success toast                     |
 * | warning          | string                     | warning toast                     |
 * | info             | string                     | info toast                        |
 * | login-redirect   | boolean                    | post-login navigation             |
 * | clearBreadCrumb  | boolean                    | clears the breadcrumb             |
 */
export enum PubSubTopic {
  LOADING = 'loading',
  ERROR = 'error',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
  LOGIN_REDIRECT = 'login-redirect',
  CLEAR_BREADCRUMB = 'clearBreadCrumb',
}
