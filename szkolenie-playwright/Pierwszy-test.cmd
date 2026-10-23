@echo off
chcp 65001 >nul
pushd "%~dp0"
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts 01-pierwszy-test.spec.ts --headed
set "SZKOLENIE_EXIT=%errorlevel%"
echo.
pause
popd
exit /b %SZKOLENIE_EXIT%
