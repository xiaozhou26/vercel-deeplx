"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var append_exports = {};
__export(append_exports, {
  appendRoutesToPhase: () => appendRoutesToPhase
});
module.exports = __toCommonJS(append_exports);
var import_index = require("./index");
function appendRoutesToPhase({
  routes: prevRoutes,
  newRoutes,
  phase
}) {
  const routes = prevRoutes ? [...prevRoutes] : [];
  if (newRoutes === null || newRoutes.length === 0) {
    return routes;
  }
  let isInPhase = false;
  let insertIndex = -1;
  routes.forEach((r, i) => {
    if ((0, import_index.isHandler)(r)) {
      if (r.handle === phase) {
        isInPhase = true;
      } else if (isInPhase) {
        insertIndex = i;
        isInPhase = false;
      }
    }
  });
  if (isInPhase) {
    routes.push(...newRoutes);
  } else if (phase === null) {
    const lastPhase = routes.findIndex((r) => (0, import_index.isHandler)(r) && r.handle);
    if (lastPhase === -1) {
      routes.push(...newRoutes);
    } else {
      routes.splice(lastPhase, 0, ...newRoutes);
    }
  } else if (insertIndex > -1) {
    routes.splice(insertIndex, 0, ...newRoutes);
  } else {
    routes.push({ handle: phase });
    routes.push(...newRoutes);
  }
  return routes;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  appendRoutesToPhase
});
