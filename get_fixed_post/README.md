
venv構築
``` sh
cd get_fixed_post
sudo apt install python3.12-venv
python3 -m venv venv
cd ../
source get_fixed_post/venv/bin/activate
pip install -r get_fixed_post/requirements.txt

```
 - 2回目以降
``` sh
source push_flask/flask/bin/activate
export FLASK_APP=push_flask
export FLASK_ENV=development
flask run
```

streamlit終了とvenvの抜け方
``` sh
# ctrl + C でstreamlit終了
deactivate
```