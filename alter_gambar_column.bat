@echo off
echo ========================================
echo ALTER TABLE GAMBAR TO LONGTEXT
echo ========================================
echo.

echo Connecting to MySQL...
echo.

cd /d "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin"

echo Running ALTER TABLE command...
mysql.exe -u root --port=3308 -e "USE mimatcha_db; ALTER TABLE produk MODIFY COLUMN gambar LONGTEXT;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Column 'gambar' changed to LONGTEXT
    echo ========================================
    echo.
    echo Verifying the change...
    mysql.exe -u root --port=3308 -e "USE mimatcha_db; SHOW COLUMNS FROM produk LIKE 'gambar';"
    echo.
    echo ========================================
    echo DONE! You can now add products with large images.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR! Failed to alter table.
    echo ========================================
)

echo.
pause
