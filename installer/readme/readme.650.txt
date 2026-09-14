PRS+ update for Sony PRS-650

Warning: make sure your reader is at least 75% charged before starting.

This package is an update package for a reader that already has PRS+ and its
PRS+ bootstrap firmware installed. It is not a first-install package. The
first installation must be performed with the historical PRS-650 `setup.exe`,
which installs the patched Rootfs containing the early-boot `runonce.sh` hook.

1) Connect the reader to your computer.
2) Copy the complete `PRSPInstaller` folder and the `runonce.sh` file from
   this archive to the root of the reader's internal storage.
3) Safely eject the reader. Do not rely on a power-cycle to start the update.
4) On a previously bootstrapped reader, the installed Rootfs consumes
   `/Data/runonce.sh` while the reader transitions from USB/recovery mode back
   to normal mode.
5) Wait for the reader to finish restarting before disconnecting power or
   removing files.

The root `runonce.sh` file is the historical PRS+ update script: it sources
`PRSPInstaller/installer.sh`, removes the staging folder, reloads the installed
PRS+ startup script, and removes itself. The installer replaces the existing
PRS+ files. Installation details are written to
`Data/PRSPInstaller/install.log` while the installer is running.

If the reader has no patched PRS+ Rootfs, simply copying this package cannot
trigger an update. Do not manually replace `/opt1/dict/prsp`; use the original
first-install procedure or a known-good recovery path.

If the reader does not start normally after installation, do not interrupt it
repeatedly. Reconnect it, copy the installation log before troubleshooting,
and use the reader's safe-mode procedure.