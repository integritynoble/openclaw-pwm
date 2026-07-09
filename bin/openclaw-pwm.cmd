@echo off
REM openclaw-pwm — launch OpenClaw routed through the PWM token exchange (Windows).
setlocal

if "%PWM_API_KEY%"=="" (
  echo openclaw-pwm: PWM_API_KEY is not set.
  echo Get a key at https://token.comparegpt.io then run:
  echo   set PWM_API_KEY=sk-pwm-your_key_here
  echo   openclaw-pwm
  exit /b 1
)

where openclaw >nul 2>nul
if errorlevel 1 (
  echo openclaw-pwm: the 'openclaw' CLI was not found on PATH. Install it first: npm install -g openclaw
  exit /b 1
)

set "CONFIG_DIR=%USERPROFILE%\.config\openclaw"
set "CONFIG_FILE=%CONFIG_DIR%\openclaw.json"
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
if not exist "%CONFIG_FILE%" (
  copy /Y "%~dp0..\openclaw.pwm.json" "%CONFIG_FILE%" >nul
  echo openclaw-pwm: wrote PWM provider config to %CONFIG_FILE%
)

openclaw %*
