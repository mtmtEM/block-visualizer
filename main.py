from flask import Flask, request, render_template, redirect, url_for, jsonify, abort
from datetime import datetime
import ipaddress, os, sys, traceback
from werkzeug.datastructures import ImmutableMultiDict
import configparser

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

config = configparser.ConfigParser()
config.read('config.ini')


### エラーハンドリング
@app.errorhandler(400)
def error_bad_request(error):
    response = {
        'type':str(error),
        'msg':"不正なリクエストです. 再度入力した情報をご確認ください."
    }
    return render_template('access_failed.html', msg=response), 400

@app.errorhandler(404)
def error_not_found(error):
    response = {
        'type':str(error),
        'msg':"ページが見つかりませんでした. URLを再度ご確認ください."
    }
    return render_template('access_failed.html', msg=response), 404

@app.errorhandler(405)
def error_method_not_allowed(error):
    response = {
        'type':str(error),
        'msg':"不正なリクエストです. URLを再度ご確認ください."
    }
    return render_template('access_failed.html', msg=response), 405

@app.errorhandler(408)
def error_request_timeout(error):
    response = {
        'type':str(error),
        'msg':"タイムアウトとなりました. 検索条件をご確認ください."
    }
    return render_template('access_failed.html', msg=response), 408

@app.errorhandler(500)
def error_internal_server(error):
    response = {
        'type':str(error),
        'msg':"予期せぬエラーが発生しました. 詳細は管理者またはシステムログをご確認ください."
    }
    return render_template('access_failed.html', msg=response), 500

@app.route('/d3_nodes', methods=['POST'])
def search_address():
    if request.method == 'POST':
        data = request.form
        form_value = data['form-value']
        return render_template("search_result.html", search_word=form_value)
    else:
        abort(404, 'Address Not Found.')

### システムの説明など
@app.route("/node_info")
def bitcoin_node_connection():
    return render_template("node_info.html")

### システムの使い方
@app.route("/d3_hoge")
def d3_hoge():
    return render_template("d3_hoge.html")

### システムの説明など
@app.route("/about")
def explain_block_visualizer():
    return render_template("about.html")

### メインページ
@app.route("/")
def index():
    return render_template("index.html")

def main():
    app.run()

if __name__ == "__main__":
    main()
