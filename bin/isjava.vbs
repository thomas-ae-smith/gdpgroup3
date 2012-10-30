set WshShell = CreateObject("WScript.Shell")

Dim errmsg
Dim retVal

retVal = 0

On Error Resume Next
Set oExec = WshShell.Exec("java -version")
If Err.Number<>0 Then
	errmsg = "Wowza Media Server 3 requires a Java 6 (aka 1.6) or greater VM to be installed."+vbCRLF+"Before attempting to run the server, please install a Java 6 compatible VM."+vbCRLF+"Detected java version (java -version):"+vbCRLF+vbCRLF+"<cannot find command java>"
	MsgBox errmsg, (vbOKOnly + vbInformation), "Wowza Media Server (Java installation not found)"
	retVal = 1
else
	Dim javaVersion
	If Not oExec.StdOut.AtEndOfStream Then
	  javaVersion = oExec.StdOut.ReadAll
	End If

	If Not oExec.StdErr.AtEndOfStream Then
	  javaVersion = oExec.Stderr.ReadAll
	End If
	
	Dim pos
	pos = InStr(javaVersion, "1.6")
	if pos = 0 then
		pos = InStr(javaVersion, "1.7")
	end if
	if pos = 0 then
		pos = InStr(javaVersion, "1.8")
	end if

	if pos = 0 then
		errmsg = "Wowza Media Server 3 requires a Java 6 (aka 1.6) or greater VM to be installed."+vbCRLF+"Before attempting to run the server, please install a Java 6 compatible VM."+vbCRLF+"Detected java version (java -version):"+vbCRLF+vbCRLF+javaVersion
		MsgBox errmsg, (vbOKOnly + vbInformation), "Wowza Media Server (Java version incompatible)"
		retVal = 1
	end if
end if

Wscript.Quit retVal