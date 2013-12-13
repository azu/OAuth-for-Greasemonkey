/* dependence
  OAuth.js
  SHA-1.js
  TwitterOauth for Greasemonkey
*/

// TwitterOauth for Greasemonkey
function TwitterOauth() {
    this.initialize.apply(this, arguments);
}
TwitterOauth.prototype = {
    initialize: function (con) {
        var accessor = this.getAccessor();
        if (accessor) {
            this.accessor = accessor;
        } else {
            this.accessor.consumerKey = con.consumerKey;
            this.accessor.consumerSecret = con.consumerSecret;
            this.accessor.token = "";
            this.accessor.tokenSecret = "";
        }
    },
    accessor: {
        consumerKey: "",
        consumerSecret: "",
        token: "", // response access_token
        tokenSecret: "" // response access_token_secret
    },
    // temp for request
    request: {
        token: "",// response oauth_token
        tokenSecret: ""// response oauth_token_secret
    },
    // return boolean - トークンが取得済みかの真偽値を返す
    isAuthorize: function () {
        var accessor = this.accessor;
        return accessor.consumerKey && accessor.consumerSecret && accessor.token && accessor.tokenSecret;
    },
    // return parsed Accessor
    getAccessor: function () {
        var accessor = GM_getValue("OAuthAccessor", null);
        if (accessor) {
            return JSON.parse(accessor);
        } else {
            return false;
        }
    },
    // save received Access token - 取得したトークンを保存
    saveAccessor: function () {
        GM_setValue("OAuthAccessor", JSON.stringify(this.accessor));
    },
    deleteAccessor: function () {
        var clientInfo = {
            consumerKey: this.accessor.consumerKey,
            consumerSecret: this.accessor.consumerSecret
        };
        GM_deleteValue("OAuthAccessor");
        this.initialize(clientInfo);
    },
    // 認証ページのURLを取得
    getRequestToken: function (callback) {
        var message = {
            method: "GET",
            action: "https://api.twitter.com/oauth/request_token",
            parameters: {
                oauth_signature_method: "HMAC-SHA1",
                oauth_consumer_key: this.accessor.consumerKey
            }
        };
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, this.accessor);
        var target = OAuth.addToURL(message.action, message.parameters);
        var self = this;
        var options = {
            method: message.method,
            url: target,
            onload: function (d) {
                if (d.status == 200) {
                    var res = d.responseText;
                    var parameter = self.getParameter(res);
                    self.request.token = parameter["oauth_token"];
                    self.request.tokenSecret = parameter["oauth_token_secret"];
                    // requestURLを引数にcallback
                    if (callback) {
                        callback("https://api.twitter.com/oauth/authorize?oauth_token=" + self.request.token);
                    }
                } else {
                    alert(d.statusText);
                }
            }
        };
        GM_xmlhttpRequest(options);

    },
    // pinを元にAccess Tokenを取得して保存、callbackにはaccessorオブジェクトを渡す
    getAccessToken: function (pin, callback) {
        var message = {
            method: "GET",
            action: "https://api.twitter.com/oauth/access_token",
            parameters: {
                oauth_signature_method: "HMAC-SHA1",
                oauth_consumer_key: this.accessor.consumerKey,
                oauth_token: this.request.token, // Request Token
                oauth_verifier: pin
            }
        };
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, this.request);
        var target = OAuth.addToURL(message.action, message.parameters);
        var self = this;
        var options = {
            method: message.method,
            url: target,
            onload: function (d) {
                if (d.status == 200) {
                    /* 返り値からAccess Token/Access Token Secretを取り出す */
                    var res = d.responseText;
                    var parameter = self.getParameter(res);
                    self.accessor.token = parameter["oauth_token"];
                    self.accessor.tokenSecret = parameter["oauth_token_secret"];
                    // Accessorの保存
                    self.saveAccessor();
                    if (callback) {
                        callback(self.accessor);
                    }
                } else {
                    alert(d.statusText);
                }
            }
        };

        GM_xmlhttpRequest(options);
    },
    // DEPRECATED : use `getURL`
    // api+?+query にアクセスした結果をcallbackに渡す
    get: function (api, query, callback) {
        var btquery = (query) ? "?" + this.buildQuery(query) : "";
        var message = {
            method: "GET",
            action: api + btquery,
            parameters: {
                oauth_signature_method: "HMAC-SHA1",
                oauth_consumer_key: this.accessor.consumerKey,// queryの構築
                oauth_token: this.accessor.token // Access Token
            }
        };
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, this.accessor);
        var target = OAuth.addToURL(message.action, message.parameters);
        var options = {
            method: message.method,
            url: target,
            onload: function (d) {
                if (d.status == 200) {
                    if (callback) {
                        callback(d.responseText);
                    }
                } else {
                    callback(d.statusText);
                }
            }
        };
        GM_xmlhttpRequest(options);
    },
    getURL: function (api, query, callback) {
        if (callback == null) {
            throw new Error("must to set callback");
        }
        var btquery = (query) ? "?" + this.buildQuery(query) : "";
        var message = {
            method: "GET",
            action: api + btquery,
            parameters: {
                oauth_signature_method: "HMAC-SHA1",
                oauth_consumer_key: this.accessor.consumerKey,// queryの構築
                oauth_token: this.accessor.token // Access Token
            }
        };
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, this.accessor);
        var target = OAuth.addToURL(message.action, message.parameters);
        var options = {
            method: message.method,
            url: target,
            onload: function (response) {
                callback(null, response.responseText);
            },
            onerror: function (response) {
                callback(response, response.responseText);
            }
        };
        GM_xmlhttpRequest(options);
    },
    // DEPRECATED : use `postURL`
    post: function (api, content, callback) {
        var message = {
            method: "POST",
            action: api,
            parameters: {
                oauth_signature_method: "HMAC-SHA1",
                oauth_consumer_key: this.accessor.consumerKey,
                oauth_token: this.accessor.token // Access Token
            }
        };
        // 送信するデータをパラメータに追加する
        for (var key in content) {
            message.parameters[key] = content[key];
        }
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, this.accessor);
        var target = OAuth.addToURL(message.action, message.parameters);
        var options = {
            method: message.method,
            url: target,
            onload: function (d) {
                if (d.status == 200) {
                    if (callback) {
                        callback(d.responseText);
                    }
                } else {
                    // typeof d == object
                    callback(d);
                }
            }
        };
        GM_xmlhttpRequest(options);
    },
    postURL: function (api, content, callback) {
        if (callback == null) {
            throw new Error("must to set callback");
        }
        var message = {
            method: "POST",
            action: api,
            parameters: {
                oauth_signature_method: "HMAC-SHA1",
                oauth_consumer_key: this.accessor.consumerKey,
                oauth_token: this.accessor.token // Access Token
            }
        };
        // 送信するデータをパラメータに追加する
        for (var key in content) {
            message.parameters[key] = content[key];
        }
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, this.accessor);
        var target = OAuth.addToURL(message.action, message.parameters);
        var options = {
            method: message.method,
            url: target,
            onload: function (response) {
                callback(null, response.responseText);
            },
            onerror: function (response) {
                callback(response, response.responseText);
            }
        };
        GM_xmlhttpRequest(options);
    },
    // GM_xmlhttpRequest風に使う
    // http://gist.github.com/511308
    xhr: function (opts) {
        if (!(opts && opts.url && opts.method)) {
            GM_log("URL or method is missing.");
            return;
        }
        var message = {
            method: opts.method,
            action: opts.url,
            parameters: {
                oauth_signature_method: "HMAC-SHA1",
                oauth_consumer_key: this.accessor.consumerKey,
                oauth_token: this.accessor.token // Access Token
            }
        };
        // POST - opts.dataは文字列でもオブジェクトでも可能にする
        if (opts && opts.method.toLowerCase() == "post" && opts.data) {
            if (typeof(opts.data) === "string") {// 文字列からパラメータオブジェクトを作る
                opts.data = this.getParameter(opts.data);
            }
            var content = opts.data;// オブジェクトに変換したもの
            opts.data = null;// 元々のdataを消す
            if (typeof(content) === "object") {
                for (var key in content) {
                    message.parameters[key] = content[key];
                }
            }
        }
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, this.accessor);
        opts.url = OAuth.addToURL(message.action, message.parameters);// URLを書き換え
        GM_xmlhttpRequest(opts);
    },
    // utility関数
    // http://kevin.vanzonneveld.net
    urlencode: function (str) {
        str = (str + '').toString();
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
            replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    },
    // オブジェクトからクエリを生成
    buildQuery: function (formdata, numeric_prefix, arg_separator) {
        // *     example 1: http_build_query({foo: 'bar', php: 'hypertext processor', baz: 'boom', cow: 'milk'}, '', '&amp;');
        // *     returns 1: 'foo=bar&amp;php=hypertext+processor&amp;baz=boom&amp;cow=milk'
        // *     example 2: http_build_query({'php': 'hypertext processor', 0: 'foo', 1: 'bar', 2: 'baz', 3: 'boom', 'cow': 'milk'}, 'myvar_');
        // *     returns 2: 'php=hypertext+processor&myvar_0=foo&myvar_1=bar&myvar_2=baz&myvar_3=boom&cow=milk'
        var value, key, tmp = [];
        var self = this;
        var _http_build_query_helper = function (key, val, arg_separator) {
            var k, tmp = [];
            if (val === true) {
                val = "1";
            } else if (val === false) {
                val = "0";
            }
            if (val !== null && typeof(val) === "object") {
                for (k in val) {
                    if (val[k] !== null) {
                        tmp.push(_http_build_query_helper(key + "[" + k + "]", val[k], arg_separator));
                    }
                }
                return tmp.join(arg_separator);
            } else if (typeof(val) !== "function") {
                return self.urlencode(key) + "=" + self.urlencode(val);
            } else {
                throw new Error('There was an error processing for http_build_query().');
            }
        };
        if (!arg_separator) {
            arg_separator = "&";
        }
        for (key in formdata) {
            value = formdata[key];
            if (numeric_prefix && !isNaN(key)) {
                key = String(numeric_prefix) + key;
            }
            tmp.push(_http_build_query_helper(key, value, arg_separator));
        }

        return tmp.join(arg_separator);
    },
    // Query String から 連想配列を返す
    getParameter: function (str) {
        var dec = decodeURIComponent;
        var par = {}, itm;
        if (typeof(str) == 'undefined') {
            return par;
        }
        if (str.indexOf('?', 0) > -1) {
            str = str.split('?')[1]
        }
        str = str.split('&');
        for (var i = 0; str.length > i; i++) {
            itm = str[i].split("=");
            if (itm[0] != '') {
                par[itm[0]] = typeof(itm[1]) == 'undefined' ? true : dec(itm[1]);
            }
        }
        return par;
    }
};