from flask import Flask, request
from flask_mysqldb import MySQL
import json
from flask_cors import CORS

app = Flask(__name__, static_url_path='')
CORS(app)
app._static_folder = './'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'root'
app.config['MYSQL_DB'] = 'kw_db'
app.config['MYSQL_HOST'] = 'localhost'
mysql = MySQL(app)

keywords = None
with open('keywords.json') as keywords_file:
    keywords = json.load(keywords_file)

kw_dict = {}
for i in range(len(keywords)):
    kw_dict[keywords[i]] = i

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/data', methods=['GET',])
def data():
    timeunit = int(request.args.get('timeunit', ''))
    keywordfilter = request.args.get('keywordfilter', '')
    keywords = request.args.get('keywords', '').split(',')
    keywords_validated = []
    kw = []
    for k in keywords:
        if kw_dict.has_key(k):
            keywords_validated.append(k)
            kw.append(kw_dict[k])
    start_time = 1481787937000
    end_time = 1481827066000
    start_time = start_time - start_time%timeunit
    end_time = end_time - end_time%timeunit + timeunit

    if keywordfilter is '':
        filters = []
    else :
        filters = keywordfilter.split(',')

    cur = mysql.connection.cursor()
    cur.execute('SELECT * FROM tweets0 WHERE date>={0} and date<={1}'.format(start_time, end_time))
    rv0 = cur.fetchall()
    cur.execute('SELECT * FROM tweets1 WHERE date>={0} and date<={1}'.format(start_time, end_time))
    rv1 = cur.fetchall()
    result = {}
    for j in range(len(rv0)):
        d0 = rv0[j]
        d1 = rv1[j]
        date = d0[1]
        values = d0[2:] + d1[2:]
        index = date / timeunit
        if not result.has_key(index):
             result[index] = {
                'date': index * timeunit,
                'values': [0] * len(kw),
             }
        for i in range(len(kw)):
            result[index]['values'][i] += values[kw[i]]
    ret = []
    for k,v in result.items():
        ret.append(v)

    return json.dumps({
        'keywords': keywords_validated,
        'timerange': [start_time, end_time],
        'timeunit': timeunit,
        'data': ret,
    })

if __name__ == "__main__":
    app.run()
