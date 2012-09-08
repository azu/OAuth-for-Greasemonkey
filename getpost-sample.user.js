// ==UserScript==
// @name           OAuth for Greasemonkey sample
// @namespace      http://efcl.info/
// @include        http://*
// @require https://raw.github.com/azu/OAuth-for-Greasemonkey/master/oauth.js
// @require https://raw.github.com/azu/OAuth-for-Greasemonkey/master/sha1.js
// @require https://raw.github.com/azu/OAuth-for-Greasemonkey/master/GMwrap.js
// ==/UserScript==
// http://userscripts.org/scripts/show/78102
/*認証手順
    tw.getRequestToken
        consumerKeyとconsumerSecretを使って、OAuth認証のページURLに必要なRequestTokenを取得。
    RequestTokenを元にOAuth認証のページにアクセスしてもらって、PINコードを取ってきてもらう。
    tw.getAccessToken
        入力されたPINコードを元にAccessToken(APIをたたくのに使う)を取得して保存。
        一回AccessTokenが手に入れば認証は半永久的。
        APIたたくときにAccessTokenを一緒に使う。
*/
// ClientInfomation
// http://dev.twitter.com/apps
var clientInfo = {
    name: 'PNBT',
    consumerKey: '9zzFsVFm4nLyfF5WXZsbrg',
    consumerSecret: '318LbLBmvECeZZmSUKVzdq8dpazGtMFf2P6hMPUjWU',
}
// TwitterOauthにクライアント情報を渡してnewする(必須)
var tw = new TwitterOauth(clientInfo);
if(tw.isAuthorize()){
    // update test with client name.
    GM_registerMenuCommand("OAuth update test",function(){
        var content = {status: "update test", source: clientInfo.name};
        tw.post('http://twitter.com/statuses/update.json', content ,function(){
            console.log(res); // firebug
        });
    });
    var query = {
        q : "oauth",
        per_page : 5
    }
    // get test
    GM_registerMenuCommand("OAuth search test(Firebug)",function(){
        tw.get("http://api.twitter.com/1/users/search.json" , query ,function(res){
            console.log(res); // firebug
        })
    });
}else{ // tokenがまだないなら認証させる
    var iframeDoc;
    GM_registerMenuCommand("OAuth Authorization",function(){
        makeFrame(function gotFrame1(iframe, win, doc) {
            iframeDoc = doc;
            iframe.height = "350";
            iframe.width = "500";
            iframe.style.position = "fixed";
            iframe.style.bottom = iframe.style.left = "0";
            tw.getRequestToken(createAuthorizationMenu);
        });
    });
}
function createAuthorizationMenu(authorizeURL){
    var div = iframeDoc.createElement("div");
    div.id = "GM_iframe_Oauth";
    var imgOauth = iframeDoc.createElement("img");
    imgOauth.src = "data:image/png;base64,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";
    imgOauth.addEventListener("click",function(){
        GM_openInTab(authorizeURL);
    },false);
    var textPin = iframeDoc.createElement("p");
    textPin.innerHTML = "input PIN code";
    var inputPin = iframeDoc.createElement("input");
    var submitBt = iframeDoc.createElement("Button");
    submitBt.textContent = "SAVE";
    submitBt.addEventListener("click",function(e){
        tw.getAccessToken(inputPin.value.replace(/\s/g ,"") , function(){
            div.innerHTML += "success!";
            location.reload();
        });
    },false)
    div.appendChild(imgOauth);
    div.appendChild(textPin);
    div.appendChild(inputPin);
    div.appendChild(submitBt);
    iframeDoc.body.appendChild(div);
}
// about:configなフレームを作成する。
function makeFrame(callback/*(iframeTag, window, document)*/, name, debug) {
    function testInvasion() {
        iframe.removeEventListener("load", done, true);
        var message = ((new Date) - load.start) + "ms passed, ";
        try { // probe for security violation error, in case mozilla struck a bug
            var url = unsafeWindow.frames[framename].location.href;
            message += url == "about:blank" ? "but we got the right document." : "and we incorrectly loaded " + url;
            if (debug) console.log(message);
            done();
        }
        catch(e) {
            if (console && console.error && console.trace) {
                console.error(e);
                console.trace();
            }
            if (debug) console.log(message + "and our iframe was invaded. Trying again!");
            document.body.removeChild(iframe);
            makeFrame(callback, name);
        }
    }
    function done() {
        clearTimeout(load.timeout);
        if (debug) console.log("IFrame %x load event after %d ms", framename, (new Date) - load.start);
        var win = unsafeWindow.frames[framename];
        var doc = iframe.contentWindow.document;
        // 苦し紛れのエスケープ
        var esframeName = "'"+framename+"'";
        // 自分自身のiframeを閉じるボタン
        var xImg = doc.createElement("img");
        xImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAATElEQVQoka2RSQ4AIAgD+f+jp96M0aq49AgdUiB0qZCkONQ/EBAwDOrrU7A1uZqN2hodtNwRqNdz0VOg62+jzuDUcVzkf+/I6h28UQHjW25Gob5AIAAAAABJRU5ErkJggg=="
        xImg.setAttribute("onclick", "parent.document.getElementsByName("+esframeName+")[0].style.display='none';");
        xImg.setAttribute("style","background-color:red;border:3px;position:fixed;top:0px;right:0px");
        doc.body.appendChild(xImg);
        callback(iframe, win, doc);
    }
    var iframe = document.createElement("iframe");
    var framename = iframe.name = typeof name != "undefined" ? name : ("pane" + (makeFrame.id = (makeFrame.id || 0) - 1));
    iframe.setAttribute("style", "overflow:auto;z-index:18999; border:0; margin:0; padding:0;top:auto; right:auto; bottom:auto; left:auto;background-color:#fff");
    iframe.src = "about:blank";
    iframe.addEventListener("load", done, true);
    var frames = makeFrame.data || {};
    var load = frames[framename] || {
        start: new Date,
        sleepFor: 400
    };
    load.timeout = setTimeout(testInvasion, load.sleepFor);
    load.sleepFor *= 1.5;
    frames[framename] = load;
    makeFrame.data = frames;
    document.body.appendChild(iframe);
}