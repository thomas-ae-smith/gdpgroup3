@echo off

call setenv.bat

if not %WMSENVOK% == "true" goto end

set CLASSPATH="%WMSAPP_HOME%\bin\genkey.jar"

"%_EXECJAVA%" -cp %CLASSPATH% main.Main %1 %2 %3

:end