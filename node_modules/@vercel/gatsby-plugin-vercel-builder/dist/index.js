"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  generateVercelBuildOutputAPI3Output: () => generateVercelBuildOutputAPI3Output
});
module.exports = __toCommonJS(src_exports);
var import_routing_utils = require("@vercel/routing-utils");
var import_fs_extra4 = require("fs-extra");

// src/schemas.ts
var import_typebox = require("@sinclair/typebox");
var import_custom = require("@sinclair/typebox/custom");
var import_compiler = require("@sinclair/typebox/compiler");
import_custom.Custom.Set("StringEnum", (schema, value) => {
  return schema.enum.includes(value);
});
function StringEnum(values) {
  return import_typebox.Type.Unsafe({
    [import_typebox.Kind]: "StringEnum",
    type: "string",
    enum: values
  });
}
var GatsbyPageSchema = import_typebox.Type.Object({
  mode: StringEnum(["SSG", "DSG", "SSR"]),
  path: import_typebox.Type.String()
});
var GatsbyFunctionSchema = import_typebox.Type.Object({
  functionRoute: import_typebox.Type.String(),
  originalAbsoluteFilePath: import_typebox.Type.String()
});
import_compiler.TypeCompiler.Compile(GatsbyFunctionSchema);
var GatsbyRedirectSchema = import_typebox.Type.Object({
  fromPath: import_typebox.Type.String(),
  toPath: import_typebox.Type.String(),
  isPermanent: import_typebox.Type.Optional(import_typebox.Type.Boolean()),
  statusCode: import_typebox.Type.Optional(import_typebox.Type.Number())
});
var GatsbyConfigSchema = import_typebox.Type.Object({
  trailingSlash: import_typebox.Type.Optional(
    StringEnum(["always", "never", "ignore", "legacy"])
  ),
  pathPrefix: import_typebox.Type.Optional(import_typebox.Type.String())
});
var GatsbyStateSchema = import_typebox.Type.Object({
  pages: import_typebox.Type.Array(import_typebox.Type.Tuple([import_typebox.Type.String(), GatsbyPageSchema])),
  redirects: import_typebox.Type.Array(GatsbyRedirectSchema),
  functions: import_typebox.Type.Array(GatsbyFunctionSchema),
  config: GatsbyConfigSchema
});
var validateGatsbyState = import_compiler.TypeCompiler.Compile(GatsbyStateSchema);

// src/helpers/functions.ts
var import_path3 = require("path");
var import_fs_extra3 = require("fs-extra");

// src/utils/symlink.ts
var import_path = __toESM(require("path"));
var import_fs_extra = require("fs-extra");
var removeTrailingSlash = (str) => str.replace(/\/$/, "");
var createSymlink = async (pathName, destName) => {
  const functionName = removeTrailingSlash(pathName).split(import_path.sep).pop();
  const dirPath = removeTrailingSlash(
    (0, import_path.join)(".vercel", "output", "functions", (0, import_path.normalize)((0, import_path.join)(pathName, "..")))
  );
  await (0, import_fs_extra.ensureDir)(dirPath);
  (0, import_fs_extra.symlinkSync)(
    import_path.default.relative(dirPath, (0, import_path.join)(".vercel", "output", "functions", destName)),
    import_path.default.join(dirPath, `${functionName}.func`)
  );
};

