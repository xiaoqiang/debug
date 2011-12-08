var editor, actionLock = false, tabkey = false; // 事件锁
/*
 * 动态设定编辑器尺寸
 */
var setElementsSize = function(){


    var h = document.documentElement.clientHeight - (80 + 5), w = document.body.clientWidth - 260;
    $("#tabs").width(w - 50);
    $("#statbar").width(w);
    $("#editor").css("height", h).css("width", w);
    if (editor) 
        editor.resize();
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
        exec: function(env, args, request) {
            if(actionLock) return false;
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
};
var starTab = function(add) {
    tabkey = add;
    var target = $('.tab'),
    fileName = target.attr("title"),
    html = '代码地址：<a target="_blank" href="'+fileName+'">'+fileName+'</a>'
    if(add) { // 加星号
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
        str = str.replace(/'/g, "&#039;");
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
        success: function(msg){
            if (msg) {
                starTab(false);
                showMsg('保存成功');
                setStatusBar();
            }else{
                showMsg('保存失败，文件写入异常');
            }
        }
        
    });
}

$(function(){
    setElementsSize(); // 初始化编辑器和控制台尺寸
    initEditor();
});
