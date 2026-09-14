# PRS+

PRS+ is a custom firmware and JavaScript enhancement layer for Sony PRS
e-readers. It extends the stock reader software with improved reading,
library, folder, dictionary, media, localization, utility, and game features.

This repository is a legacy embedded-firmware project. It is not a Node.js
application and it is not intended to run on a modern desktop operating
system. The runtime, filesystem layout, boot process, and package format are
specific to Sony reader firmware.

## Supported models

The source tree contains model-specific support for:

- PRS-300
- PRS-350
- PRS-505
- PRS-600
- PRS-650
- PRS-950

The PRS-650 is the primary validation target for the current work. Model
specific files must not be copied between devices unless their firmware
interfaces and storage layout are known to be identical.

## Repository layout

```text
firmware/       Sony firmware payloads and model-specific resources
script/         Embedded JavaScript runtime, core, compatibility, and add-ons
installer/      Installer scripts, update scripts, and model instructions
build/          Apache Ant build files, tools, temporary files, and output
test/           Node-based host tests for logic that can be tested safely
changelog.txt   Historical release and compatibility notes
```

Important runtime files include:

- `script/prsp.js` - bootstrap loader and safety checks.
- `script/core/` - shared PRS+ runtime.
- `script/core/compat/` - model-specific compatibility code.
- `script/addons/` - add-ons and utilities.
- `firmware/650/prsp.sh` - PRS-650 startup mount script.
- `installer/installer.sh.650` - PRS-650 update installer.
- `installer/data/runonce.sh` - post-install cleanup script copied to the
  reader; it is not the initial update trigger.

## Runtime constraints

PRS+ runs inside Sony's embedded ES3-era JavaScript environment. Firmware
source must remain compatible with that environment:

- Use ES3-compatible JavaScript in `script/`.
- Do not use `let`, `const`, arrow functions, promises, classes, or modern web
  APIs in reader code.
- The runtime exposes Sony-specific globals such as `FileSystem`, `Stream`,
  `System`, `kbook`, `Fskin`, `FskUI`, and `FskCache`.
- Core and add-on code is combined and dynamically loaded with
  `new Function(...)`.
- The reader has tight startup-time, memory, storage, and script-size limits.
  Large bundles are split into multiple files.
- Changes must be tested against the target reader, not only with Node.js.

These limitations are intentional compatibility requirements, not signs that
the code should be converted into a modern browser or Node application.

## PRS-650 update model

### The critical distinction: first install versus update

The historical PRS-650 `setup.exe` is required for the first installation.
It does more than copy `PRSPInstaller`:

1. It installs a patched PRS-650 Rootfs image.
2. That Rootfs contains the early-boot hook that checks for
   `/Data/runonce.sh`.
3. It copies the initial PRS+ files and update support to the reader.

Subsequent updates can use the update package only if that patched Rootfs is
already installed. Copying a new `PRSPInstaller` folder to a stock reader, or
to a reader without the original PRS+ bootstrap, will not execute the
installer. A normal reboot alone is not evidence that the update hook exists.

The current repository builds update packages; it does not recreate the
historical Windows first-install executable or Rootfs patch.

### Historical update sequence

The working PRS-650 update flow is:

1. Connect the reader to the computer.
2. Copy the package contents to the root of internal storage:

   ```text
   /Data/PRSPInstaller/
   /Data/runonce.sh
   ```

   On Windows, the reader's internal storage is normally shown as `D:\`, so
   these paths appear as:

   ```text
   D:\PRSPInstaller\
   D:\runonce.sh
   ```

3. Safely eject the reader.
4. Return the reader from USB/recovery mode to normal mode.
5. The patched Rootfs consumes `/Data/runonce.sh`.
6. The script sources `PRSPInstaller/installer.sh`.
7. The installer replaces `/opt1/dict/prsp` with the new PRS+ payload.
8. The staging directory and trigger script are removed.
9. The installed `prsp.sh` is sourced to restore the PRS+ runtime.

### USB, recovery, and normal-mode transitions

The terms "USB mode" and "recovery mode" are easy to confuse here. The
historical updater does not ask the user to hold a special button combination:
it uses the bundled `tools\ebook_msc.exe` utility to control the reader's USB
mass-storage state.

The two historical commands are:

```text
ebook_msc.exe ... um recovery
ebook_msc.exe ... um normal
```