// src/handlers/build.ts
var import_path2 = require("path");
var import_build_utils = require("@vercel/build-utils");
var import_esbuild = require("esbuild");
var import_fs_extra2 = require("fs-extra");
var writeHandler = async ({
  outDir,
  handlerFile,
  prefix = ""
}) => {
  const { major } = await (0, import_build_utils.getNodeVersion)(process.cwd());
  try {
    await (0, import_esbuild.build)({
      entryPoints: [handlerFile],
      loader: { ".ts": "ts" },
      outfile: (0, import_path2.join)(outDir, "index.js"),
      format: "cjs",
      target: `node${major}`,
      platform: "node",
      bundle: true,
      minify: true,
      // prevents renaming edge cases from causing failures like:
      // https://github.com/node-fetch/node-fetch/issues/784
      keepNames: true,
      define: {
        "process.env.NODE_ENV": "'production'",
        vercel_pathPrefix: JSON.stringify(prefix)
      }
    });
  } catch (e) {
    console.error("Failed to build lambda handler", e.message);
  }
};
var writeVCConfig = async ({
  functionDir,
  handler = "index.js"
}) => {
  const { runtime } = await (0, import_build_utils.getNodeVersion)(process.cwd());
  const config = {
    runtime,
    handler,
    launcherType: "Nodejs",
    shouldAddHelpers: true
  };
  const configPath = (0, import_path2.join)(functionDir, ".vc-config.json");
  await (0, import_fs_extra2.writeJson)(configPath, config);
};
var writePrerenderConfig = (outputPath, group) => {
  const config = {
    group,
    expiration: 600
    // 10 minutes TODO: make this configurable?
  };
  (0, import_fs_extra2.ensureFileSync)(outputPath);
  return (0, import_fs_extra2.writeFileSync)(outputPath, JSON.stringify(config));
};
async function copyFunctionLibs({
  functionDir
}) {
  await Promise.allSettled(
    [
      {
        src: (0, import_path2.join)(".cache", "query-engine"),
        dest: (0, import_path2.join)(functionDir, ".cache", "query-engine")
      },
      {
        src: (0, import_path2.join)(".cache", "page-ssr"),
        dest: (0, import_path2.join)(functionDir, ".cache", "page-ssr")
      },
      {
        src: (0, import_path2.join)(".cache", "data", "datastore"),
        dest: (0, import_path2.join)(functionDir, ".cache", "data", "datastore")
      },
      {
        src: (0, import_path2.join)(".cache", "caches"),
        dest: (0, import_path2.join)(functionDir, ".cache", "caches")
      }
    ].map(({ src, dest }) => (0, import_fs_extra2.copy)(src, dest))
  );
}
async function copyHTMLFiles({ functionDir }) {
  for (const htmlFile of ["404", "500"]) {
    if (await (0, import_fs_extra2.pathExists)((0, import_path2.join)("public", `${htmlFile}.html`))) {
      try {
        await (0, import_fs_extra2.copyFile)(
          (0, import_path2.join)("public", `${htmlFile}.html`),
          (0, import_path2.join)(functionDir, `${htmlFile}.html`)
        );
      } catch (e) {
        console.error("Failed to copy HTML files", e.message);
        process.exit(1);
      }
    }
  }
}

// src/helpers/functions.ts
async function createServerlessFunctions(ssrRoutes, prefix) {
  let functionName;
  let functionDir;
  const handlerFile = (0, import_path3.join)(__dirname, "../templates/ssr-handler.js");
  await Promise.all(
    ssrRoutes.map(async (page, index) => {
      let pathName = page.path;
      const ssrPath = (0, import_path3.join)(prefix ?? "", pathName, "index.html");
      if (index === 0) {
        functionName = `${ssrPath}.func`;
        functionDir = (0, import_path3.join)(".vercel/output/functions", functionName);
        await (0, import_fs_extra3.ensureDir)(functionDir);
        await Promise.all([
          writeHandler({ outDir: functionDir, handlerFile, prefix }),
          copyFunctionLibs({ functionDir }),
          copyHTMLFiles({ functionDir }),
          writeVCConfig({ functionDir })
        ]);
      } else {
        await createSymlink(ssrPath, functionName);
      }
      if (page.mode === "DSG") {
        writePrerenderConfig(
          (0, import_path3.join)(
            ".vercel",
            "output",
            "functions",
            `${ssrPath}.prerender-config.json`
          ),
          index + 1
        );
      }
      if (!pathName || pathName === "/") {
        pathName = "index";
      }
      const pageDataPath = (0, import_path3.join)(
        prefix ?? "",
        "page-data",
        pathName,
        "page-data.json"
      );
      await createSymlink(pageDataPath, functionName);
      if (page.mode === "DSG") {
        writePrerenderConfig(
          (0, import_path3.join)(
            ".vercel",
            "output",
            "functions",
            `${pageDataPath}.prerender-config.json`
          ),
          index + 1
        );
      }
    })
  );
}
async function createAPIRoutes(functions, prefix) {
  const apiDir = (0, import_path3.join)(".vercel", "output", "functions", "api", prefix ?? "");
  await (0, import_fs_extra3.ensureDir)(apiDir);
  await Promise.allSettled(
    functions.map(async (func) => {
      const apiRouteDir = `${apiDir}/${func.functionRoute}.func`;
      const handlerFile = func.originalAbsoluteFilePath;
      await (0, import_fs_extra3.ensureDir)(apiRouteDir);
      await Promise.all([
        writeHandler({ outDir: apiRouteDir, handlerFile }),
        writeVCConfig({ functionDir: apiRouteDir })
      ]);
    })
  );
}

