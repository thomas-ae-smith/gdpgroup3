set WshShell = CreateObject("WScript.Shell")

const HKEY_LOCAL_MACHINE = &H80000002
strComputer = "."
 
Set oReg=GetObject("winmgmts:{impersonationLevel=impersonate}!\\" &_
 strComputer & "\root\default:StdRegProv")

jdkRegistryKey = "SOFTWARE\JavaSoft\Java Development Kit"

strKeyPath = jdkRegistryKey
strValueName = "CurrentVersion"
oReg.GetStringValue HKEY_LOCAL_MACHINE, strKeyPath, strValueName, CurrentVersion

isFound = false
if not IsNull(CurrentVersion) then
	strKeyPath = jdkRegistryKey + "\"+CurrentVersion
	strValueName = "JavaHome"
	oReg.GetStringValue HKEY_LOCAL_MACHINE, strKeyPath, strValueName, JDKHome

	if not IsNull(JDKHome) then
		isFound = true
		JDKHome = JDKHome + "\bin\jconsole.exe"
		WshShell.Exec(JDKHome)
	end if
end if

if not isFound then
	MsgBox "JConsole cannot be found."+vbCRLF+vbCRLF+"To run JConsole, please install the Java Developement Kit version 5 (aka 1.5) or greater."+vbCRLF+"The Sun JDK can be downloaded at: http://java.sun.com", (vbOKOnly + vbInformation), "Wowza Media Server 3: JConsole"
end if