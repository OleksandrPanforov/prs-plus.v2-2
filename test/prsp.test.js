const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const bootstrapSource = fs.readFileSync(
  path.join(__dirname, "..", "script", "prsp.js"),
  "utf8"
);

function createRuntime(options = {}) {
  const files = Object.assign({
    "/Data/user.config": [
      "config.defaultLogLevel = \"trace\";",
      "config.logFile = \"/Data/prsp_script.log\";",
      "config.corePath = \"/core/\";",
      "config.coreFile = \"/core/\";",
      "config.addonsFile = \"/addons.js\";",
      "config.startupDiagnostics = true;"
    ].join("\n"),
    "/core/a.js": "A",
    "/core/b.js": "B",
    "/core/compat/650_config.js": "return {};",
    "/core/compat/650_bootstrap.js": [
      "PARAMS.Core.testSafeRead = PARAMS.getFileContent(\"/core/a.js\");",
      "PARAMS.Core.testUnsafeRead = PARAMS.getFileContent(\"/core/../secret.js\");",
      "PARAMS.Core.testUnsafeCommand = PARAMS.getFileContent(\"/core/file;touch\");",
      "PARAMS.Core.testCombined = PARAMS.getFileContentEx(\"/core/\", \".js\");"
    ].join("\n")
  }, options.files || {});
  const openedPaths = [];
  const logs = [];
  const closedStreams = [];
  const closedIterators = [];
  const directories = options.directories || ["/core/"];
  const directoryEntries = options.directoryEntries || {
    "/core/": ["b.js", "a.js"]
  };

  function streamFile(filePath, mode) {
    openedPaths.push(filePath);
    this.bytesAvailable = 0;
    this.toString = function () {
      if (files[filePath] === undefined) {
        throw new Error("missing test file");
      }
      return files[filePath];
    };
    this.seek = function () {};
    this.writeLine = function (message) {
      logs.push(message);
    };
    this.close = function () {};
    closedStreams.push(filePath);
  }

  const context = {
    FileSystem: {
      getFileInfo(filePath) {
        if (directories.indexOf(filePath) !== -1) {
          return {type: "directory"};
        }
        if (files[filePath] !== undefined) {
          return {type: "file"};
        }
        return null;
      },
      Iterator: function (directory) {
        const entries = (directoryEntries[directory] || []).map((filePath) => ({
          type: "file",
          path: filePath
        }));
        let index = 0;
        this.getNext = function () {
          return index < entries.length ? entries[index++] : null;
        };
        this.close = function () {
          closedIterators.push(directory);
        };
      }
    },
    Stream: {File: streamFile},
    System: {
      applyEnvironment(name) {
        const values = {
          "[prspSafeModeFile]": options.safeMode ? "/Data/safe-mode" : "/Data/no-safe-mode",
          "[prspModel]": "650",
          "[prspLogFile]": "/Data/prsp_script.log",
          "[prspCorePath]": "/core/",
          "[prspAddonsPath]": "/addons/",
          "[prspSettingsPath]": "/settings/",
          "[prspPublicPath]": "/Data/",
          "[userDictionaryPath]": "/dict/",
          "[prspUserCSSPath]": "/css/",
          "[prspCoreFile]": "/core/",
          "[prspAddonsFile]": "/addons.js",
          "[prspBetaUserConfig]": "/Data/user.config"
        };
        return values[name] || "";
      }
    },
    console
  };

  vm.runInNewContext(bootstrapSource, context, {filename: "prsp.js"});
  return {context, logs, openedPaths, closedStreams, closedIterators};
}

test("rejects unsafe paths before opening files", () => {
  const runtime = createRuntime();

  assert.equal(runtime.context.Core.testSafeRead, "A");
  assert.equal(runtime.context.Core.testUnsafeRead, "");
  assert.equal(runtime.context.Core.testUnsafeCommand, "");
  assert.deepEqual(
    runtime.openedPaths.filter((filePath) => filePath.indexOf("secret") !== -1),
    []
  );
  assert.equal(
    runtime.openedPaths.filter((filePath) => filePath.indexOf(";") !== -1).length,
    0
  );
});

test("combines directory files in sorted order", () => {
  const runtime = createRuntime();

  assert.equal(runtime.context.Core.testCombined, "AB");
  assert.ok(runtime.openedPaths.filter((filePath) => filePath === "/core/a.js").length >= 1);
  assert.ok(runtime.openedPaths.filter((filePath) => filePath === "/core/b.js").length >= 1);
});