// src/helpers/static.ts
var import_path4 = require("path");
var import_build_utils2 = require("@vercel/build-utils");
async function createStaticDir(prefix) {
  const publicDir = (0, import_path4.join)(process.cwd(), "public");
  const targetDir = (0, import_path4.join)(
    process.cwd(),
    ".vercel",
    "output",
    "static",
    prefix ?? ""
  );
  try {
    await (0, import_build_utils2.hardLinkDir)(publicDir, [targetDir]);
  } catch (err) {
    console.error(err);
    throw new Error(
      `Failed to hardlink (or copy) "public" dir files from "${publicDir}" to "${targetDir}".`
    );
  }
}

// src/index.ts
var import_path5 = require("path");
async function generateVercelBuildOutputAPI3Output({
  gatsbyStoreState
}) {
  const state = {
    pages: Array.from(gatsbyStoreState.pages.entries()),
    // must transform from a Map for validation
    redirects: gatsbyStoreState.redirects,
    functions: gatsbyStoreState.functions,
    config: gatsbyStoreState.config
  };
  if (validateGatsbyState.Check(state)) {
    console.log("\u25B2 Creating Vercel build output");
    const { pages, functions, config: gatsbyConfig } = state;
    const { pathPrefix = "" } = gatsbyConfig;
    const ssrRoutes = pages.map((p) => p[1]).filter((page) => page.mode === "SSR" || page.mode === "DSG");
    const ops = [];
    if (functions.length > 0) {
      ops.push(createAPIRoutes(functions, pathPrefix));
    }
    if (ssrRoutes.length > 0) {
      ops.push(createServerlessFunctions(ssrRoutes, pathPrefix));
    }
    await Promise.all(ops);
    await createStaticDir(pathPrefix);
    let trailingSlash = void 0;
    if (gatsbyConfig.trailingSlash === "always") {
      trailingSlash = true;
    } else if (gatsbyConfig.trailingSlash === "never") {
      trailingSlash = false;
    }
    const redirects = [];
    const rewrites = [];
    for (const {
      fromPath,
      toPath,
      isPermanent,
      statusCode
    } of state.redirects) {
      if (statusCode === 200) {
        rewrites.push({
          source: fromPath,
          destination: toPath
        });
      } else {
        redirects.push({
          source: fromPath,
          destination: toPath,
          permanent: isPermanent
        });
      }
    }
    const routes = (0, import_routing_utils.getTransformedRoutes)({
      trailingSlash,
      redirects,
      rewrites
    }).routes || [];
    routes.push({
      handle: "error"
    });
    if (pathPrefix) {
      routes.push({
        status: 404,
        src: "^(?!/api).*$",
        dest: (0, import_path5.join)(pathPrefix, "404.html")
      });
    }
    routes.push({
      status: 404,
      src: "^(?!/api).*$",
      dest: "404.html"
    });
    const config = {
      version: 3,
      routes: routes || void 0
    };
    await (0, import_fs_extra4.writeJson)(".vercel/output/config.json", config);
    console.log("Vercel output has been generated");
  } else {
    const errors = [...validateGatsbyState.Errors(state)];
    throw new Error(
      `Gatsby state validation failed:
${errors.map(
        (err) => `  - ${err.message}, got ${typeof err.value} (${JSON.stringify(
          err.value
        )}) at path "${err.path}"
`
      ).join(
        ""
      )}Please check your Gatsby configuration files, or file an issue at https://vercel.com/help#issues`
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateVercelBuildOutputAPI3Output
});