They are used in different situations:

- **First installation:** the Windows `setup.exe` copies the full bootstrap
  payload and issues `um recovery`. This is part of installing the patched
  Rootfs and is not reproduced by the current update package.
- **Subsequent update:** the updater copies only `PRSPInstaller` and the root
  `runonce.sh`, then issues `um normal`. This makes the reader leave the USB
  transition state and boot normally, where the patched Rootfs consumes
  `/Data/runonce.sh`.

For a manual update using the generated package, use this sequence:

1. Start with the reader fully booted and showing its normal user interface.
2. Connect the USB cable and wait until the internal storage appears in
   Windows.
3. Copy the **contents** of the package to the root of internal storage. The
   final paths must be exactly:

   ```text
   D:\runonce.sh
   D:\PRSPInstaller\installer.sh
   D:\PRSPInstaller\prsp\resources.img
   ```

   Do not create `D:\Data\...`, `D:\PRSPInstaller\PRSPInstaller\...`, or
   `D:\update.zip`.
4. Use Windows **Safely Remove Hardware / Eject** for the reader and wait for
   Windows to confirm that it is safe to remove.
5. Disconnect the USB cable. Do not press reset, hold the power switch, or
   repeatedly reconnect the cable while the reader is transitioning.
6. Allow the reader to boot completely. On a correctly patched reader,
   `/Data/runonce.sh` is moved and executed during early boot.
7. Reconnect the reader only after the normal UI is available, then check:

   ```text
   D:\PRSPInstaller\install.log
   ```

   A successful run normally removes both `D:\runonce.sh` and
   `D:\PRSPInstaller`.

There is no reliable user-facing way to force the patched Rootfs hook by
holding buttons. If `D:\runonce.sh` remains after a clean eject and complete
boot, the hook was not executed. The likely causes are that the original
PRS-650 `setup.exe` bootstrap was never completed, the patched Rootfs was
replaced, or the reader was only rebooted without a USB-to-normal transition.
Do not keep power-cycling the reader and do not manually delete
`/opt1/dict/prsp`.

The PRS+ code also has a separate USB safe-mode behavior: when the reader is
connected to USB during ordinary startup, PRS+ may deliberately skip loading
its JavaScript runtime. That is not the update trigger and is another reason
to disconnect USB before the final boot.

The historical trigger is intentionally simple:

```sh
if [ -f /Data/PRSPInstaller/installer.sh ]
then
    . /Data/PRSPInstaller/installer.sh
    rm -R /Data/PRSPInstaller
fi

if [ -f /opt1/dict/prsp/prsp.sh ]
then
    . /opt1/dict/prsp/prsp.sh
fi

rm /Data/runonce.sh
```

Do not manually delete `/opt1/dict/prsp`. A failed replacement can leave the
reader without a bootable PRS+ resource image.

### Package contents

A PRS-650 update package contains:

```text
runonce.sh
PRSPInstaller/
├── installer.sh
├── data/
│   └── runonce.sh
└── prsp/
    ├── deviceConfig.xml
    ├── prsp.sh
    ├── prspfw.ver
    ├── resources.img
    └── resources.img.md5
```

The nested `PRSPInstaller/data/runonce.sh` is installed as cleanup/support
data. The root `runonce.sh` is the update trigger consumed by the patched
Rootfs.

## Building the PRS-650 package

The active build configuration is in
[`build/prsp.properties`](build/prsp.properties):

```properties
MODEL=650
PRSP_VER=2.2.0preview
```

Run Ant from the `build` directory:

```powershell
Push-Location build
rtk ant buildAll
Pop-Location
```

The generated package is written to:

```text
build/dist/650/
build/dist/PRSP_650_2.2.0preview_Installer.zip
```

The build performs the following work:

- Combines and minifies the core and add-on JavaScript.
- Applies PRS-650 compatibility files.
- Packages the PRS-650 firmware resources.
- Creates and validates the CRAMFS resource image.
- Writes `prspfw.ver`.
- Generates `resources.img.md5`.
- Creates the `PRSPInstaller` update layout.
- Adds the root PRS-650 `runonce.sh`.

The build output is not a first-install `setup.exe`.

## Validation

Host-side tests use Node's built-in test runner:

```powershell
rtk npm test
```

Useful checks after changes:

```powershell
rtk git diff --check
rtk node --check script/prsp.js
```

