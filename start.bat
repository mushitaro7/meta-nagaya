@echo off
chcp 65001 > nul
echo.
echo  🏮 メタNAGA屋 起動中...
echo  =====================================
echo.

:: マルチプレイヤーサーバー起動
echo  📡 マルチプレイヤーサーバー起動... (port 3001)
start "MetaNagaya-Server" cmd /k "cd /d f:\MetaNagaya\server && node index.js"

:: 少し待ってからViteを起動
timeout /t 2 /nobreak > nul

:: フロントエンド起動
echo  🌐 フロントエンド起動... (port 5173)
start "MetaNagaya-Frontend" cmd /k "cd /d f:\MetaNagaya && npm run dev"

echo.
echo  ✅ 起動完了！
echo  フロント: http://localhost:5173
echo  サーバー: http://localhost:3001
echo.
timeout /t 3 /nobreak > nul

:: ブラウザで開く
start http://localhost:5173
