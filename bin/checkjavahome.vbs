set WshShell = CreateObject("WScript.Shell")

on error resume next

Dim retVal
Dim logInfo

retVal = 0
logInfo = false

const HKEY_LOCAL_MACHINE = &H80000002
const CURRVERREGKEY = "CurrentVersion"
const JAVAHOMEREGKEY = "JavaHome"
const JAVAHOMEVAR = "JAVA_HOME"
const JAVACMD = "\bin\java.exe"
const JDKREGKEY = "SOFTWARE\JavaSoft\Java Development Kit"
const JREREGKEY = "SOFTWARE\JavaSoft\Java Runtime Environment"

rem Set oReg = GetObject("winmgmts:{impersonationLevel=impersonate}!\\.\root\default:StdRegProv")
rem http://davidgardiner.blogspot.com/2007/03/listing-installed-applications-on-vista.html

Dim oReg64
Dim oReg32

oReg64 = NULL
oReg32 = NULL

if Isx64(".") then
	Set objCtx = CreateObject("WbemScripting.SWbemNamedValueSet")
	objCtx.Add "__ProviderArchitecture", 64
	objCtx.Add "__RequiredArchitecture", TRUE
	Set objLocator = CreateObject("Wbemscripting.SWbemLocator")
	Set objServices = objLocator.ConnectServer("","root\default","","",,,,objCtx)
	Set oReg64 = objServices.Get("StdRegProv") 
end if

Set objCtx = CreateObject("WbemScripting.SWbemNamedValueSet")
objCtx.Add "__ProviderArchitecture", 32
objCtx.Add "__RequiredArchitecture", TRUE
Set objLocator = CreateObject("Wbemscripting.SWbemLocator")
Set objServices = objLocator.ConnectServer("","root\default","","",,,,objCtx)
Set oReg32 = objServices.Get("StdRegProv") 

Set oFSO = CreateObject("Scripting.FileSystemObject")
set oEnvSys = WshShell.Environment("System")

Dim isJavaHomeSet
Dim javaHomeVal
Dim javaHomeVersionStr
Dim javaHomeVersionOK

Dim jdkVersion
Dim jdkVersionStr
Dim jdkVersionOk
Dim jreVersion
Dim jreVersionStr
Dim jreVersionOk
Dim jdkPath
Dim jrePath
Dim javaVersionStr
Dim setJavaHomePrompt
Dim doSetJavaHome

isJavaHomeSet = false
javaHomeVal = NULL
javaHomeVersionStr = NULL
javaHomeVersionOK = false
jdkVersion = NULL
jdkVersionStr = NULL
jdkVersionOk = false
jreVersion = NULL
jreVersionStr = NULL
jreVersionOk = false
jdkPath = NULL
jrePath = NULL
javaVersionStr = NULL
setJavaHomePrompt = NULL
doSetJavaHome = false

Function Isx64(strComputer)
	Set objWMI = GetObject("winmgmts:\\" & strComputer & "\root\CIMV2")
	Set colItems = objWMI.ExecQuery("Select AddressWidth FROM Win32_Processor","WQL",wbemRetImm + wbemForOnly)
	Isx64 = False
	For Each objItem In colItems
	    If objItem.AddressWidth = "64" Then Isx64 = True
	Next
End Function

Function readGetValue(keyStr, valueStr)
	Dim value
	
	value = NULL
	oReg32.GetStringValue HKEY_LOCAL_MACHINE, keyStr, valueStr, value
	if not IsNull(oReg64) and IsNull(value) then
		oReg64.GetStringValue HKEY_LOCAL_MACHINE, keyStr, valueStr, value
	end if
	
	readGetValue = value
	
End Function

