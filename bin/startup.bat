@echo off

call setenv.bat

if not %WMSENVOK% == "true" goto end

set _WINDOWNAME="Wowza Media Server 3"
set _EXESERVER=
if "%1"=="newwindow" (
set _EXESERVER=start %_WINDOWNAME%
shift
)

set CLASSPATH="%WMSAPP_HOME%\bin\wms-bootstrap.jar"
set CLASSPATH=%CLASSPATH:\=/%
set CLASSPATH=%CLASSPATH://=/%
   
rem cacls jmxremote.password /P username:R
rem cacls jmxremote.access /P username:R

set JMXOPTIONS=-Dcom.sun.management.jmxremote=true

rem log interceptor com.wowza.wms.logging.LogNotify - see Javadocs for ILogNotify

%_EXESERVER% "%_EXECJAVA%" %JAVA_OPTS% %JMXOPTIONS% -Dcom.wowza.wms.runmode="standalone" -Dcom.wowza.wms.native.base="win" -Dcom.wowza.wms.ConfigURL="%WMSCONFIG_URL%" -cp %CLASSPATH% com.wowza.wms.bootstrap.Bootstrap start

:end