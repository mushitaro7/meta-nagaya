@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo   🏮 メタNAGA屋 開発サーバー起動
echo ==========================================
echo.
echo [1/2] Socket.io サーバーを起動中...
start "メタNAGA屋-サーバー" cmd /k "cd /d f:\MetaNagaya\server && node index.js"

echo [2/2] フロントエンドを起動中（3秒後）...
timeout /t 3 /nobreak > nul
start "メタNAGA屋-フロント" cmd /k "cd /d f:\MetaNagaya && npm run dev"

echo.
echo ==========================================
echo   ✅ 起動完了！
echo   フロント: http://localhost:5173
echo   サーバー: http://localhost:3001
echo   ヘルスチェック: http://localhost:3001/health
echo ==========================================
echo.
echo ※ 複数タブ/ウィンドウで開くとマルチプレイヤーをテストできます
pause
