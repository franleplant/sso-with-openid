import debugFactory from "debug";
import { Issuer, custom } from "openid-client";

export * from "./middleware";
export { default as routes } from "./routes";
export * from "./session";

// A simple way of debugging openid-client requests
const debug = debugFactory("myapp");

custom.setHttpOptionsDefaults({
  headers: {
    // temporary workaround
    // for some reason the default user agent that this lib uses
    // breaks costar CA, so we need to force it to something else,
    // TODO maybe use something better than Postman's
    "User-Agent": "PostmanRuntime/7.26.5",
  },

  hooks: {
    beforeRequest: [
      (options) => {
        const { method, url, headers, body, form } = options;
        debug(`>>> Request %s %s`, method.toUpperCase(), url.href);
        debug(`Headers: %O`, headers);
        debug(`Body %O`, body || form);
      },
    ],
    afterResponse: [
      (response) => {
        const { statusCode, headers, body } = response;
        const { method, url } = response.request.options;

        debug(`<<< Response %s %s`, method.toUpperCase(), url.href);
        debug(`Status %s`, statusCode);
        debug(`Headers: %O`, headers);
        debug(`Body %O`, body);
        return response;
      },
    ],
  },
});
