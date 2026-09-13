# PRS+ Firmware Repository Context

## Project purpose

This repository is a source archive for PRS+, a custom firmware and enhancement layer for Sony PRS e-readers. The project adds functionality to the stock Sony reader firmware, including home screen customization, better book management, dictionary support, reading UX tweaks, and a number of built-in utilities and mini-games.

The project is old and device-specific: it targets Sony PRS devices such as the 300/350/505/600/650/950 line, and the repo includes both model-dependent firmware payloads and shared runtime scripts.

## Reference documentation

The official PRS+ documentation was hosted on the Google Code archive as the User Guide wiki:

- https://code.google.com/archive/p/prs-plus/wikis/UserGuide.wiki

The repo itself includes important local documentation in the changelog and installer README files, which describe the project’s behavior and the supported installation flow.

## Repo layout

- `firmware/`: device-specific firmware payloads or model-targeted packages.
  - Subfolders: `300`, `350`, `505`, `600`, `650`, `950`, plus `binaries`.
- `script/`: the runtime logic that runs on the reader after installation.
  - `prsp.js`: bootstrap loader.
  - `core/`: the main PRS+ core system.
  - `addons/`: optional utilities and add-ons.
  - `addons1/`: second chunk of add-ons for size-splitting.
  - `languages/`: localized strings.
  - `user.config.*`: per-model device configuration templates.
- `installer/`: installation assets and README instructions for flashing/updating the device.
  - Contains a Windows-based installation flow and language packs.
- `build/`: build output and generated artifacts.
- `changelog.txt`: release history, bugfixes, feature additions, and model-specific support notes.

## Architecture and runtime model

The code is not a normal desktop application. It is a custom script layer that runs on the reader’s embedded environment.

From `script/prsp.js`, the bootstrap process:

- reads device model information from the runtime environment,
- loads a model-specific compatibility config,
- loads the core runtime from `coreFile`,
- loads add-ons from the main `addonsFile` and a second `addons1` file,
- calls a device-specific bootstrap entry point.

This is a clear sign that the project is designed around a platform with a small JS runtime, model-specific compatibility shims, and split loading to work around script-size constraints.

The comments in `prsp.js` explicitly mention a 100k limit and the need to split the add-on code into `addons` and `addons1` for large devices. That is an important implementation detail for future work in this repository.

## Supported devices and compatibility

The repo shows active support for these Sony PRS models:

- PRS-300
- PRS-350
- PRS-505
- PRS-600
- PRS-650
- PRS-950

`user.config.<model>` and model-specific compatibility paths indicate that most logic is abstracted around a single PRS+ runtime with device-specific patches.

## Feature areas from the docs and changelog

The project adds a large number of enhancements over the stock firmware. Based on the changelog and repository structure, the feature set includes:

- Better reading UX:
  - custom zoom options,
  - page-turn and gesture improvements,
  - annotation / popup / dictionary behavior,
  - better EPUB/CSS handling,
  - custom fonts and text scaling.
- File and folder management:
  - browse folders,
  - card scanning toggles,
  - SD/MS card access via mount,
  - better folder listings and book organization.
- Home / library enhancements:
  - booklist customization,
  - sorting by filename/title/author,
  - collection handling,
  - cover page and standby image support.
- Utilities and apps:
  - dictionary,
  - calculator,
  - calendar,
  - screenshot support,
  - custom CSS and keyboard layouts,
  - support for extra keyboard characters and localized layouts.
- Games and add-ons:
  - Chess, Mahjong, FreeCell, MineSweeper, Draughts, Sudoku, XO-Cubed, Solitaire, and others.
- Localization:
  - many translations (English, German, French, Russian, Spanish, Catalan, Czech, Turkish, etc.).

## Installation flow

The local installer README is explicit about the upgrade process:

1. Install a base Sony image on the reader first.
2. On Windows, use the provided installer tool to flash the base image.
3. Transfer the PRS+ update package or `PRSPInstaller` folder to the reader’s internal memory.
4. Reboot the reader.
5. The firmware installer runs automatically during startup.
6. Delete the install folder after the update completes.

This repo is therefore not a traditional source-code repository for a host app; it is a firmware customization package that is installed onto the reader hardware itself.

## Operational notes for future work

- Treat model-specific code as first-class; changes often need to be mirrored across `300`, `350`, `505`, `600`, `650`, and `950` variants.
- The runtime is script-driven and highly sensitive to file layout, config paths, and the reader’s filesystem structure.
- The project has a strong “compatibility layer” concept; behavior diverges by device model.
- Packaging and installation are as important as the code itself, because these devices require a clean base image plus a PRS+ update package.
- The changelog shows a long evolution from early beta builds to broad device support, meaning compatibility and versioning matter more than in a normal app codebase.

## Summary

This repo is a legacy, model-specific firmware customization project for Sony PRS e-readers. The key theme is: take a stock reader, patch its runtime and UI via JS-based bootstrapping, and add book management, reading enhancements, localization, and utilities without rewriting the device firmware from scratch. The codebase is highly device-aware, installation-focused, and built around a compatibility/bootstrapping architecture rather than ordinary application engineering.
