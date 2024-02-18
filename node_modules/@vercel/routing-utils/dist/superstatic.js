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
var superstatic_exports = {};
__export(superstatic_exports, {
  collectHasSegments: () => collectHasSegments,
  convertCleanUrls: () => convertCleanUrls,
  convertHeaders: () => convertHeaders,
  convertRedirects: () => convertRedirects,
  convertRewrites: () => convertRewrites,
  convertTrailingSlash: () => convertTrailingSlash,
  getCleanUrls: () => getCleanUrls,
  sourceToRegex: () => sourceToRegex
});
module.exports = __toCommonJS(superstatic_exports);
var import_url = require("url");
var import_path_to_regexp = require("path-to-regexp");
const UN_NAMED_SEGMENT = "__UN_NAMED_SEGMENT__";
function getCleanUrls(filePaths) {
  const htmlFiles = filePaths.map(toRoute).filter((f) => f.endsWith(".html")).map((f) => ({
    html: f,
    clean: f.slice(0, -5)
  }));
  return htmlFiles;
}
function convertCleanUrls(cleanUrls, trailingSlash, status = 308) {
  const routes = [];
  if (cleanUrls) {
    const loc = trailingSlash ? "/$1/" : "/$1";
    routes.push({
      src: "^/(?:(.+)/)?index(?:\\.html)?/?$",
      headers: { Location: loc },
      status
    });
    routes.push({
      src: "^/(.*)\\.html/?$",
      headers: { Location: loc },
      status
    });
  }
  return routes;
}
function convertRedirects(redirects, defaultStatus = 308) {
  return redirects.map((r) => {
    const { src, segments } = sourceToRegex(r.source);
    const hasSegments = collectHasSegments(r.has);
    normalizeHasKeys(r.has);
    normalizeHasKeys(r.missing);
    try {
      const loc = replaceSegments(segments, hasSegments, r.destination, true);
      let status;
      if (typeof r.permanent === "boolean") {
        status = r.permanent ? 308 : 307;
      } else if (r.statusCode) {
        status = r.statusCode;
      } else {
        status = defaultStatus;
      }
      const route = {
        src,
        headers: { Location: loc },
        status
      };
      if (r.has) {
        route.has = r.has;
      }
      if (r.missing) {
        route.missing = r.missing;
      }
      return route;
    } catch (e) {
      throw new Error(`Failed to parse redirect: ${JSON.stringify(r)}`);
    }
  });
}
function convertRewrites(rewrites, internalParamNames) {
  return rewrites.map((r) => {
    const { src, segments } = sourceToRegex(r.source);
    const hasSegments = collectHasSegments(r.has);
    normalizeHasKeys(r.has);
    normalizeHasKeys(r.missing);
    try {
      const dest = replaceSegments(
        segments,
        hasSegments,
        r.destination,
        false,
        internalParamNames
      );
      const route = { src, dest, check: true };
      if (r.has) {
        route.has = r.has;
      }
      if (r.missing) {
        route.missing = r.missing;
      }
      if (r.statusCode) {
        route.status = r.statusCode;
      }
      return route;
    } catch (e) {
      throw new Error(`Failed to parse rewrite: ${JSON.stringify(r)}`);
    }
  });
}
function convertHeaders(headers) {
  return headers.map((h) => {
    const obj = {};
    const { src, segments } = sourceToRegex(h.source);
    const hasSegments = collectHasSegments(h.has);
    normalizeHasKeys(h.has);
    normalizeHasKeys(h.missing);
    const namedSegments = segments.filter((name) => name !== UN_NAMED_SEGMENT);
    const indexes = {};
    segments.forEach((name, index) => {
      indexes[name] = toSegmentDest(index);
    });
    hasSegments.forEach((name) => {
      indexes[name] = "$" + name;
    });
    h.headers.forEach(({ key, value }) => {
      if (namedSegments.length > 0 || hasSegments.length > 0) {
        if (key.includes(":")) {
          key = safelyCompile(key, indexes);
        }
        if (value.includes(":")) {
          value = safelyCompile(value, indexes);
        }
      }
      obj[key] = value;
    });
    const route = {
      src,
      headers: obj,
      continue: true
    };
    if (h.has) {
      route.has = h.has;
    }
    if (h.missing) {
      route.missing = h.missing;
    }
    return route;
  });
}
function convertTrailingSlash(enable, status = 308) {
  const routes = [];
  if (enable) {
    routes.push({
      src: "^/\\.well-known(?:/.*)?$"
    });
    routes.push({
      src: "^/((?:[^/]+/)*[^/\\.]+)$",
      headers: { Location: "/$1/" },
      status
    });
    routes.push({
      src: "^/((?:[^/]+/)*[^/]+\\.\\w+)/$",
      headers: { Location: "/$1" },
      status
    });
  } else {
    routes.push({
      src: "^/(.*)\\/$",
      headers: { Location: "/$1" },
      status
    });
  }
  return routes;
}
function sourceToRegex(source) {
  const keys = [];
  const r = (0, import_path_to_regexp.pathToRegexp)(source, keys, {
    strict: true,
    sensitive: true,
    delimiter: "/"
  });
  const segments = keys.map((k) => k.name).map((name) => {
    if (typeof name !== "string") {
      return UN_NAMED_SEGMENT;
    }
    return name;
  });
  return { src: r.source, segments };
}
const namedGroupsRegex = /\(\?<([a-zA-Z][a-zA-Z0-9]*)>/g;
const normalizeHasKeys = (hasItems = []) => {
  for (const hasItem of hasItems) {
    if ("key" in hasItem && hasItem.type === "header") {
      hasItem.key = hasItem.key.toLowerCase();
    }
  }
  return hasItems;
};
function collectHasSegments(has) {
  const hasSegments = /* @__PURE__ */ new Set();
  for (const hasItem of has || []) {
    if (!hasItem.value && "key" in hasItem) {
      hasSegments.add(hasItem.key);
    }
    if (hasItem.value) {
      for (const match of hasItem.value.matchAll(namedGroupsRegex)) {
        if (match[1]) {
          hasSegments.add(match[1]);
        }
      }
      if (hasItem.type === "host") {
        hasSegments.add("host");
      }
    }
  }
  return [...hasSegments];
}
const escapeSegment = (str, segmentName) => str.replace(new RegExp(`:${segmentName}`, "g"), `__ESC_COLON_${segmentName}`);
const unescapeSegments = (str) => str.replace(/__ESC_COLON_/gi, ":");
function replaceSegments(segments, hasItemSegments, destination, isRedirect, internalParamNames) {
  const namedSegments = segments.filter((name) => name !== UN_NAMED_SEGMENT);
  const canNeedReplacing = destination.includes(":") && namedSegments.length > 0 || hasItemSegments.length > 0 || !isRedirect;
  if (!canNeedReplacing) {
    return destination;
  }
  let escapedDestination = destination;
  const indexes = {};
  segments.forEach((name, index) => {
    indexes[name] = toSegmentDest(index);
    escapedDestination = escapeSegment(escapedDestination, name);
  });
  hasItemSegments.forEach((name) => {
    indexes[name] = "$" + name;
    escapedDestination = escapeSegment(escapedDestination, name);
  });
  const parsedDestination = (0, import_url.parse)(escapedDestination, true);
  delete parsedDestination.href;
  delete parsedDestination.path;
  delete parsedDestination.search;
  delete parsedDestination.host;
  let { pathname, hash, query, hostname, ...rest } = parsedDestination;
  pathname = unescapeSegments(pathname || "");
  hash = unescapeSegments(hash || "");
  hostname = unescapeSegments(hostname || "");
  let destParams = /* @__PURE__ */ new Set();
  const pathnameKeys = [];
  const hashKeys = [];
  const hostnameKeys = [];
  try {
    (0, import_path_to_regexp.pathToRegexp)(pathname, pathnameKeys);
    (0, import_path_to_regexp.pathToRegexp)(hash || "", hashKeys);
    (0, import_path_to_regexp.pathToRegexp)(hostname || "", hostnameKeys);
  } catch (_) {
  }
  destParams = new Set(
    [...pathnameKeys, ...hashKeys, ...hostnameKeys].map((key) => key.name).filter((val) => typeof val === "string")
  );
  pathname = safelyCompile(pathname, indexes, true);
  hash = hash ? safelyCompile(hash, indexes, true) : null;
  hostname = hostname ? safelyCompile(hostname, indexes, true) : null;
  for (const [key, strOrArray] of Object.entries(query)) {
    if (Array.isArray(strOrArray)) {
      query[key] = strOrArray.map(
        (str) => safelyCompile(unescapeSegments(str), indexes, true)
      );
    } else {
      query[key] = safelyCompile(
        unescapeSegments(strOrArray),
        indexes,
        true
      );
    }
  }
  const paramKeys = Object.keys(indexes);
  const needsQueryUpdating = (
    // we do not consider an internal param since it is added automatically
    !isRedirect && !paramKeys.some(
      (param) => !(internalParamNames && internalParamNames.includes(param)) && destParams.has(param)
    )
  );
  if (needsQueryUpdating) {
    for (const param of paramKeys) {
      if (!(param in query) && param !== UN_NAMED_SEGMENT) {
        query[param] = indexes[param];
      }
    }
  }
  destination = (0, import_url.format)({
    ...rest,
    hostname,
    pathname,
    query,
    hash
  });
  return destination.replace(/%24/g, "$");
}
function safelyCompile(value, indexes, attemptDirectCompile) {
  if (!value) {
    return value;
  }
  if (attemptDirectCompile) {
    try {
      return (0, import_path_to_regexp.compile)(value, { validate: false })(indexes);
    } catch (e) {
    }
  }
  for (const key of Object.keys(indexes)) {
    if (value.includes(`:${key}`)) {
      value = value.replace(
        new RegExp(`:${key}\\*`, "g"),
        `:${key}--ESCAPED_PARAM_ASTERISK`
      ).replace(
        new RegExp(`:${key}\\?`, "g"),
        `:${key}--ESCAPED_PARAM_QUESTION`
      ).replace(new RegExp(`:${key}\\+`, "g"), `:${key}--ESCAPED_PARAM_PLUS`).replace(
        new RegExp(`:${key}(?!\\w)`, "g"),
        `--ESCAPED_PARAM_COLON${key}`
      );
    }
  }
  value = value.replace(/(:|\*|\?|\+|\(|\)|\{|\})/g, "\\$1").replace(/--ESCAPED_PARAM_PLUS/g, "+").replace(/--ESCAPED_PARAM_COLON/g, ":").replace(/--ESCAPED_PARAM_QUESTION/g, "?").replace(/--ESCAPED_PARAM_ASTERISK/g, "*");
  return (0, import_path_to_regexp.compile)(`/${value}`, { validate: false })(indexes).slice(1);
}
function toSegmentDest(index) {
  const i = index + 1;
  return "$" + i.toString();
}
function toRoute(filePath) {
  return filePath.startsWith("/") ? filePath : "/" + filePath;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectHasSegments,
  convertCleanUrls,
  convertHeaders,
  convertRedirects,
  convertRewrites,
  convertTrailingSlash,
  getCleanUrls,
  sourceToRegex
});
