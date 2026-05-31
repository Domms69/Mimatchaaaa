@echo off
echo ========================================
echo RESTART LARAGON APACHE
echo ========================================
echo.

echo Stopping Apache...
taskkill /F /IM httpd.exe >nul 2>&1

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting Laragon...
start "" "C:\laragon\laragon.exe"

echo Waiting 5 seconds for services to start...
timeout /t 5 /nobreak >nul

echo.
echo Testing API...
curl -s "http://testtt.test/api/index.php?action=get_products" | findstr "id_produk"

echo.
echo ========================================
echo DONE! Press any key to close...
pause >nul
