#!/bin/zsh
cd "$(dirname "$0")"
echo "在浏览器打开 http://127.0.0.1:4321"
echo "结束预览时按 Control-C。"
python3 serve.py
