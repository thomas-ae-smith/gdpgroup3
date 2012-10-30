@echo off

set _EXECJAVA=java
set JAVA_OPTS=-Xmx2048M

rem If running JDK, uncomment to run server environment (faster)
set JAVA_OPTS=%JAVA_OPTS% -server

rem Better garbage collection setting to avoid long pauses
rem set JAVA_OPTS=%JAVA_OPTS% -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:NewSize=512m

rem Uncomment to log debug garbage collection information
rem set NOW=%date:~10,4%-%date:~4,2%-%date:~7,2%-%time:~0,2%-%time:~3,2%
rem set JAVA_OPTS=%JAVA_OPTS% -verbose:gc -Xloggc:"%WMSAPP_HOME%/logs/gc_%NOW%.log" -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+PrintHeapAtGC

rem Uncomment to write heap dump on OutOfMemoryError
rem set JAVA_OPTS=%JAVA_OPTS% -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=%WMSAPP_HOME%

rem Uncomment to fix multicast crosstalk problem when streams share multicast port
rem set JAVA_OPTS=%JAVA_OPTS% -Djava.net.preferIPv4Stack=true

rem Uncomment to force Java to use specific language settings
rem set JAVA_OPTS=%JAVA_OPTS% -Duser.language=en -Duser.country=US -Dfile.encoding=Cp1252

set EXECCSCRIPT=cscript
if not exist "%SystemRoot%\SysWOW64\cscript.exe" goto skip64bitcscript
set EXECCSCRIPT="%SystemRoot%\SysWOW64\cscript.exe"
:skip64bitcscript

set WMSCONFIG_URL=
rem set WMSAPP_HOME=C:/wms2
rem set WMSCONFIG_HOME=C:/wms2

set WMSENVOK="false"

rem Guess WMSAPP_HOME if not defined
set CURRENT_DIR=%cd%
if not "%WMSAPP_HOME%" == "" goto gotAppHome
set WMSAPP_HOME=%CURRENT_DIR%
if exist "%WMSAPP_HOME%\bin\startup.bat" goto okAppHome
cd ..
set WMSAPP_HOME=%cd%
cd %CURRENT_DIR%
:gotAppHome
if exist "%WMSAPP_HOME%\bin\startup.bat" goto okAppHome
%EXECSCRIPT% "displaymsg.vbs" "The WMSAPP_HOME environment variable is missing or not defined correctly (%WMSAPP_HOME%). This environment variable is needed to run the server."
goto end
:okAppHome

rem Guess WMSCONFIG_HOME if not defined
set CURRENT_DIR=%cd%
if not "%WMSCONFIG_HOME%" == "" goto gotConfigHome
set WMSCONFIG_HOME=%WMSAPP_HOME%
if exist "%WMSCONFIG_HOME%\conf\Server.license" goto okConfigHome
cd ..
set WMSCONFIG_HOME=%cd%
cd %CURRENT_DIR%
:gotConfigHome
if exist "%WMSCONFIG_HOME%\conf\Server.license" goto okConfigHome
%EXECSCRIPT% "displaymsg.vbs" "The WMSCONFIG_HOME environment variable is missing or not defined correctly (%WMSCONFIG_HOME%). This environment variable is needed to run the server."
goto end
:okConfigHome

%EXECSCRIPT% "checkjavahome.vbs" //Nologo
if not %errorlevel% == 0 goto end

set WMSENVOK="true"
rem set _EXECJAVA=%JAVA_HOME%\bin\java.exe
set _EXECJAVA=c:\Program Files\java\jdk1.7.0_07\bin\java.exe
:end
