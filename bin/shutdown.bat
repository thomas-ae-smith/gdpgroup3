@echo off

call setenv.bat

if not %WMSENVOK% == "true" goto end

set _WINDOWNAME="Wowza Media Server 3"
set _EXESERVER=

set CLASSPATH="%WMSAPP_HOME%\bin\wms-bootstrap.jar"

%_EXESERVER% "%_EXECJAVA%" -Dcom.wowza.wms.AppHome="%WMSAPP_HOME%" -Dcom.wowza.wms.ConfigHome="%WMSCONFIG_HOME%" -cp %CLASSPATH% com.wowza.wms.bootstrap.Bootstrap stop

:end