test("closes directory iterators after combining files", () => {
  const runtime = createRuntime();

  assert.deepEqual(runtime.closedIterators, ["/core/"]);
});

test("closes file streams after successful and rejected reads", () => {
  const runtime = createRuntime();

  assert.ok(runtime.closedStreams.indexOf("/Data/user.config") !== -1);
  assert.ok(runtime.closedStreams.indexOf("/core/a.js") !== -1);
  assert.equal(runtime.closedStreams.indexOf("/core/../secret.js"), -1);
});

test("passes the model and compatibility loader contract to the bootstrap", () => {
  const runtime = createRuntime({
    files: {
      "/core/compat/650_bootstrap.js": [
        "PARAMS.Core.contractModel = PARAMS.model;",
        "PARAMS.Core.contractPath = PARAMS.compatPath;",
        "PARAMS.Core.contractLoaders = typeof PARAMS.loadCore + \":\" + typeof PARAMS.loadAddons;",
        "PARAMS.Core.contractReader = typeof PARAMS.getFileContent + \":\" + typeof PARAMS.getFileContentEx;"
      ].join("\n")
    }
  });

  assert.equal(runtime.context.Core.contractModel, "650");
  assert.equal(runtime.context.Core.contractPath, "/core/compat/");
  assert.equal(runtime.context.Core.contractLoaders, "function:function");
  assert.equal(runtime.context.Core.contractReader, "function:function");
});

test("does not initialize when safe mode is active", () => {
  const runtime = createRuntime({
    safeMode: true,
    files: {
      "/Data/safe-mode": ""
    }
  });

  assert.equal(runtime.context.Core, undefined);
  assert.deepEqual(runtime.openedPaths, []);
});

test("records startup timing only when diagnostics are enabled", () => {
  const runtime = createRuntime();
  const startupLogs = runtime.logs.filter((message) => message.indexOf("[startup]") === 0);

  assert.equal(runtime.context.Core.diagnostics.enabled, true);
  assert.ok(startupLogs.some((message) => message.indexOf("config loaded") !== -1));
  assert.ok(startupLogs.some((message) => message.indexOf("bootstrap finished") !== -1));
  startupLogs.forEach((message) => {
    assert.match(message, /total=\d+ms phase=\d+ms$/);
  });
});

test("does not emit startup timing when diagnostics are disabled", () => {
  const runtime = createRuntime({
    files: {
      "/Data/user.config": [
        "config.defaultLogLevel = \"trace\";",
        "config.logFile = \"/Data/prsp_script.log\";",
        "config.startupDiagnostics = false;"
      ].join("\n")
    }
  });

  assert.equal(runtime.context.Core.diagnostics.enabled, false);
  assert.equal(runtime.logs.filter((message) => message.indexOf("[startup]") === 0).length, 0);
});

test("records refresh timing only when diagnostics are enabled", () => {
  const runtime = createRuntime({
    files: {
      "/core/compat/650_bootstrap.js": [
        "PARAMS.Core.diagnostics.recordRefresh(\"Chess\", 4, \"board\");",
        "PARAMS.Core.diagnostics.recordRefresh(\"Chess\", 6, \"board\");"
      ].join("\n")
    }
  });
  const refreshLogs = runtime.logs.filter((message) => message.indexOf("[refresh]") === 0);

  assert.equal(refreshLogs.length, 2);
  assert.match(refreshLogs[0], /category=Chess count=1 duration=4ms total=4ms region=board/);
  assert.match(refreshLogs[1], /category=Chess count=2 duration=6ms total=10ms region=board/);
});

test("does not emit refresh timing when diagnostics are disabled", () => {
  const runtime = createRuntime({
    files: {
      "/Data/user.config": [
        "config.defaultLogLevel = \"trace\";",
        "config.logFile = \"/Data/prsp_script.log\";",
        "config.startupDiagnostics = false;"
      ].join("\n"),
      "/core/compat/650_bootstrap.js":
        "PARAMS.Core.diagnostics.recordRefresh(\"Chess\", 4, \"board\");"
    }
  });

  assert.equal(runtime.logs.filter((message) => message.indexOf("[refresh]") === 0).length, 0);
});