The host tests cover path validation, file and directory cleanup, bootstrap
contracts, diagnostics, converter failure handling, and refresh diagnostics.
They cannot prove that a firmware package will boot on physical hardware.

## Performance and reliability work

The PRS-650-focused changes include:

- Safe path validation before filesystem access.
- Removal of unsafe dynamic evaluation in the Draughts code path.
- More efficient file aggregation and reduced redundant filesystem probes.
- Media-source caching and cached BrowseFolders sort keys.
- Deferred file-size lookups until size display is requested.
- Lazy loading for PRS-650 games, with cached evaluation after first use.
- Startup diagnostics for configuration, core, add-ons, lifecycle hooks, and
  settings loading.
- Optional screen-refresh timing and count diagnostics.
- Converter diagnostics and validation of generated EPUB output.
- Continue Reading behavior and reading-history export.

Diagnostics are opt-in. Disable them after collecting measurements because
logging adds startup and storage I/O on the reader.

Partial e-ink refresh and waveform changes remain intentionally unimplemented.
The available firmware APIs are hardware- and firmware-dependent, and guessed
waveform values could cause display corruption or unstable behavior.

## Configuration and storage notes

The reader exposes internal storage as `/Data/` to its Linux environment.
Therefore:

```text
D:\database\system\PRSPlus\  ==  /Data/database/system/PRSPlus/
D:\PRSPInstaller\             ==  /Data/PRSPInstaller/
D:\runonce.sh                 ==  /Data/runonce.sh
```

`D:\Data\PRSPInstaller` is incorrectly nested and will not be found by the
installer.

The PRS+ user shell hook, when present, is:

```text
/Data/database/system/PRSPlus/prsp.sh
```

The PRS-650 startup script mounts the installed resource image from:

```text
/opt1/dict/prsp/resources.img
```

It also mounts the installed device configuration and optionally loads
`/opt0/prsp/kconfig.xml`.

Card scanning and cache behavior is important operationally. Disabling card
scanning can preserve stale book entries after files are deleted from a card.
Deleting a card's cache is safe only if bookmarks and current-page metadata for
that card are not needed.

## Troubleshooting an update that does not run

### No `install.log`

If `D:\PRSPInstaller\install.log` is never created, the installer script was
not invoked. The most likely causes are:

- The reader was never bootstrapped with the historical PRS-650 `setup.exe`.
- The patched Rootfs is absent or was replaced by stock firmware.
- The files were copied to `D:\Data\PRSPInstaller` instead of
  `D:\PRSPInstaller`.
- The reader was rebooted without completing the USB/recovery-to-normal
  transition that consumes `/Data/runonce.sh`.
- `runonce.sh` was renamed, nested, or left with an unusable file layout.

### `runonce.sh` remains on the device

This indicates that the patched Rootfs did not consume it. Do not repeatedly
power-cycle the reader and do not delete the active PRS+ installation.
Recover the original first-install/bootstrap path instead.

### `install.log` exists but replacement failed

Preserve the log before making further changes. The installer remounts
`/opt1/dict`, removes the previous PRS+ directory, copies the new payload, and
remounts the filesystem read-only. A failure during replacement may require a
known-good recovery package.

### Resource image concerns

The generated `resources.img` is checked by the build and its MD5 is written
to `resources.img.md5`. Do not substitute a resource image from another model.
PRS-600, PRS-650, and PRS-950 startup files are not interchangeable merely
because they have similar names.

## Security and maintenance guidance

- Keep all reader code ES3-compatible.
- Validate paths before opening or writing files.
- Avoid shell commands and dynamic evaluation unless required by the legacy
  architecture and carefully constrained.
- Preserve model-specific package boundaries.
- Prefer opt-in diagnostics over permanent logging.
- Test update packaging as carefully as JavaScript behavior.
- Keep a known-good PRS-650 recovery package before installing experimental
  builds.
- Never assume a successful host build proves successful hardware installation.

## Historical documentation

The original user guide was hosted on the Google Code archive:

<https://code.google.com/archive/p/prs-plus/wikis/UserGuide.wiki>

The archive remains useful for feature and storage behavior, but its installer
instructions are historical. In particular, references to `setup.exe` apply to
the first PRS-650 bootstrap, while later `update.zip` updates depend on the
patched Rootfs installed by that first step.
