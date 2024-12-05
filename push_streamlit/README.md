
venv構築とstreamlit起動まで
``` sh
sudo apt install python3.12-venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit.py
```

streamlit終了とvenvの抜け方
``` sh
# ctrl + C でstreamlit終了
deactivate
```