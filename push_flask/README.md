
venv構築とstreamlit起動まで
 - 初回
``` sh
cd push_flask
sudo apt install python3.12-venv
python3 -m venv flask
cd ../
source push_flask/flask/bin/activate
pip install -r push_flask/requirements.txt
export FLASK_APP=push_flask
export FLASK_ENV=development
flask run
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