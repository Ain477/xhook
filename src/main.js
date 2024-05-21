import { EventEmitter } from "./misc/event-emitter";
import headers from "./misc/headers";

//patchable types
import XMLHttpRequest from "./patch/xmlhttprequest";
import fetch from "./patch/fetch";

//global state
import hooks from "./misc/hooks";
//the global hooks event emitter is also the global fhook object
//(not the best decision in hindsight)
const fhook = hooks;
fhook.EventEmitter = EventEmitter;

/**
 * Only intercept the provided domain's requests
 */
fhook.interceptOnly = [];

//modify hooks
fhook.before = function (handler, i) {
  if (handler.length < 1 || handler.length > 2) {
    throw "invalid hook";
  }
  return fhook.on("before", handler, i);
};
fhook.after = function (handler, i) {
  if (handler.length < 2 || handler.length > 3) {
    throw "invalid hook";
  }
  return fhook.on("after", handler, i);
};

//globally enable/disable
fhook.enable = function () {
  XMLHttpRequest.patch();
  fetch.patch();
};
fhook.disable = function () {
  XMLHttpRequest.unpatch();
  fetch.unpatch();
};
//expose native objects
fhook.XMLHttpRequest = XMLHttpRequest.Native;
fhook.fetch = fetch.Native;

//expose helpers
fhook.headers = headers.convert;

if (fhook.interceptOnly && fhook.interceptOnly.length > 0) {
  console.log("====================================");
  console.log("Watching with filter");
  console.log("====================================");
  fhook.disable();
  XMLHttpRequest.filterURL(fhook.interceptOnly);
  fetch.filterURL(fhook.interceptOnly);
  fhook.enable();
} else {
  console.log("====================================");
  console.log(`Watching without filter`);
  console.log("====================================");
  fhook.enable();
}

export default fhook;
