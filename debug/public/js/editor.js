var editor, actionLock = false, tabkey = false, // 事件锁
 onStdErr = false, onStdOut = false, //鼠标是否在std的div区域内，如果在则不把滚动条往下拉
 timer = null, num = -1;
/*
 * 动态设定编辑器尺寸
 */
var setEditorSize = function(h, w, hideConsole, loc){
    var cli = $("#console");
    if (!h) {
        h = document.documentElement.clientHeight - (80 + 5); // 减去header和statusBar的部分
        if (!hideConsole && loc === "BOTTOM") 
            h -= cli.height() + 10; // 如果显示console，则要减去console的部分
    }
    if (!w) {
        w = document.body.clientWidth - 260; // 减去sidebar的部分
        if (!hideConsole && loc === "RIGHT") 
            w -= cli.width() + 10;
    }
    $("#tabs").width(w - 50);
    $("#statbar").width(w);
    $("#editor").css("height", h).css("width", w);
    if (editor) 
        editor.resize();
}

var setFileListSize = function(height, hideConsole, loc){
    height = height || document.documentElement.clientHeight - 145;
    if (!hideConsole && loc === "BOTTOM") {
        height -= 135;
    }
    $("#file-list").css({
        "height": height,
        "overflow": "auto"
    });
}

var setElementsSize = function(){
    var display = false, location;
    if (!display) {// 隐藏console
        setEditorSize(null, null, true);
        setFileListSize(null, true);
    }
    else {
        location = CLI.cache.location;
        if (location === "BOTTOM" || location === "RIGHT") {
            setEditorSize(null, null, false, location);
        }
        else {
            setEditorSize(null, null, false);
        }
        setFileListSize(null, false, location);
    }
}
var initEditor = function(){
    editor = ace.edit("editor");
    var HtmlMode = require("ace/mode/html").Mode, theme = cookieHandler.get('theme');
    editor.getSession().setMode(new HtmlMode());
    // 初始化编辑器配色方案
    theme = theme || "textmate";
    head.js("js/ace/theme-" + theme + ".js", function(){
        editor.setTheme("ace/theme/" + theme);
        $("#editor-theme option[value='" + theme + "']").attr("selected", "selected");
        $("#editor-theme").removeAttr("disabled");
    });
    editor.renderer.getShowPrintMargin(true);
    editor.renderer.setHScrollBarAlwaysVisible(false);
    // 绑定编辑器快捷键
    editor.commands.addCommand({
        name: 'Save',
        bindKey: {
            win: 'Ctrl-S',
            mac: 'Command-S',
            sender: 'editor'
        },
        exec: function(env, args, request){
            if (actionLock) 
                return false;
            actionLock = true;
            saveFile();
            actionLock = false;
        }
    });
    editor.getSession().on('change', onChange); // 绑定编辑器事件
    $("#editor-theme").change(function(){
        if (!editor) 
            return false;
        var theme = this.value;
        head.js("js/ace/theme-" + theme + ".js", function(){
            editor.setTheme("ace/theme/" + theme);
            cookieHandler.set('theme', theme);
        });
        return false;
    });
    $('#nav-save').click(function(){
        saveFile();
    });
    clip = new ZeroClipboard.Client();
    clip.setHandCursor(true);
    
    
    clip.addEventListener('mouseOver', function(client){
        // update the text on mouse over
        clip.setText($('#code-url').attr('href'));
    });
    
    clip.addEventListener('complete', function(client, text){
        showMsg('地址已经复制到剪贴板');
    });
    
    clip.glue('code-url', 'copy-wrap');
};
var starTab = function(add){
    tabkey = add;
    var target = $('.acttive'), fileName = target.attr("title"), html = '代码地址：<a target="_blank" href="' + fileName + '">' + fileName + '</a>'
    if (add) { // 加星号
        html += '*';
    }
    target.html(html);
}
var onChange = function(){
    starTab(true);
}
$(window).resize(function(){
    setElementsSize(); // 编辑器和控制台尺寸自适应
});


$(document).keydown(function(e){
    // 捕获键盘按键
    if (e.metaKey || e.ctrlKey) {
        var save = 'S';
        if (editor && e.keyCode === save.charCodeAt(0)) {
            if (actionLock) 
                return false;
            actionLock = true;
            saveFile();
            actionLock = false;
            return false;
        }
    }
});

window.onbeforeunload = function(){
    if (tabkey) { // 有尚未保存的文件
        return '文件尚未保存，现在离开本页面将丢失已修改的内容。确认离开页面？';
    }
};

var htmlspecialchars = function(str){
    if (typeof(str) == "string") {
        str = str.replace(/&/g, "&amp;"); /* must do &amp; first */
        str = str.replace(/"/g, "&quot;");
        //str = str.replace(/'/g, "&#039;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/>/g, "&gt;");
        str = str.replace(/\|/g, '&brvbar;');
    }
    return str;
}

/*
 * 显示顶部提示信息
 */
var showMsg = function(content, waiting, speed){
    if (typeof waiting === "undefined") 
        waiting = 1200;
    if (typeof speed === "undefined") 
        speed = 600;
    var msger = $("#msg");
    msger.html(content).slideDown(speed, function(){
        setTimeout(function(){
            msger.slideUp(speed);
        }, waiting);
    });
}

var setStatusBar = function(){
    var d = new Date(), curr = d.toLocaleString(), statbar = $("#statbar");
    statbar.html("已保存于" + curr);
}

/*
 * 保存文件
 */
var saveFile = function(){
    var e = editor.getSession(), content = htmlspecialchars(e.getValue()), id = $('#logo').attr('rel');
    $.ajax({
        url: '/code/',
        type: 'POST',
        dataType: 'text',
        data: {
            'id': id,
            'code': content
        },
        success: function(data){
            if (data) {
                starTab(false);
                //showMsg('保存成功');
                setStatusBar();
            }
            else {
                showMsg('保存失败，文件写入异常');
            }
        }
        
    });
}

//绑定鼠标进出std DIV的事件
function mouseOnStdDiv(){
    $("#stdout").mouseenter(function(){
        onStdOut = true;
    });
    $("#stderr").mouseenter(function(){
        onStdErr = true;
    });
    $("#stdout").mouseleave(function(){
        onStdOut = false;
    });
    $("#stderr").mouseleave(function(){
        onStdErr = false;
    })
}

//获取stdErr和stdOut
function getOutput(){
    $.ajax({
        cache: false,
        type: 'POST',
        url: '/logshow/',
        data: {
            'id': $('#logo').attr('rel'),
            'num': num
        },
        dataType: 'json',
        error: function(){
            $("#" + action).html('debug wa.log is err');
            clearTimeout(timer);
            timer = null;
            timer = setTimeout(function(){
                getOutput();
            }, 30000);
        },
        success: function(data){
            if (data.num != -1) {
                num = data.num;
                var html = decodeURIComponent(data.log)
                $('#stdout').html(html);
                if (html == 'page is loaded! enjoy it!') {
                    $('#stderr').html(html + '<br />');
                }
                else {
                    $('#stderr').html($('#stderr').html() + html + '<br />');
                }
                if (!onStdErr) {
                    if (!document.getElementById) 
                        return;
                    var outDiv = document.getElementById('stderr');
                    outDiv.scrollTop = outDiv.scrollHeight;
                }
            }
            getOutput();
        }        
    });
}



$(function(){
    var id = $('#logo').attr('rel');
    setElementsSize(); // 初始化编辑器和控制台尺寸
    initEditor();
    //getOutput();
});


