var express = require('express'), fs = require('fs'), app = module.exports = express.createServer();
//app config
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
    app.set('view options', {
        layout: false
    });
});
function getId(){
    var now = new Date();
    return now.getTime();
}
function createProblem(res, id){
    var key = false,problem;
    if(!id){
        id = getId();
        key = true;
    }
    problem = '{"id": ' + id + ', "code": "Hello World"}';
    fs.writeFile('data/' + id + '.json', problem, 'utf8', function(err){
        if (err) {
            throw err;
        }
        else {
            problem = JSON.parse(problem);
            toHtml(id, res, problem, key);
        }
    });
}
function toHtml(id, res, problem, key){
    var code = enhtmlspecialchars(decodeURIComponent(problem.code)),
    html = decodeURIComponent(problem.code);
    fs.writeFile('public/html/' + id + '.html', code, 'utf8', function(err){
        if (err) {
            throw err;
        }
        else {
            problem['code'] = html;
            if (key) {
                res.render('index', problem);
            }
        }
    });
    
}
function enhtmlspecialchars(str){
    if (typeof(str) == "string") {       
        str = str.replace(/&quot;/g, "\"");
        str = str.replace(/%E2%80%98/g, "'");
        str = str.replace(/&lt;/g, "<");
        str = str.replace(/&gt;/g, ">");
        str = str.replace(/&brvbar;/g, '|');
        str = str.replace(/&amp;/g, "&"); /* must do &amp; last */
    }
    console.log('==========='+str+'=====');
    return str;
}
app.get('/:id', function(req, res){
    var id = req.params.id, problem;
    if (+id) {
        fs.readFile('data/' + id + '.json', 'utf8', function(err, data){
            if (err) {
                createProblem(res);
            }
            else {
                problem = JSON.parse(data);
                toHtml(id, res, problem, true);
            }
        });
    }
});
app.get('/*', function(req, res){
    var id = getId();
    createProblem(res, id);
    res.redirect('/'+id);    
});
app.post('/code/*', function(req, res){
    var id = req.body.id, code = req.body.code, encode =encodeURIComponent(code), problem = '{"id": ' + id + ', "code": "' + encode + '"}';
    fs.writeFile('data/' + id + '.json', problem, 'utf8', function(err){
        if (err) {
            res.write('0');
            res.end();
            throw err;            
        }
        else {
            fs.writeFile('public/html/' + id + '.html', enhtmlspecialchars(code), 'utf8', function(err){
                if (err) {
                    res.write('0');
                    res.end();
                    throw err; 
                }else{
                    res.write('1');
                    res.end();
                }
            });
        }
    });
});
app.listen(80);
