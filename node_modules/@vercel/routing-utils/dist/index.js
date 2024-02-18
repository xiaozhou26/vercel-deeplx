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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  appendRoutesToPhase: () => import_append.appendRoutesToPhase,
  getCleanUrls: () => import_superstatic2.getCleanUrls,
  getTransformedRoutes: () => getTransformedRoutes,
  isHandler: () => isHandler,
  isValidHandleValue: () => isValidHandleValue,
  mergeRoutes: () => import_merge.mergeRoutes,
  normalizeRoutes: () => normalizeRoutes
});
module.exports = __toCommonJS(src_exports);
var import_url = require("url");
var import_superstatic = require("./superstatic");
var import_append = require("./append");
var import_merge = require("./merge");
__reExport(src_exports, require("./schemas"), module.exports);
var import_superstatic2 = require("./superstatic");
__reExport(src_exports, require("./types"), module.exports);
const VALID_HANDLE_VALUES = [
  "filesystem",
  "hit",
  "miss",
  "rewrite",
  "error",
  "resource"
];
const validHandleValues = new Set(VALID_HANDLE_VALUES);
function isHandler(route) {
  return typeof route.handle !== "undefined";
}
function isValidHandleValue(handle) {
  return validHandleValues.has(handle);
}
function normalizeRoutes(inputRoutes) {
  if (!inputRoutes || inputRoutes.length === 0) {
    return { routes: inputRoutes, error: null };
  }
  const routes = [];
  const handling = [];
  const errors = [];
  inputRoutes.forEach((r, i) => {
    const route = { ...r };
    routes.push(route);
    const keys = Object.keys(route);
    if (isHandler(route)) {
      const { handle } = route;
      if (keys.length !== 1) {
        const unknownProp = keys.find((prop) => prop !== "handle");
        errors.push(
          `Route at index ${i} has unknown property \`${unknownProp}\`.`
        );
      } else if (!isValidHandleValue(handle)) {
        errors.push(
          `Route at index ${i} has unknown handle value \`handle: ${handle}\`.`
        );
      } else if (handling.includes(handle)) {
        errors.push(
          `Route at index ${i} is a duplicate. Please use one \`handle: ${handle}\` at most.`
        );
      } else {
        handling.push(handle);
      }
    } else if (route.src) {
      if (!route.src.startsWith("^")) {
        route.src = `^${route.src}`;
      }
      if (!route.src.endsWith("$")) {
        route.src = `${route.src}$`;
      }
      route.src = route.src.replace(/\\\//g, "/");
      const regError = checkRegexSyntax("Route", i, route.src);
      if (regError) {
        errors.push(regError);
      }
      const handleValue = handling[handling.length - 1];
      if (handleValue === "hit") {
        if (route.dest) {
          errors.push(
            `Route at index ${i} cannot define \`dest\` after \`handle: hit\`.`
          );
        }
        if (route.status) {
          errors.push(
            `Route at index ${i} cannot define \`status\` after \`handle: hit\`.`
          );
        }
        if (!route.continue) {
          errors.push(
            `Route at index ${i} must define \`continue: true\` after \`handle: hit\`.`
          );
        }
      } else if (handleValue === "miss") {
        if (route.dest && !route.check) {
          errors.push(
            `Route at index ${i} must define \`check: true\` after \`handle: miss\`.`
          );
        } else if (!route.dest && !route.continue) {
          errors.push(
            `Route at index ${i} must define \`continue: true\` after \`handle: miss\`.`
          );
        }
      }
    } else {
      errors.push(
        `Route at index ${i} must define either \`handle\` or \`src\` property.`
      );
    }
  });
  const error = errors.length > 0 ? createError(
    "invalid_route",
    errors,
    "https://vercel.link/routes-json",
    "Learn More"
  ) : null;
  return { routes, error };
}
function checkRegexSyntax(type, index, src) {
  try {
    new RegExp(src);
  } catch (err) {
    const prop = type === "Route" ? "src" : "source";
    return `${type} at index ${index} has invalid \`${prop}\` regular expression "${src}".`;
  }
  return null;
}
function checkPatternSyntax(type, index, {
  source,
  destination,
  has
}) {
  let sourceSegments = /* @__PURE__ */ new Set();
  const destinationSegments = /* @__PURE__ */ new Set();
  try {
    sourceSegments = new Set((0, import_superstatic.sourceToRegex)(source).segments);
  } catch (err) {
    return {
      message: `${type} at index ${index} has invalid \`source\` pattern "${source}".`,
      link: "https://vercel.link/invalid-route-source-pattern"
    };
  }
  if (destination) {
    try {
      const { hostname, pathname, query } = (0, import_url.parse)(destination, true);
      (0, import_superstatic.sourceToRegex)(hostname || "").segments.forEach(
        (name) => destinationSegments.add(name)
      );
      (0, import_superstatic.sourceToRegex)(pathname || "").segments.forEach(
        (name) => destinationSegments.add(name)
      );
      for (const strOrArray of Object.values(query)) {
        const value = Array.isArray(strOrArray) ? strOrArray[0] : strOrArray;
        (0, import_superstatic.sourceToRegex)(value || "").segments.forEach(
          (name) => destinationSegments.add(name)
        );
      }
    } catch (err) {
    }
    const hasSegments = (0, import_superstatic.collectHasSegments)(has);
    for (const segment of destinationSegments) {
      if (!sourceSegments.has(segment) && !hasSegments.includes(segment)) {
        return {
          message: `${type} at index ${index} has segment ":${segment}" in \`destination\` property but not in \`source\` or \`has\` property.`,
          link: "https://vercel.link/invalid-route-destination-segment"
        };
      }
    }
  }
  return null;
}
function checkRedirect(r, index) {
  if (typeof r.permanent !== "undefined" && typeof r.statusCode !== "undefined") {
    return `Redirect at index ${index} cannot define both \`permanent\` and \`statusCode\` properties.`;
  }
  return null;
}
function createError(code, allErrors, link, action) {
  const errors = Array.isArray(allErrors) ? allErrors : [allErrors];
  const message = errors[0];
  const error = {
    name: "RouteApiError",
    code,
    message,
    link,
    action,
    errors
  };
  return error;
}
function notEmpty(value) {
  return value !== null && value !== void 0;
}
function getTransformedRoutes(vercelConfig) {
  const { cleanUrls, rewrites, redirects, headers, trailingSlash } = vercelConfig;
  let { routes = null } = vercelConfig;
  if (routes) {
    const hasNewProperties = typeof cleanUrls !== "undefined" || typeof trailingSlash !== "undefined" || typeof redirects !== "undefined" || typeof headers !== "undefined" || typeof rewrites !== "undefined";
    if (hasNewProperties) {
      const error = createError(
        "invalid_mixed_routes",
        "If `rewrites`, `redirects`, `headers`, `cleanUrls` or `trailingSlash` are used, then `routes` cannot be present.",
        "https://vercel.link/mix-routing-props",
        "Learn More"
      );
      return { routes, error };
    }
    return normalizeRoutes(routes);
  }
  if (typeof cleanUrls !== "undefined") {
    const normalized = normalizeRoutes(
      (0, import_superstatic.convertCleanUrls)(cleanUrls, trailingSlash)
    );
    if (normalized.error) {
      normalized.error.code = "invalid_clean_urls";
      return { routes, error: normalized.error };
    }
    routes = routes || [];
    routes.push(...normalized.routes || []);
  }
  if (typeof trailingSlash !== "undefined") {
    const normalized = normalizeRoutes((0, import_superstatic.convertTrailingSlash)(trailingSlash));
    if (normalized.error) {
      normalized.error.code = "invalid_trailing_slash";
      return { routes, error: normalized.error };
    }
    routes = routes || [];
    routes.push(...normalized.routes || []);
  }
  if (typeof redirects !== "undefined") {
    const code = "invalid_redirect";
    const regexErrorMessage = redirects.map((r, i) => checkRegexSyntax("Redirect", i, r.source)).find(notEmpty);
    if (regexErrorMessage) {
      return {
        routes,
        error: createError(
          "invalid_redirect",
          regexErrorMessage,
          "https://vercel.link/invalid-route-source-pattern",
          "Learn More"
        )
      };
    }
    const patternError = redirects.map((r, i) => checkPatternSyntax("Redirect", i, r)).find(notEmpty);
    if (patternError) {
      return {
        routes,
        error: createError(
          code,
          patternError.message,
          patternError.link,
          "Learn More"
        )
      };
    }
    const redirectErrorMessage = redirects.map(checkRedirect).find(notEmpty);
    if (redirectErrorMessage) {
      return {
        routes,
        error: createError(
          code,
          redirectErrorMessage,
          "https://vercel.link/redirects-json",
          "Learn More"
        )
      };
    }
    const normalized = normalizeRoutes((0, import_superstatic.convertRedirects)(redirects));
    if (normalized.error) {
      normalized.error.code = code;
      return { routes, error: normalized.error };
    }
    routes = routes || [];
    routes.push(...normalized.routes || []);
  }
  if (typeof headers !== "undefined") {
    const code = "invalid_header";
    const regexErrorMessage = headers.map((r, i) => checkRegexSyntax("Header", i, r.source)).find(notEmpty);
    if (regexErrorMessage) {
      return {
        routes,
        error: createError(
          code,
          regexErrorMessage,
          "https://vercel.link/invalid-route-source-pattern",
          "Learn More"
        )
      };
    }
    const patternError = headers.map((r, i) => checkPatternSyntax("Header", i, r)).find(notEmpty);
    if (patternError) {
      return {
        routes,
        error: createError(
          code,
          patternError.message,
          patternError.link,
          "Learn More"
        )
      };
    }
    const normalized = normalizeRoutes((0, import_superstatic.convertHeaders)(headers));
    if (normalized.error) {
      normalized.error.code = code;
      return { routes, error: normalized.error };
    }
    routes = routes || [];
    routes.push(...normalized.routes || []);
  }
  if (typeof rewrites !== "undefined") {
    const code = "invalid_rewrite";
    const regexErrorMessage = rewrites.map((r, i) => checkRegexSyntax("Rewrite", i, r.source)).find(notEmpty);
    if (regexErrorMessage) {
      return {
        routes,
        error: createError(
          code,
          regexErrorMessage,
          "https://vercel.link/invalid-route-source-pattern",
          "Learn More"
        )
      };
    }
    const patternError = rewrites.map((r, i) => checkPatternSyntax("Rewrite", i, r)).find(notEmpty);
    if (patternError) {
      return {
        routes,
        error: createError(
          code,
          patternError.message,
          patternError.link,
          "Learn More"
        )
      };
    }
    const normalized = normalizeRoutes((0, import_superstatic.convertRewrites)(rewrites));
    if (normalized.error) {
      normalized.error.code = code;
      return { routes, error: normalized.error };
    }
    routes = routes || [];
    routes.push({ handle: "filesystem" });
    routes.push(...normalized.routes || []);
  }
  return { routes, error: null };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  appendRoutesToPhase,
  getCleanUrls,
  getTransformedRoutes,
  isHandler,
  isValidHandleValue,
  mergeRoutes,
  normalizeRoutes,
  ...require("./schemas"),
  ...require("./types")
});
