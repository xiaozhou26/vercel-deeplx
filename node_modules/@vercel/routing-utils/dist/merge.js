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
var merge_exports = {};
__export(merge_exports, {
  mergeRoutes: () => mergeRoutes
});
module.exports = __toCommonJS(merge_exports);
var import_index = require("./index");
function getBuilderRoutesMapping(builds) {
  const builderRoutes = {};
  for (const { entrypoint, routes, use } of builds) {
    if (routes) {
      if (!builderRoutes[entrypoint]) {
        builderRoutes[entrypoint] = {};
      }
      builderRoutes[entrypoint][use] = routes;
    }
  }
  return builderRoutes;
}
function getCheckAndContinue(routes) {
  const checks = [];
  const continues = [];
  const others = [];
  for (const route of routes) {
    if ((0, import_index.isHandler)(route)) {
      throw new Error(
        `Unexpected route found in getCheckAndContinue(): ${JSON.stringify(
          route
        )}`
      );
    } else if (route.check && !route.override) {
      checks.push(route);
    } else if (route.continue && !route.override) {
      continues.push(route);
    } else {
      others.push(route);
    }
  }
  return { checks, continues, others };
}
function mergeRoutes({ userRoutes, builds }) {
  const userHandleMap = /* @__PURE__ */ new Map();
  let userPrevHandle = null;
  (userRoutes || []).forEach((route) => {
    if ((0, import_index.isHandler)(route)) {
      userPrevHandle = route.handle;
    } else {
      const routes = userHandleMap.get(userPrevHandle);
      if (!routes) {
        userHandleMap.set(userPrevHandle, [route]);
      } else {
        routes.push(route);
      }
    }
  });
  const builderHandleMap = /* @__PURE__ */ new Map();
  const builderRoutes = getBuilderRoutesMapping(builds);
  const sortedPaths = Object.keys(builderRoutes).sort();
  sortedPaths.forEach((path) => {
    const br = builderRoutes[path];
    const sortedBuilders = Object.keys(br).sort();
    sortedBuilders.forEach((use) => {
      let builderPrevHandle = null;
      br[use].forEach((route) => {
        if ((0, import_index.isHandler)(route)) {
          builderPrevHandle = route.handle;
        } else {
          const routes = builderHandleMap.get(builderPrevHandle);
          if (!routes) {
            builderHandleMap.set(builderPrevHandle, [route]);
          } else {
            routes.push(route);
          }
        }
      });
    });
  });
  const outputRoutes = [];
  const uniqueHandleValues = /* @__PURE__ */ new Set([
    null,
    ...userHandleMap.keys(),
    ...builderHandleMap.keys()
  ]);
  for (const handle of uniqueHandleValues) {
    const userRoutes2 = userHandleMap.get(handle) || [];
    const builderRoutes2 = builderHandleMap.get(handle) || [];
    const builderSorted = getCheckAndContinue(builderRoutes2);
    if (handle !== null && (userRoutes2.length > 0 || builderRoutes2.length > 0)) {
      outputRoutes.push({ handle });
    }
    outputRoutes.push(...builderSorted.continues);
    outputRoutes.push(...userRoutes2);
    outputRoutes.push(...builderSorted.checks);
    outputRoutes.push(...builderSorted.others);
  }
  return outputRoutes;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mergeRoutes
});
