@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ระบบใบเสนอราคา - อย่าปิดหน้าต่างนี้

echo.
echo   ========================================
echo      ระบบใบเสนอราคา
echo   ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [!] ไม่พบ Node.js ในเครื่อง
  echo       ติดตั้งก่อนที่ https://nodejs.org  ^(เลือกรุ่น LTS^)
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   กำลังติดตั้งส่วนประกอบครั้งแรก ใช้เวลาสักครู่...
  echo.
  call npm install
  if errorlevel 1 goto :error
  echo.
)

if not exist ".next\BUILD_ID" (
  echo   กำลังเตรียมโปรแกรม ใช้เวลาสักครู่...
  echo.
  call npm run build
  if errorlevel 1 goto :error
  echo.
)

echo   กำลังเปิดโปรแกรม...
echo.
echo   * เปิดเบราว์เซอร์ให้อัตโนมัติ ถ้าไม่ขึ้นให้พิมพ์ http://localhost:3000
echo   * ปิดโปรแกรมด้วยการปิดหน้าต่างสีดำนี้
echo   * เครื่องอื่นในออฟฟิศเข้าได้ที่ที่อยู่ Network ที่แสดงด้านล่าง
echo.

start "" http://localhost:3000
call npm run start
goto :eof

:error
echo.
echo   [!] เกิดข้อผิดพลาด ดูข้อความด้านบน
echo.
pause
exit /b 1
