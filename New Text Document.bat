@echo off
title رفع المشروع على GitHub

echo === إعداد بيانات المستخدم ...
git config --global user.name "Flex"
git config --global user.email "fmagdy01273171770@gmail.com
"

echo === إزالة remote القديم (لو موجود) ...
git remote remove origin 2>nul

echo === ربط الريبو ...
git remote add origin https://github.com/flex8594156/wyhetxndfgxnfg.git

echo === اضافة جميع الملفات ...
git add .

echo === عمل commit ...
git commit -m "Initial commit"

echo === معرفة اسم الفرع الحالي ...
FOR /F "delims=* " %%i IN ('git branch --show-current') DO SET branch=%%i

echo === الفرع الحالي: %branch%

echo === رفع الملفات ...
git push -u origin %branch%

echo.
echo === تم رفع المشروع بنجاح على GitHub ===

cmd /k
