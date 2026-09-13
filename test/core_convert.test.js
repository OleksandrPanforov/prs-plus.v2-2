const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const converterSource = fs.readFileSync(
  path.join(__dirname, "..", "script", "core", "core_convert.js"),
  "utf8"
);

function createConverterRuntime(options = {}) {
  const files = {
    "/Data/book.fb2": "fb2",
    ...(options.files || {})
  };
  const logs = [];
  const messages = [];
  const parent = {nodes: []};
  const context = {
    Core: {
      config: {model: "650"},
      text: {
        endsWith: (value, suffix) => value.slice(-suffix.length) === suffix,
        startsWith: (value, prefix) => value.indexOf(prefix) === 0
      },
      io: {
        getFileSize: (filePath) => files[filePath] === undefined ? null : files[filePath].length,
        copyFile: () => {},
        deleteFile: (filePath) => { delete files[filePath]; },
        moveFile: (source, destination) => {
          files[destination] = files[source];
          delete files[source];
        }
      },
      shell: {
        MS_MOUNT_PATH: "/opt/mnt/ms",
        SD_MOUNT_PATH: "/opt/mnt/sd",
        MS: 1,
        SD: 0,
        mount: () => {},
        umount: () => {},
        exec: (command) => {
          logs.push(command);
          if (options.fail) {
            throw "exit code: 1";
          }
          if (options.emptyOutput) {
            files["/Data/book.fb2.epub"] = "";
          } else {
            files["/Data/book.fb2.epub"] = "epub";
          }
        }
      },
      media: {
        findMedia: () => null,
        createMediaNode: (filePath) => ({media: {path: filePath}, path: filePath})
      },
      ui: {
        createContainerNode: (node) => node,
        showMsg: (message) => { messages.push(message); }
      },
      lang: {
        getLocalizer: () => (key) => key
      },
      log: {
        getLogger: () => ({
          trace: (message) => logs.push(message),
          error: (message) => logs.push(message)
        })
      }
    },
    FileSystem: {
      getExtension: (filePath) => filePath.split(".").pop(),
      getFileInfo: (filePath) => files[filePath] === undefined ? null : {type: "file"}
    },
    System: {
      applyEnvironment: (name) => ({
        "[prspPath]": "/prsp/",
      }[name] || "")
    },
    kbook: {
      model: {},
      root: {}
    },
    log: {
      trace: (message) => logs.push(message),
      error: (message) => logs.push(message)
    }
  };

  vm.runInNewContext(converterSource, context, {filename: "core_convert.js"});
  return {context, files, logs, messages, parent};
}

test("keeps the FB2 node when conversion does not produce an EPUB", () => {
  const runtime = createConverterRuntime({emptyOutput: true});
  const node = runtime.context.Core.convert.createMediaNode(
    "/Data/book.fb2",
    "Book",
    runtime.parent,
    runtime.context.Core.convert.createMediaNode
  );
  runtime.parent.nodes.push(node);

  node.enter();

  assert.equal(runtime.parent.nodes[0], node);
  assert.ok(runtime.logs.some((message) => message.indexOf("empty output") !== -1), runtime.logs.join("\n"));
});

test("logs converter failures with source and destination paths", () => {
  const runtime = createConverterRuntime({fail: true});
  const node = runtime.context.Core.convert.createMediaNode(
    "/Data/book.fb2",
    "Book",
    runtime.parent,
    runtime.context.Core.convert.createMediaNode
  );

  node.enter();

  assert.ok(runtime.logs.some((message) =>
    message.indexOf("fb2toepub failed source=/Data/book.fb2 destination=/Data/book.fb2.epub") !== -1
  ), runtime.logs.join("\n"));
  assert.deepEqual(runtime.parent.nodes, []);
});
