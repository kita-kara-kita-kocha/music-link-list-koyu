from flask import Flask, request, render_template_string
from time_parse import time_str_to_seconds

app = Flask(__name__)

HTML = '''
<!doctype html>
<title>時間表記→秒数変換</title>
<h1>時間表記（h:m:s または m:s）を秒数に変換</h1>
<form method="post">
  <input name="time_str" placeholder="例: 1:23:45 または 12:34" required>
  <input type="submit" value="変換">
</form>
{% if result is not none %}
  <h2>結果: {{ result }}s</h2>
{% elif error %}
  <h2 style="color:red;">{{ error }}</h2>
{% endif %}
'''

@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    error = None
    if request.method == 'POST':
        time_str = request.form.get('time_str', '')
        try:
            result = time_str_to_seconds(time_str)
        except Exception as e:
            error = str(e)
    return render_template_string(HTML, result=result, error=error)

if __name__ == '__main__':
    app.run(debug=True)
