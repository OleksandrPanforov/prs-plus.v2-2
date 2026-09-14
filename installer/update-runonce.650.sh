# Run installer script, if present
if [ -f /Data/PRSPInstaller/installer.sh ]
then
	. /Data/PRSPInstaller/installer.sh
	rm -R /Data/PRSPInstaller
fi

# Run the newly installed PRS+ startup script, if present
if [ -f /opt1/dict/prsp/prsp.sh ]
then
	. /opt1/dict/prsp/prsp.sh
fi

rm /Data/runonce.sh
