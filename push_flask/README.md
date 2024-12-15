
venv構築とstreamlit起動まで
 - 初回
``` sh
cd push_flask
sudo apt install python3.12-venv
python3 -m venv flask
source flask/bin/activate
pip install -r requirements.txt
export FLASK_APP=push_flask
export FLASK_ENV=development
cd ../
flask run
```
 - 2回目以降
``` sh
cd push_flask
source flask/bin/activate
export FLASK_APP=push_flask
export FLASK_ENV=development
cd ../
flask run
```

streamlit終了とvenvの抜け方
``` sh
# ctrl + C でstreamlit終了
deactivate
```