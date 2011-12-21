// 控制台
CLI = {};
CLI.cache = {
    console: null, // console的DOM对象
    stdout: null, // stdout的DOM对象
    stderr: null, // stderr的DOM对象
    handler: null, // handler的DOM对象
    location: null, // 当前console的位置
    display: true, // 当前console是否显示
    minWidth: 200, // 当console在右侧显示时的最小宽度
    minHeight: 125, // 当console在底部显示时的最小高度
    mouseDown: false, // 鼠标按下
};
CLI.loader = {
    /*
     * 初始化控制台
     */
    init: function() {
        var _display;
        
        // 获取DOM对象
        CLI.cache.console = $("#console");
        CLI.cache.stdout = $("#stdout");
        CLI.cache.stderr = $("#stderr");
        CLI.cache.handler = $("#console-event-handler");
        if (!CLI.cache.console) return false;
        
        // 初始化console样式
        CLI.cache.location = cookieHandler.get('console_location') || "BOTTOM";
        $("#console-location option[value='" + CLI.cache.location + "']").attr("selected", "selected");
        $("#console-display").removeAttr("disabled");
        _display = cookieHandler.get('console_display');
        if (_display !== null && _display === "0") {
            CLI.cache.display = false;
        }
        CLI.loader.display(CLI.cache.display);
        
        // 注册事件
        CLI.loader.resizable();
    },
    
    /*
     * 设定控制台尺寸
     */
    size: function(width, height) {
        var _width, _height;
        if (CLI.cache.location === "BOTTOM") {
            width = width || document.body.clientWidth;
            height = height || CLI.cache.minHeight;
            _width = (width - 20) / 2,
            _height = height - 25;
            CLI.cache.console.css({ width: width, height: height });
            CLI.cache.stdout.css({ width: _width, height: _height });
            CLI.cache.stderr.css({ width: _width, height: _height });
        } else if (CLI.cache.location === "RIGHT") {
            width = width || CLI.cache.minWidth;
            height = height || document.documentElement.clientHeight - 35; // 减去顶部导航条的高度
            _width = width - 10,
            _height = (height - 46) / 2;
            CLI.cache.console.css({ width: width, height: height});
            CLI.cache.stdout.css({ width: _width, height: _height });
            CLI.cache.stderr.css({ width: _width, height: _height });
        }
        return CLI.cache.console;
    },
    
    /*
     * 设定控制台位置
     */
    locate: function(loc) {
        var cli_height,
            std_height;
        if (!loc) return false;
        loc = loc.toUpperCase();
        if (loc === "BOTTOM") {
            CLI.cache.location = loc;
            cookieHandler.set('console_location', CLI.cache.location);
            CLI.cache.console.removeClass().addClass("console-bottom");
            CLI.loader.size();
            setEditorSize(null, null, false, CLI.cache.location);
            setFileListSize(null, false, CLI.cache.location);
        } else if (loc === "RIGHT") {
            CLI.cache.location = loc;
            cookieHandler.set('console_location', CLI.cache.location);
            CLI.cache.console.removeClass().addClass("console-right");
            CLI.loader.size();
            setEditorSize(null, null, false, CLI.cache.location);
            setFileListSize(null, false, CLI.cache.location);
        }
    },
    
    /*
     * 设定控制台可见性
     */
    display: function(show) {
        if (!show) { // 隐藏
            CLI.cache.display = false;
            $("#console-display option[value='0']").attr("selected", "selected");
            $("#console-location").attr("disabled", "disabled");
            setEditorSize(null, null, true);
            setFileListSize(null, true);
            CLI.cache.console.hide();
            cookieHandler.set('console_display', '0');
        } else { // 显示
            CLI.cache.display = true;
            $("#console-display option[value='1']").attr("selected", "selected");
            $("#console-location").removeAttr("disabled");
            CLI.loader.locate(CLI.cache.location);
            setEditorSize(null, null, false, CLI.cache.location);
            setFileListSize(null, true);
            CLI.cache.console.show();
            cookieHandler.set('console_display', '1');
        }
    },
    
    /*
     * 拖拽控制台事件
     */
    resizable: function() {
        var startMouse = {},
            startSize = {},
            maxHeight = 0,
            maxWidth = 0;
        var mouseUpHandler = function(e) {
            CLI.cache.mouseDown = false;
            CLI.cache.console.css({ opacity: 1 });
        };
        var mouseMoveHandler = function(e) {
            if (CLI.cache.mouseDown) {
                var newSize = { w: startSize.w, h: startSize.h };
                if (CLI.cache.location === "BOTTOM") {
                    newSize.h = Math.min(Math.max(newSize.h - (e.clientY - startMouse.y), CLI.cache.minHeight), maxHeight);
                } else if (CLI.cache.location === "RIGHT") {
                    newSize.w = Math.min(Math.max(newSize.w - (e.clientX - startMouse.x), CLI.cache.minWidth), maxWidth);
                }
                CLI.loader.size(newSize.w, newSize.h).css({ opacity: 0.6 });
                CLI.cache.mouseDown = true;
            }
        };
        CLI.cache.handler.mousedown(function (e) {
            e.preventDefault();
            CLI.cache.mouseDown = true;
            startMouse = { x: e.clientX,    y: e.clientY };
            startSize = { w: CLI.cache.console.width(), h: CLI.cache.console.height() };
            maxHeight = document.documentElement.clientHeight - 60;
            maxWidth = document.body.clientWidth - 260;
        });
        $(document).mouseup(mouseUpHandler).mousemove(mouseMoveHandler);
    },
    
    /*
     * 高亮错误栈
     */
    setErrorstack: function(str) {
        var currDirFull = NAEIDE_config.BASE + DOMAIN,
            filesInCurrDir = currDirFull + "[\\/\\.\\w]+",
            stackInf = filesInCurrDir + ":[\\d]+(:[\\d]+)?",
            reg = new RegExp(stackInf, "g");
        return str.replace(reg, function(s) {
            var inf = s.toString().split(DOMAIN)[1] || "";
            return '<span class="stderr_gotoline" name="' + inf + '">' + s + '</span>';
        });
    },
};

window.onload = function() {
    CLI.loader.init();
    $("#console-close").toggle(function() {
        CLI.loader.locate('RIGHT');
        $(this).text('放在下面');
    },
    function() {
        CLI.loader.locate('BOTTOM');
        $(this).text('放在右边');
    });
    $("#console-min").click(function() {
        CLI.loader.size();
    });
    $(window).resize(function(){
        CLI.loader.size();
    });
};