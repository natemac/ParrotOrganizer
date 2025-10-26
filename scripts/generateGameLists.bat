@echo off
REM Generate game lists for ParrotOrganizer
REM Run this script from the ParrotOrganizer folder

echo Generating game lists...

REM Create data folder if it doesn't exist
if not exist "data" mkdir data

REM Generate GameProfiles list
cd ..\GameProfiles
dir /b *.xml > ..\ParrotOrganizer\data\gameProfiles_temp.txt
cd ..\ParrotOrganizer

REM Remove .xml extension
powershell -Command "(Get-Content data\gameProfiles_temp.txt) -replace '\.xml$', '' | Set-Content data\gameProfiles.txt"
del data\gameProfiles_temp.txt

REM Generate UserProfiles list
cd ..\UserProfiles
if exist *.xml (
    dir /b *.xml > ..\ParrotOrganizer\data\userProfiles_temp.txt
    cd ..\ParrotOrganizer
    powershell -Command "(Get-Content data\userProfiles_temp.txt) -replace '\.xml$', '' | Set-Content data\userProfiles.txt"
    del data\userProfiles_temp.txt
) else (
    cd ..\ParrotOrganizer
    echo. > data\userProfiles.txt
)

echo Done! Game lists generated in data folder.
pause
