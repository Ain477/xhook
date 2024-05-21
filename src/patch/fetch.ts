import { windowRef } from "../misc/window";
import hooks from "../misc/hooks";

interface InterceptReqOptions extends Omit<RequestInit, "window"> {
  url?: URL | string;
  isFetch?: boolean;
  acceptedRequest?: boolean;
}

//browser's fetch
const Native: typeof fetch = windowRef.fetch;
let interceptOnly: string[] = [];

function copyToObjFromRequest(req: Request): any {
  const copyedKeys = [
    "method",
    "headers",
    "body",
    "mode",
    "credentials",
    "cache",
    "redirect",
    "referrer",
    "referrerPolicy",
    "integrity",
    "keepalive",
    "signal",
    "url",
  ];
  let copyedObj = {};
  copyedKeys.forEach(key => (copyedObj[key] = req[key]));
  return copyedObj;
}

function covertHeaderToPlainObj(headers: RequestInit["headers"]) {
  if (headers instanceof Headers) {
    return covertTDAarryToObj([...headers.entries()]);
  }
  if (Array.isArray(headers)) {
    return covertTDAarryToObj(headers);
  }
  return headers;
}

function covertTDAarryToObj<T extends [any, any][]>(input: T) {
  return input.reduce((prev, [key, value]) => {
    prev[key] = value;
    return prev;
  }, {});
}

/**
 * if fetch(hacked by fhook) accept a Request as a first parameter, it will be destructed to a plain object.
 * Finally the whole network request was convert to fetch(Request.url, other options)
 */
const fhook: typeof fetch = function (input, init = { headers: {} }) {
  let options: InterceptReqOptions = { ...init, isFetch: true };

  if (input instanceof Request) {
    const requestObj = copyToObjFromRequest(input);
    const prevHeaders = {
      ...covertHeaderToPlainObj(requestObj.headers),
      ...covertHeaderToPlainObj(options.headers),
    };
    options = {
      ...requestObj,
      ...init,
      headers: prevHeaders,
      acceptedRequest: true,
    };
  } else {
    options.url = input;
  }

  if (options.url) {
    const match = interceptOnly.find(u => u.includes(options.url.toString()));
    if (!match) {
      const { url, ...rest } = options;
      return Native(url, rest);
    }
  }

  const beforeHooks = hooks.listeners("before");
  const afterHooks = hooks.listeners("after");

  return new Promise(function (resolve, reject) {
    let fullfiled = resolve;

    const processAfter = function (response) {
      if (!afterHooks.length) {
        return fullfiled(response);
      }

      const hook = afterHooks.shift();

      if (hook.length === 2) {
        hook(options, response);
        return processAfter(response);
      } else if (hook.length === 3) {
        return hook(options, response, processAfter);
      } else {
        return processAfter(response);
      }
    };

    const done = function (userResponse) {
      if (userResponse !== undefined) {
        const response = new Response(
          userResponse.body || userResponse.text,
          userResponse
        );
        resolve(response);
        processAfter(response);
        return;
      }

      //continue processing until no hooks left
      processBefore();
    };

    const processBefore = function () {
      if (!beforeHooks.length) {
        send();
        return;
      }

      const hook = beforeHooks.shift();

      if (hook.length === 1) {
        return done(hook(options));
      } else if (hook.length === 2) {
        return hook(options, done);
      }
    };

    const send = async () => {
      const { url, isFetch, acceptedRequest, ...restInit } = options;
      if (input instanceof Request && restInit.body instanceof ReadableStream) {
        restInit.body = await new Response(restInit.body).text();
      }
      return Native(url, restInit)
        .then(response => processAfter(response))
        .catch(function (err) {
          fullfiled = reject;
          processAfter(err);
          return reject(err);
        });
    };

    processBefore();
  });
};

//patch interface
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  filterURL(urls: string[]) {
    interceptOnly = urls;
  },
  patch() {
    if (Native) {
      windowRef.fetch = fhook;
    }
  },
  unpatch() {
    if (Native) {
      windowRef.fetch = Native;
    }
  },
  Native,
  fhook,
};
