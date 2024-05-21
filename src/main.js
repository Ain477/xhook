import { EventEmitter } from "./misc/event-emitter";
import headers from "./misc/headers";

//patchable types
import XMLHttpRequest from "./patch/xmlhttprequest";
import fetch from "./patch/fetch";

//global state
import hooks from "./misc/hooks";
//the global hooks event emitter is also the global xhook object
//(not the best decision in hindsight)
const xhook = hooks;
xhook.EventEmitter = EventEmitter;

/**
 * Only intercept the provided domain's requests
 */
xhook.interceptOnly = [];

//modify hooks
xhook.before = function (handler, i) {
  if (handler.length < 1 || handler.length > 2) {
    throw "invalid hook";
  }
  return xhook.on("before", handler, i);
};
xhook.after = function (handler, i) {
  if (handler.length < 2 || handler.length > 3) {
    throw "invalid hook";
  }
  return xhook.on("after", handler, i);
};

//globally enable/disable
xhook.enable = function () {
  XMLHttpRequest.patch();
  fetch.patch();
};
xhook.disable = function () {
  XMLHttpRequest.unpatch();
  fetch.unpatch();
};
//expose native objects
xhook.XMLHttpRequest = XMLHttpRequest.Native;
xhook.fetch = fetch.Native;

//expose helpers
xhook.headers = headers.convert;

if (xhook.interceptOnly && xhook.interceptOnly.length > 0) {
  console.log("====================================");
  console.log("Watching with filter");
  console.log("====================================");
  xhook.disable();
  XMLHttpRequest.filterURL(xhook.interceptOnly);
  fetch.filterURL(xhook.interceptOnly);
  xhook.enable();
} else {
  console.log("====================================");
  console.log(`Watching without filter`);
  console.log("====================================");
  xhook.enable();
}

export default xhook;
