// ==UserScript==
// @name           twitter OAuth test
// @namespace      http://efcl.info/
// @include        *
// @require        http://github.com/azu/OAuth-for-Greasemonkey/raw/master/oauth.js
// @require        http://github.com/azu/OAuth-for-Greasemonkey/raw/master/sha1.js
// @require        http://github.com/azu/OAuth-for-Greasemonkey/raw/master/GMwrap.js
// @resource       oauthbutton http://a0.twimg.com/images/dev/buttons/sign-in-with-twitter-d.png
// ==/UserScript==
alert("Check User Script Commands!");
(function(){
    // ClientInfomation
    // http://dev.twitter.com/apps
    var clientInfo = { // own app
        name : 'Greasemonkey',
        consumerKey : 'xd5X7ErA1TSvk53fTeqttg',
        consumerSecret : 'BziZTjDYv1v68bxuuuDn7oVeJLwt7YRB5RtuCVvzhFE'
    }
    var tw = new TwitterOauth(clientInfo);
    if (!tw.isAuthorize()){
        (function(){
            var iframeDoc;
            var listner = function(iframe, win, doc){
                iframeDoc = doc;
                iframe.height = "200";
                iframe.width = "350";
                iframe.style.position = "fixed";
                iframe.style.bottom = iframe.style.right = "0";
                var message = doc.createElement("div");
                message.id = "message";
                message.textContent = "Now Loading..."
                doc.body.appendChild(message);
                tw.getRequestToken(createAuthorizationMenu);

                var css = '#GM_iframe_Oauth {'
                        + 'font-size:24px;'
                        + 'margin : 20px;'
                        + '}'
                        + '#GM_iframe_Oauth img{'
                        + 'margin : 10px 0;'
                        + 'box-shadow: 8px 4px 8px #808080;'
                        + '-moz-box-shadow: 8px 4px 8px #808080;'
                        + '}'
                        + '#close {'
                        + 'background-color:red;border:5px;position:fixed;top:0px;right:0px;'
                        + '}';
                addCSS(doc, css);
            };
            GM_registerMenuCommand("test OAuth Authorization", function(){
                makeFrame(listner);
            });
            function createAuthorizationMenu(authorizeURL){
                var div = iframeDoc.createElement("div");
                div.id = "GM_iframe_Oauth";
                var imgOauth = iframeDoc.createElement("img");
                // http://dev.twitter.com/pages/sign_in_with_twitter
                imgOauth.src = GM_getResourceURL("oauthbutton");
                imgOauth.addEventListener("click", function(){
                    GM_openInTab(authorizeURL);
                }, false);
                var message = iframeDoc.getElementById("message");
                message.innerHTML = '<ol>'
                        + '<li>認証ボタンをクリックし認証を行う</li>'
                        + '<li>認証後に表示されるPINコードをコピー</li>'
                        + '<li>下記のテキストボックスに入力し保存</li>'
                        + '</ol>'
                var submitDiv = iframeDoc.createElement("div");
                var inputPin = iframeDoc.createElement("input");
                var submitBt = iframeDoc.createElement("Button");
                submitBt.textContent = "SAVE";
                submitBt.addEventListener("click", function(e){
                    tw.getAccessToken(inputPin.value.replace(/\s/g, ""), function(){
                        div.innerHTML += "success!";
                        location.reload();
                    });
                }, false)
                submitDiv.appendChild(inputPin);
                submitDiv.appendChild(submitBt);
                div.appendChild(imgOauth);
                div.appendChild(submitDiv);
                iframeDoc.body.appendChild(div);
            }

            function addCSS(context, css){
                if (!context) context = document;
                if (context.createStyleSheet){ // for IE
                    var sheet = context.createStyleSheet();
                    sheet.cssText = css;
                    return sheet;
                }else{
                    var sheet = context.createElement('style');
                    sheet.type = 'text/css';
                    var _root = context.getElementsByTagName('head')[0] || context.documentElement;
                    sheet.textContent = css;
                    return _root.appendChild(sheet).sheet;
                }
            }

            function makeFrame(callback/*(iframeTag, window, document)*/, name, debug){
                function testInvasion(){
                    iframe.removeEventListener("load", done, true);
                    var message = ((new Date) - load.start) + "ms passed, ";
                    try{ // probe for security violation error, in case mozilla struck a bug
                        var url = unsafeWindow.frames[framename].location.href;
                        message += url == "about:blank" ? "but we got the right document." : "and we incorrectly loaded " + url;
                        done();
                    }catch (e){
                        document.body.removeChild(iframe);
                        makeFrame(callback, name);
                    }
                }

                function done(){
                    clearTimeout(load.timeout);
                    var win = unsafeWindow.frames[framename];
                    var doc = iframe.contentWindow.document;
                    var esframeName = "'" + framename + "'";
                    var xImg = doc.createElement("img");
                    xImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAATElEQVQoka2RSQ4AIAgD+f+jp96M0aq49AgdUiB0qZCkONQ/EBAwDOrrU7A1uZqN2hodtNwRqNdz0VOg62+jzuDUcVzkf+/I6h28UQHjW25Gob5AIAAAAABJRU5ErkJggg=="
                    xImg.setAttribute("onclick", "parent.document.getElementsByName(" + esframeName + ")[0].style.display='none';");
                    xImg.id = "close";
                    doc.body.appendChild(xImg);
                    callback(iframe, win, doc);
                }

                var iframe = document.createElement("iframe");
                var framename = iframe.name = typeof name != "undefined" ? name : ("pane" + (makeFrame.id = (makeFrame.id || 0) - 1));
                iframe.setAttribute("style", "overflow:auto;z-index:25678; border:1px solid; margin:0; padding:15px;top:auto; right:auto; bottom:auto; left:auto;background-color:#fff;-moz-border-radius: 10px 0 0 0;border-radius: 50px 0 0 0;");
                iframe.src = "about:blank";
                iframe.addEventListener("load", done, true);
                var frames = makeFrame.data || {};
                var load = frames[framename] || {
                    start : new Date,
                    sleepFor : 400
                };
                load.timeout = setTimeout(testInvasion, load.sleepFor);
                load.sleepFor *= 1.5;
                frames[framename] = load;
                makeFrame.data = frames;
                document.body.appendChild(iframe);
            }
        })();
        return;
    }else{
        GM_registerMenuCommand("test OAuth reset", function(){
            tw.deleteAccessor();
            alert("delete OAuth token");
        });
    }
    // ↓↓↓↓Your Script↓↓↓↓
    GM_registerMenuCommand("test Twitter status", function(){
        // Similar to GM_xmlhttpRequest
        tw.xhr({
            method : "GET",
            url : "https://api.twitter.com/1/help/test.json",
            headers : {
                'User-agent' : 'Mozilla/4.0 (compatible) Greasemonkey'
            },
            onload : function(response){
                GM_log(response.responseText);
            },
            onerror : function(response){
                GM_log(response.responseText);
            },
            onreadystatechange : function(response){
                GM_log("readyState is " + response.readyState);
            }
        });
    })
    GM_registerMenuCommand("test OAuth post", function(){
        tw.xhr({
            method : 'POST',
            url : 'https://twitter.com/statuses/update.json',
            headers : {
                'Content-type' : 'application/x-www-form-urlencoded'
            },
            // data : "status=POST TEST&source"+clientInfo.name, //=> ok
            data : {
                status : 'POST TEST',
                source : clientInfo.name
            },
            onload : function(res){
                console.log(res);
            },
            onerror : function(res){
                GM_log(res.status + ':' + res.statusText);
            }
        });
    });
})();
