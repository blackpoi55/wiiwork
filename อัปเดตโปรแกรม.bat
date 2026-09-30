@echo off
chcp 65001 >nul
cd /d "%~dp0"
title อัปเดตระบบใบเสนอราคา

echo.
echo   ========================================
echo      อัปเดตระบบใบเสนอราคา
echo   ========================================
echo.
echo   ใช้ไฟล์นี้เมื่อมีการแก้ไขโค้ดใหม่
echo   ข้อมูลใบเสนอราคาในโฟลเดอร์ data\ จะไม่ถูกแตะต้อง
echo.

where git >nul 2>nul
if errorlevel 1 goto :skipgit
echo   [1/3] ดึงโค้ดล่าสุดจาก GitHub...
call git pull
echo.
:skipgit

echo   [2/3] ติดตั้งส่วนประกอบ...
call npm install
if errorlevel 1 goto :error
echo.

echo   [3/3] สร้างโปรแกรมใหม่...
call npm run build
if errorlevel 1 goto :error
echo.

echo   เรียบร้อย เปิดใช้งานได้จากไฟล์ "เปิดโปรแกรม.bat"
echo.
pause
goto :eof

:error
echo.
echo   [!] เกิดข้อผิดพลาด ดูข้อความด้านบน
echo.
pause
exit /b 1
