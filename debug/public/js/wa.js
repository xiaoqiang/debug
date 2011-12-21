var wa = {
    htmlspecialchars: function(str){
        if (typeof(str) == "string") {
            str = str.replace(/&/g, "&amp;"); /* must do &amp; first */
            str = str.replace(/"/g, "&quot;");
            str = str.replace(/</g, "&lt;");
            str = str.replace(/>/g, "&gt;");
            str = str.replace(/\|/g, '&brvbar;');
        }
        return str;
    },
    log: function(msg){
        function getXMLHTTPRequest(){
            if (XMLHttpRequest) {
                return new XMLHttpRequest();
            }
            else {
                try {
                    return new ActiveXObject('Msxml2.XMLHTTP');
                } 
                catch (e) {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                }
            }
        }
        var req = getXMLHTTPRequest();
        req.open('PUT', '/log/' + this.htmlspecialchars(msg), true);
        req.setRequestHeader("Content-type", "text/plain");
        req.send(null);
    }
}
wa.log('page is loaded! enjoy it!');


