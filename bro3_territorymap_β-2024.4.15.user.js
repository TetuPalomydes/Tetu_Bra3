// ==UserScript==
// @name        bro3_territorymap_β
// @namespace   3gokushi.jp
// @description ブラウザ三国志のプロフィール画面に国情報の分布図を追加する
// @include     http://*.3gokushi.jp/user/*
// @include     https://*.3gokushi.jp/user/*
// @version     2024.4.15
// @grant       none
// ==/UserScript==
{
    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* 変数の宣言   */
    var mapWidth = 1300; //900;
    var mapScale = 0.275; //0.4;
    var mapRadius = 800; //750;_3つの円の中心線の円座標サイズを示す
    var mapRadiusRange = 200;//_3つの円の中心線からの距離を示す
    //var div_gray02Wrapper;
    var elmDiv;
    var elmSpan;
    var elmCanvas, context;
    var tr, th, td;
    var x, y;
    var regExp, m;
    var i, ret;

    //alert(window.document.location.pathname);
    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* @include     */
    if (window.document.location.pathname == "/user/") {//URL.match()
    } else {
        return (false);
    }

    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* 変数の初期化 */
    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* 関数の登録   */
    function fx(x) { return (x * mapScale + 367); }
    function fy(y) { return (-1 * y * mapScale + 367); }
    function fr(r) { return (r * mapScale); }

    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* 例外処理     */
    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* 処理         */
    elmDiv = window.document.createElement("div");
    {
        elmSpan = window.document.createElement("span");
        {
            elmSpan.textContent = "分布図";
        }
        elmDiv.appendChild(elmSpan);

        elmCanvas = window.document.createElement("canvas");
        {
            elmCanvas.setAttribute("id", "territories");
            elmCanvas.setAttribute("width", "1300");
            elmCanvas.setAttribute("height", "1300");
            elmCanvas.setAttribute("style", "cursor:pointer");
        }
        elmDiv.appendChild(elmCanvas);
    }
    window.document.getElementById("gray02Wrapper").appendChild(elmDiv);

    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* 処理         */
    window.document.getElementById("territories").addEventListener("click", function (event) {
        var clickX = event.pageX;
        var clickY = event.pageY;

        // 要素の位置を取得
        var clientRect = this.getBoundingClientRect();
        var positionX = clientRect.left + window.pageXOffset;
        var positionY = clientRect.top + window.pageYOffset;

        // 要素内におけるクリック位置を計算
        var x = clickX - positionX;
        var y = clickY - positionY;

        //マップ座標に変換
        x = Math.min(Math.max(Math.floor((x - 366) / mapScale), -1 * mapWidth), mapWidth);
        y = Math.min(Math.max(Math.floor((y - 366) / mapScale * -1), -1 * mapWidth), mapWidth);
        //alert("x: " + x + ",y: " + y);

        //全体地図を表示
        location = location.origin + "/map.php?x=" + x + "&y=" + y;
    });

    //*_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ *//* 処理         */
    context = window.document.getElementById("territories").getContext("2d");

    //下地
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, 735, 735);
    //枠線
    context.strokeRect(0, 0, 735, 735);

    //X軸
    context.beginPath(); context.moveTo(fx(-1 * mapWidth), fy(0)); context.lineTo(fx(mapWidth), fy(0)); context.stroke();
    //Y軸
    context.beginPath(); context.moveTo(fx(0), fy(-1 * mapWidth)); context.lineTo(fx(0), fy(mapWidth)); context.stroke();

    //中原
    context.beginPath(); context.moveTo(fx(-1300), fy(300)); context.lineTo(fx(1300), fy(300)); context.stroke();
    context.beginPath(); context.moveTo(fx(-1300), fy(-300)); context.lineTo(fx(1300), fy(-300)); context.stroke();
    context.beginPath(); context.moveTo(fx(300), fy(-1300)); context.lineTo(fx(300), fy(1300)); context.stroke();
    context.beginPath(); context.moveTo(fx(-300), fy(-1300)); context.lineTo(fx(-300), fy(1300)); context.stroke();

    //新規城
    //context.beginPath(); context.arc(fx(0), fy(0), fr(mapRadius), 0, 2 * Math.PI); context.stroke();


    //本拠地
    tr = window.document.querySelectorAll("div#gray02Wrapper > table.commonTables > tbody > tr");
    for (i = 0; i < tr.length; i++) {
        td = tr[i].querySelectorAll("td");
        if (td.length == 3 && /\(本拠地\)/.test(td[0].textContent)) {
            ret = true; break;
        }
    }
    if (ret) {
    } else {
        console.error("'(本拠地)' not found.");
        return (false);
    }
    m = td[1].textContent.match(/(-?\d+)\,\s?(-?\d+)/);
    if (m && m.length == 3) {
    } else {
        //仕様変更?
        console.error("tr[" + i + "] > td[1]: " + td[1]);
        return (false);
    }
    x = 1 * m[1];
    y = 1 * m[2];
    //context.beginPath(); context.moveTo(fx(0.5 * x), fy(0.5 * y)); context.lineTo(fx(1.5 * x), fy(1.5 * y)); context.stroke();

    //context.strokeStyle = "#0000CC";
    //context.beginPath(); context.arc(fx(0), fy(0), fr(mapRadius+mapRadiusRange), 0, 2 * Math.PI); context.stroke();
    //context.beginPath(); context.arc(fx(0), fy(0), fr(mapRadius-mapRadiusRange), 0, 2 * Math.PI); context.stroke();

    //国情報
    tr = window.document.querySelectorAll("div#gray02Wrapper > table.commonTables > tbody > tr");
    //alert("tr.length: " + tr.length);
    for (i = tr.length - 1; i >= 0; i--) {
        th = tr[i].querySelectorAll("th");
        if (th.length == 3) {
            if (th[0].textContent == "名前" && th[1].textContent == "座標" && th[2].textContent == "人口") {
                break;
            }
        }
        td = tr[i].querySelectorAll("td");
        if (td.length == 3) {
            //m = td[1].textContent.match(/(-?\d+)\,(-?\d+)/);
            m = td[1].textContent.match(/(-?\d+)\,\s?(-?\d+)/);
            if (m && m.length == 3) {
            } else {
                //仕様変更?
                alert("tr[" + i + "] > td[1]: " + td[1]);
                return (false);
            }
            x = 1 * m[1];
            y = 1 * m[2];
            //if (td[2].textContent > 0) {
            if (td[2].textContent.replace(",", "") > 0) {
                if (/\(本拠地\)/.test(td[0].textContent)) {
                    //本拠地
                    context.fillStyle = "#CC0000";
                } else {
                    //拠点
                    context.fillStyle = "#FF9900";
                }
                context.fillRect(fx(x) - 3, fy(y) - 3, 7, 7);
            } else {
                if (/[南北][東西]砦/.test(td[0].textContent)) {
                } else {
                //領地
                context.fillStyle = "#000000";
                context.fillRect(fx(x) - 2, fy(y) - 2, 5, 5);
                }
            }
        }
    }
}