Function getJavaVersionStr(javaPath)

	Dim tmpStr
	
	tmpStr = NULL
	
	Err.Clear
	Set oExec = WshShell.Exec("""" & javaPath & """ -version")
	If Err.Number = 0 Then
		If Not oExec.StdOut.AtEndOfStream Then
		  tmpStr = oExec.StdOut.ReadAll
		End If

		If Not oExec.StdErr.AtEndOfStream Then
		  tmpStr = oExec.Stderr.ReadAll
		End If
	end if
	Err.Clear
	
	if IsNull(tmpStr) then
		tmpStr = "Java version unknown"
	end if
	
	getJavaVersionStr = tmpStr
	
End Function

Function isJavaVersionOk(javaVersion)

	isJavaVersionOk = false

	Dim pos
	pos = InStr(javaVersion, "1.6")
	if pos = 0 then
		pos = InStr(javaVersion, "1.7")
	end if
	if pos = 0 then
		pos = InStr(javaVersion, "1.8")
	end if

	if pos > 0 then
		isJavaVersionOk = true
	end if

End Function

javaHomeVal = oEnvSys(JAVAHOMEVAR)
if not IsNull(javaHomeVal) then
	isJavaHomeSet = true
	if oFSO.FileExists(javaHomeVal & JAVACMD) then
		rem javaHomeVersionStr = getJavaVersionStr(javaHomeVal & JAVACMD)
		rem javaHomeVersionOK = isJavaVersionOk(javaHomeVersionStr)
		javaHomeVersionStr = "Valid Java Runtime"
		javaHomeVersionOK = true
	end if
end if

if logInfo then
	Wscript.Echo "isJavaHomeSet: " & isJavaHomeSet
	Wscript.Echo "javaHomeVal: " & javaHomeVal
	Wscript.Echo "javaHomeVersionStr: " & javaHomeVersionStr
	Wscript.Echo "javaHomeVersionOK: " & javaHomeVersionOK
end if

if not javaHomeVersionOK then
	
	jdkVersion = readGetValue(JDKREGKEY, CURRVERREGKEY)
	if not IsNull(jdkVersion) then
		jdkPath = readGetValue((JDKREGKEY + "\" + jdkVersion), JAVAHOMEREGKEY)
		if RIGHT(jdkPath, 1) = "\" then
			jdkPath = LEFT(jdkPath, LEN(jdkPath)-1)
		end if
		if not IsNull(jdkPath) then
			if oFSO.FileExists(jdkPath & JAVACMD) then
				jdkVersionStr = getJavaVersionStr(jdkPath & JAVACMD)
				jdkVersionOk = isJavaVersionOk(jdkVersionStr)
			end if
		end if
	end if

	jreVersion = readGetValue(JREREGKEY, CURRVERREGKEY)
	if not IsNull(jreVersion) then
		jrePath = readGetValue((JREREGKEY + "\" + jreVersion), JAVAHOMEREGKEY)
		if RIGHT(jrePath, 1) = "\" then
			jrePath = LEFT(jrePath, LEN(jrePath)-1)
		end if
		if not IsNull(jrePath) then
			if oFSO.FileExists(jrePath & JAVACMD) then
				jreVersionStr = getJavaVersionStr(jrePath & JAVACMD)
				jreVersionOk = isJavaVersionOk(jreVersionStr)
			end if
		end if
	end if

	if logInfo then
		Wscript.Echo "jdkVersion: " & jdkVersion
		Wscript.Echo "jdkVersionStr: " & jdkVersionStr
		Wscript.Echo "jdkVersionOk: " & jdkVersionOk
		Wscript.Echo "jdkPath: " & jdkPath
		Wscript.Echo "jreVersion: " & jreVersion
		Wscript.Echo "jreVersionStr: " & jreVersionStr
		Wscript.Echo "jreVersionOk: " & jreVersionOk
		Wscript.Echo "jrePath: " & jrePath
	end if

	Dim prompt

	if jdkVersionOk then
		javaVersionStr = jdkVersionStr
	elseif jreVersionOk then
		javaVersionStr = jreVersionStr
	elseif not IsNull(jdkVersionStr) then
		javaVersionStr = jdkVersionStr
	elseif not IsNull(jreVersionStr) then
		javaVersionStr = jreVersionStr
	else
		javaVersionStr = "Java version unknown"+vbCRLF
	end if


	Dim javaMissingMsg

	javaMissingMsg = ""
	javaMissingMsg = javaMissingMsg + "Wowza Media Server 3 requires a Java 6 (aka 1.6) or greater VM to be installed."+vbCRLF
	javaMissingMsg = javaMissingMsg + "Before attempting to run the server, please install a Java 6 compatible VM."+vbCRLF
	javaMissingMsg = javaMissingMsg + "Most recent version of Java preferred."+vbCRLF+vbCRLF

	javaMissingMsg = javaMissingMsg + "Detected java version (java -version):"+vbCRLF+vbCRLF+javaVersionStr

	javaMissingMsg = javaMissingMsg + vbCRLF
	javaMissingMsg = javaMissingMsg + "If you do have a Java 6 compatible VM installed, set the JAVA_HOME environment variable"+vbCRLF
	javaMissingMsg = javaMissingMsg + "to the location of your Java installation."+vbCRLF

	Dim updateJavaHomeMsg

	updateJavaHomeMsg = ""
	updateJavaHomeMsg = updateJavaHomeMsg + "Wowza Media Server 3 requires a Java 6 (aka 1.6) or greater VM to be installed."+vbCRLF
	updateJavaHomeMsg = updateJavaHomeMsg + "The JAVA_HOME environment variable is missing or does not point to a valid Java environment."+vbCRLF
	updateJavaHomeMsg = updateJavaHomeMsg + "A valid Java environment has been found on your machine."+vbCRLF+vbCRLF

	updateJavaHomeMsg = updateJavaHomeMsg + "Detected java version (java -version):"+vbCRLF+vbCRLF+javaVersionStr

	updateJavaHomeMsg = updateJavaHomeMsg + vbCRLF
	updateJavaHomeMsg = updateJavaHomeMsg + "Would you like the JAVA_HOME environment variable updated to point to this Java environment?"+vbCRLF

	if isJavaHomeSet then

		if not javaHomeVersionOK then
			if jdkVersionOk or jreVersionOk then
				setJavaHomePrompt = updateJavaHomeMsg
			else
				MsgBox javaMissingMsg, (vbOKOnly + vbInformation), "Wowza Media Server 3 requires a Java 6 (aka 1.6)"
				retVal = 1
			end if
		end if

	elseif jdkVersionOk or jreVersionOk then
		setJavaHomePrompt = updateJavaHomeMsg
	else
		MsgBox javaMissingMsg, (vbOKOnly + vbInformation), "Wowza Media Server 3 requires a Java 6 (aka 1.6)"
		retVal = 1
	end if

	if not IsNull(setJavaHomePrompt) then
		Dim yesNoResponse
		yesNoResponse = MsgBox(setJavaHomePrompt, vbYesNo, "Update JAVA_HOME environment variable?")
		If yesNoResponse = vbYes Then
			doSetJavaHome = true
		else
			retVal = 1
		End If
	end if

	if doSetJavaHome then
	
		set oEnvProcess = WshShell.Environment("Process")
		set oEnvVolatile = WshShell.Environment("Volatile")
		
		if jdkVersionOk then
			oEnvSys(JAVAHOMEVAR) = jdkPath
			oEnvProcess(JAVAHOMEVAR) = jdkPath
			oEnvVolatile(JAVAHOMEVAR) = jdkPath
		elseif jreVersionOk then
			oEnvSys(JAVAHOMEVAR) = jrePath
			oEnvProcess(JAVAHOMEVAR) = jrePath
			oEnvVolatile(JAVAHOMEVAR) = jrePath
		end if

		Dim JavaHomeSet

		JavaHomeSet = ""
		

		if IsNull(oEnvSys(JAVAHOMEVAR)) or LEN(oEnvSys(JAVAHOMEVAR)) = 0 then
			JavaHomeSet = JavaHomeSet + "Insufficient permissions to set the JAVA_HOME environment variable."+ vbCRLF+vbCRLF
			JavaHomeSet = JavaHomeSet + "To set JAVA_HOME:"+ vbCRLF+vbCRLF
			JavaHomeSet = JavaHomeSet + Chr(149)+" Open the ""System"" control panel"+ vbCRLF
			JavaHomeSet = JavaHomeSet + Chr(149)+" Navigate to ""Advanced system settings"""+ vbCRLF
			JavaHomeSet = JavaHomeSet + Chr(149)+" Click the ""Environment Variables..."" button"+ vbCRLF
			JavaHomeSet = JavaHomeSet + Chr(149)+" Add a new variable named JAVA_HOME to the "+ vbCRLF
			JavaHomeSet = JavaHomeSet + "  ""System variables"" section that points to "+ vbCRLF
			JavaHomeSet = JavaHomeSet + "  the root of your Java installation."+ vbCRLF
			MsgBox JavaHomeSet, (vbOKOnly + vbExclamation), "Insufficient permissions to set JAVA_HOME"	
		else
			JavaHomeSet = JavaHomeSet + "The JAVA_HOME environment variable has been updated to:" + vbCRLF+vbCRLF
			JavaHomeSet = JavaHomeSet + oEnvSys(JAVAHOMEVAR)
			MsgBox JavaHomeSet, (vbOKOnly + vbInformation), "The JAVA_HOME environment variable has been updated"	
		end if

	
	end if
	
end if

Wscript.Quit retVal
