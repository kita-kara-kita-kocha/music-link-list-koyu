
venv構築
``` sh
cd get_fixed_post
sudo apt install python3.12-venv
python3 -m venv venv
cd ../
source get_fixed_post/venv/bin/activate
pip install -r get_fixed_post/requirements.txt
python get_fixed_post/main.py
```
 - 2回目以降
``` sh
source get_fixed_post/venv/bin/activate
python get_fixed_post/main.py
```

streamlit終了とvenvの抜け方
``` sh
# ctrl + C でstreamlit終了
deactivate
```