// ==UserScript==
// @name		NPCKanri_Dam+Wada
// @namespace	NPC隣接管理攻略確認ツール
// @include		https://*.3gokushi.jp/user/*
// @include		http://*.3gokushi.jp/user/*
// @description	NPC隣接管理攻略確認ツール
// @version		1.0.1

// @grant	GM_getValue
// @grant	GM_setValue
// @require	https://code.jquery.com/jquery-2.1.4.min.js
// @require	https://code.jquery.com/ui/1.11.4/jquery-ui.min.js

// ==/UserScript==
// version	date
// 0.0.1		2024/09/18	開発開始
// 1.0.1		2024/09/21	公開開始

jQuery.noConflict();
q$ = jQuery;

//----------------------------------------------------------------------
// スクリプト全体で共有する固有定義
//----------------------------------------------------------------------
var SERVER_SCHEME = location.protocol + "//";
var BASE_URL = SERVER_SCHEME + location.hostname;
var SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];
var AJAX_REQUEST_INTERVAL = 100; // (ms)
var gNavLinks = q$("div[id='gNav'] ul a[href]");

// 全体地図 URLから アクティブ拠点の座標を取得正規表現で抽出
var match = gNavLinks[1].search.match(/x=(-?\d+)&y=(-?\d+)/);
var activeBase = { x: match[1], y: match[2] }
//----------------------------------------------------------------------
// グローバル変数群
//----------------------------------------------------------------------
// イベント駆動制御用
var g_event_process = false;

//----------------------------------------------------------------------
// メインルーチン
//----------------------------------------------------------------------
(function () {
    profileControl();
})();

//----------------------------------------------------------------------
// プロフィール画面の実行制御
//----------------------------------------------------------------------
function profileControl() {
    // 他人のプロフィールならtrue
    if (q$(location).attr('search').length > 0) {
        return;
    }
    /*
        var gNavLinks = q$("div[id='gNav'] ul a[href]");
    
        // 全体地図 URLから アクティブ拠点の座標を取得正規表現で抽出
        var match = gNavLinks[1].search.match(/x=(-?\d+)&y=(-?\d+)/);
        var activeBase = { x: match[1], y: match[2] }
        // 同盟 URLから所属同盟のalliance_IDを取得
        var match = gNavLinks[2].search.match(/id=(\d+)/);
        var myAllianceID = match[1];
    */


    // N隣接攻略確認ツールリンクの作成
    q$("ul[id=statMenu]").eq(1).children("li[class='last']").after(
        "<li class='last'><a href='#' id='search_resource_setting' class='darkgreen'>N隣接攻略確認</a></li>"
    ).attr('class', '');

    q$("#gray02Wrapper").css('position', 'relative').append(
        "<div id='search_resource' class='roundbox' style='display: block; position: absolute; top: 92px; display: none;'>" +
        "<div style='margin: 4px; font-weight: bold; font-size: 12px; color: #009;'>" +
        "</div>" +
        "<div id='search_resource_tabs' style='margin: 4px; font-size:12px;'>" +
        "<div id='tab-search-npc'>" +
        "<div>" +
        "<div style='font-weight: bold; color: red;'>マップ探索範囲" +
        "<span id='count_info'></span>" +
        "</div>" +
        "<div style='margin-left: 4px;'>" +
        "<span style='font-weight: bold;'>(</span>" +
        "<input id='posx1' type=text size=5 style='margin-left:4px; margin-right: 4px;'>" +
        "<span style='font-weight: bold;'>,</span>" +
        "<input id='posy1' type=text size=5 style='margin-left:4px; margin-right: 4px;'>" +
        "<span style='font-weight: bold;'>) - (</span>" +
        "<input id='posx2' type=text size=5 style='margin-left:4px; margin-right: 4px;'>" +
        "<span style='font-weight: bold;'>,</span>" +
        "<input id='posy2' type=text size=5 style='margin-left:4px; margin-right: 4px;'>" +
        "<span style='font-weight: bold;'>)</span>" +
        "</div>" +
        "<div style='margin-left: 4px; display: flex; align-items: center;'>" +
        "<label style='font-weight: bold;'>アクティブ拠点から </label>" +
        "<input id='range_input' type='number' value='50' min='50' step='50' style='width: 45px; margin-right: 4px;'>" +
        "<label style='font-weight: bold;'>マス範囲の座標を </label>" +
        "<input type='button' value='投入' id='submit_range' style='margin-left: 4px;'></input>" +
        "</div>" +
        "</div>" +
        "<div style='margin-top: 10px; font-weight: bold; color: red;'>NPC調査対象</div>" +
        "<div style='margin-left: 4px;'>" +
        "<label>★1<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★2<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★3<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★4<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★5<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★6<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★7<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★8<input type='checkbox' class='npc_star_check'></label>  " +
        "<label>★9<input type='checkbox' class='npc_star_check'></label>" +
        "</div>" +
        "<div style='margin-left: 4px; margin-top: 5px;'>" +
        "<label>未隣接<input type='checkbox' class='npc_status_check'></label>  " +
        "<label>単独隣接<input type='checkbox' class='npc_status_check'></label>  " +
        "<label>包囲<input type='checkbox' class='npc_status_check'></label>  " +
        "<label>競合<input type='checkbox' class='npc_status_check'></label>  " +
        "<label>-<input type='checkbox' class='npc_status_check'></label>" +
        "</div>" +
        "<div style='margin-left: 4px; margin-top: 10px;'>" +
        "<input type='button' value='CheckAll' id='check_all_btn' style='margin-right: 10px;'></input>" +
        "<input type='button' value='ClearAll' id='clear_all_btn'></input>" +
        "</div>" +
        "<div>" +
        "<div>" +
        "<div style='font-weight: bold; color: red; font-size: 12px;'>NPC座標リスト</div>" +
        "<textarea style='margin-left: 8px;' id='npc_box' rows='10' cols='90'></textarea>" +
        "</div>" +
        "<div>" +
        "<input type='button' value='探索を開始' id='search_npc_exec'></input>" +
        "<span id='npc_search_info' style='margin-left: 8px; color: red; font-weight: bold;'>左ボタンを押すと探索となります。</span>" +
        "</div>" +
        "<div>" +
        "<textarea id='result_npc_box' cols='90' rows='10' style='overflow: auto; display: block;'></textarea>" +
        "</div>" +
        "<br><input id='close_result' type='button' value='閉じる'></input>" +
        "</div>" +
        "</div>" +
        "</div>"
    );

    // CheckAllボタンの機能
    q$("#check_all_btn").click(function () {
        q$(".npc_star_check").prop("checked", true);
        q$(".npc_status_check").prop("checked", true);
    });

    // ClearAllボタンの機能
    q$("#clear_all_btn").click(function () {
        q$(".npc_star_check").prop("checked", false);
        q$(".npc_status_check").prop("checked", false);
    });

    // 運営のcssを無効化
    q$("#search_resource_tabs li").css({ 'padding': '0px', 'min-width': '0px' });
    q$("#search_resource_tabs li a").css({ 'background': 'none' });
    q$("#search_resource_tabs div label").css({ 'font-size': '12px', 'margin-left': '4px', 'vertical-align': '0.2em' });
    q$("div[id*='tab-search-'] div").css({ 'padding': '2px' });

    // タブを有効化
    q$("#search_resource_tabs").tabs();

    // 処理制御変数
    var stop = false;
    var wait = false;

    // 資源、NPC隣接検索ツール有効化
    q$("#search_resource_setting").on('click',
        function () {
            if (q$("#search_resource").css('display') == 'none') {
                q$("#search_resource").css('display', '');
            } else {
                stop = true;
                q$("#search_resource").css('display', 'none');
            }
        }
    );

    // 入力範囲のチェック
    function checkRange(element) {
        var x1 = parseInt(q$("#posx1", element).val());
        var y1 = parseInt(q$("#posy1", element).val());
        var x2 = parseInt(q$("#posx2", element).val());
        var y2 = parseInt(q$("#posy2", element).val());
        if (isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2)) {
            return null;
        }

        // x1 < x2 となるよう座標交換
        if (x1 > x2) {
            var sw = x2;
            x2 = x1;
            x1 = sw;
        }

        // y1 < y2 となるよう座標交換
        if (y1 > y2) {
            var sw = y2;
            y2 = y1;
            y1 = sw;
        }

        if (x1 < -1300) {
            x1 = -1300;
        }
        if (x2 > 1300) {
            x2 = 1300;
        }
        if (y1 < -1300) {
            y1 = -1300;
        }
        if (y2 > 1300) {
            y2 = 1300;
        }

        var sizex = Math.abs(x2 - x1) + 1 - 10 * 2;
        var sizey = Math.abs(y2 - y1) + 1 - 10 * 2;
        var mapct = (Math.floor(sizex / 21) + 2) * (Math.floor(sizey / 21) + 2);

        return { x1: x1, y1: y1, x2: x2, y2: y2, ct: mapct };
    }

    // submit_range ボタンのクリックイベント    
    document.getElementById('submit_range').addEventListener('click', function () {
        // range_inputの値を取得
        let rangeValue = parseInt(document.getElementById('range_input').value, 10);

        // 範囲計算
        let posx1 = parseInt(activeBase.x) - parseInt(rangeValue);
        let posy1 = parseInt(activeBase.y) + parseInt(rangeValue);
        let posx2 = parseInt(activeBase.x) + parseInt(rangeValue);
        let posy2 = parseInt(activeBase.y) - parseInt(rangeValue);

        if (posx1 < -1300) {
            posx1 = -1300;
        }
        if (posx2 > 1300) {
            posx2 = 1300;
        }
        if (posy2 < -1300) {
            posy2 = -1300;
        }
        if (posy1 > 1300) {
            posy1 = 1300;
        }

        // テキストボックスに値を設定
        document.getElementById('posx1').value = posx1;
        document.getElementById('posy1').value = posy1;
        document.getElementById('posx2').value = posx2;
        document.getElementById('posy2').value = posy2;

    });



    // 資源探索

    // NPCの探索
    q$("#search_npc_exec").on('click',
        function () {
            if (q$(this).val() == '探索を中止') {
                stop = true;
                return;
            }

            if (g_event_process) {
                alert("資源の検索処理が実行中です");
                return;
            }

            var base = q$("#tab-search-npc");

            // 範囲指定が行われているかチェック
            var result = checkRange(base);
            if (result == null) {
                // alert('探索範囲を指定してください。');
                // デバッグ用
                var result = { x1: -1300, y1: -1300, x2: 1300, y2: 1300, ct: 15376 }
                // return;
            }

            // ボタン名変更
            q$(this).val('探索を中止');

            // イベント制御
            g_event_process = true;

            // NPC検索対象
            var search_target = q$("input[name='search_npc_target']:checked").val();
            if (search_target == 'pos') {
            } else {
                //-------------
                // NPC隣接探索
                //-------------
                q$("#result_npc_box").val("探索後にここにリストが出ますのでそれで状況判断となります");

                // 隣接探索対象のNPC探索
                var target = q$("#npc_box").val().split(/\r\n|\r|\n/);
                var search_target = new Array();
                var checkedStars = q$(".npc_star_check:checked").map(function () {
                    return q$(this).parent().text().trim(); // 検索対象として指定した★に絞るための事前処理
                }).get();
                var allUnchecked = q$(".npc_star_check:checked").length === 0; // 絞り込みバイパスフラグ。検索対象に★の指定がない場合に発動

                // ここで取得対象砦のリスト作ってる
                for (var i = 0; i < target.length; i++) {
                    var match = target[i].replace(/ /g, "").match(/^.*\t([-]*\d+)\t([-]*\d+)\t(\S+)$/);

                    if (match == null) {
                        continue;
                    }
                    if (parseInt(match[1]) < result.x1 || parseInt(match[1]) > result.x2) {
                        match = null;
                        continue;
                    }
                    if (parseInt(match[2]) < result.y1 || parseInt(match[2]) > result.y2) {
                        match = null;
                        continue;
                    }
                    if (!allUnchecked && !checkedStars.includes(match[3])) {
                        match = null;
                        continue;
                    }
                    search_target.push({ x: match[1], y: match[2] });
                }

                // 変数locのバイト数を計算する関数
                function getByteSize(str) {
                    return new Blob([str]).size;
                }

                // 初期の設定と変数
                var result_box = q$("#result_npc_box");
                var list = [];
                list.push({ name: "NPC名", x: "X座標", y: "Y座標", star: "★", owner: "所有同盟", nw: "北西", n: "北", ne: "北東", w: "西", e: "東", se: "南東", s: "南", sw: "南西", share: "場所", status: "状態" });
                var count = 0;
                var responseSizeTotal = 0;
                var max = search_target.length;
                var wait = false;

                // 最大バイトサイズ設定
                var MAX_BYTE_SIZE = 6800;

                // loc生成関数（バイトサイズ制限を考慮）
                function generateAndSendLoc(search_target, startIdx) {
                    var loc = {
                        'api': 1,
                        'map_fetch_scale': 3
                    };
                    var loc_search_target = [];
                    var locString = JSON.stringify(loc);

                    // search_targetの一部をlocに追加し、バイトサイズ閾値 MAX_BYTE_SIZE を超えないようにする
                    for (var i = startIdx; i < search_target.length; i++) {
                        loc_search_target.push(search_target[i]);
                        loc[`center[${i - startIdx}][0]`] = search_target[i].x;
                        loc[`center[${i - startIdx}][1]`] = search_target[i].y;

                        // locStringを更新してバイトサイズを確認
                        locString = JSON.stringify(loc);
                        if (getByteSize(locString) > MAX_BYTE_SIZE) {
                            return { loc, nextIndex: i + 1 };  // サイズを超えたら締め切り
                        }
                    }

                    return { loc, nextIndex: search_target.length };  // search_target の中身を全て流した場合の処理
                }

                // listに検索結果を追加
                function appendToList(res) {
                    for (var i = 0; i < res.data.center.length; i++) {
                        // ここでcenterのalliance_idを確認し、1よりも大きければ種別"その他"なNPCである。ownedフラグを立てる。                        
                        var ownedFlag = 0;
                        if (res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1])].alliance_id > 1) {
                            ownedFlag = 1;
                        }




                        // ここでcenterの種別"単独隣接","包囲","競合","その他"の条件式を用意する。
                        // チェックボックスの状態を取得する
                        var checkedStatuses = q$(".npc_status_check:checked").map(function () {
                            return q$(this).parent().text().trim();  // チェックが入ったラベルのテキストを取得
                        }).get();
                        var allUnchecked = q$(".npc_status_check:checked").length === 0; // すべてのチェックが外れているかを確認

                        // list にデータを追加する処理
                        for (var i = 0; i < res.data.center.length; i++) {
                            var status = ""; // 中心マスのステータスを取得するロジック
                            // 自分の同盟名を取得
                            var match = gNavLinks[2].search.match(/id=(\d+)/);
                            var myAllianceID = match[1];
                            var myAllianceName = res.data.alliance_data[myAllianceID];

                            // 中心マスの座標を取得
                            var centerX = parseInt(res.data.center[i][0]);
                            var centerY = parseInt(res.data.center[i][1]);

                            // 中心マスのオーナーを取得
                            var centerOwner = res.data.alliance_data[res.data.map_data[centerX][centerY].alliance_id];

                            // ステータスの初期化
                            var status = "-";

                            // 中心マスにオーナーが存在する場合
                            if (centerOwner) {
                                // オーナーが存在する場合、ステータスは"-"
                                status = "-";
                            } else {
                                // 周囲8マスのオーナー情報を取得（undefinedやnullの処理も追加）
                                var surroundingOwners = [
                                    res.data.alliance_data[res.data.map_data[centerX - 1][centerY + 1].alliance_id] || "-", // 北西
                                    res.data.alliance_data[res.data.map_data[centerX][centerY + 1].alliance_id] || "-",     // 北
                                    res.data.alliance_data[res.data.map_data[centerX + 1][centerY + 1].alliance_id] || "-", // 北東
                                    res.data.alliance_data[res.data.map_data[centerX - 1][centerY].alliance_id] || "-",     // 西
                                    res.data.alliance_data[res.data.map_data[centerX + 1][centerY].alliance_id] || "-",     // 東
                                    res.data.alliance_data[res.data.map_data[centerX - 1][centerY - 1].alliance_id] || "-", // 南西
                                    res.data.alliance_data[res.data.map_data[centerX][centerY - 1].alliance_id] || "-",     // 南
                                    res.data.alliance_data[res.data.map_data[centerX + 1][centerY - 1].alliance_id] || "-"  // 南東
                                ];

                                // 自分の所有数と未隣接のマス数をカウント
                                var myCount = surroundingOwners.filter(owner => owner === myAllianceName).length;
                                var emptyCount = surroundingOwners.filter(owner => owner === "-").length;

                                // ステータスの判定
                                if (myCount > 0) {
                                    if (myCount + emptyCount === 8) {
                                        // 自分のみが隣接 or 包囲
                                        status = myCount === 8 ? "包囲" : "単独隣接";
                                    } else {
                                        // 他のオーナーとの競合
                                        status = "競合";
                                    }
                                } else {
                                    // 周囲8マスすべてが未隣接
                                    if (emptyCount === 8) {
                                        status = "未隣接";
                                    }
                                }
                            }
                            // ここでcenterの種別からlistにpushする対象か判断する
                            // --------------
                            // すべてのチェックが外れているか、もしくはチェックされたステータスと一致する場合のみデータを追加
                            if (allUnchecked || checkedStatuses.includes(status)) {
                                // ここでcenterの地形情報を取得する。1:低地 2:平地 3:高地
                                let elevation = res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1])].elevation;
                                let elevationText = "";

                                // case文で条件分岐
                                switch (elevation) {
                                    case 1:
                                        elevationText = " [低地]";
                                        break;
                                    case 2:
                                        elevationText = " [平地]";
                                        break;
                                    case 3:
                                        elevationText = " [高地]";
                                        break;
                                    default:
                                        elevationText = ""; // 該当しない場合は空文字列
                                }
                                
                                var shareString = res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1])].name
                                    + "("
                                    + res.data.center[i][0]
                                    + ","
                                    + res.data.center[i][1]
                                    + ")"
                                    + "★" + res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1])].power
                                    + elevationText;
                                list.push({
                                    name: res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1])].name,
                                    x: res.data.center[i][0],
                                    y: res.data.center[i][1],
                                    star: "★" + res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1])].power,
                                    owner: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1])].alliance_id],
                                    nw: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0]) - 1][parseInt(res.data.center[i][1]) + 1].alliance_id],
                                    n: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1]) + 1].alliance_id],
                                    ne: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0]) + 1][parseInt(res.data.center[i][1]) + 1].alliance_id],
                                    w: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0]) - 1][parseInt(res.data.center[i][1])].alliance_id],
                                    e: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0]) + 1][parseInt(res.data.center[i][1])].alliance_id],
                                    sw: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0]) - 1][parseInt(res.data.center[i][1]) - 1].alliance_id],
                                    s: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0])][parseInt(res.data.center[i][1]) - 1].alliance_id],
                                    se: res.data.alliance_data[res.data.map_data[parseInt(res.data.center[i][0]) + 1][parseInt(res.data.center[i][1]) - 1].alliance_id],
                                    share: shareString,
                                    status: status
                                });
                            }
                        }
                    }
                }

                // マップ探索関数
                var neighbor_search_func = function () {
                    if (stop) {
                        clearInterval(npc_timer);
                        q$("#search_npc_exec").val('探索を開始');
                        stop = false;
                        g_event_process = false;
                        alert("探索を中止しました");
                        return;
                    }
                    if (search_target.length == 0) {
                        clearInterval(npc_timer);
                        q$("#npc_search_info").text("TOTAL 0 pts");
                        q$("#search_npc_exec").val('探索を開始');
                        stop = false;
                        g_event_process = false;
                        alert("指定の条件では検索対象のNPCが存在しません。");
                        return;
                    }

                    if (wait || count >= search_target.length) {
                        return;
                    }
                    var displayCount;
                    if (count > 2500) {
                        var overLimit = Math.floor(count / 2500) * 2500;
                        displayCount = "ミ" + overLimit + "ミ";
                    } else {
                        displayCount = null;
                    }

                    q$("#npc_search_info").text(displayCount);

                    wait = true;

                    // locを生成し、バイト数を確認して分割GETリクエストを送る
                    var locData = generateAndSendLoc(search_target, count);
                    count = locData.nextIndex;

                    q$.ajax({
                        url: BASE_URL + '/elevation_map.php',
                        type: 'GET',
                        datatype: 'json',
                        cache: false,
                        data: locData.loc
                    })
                        .done(function (res) {
                            appendToList(res);

                            if (count >= max) {
                                // 結果をテキストボックスに出力
                                var output = list.map(item => {
                                    return [
                                        item.name || "-",
                                        item.x || "-",
                                        item.y || "-",
                                        item.star || "-",
                                        item.owner || "-",
                                        item.nw || "-",
                                        item.n || "-",
                                        item.ne || "-",
                                        item.w || "-",
                                        item.e || "-",
                                        item.se || "-",
                                        item.s || "-",
                                        item.sw || "-",
                                        item.share || "-",
                                        item.status || "-",
                                    ].join("\t");
                                }).join("\r\n");

                                q$("#result_npc_box").val(output);
                                clearInterval(npc_timer);
                                q$("#npc_search_info").text("TOTAL " + count + " pts");
                                q$("#search_npc_exec").val('探索を開始');
                                stop = false;
                                g_event_process = false;
                                alert("ＥＮＤ");
                            }

                            wait = false;
                        })
                        .complete(function (xhr) {
                            // Content-Lengthがない場合、手動で計算
                            var responseString = JSON.stringify(xhr.responseJSON);
                            var responseSize = new Blob([responseString]).size;
                            responseSizeTotal += responseSize
                        });

                };

                // タイマー設定
                npc_timer = setInterval(neighbor_search_func, 1000);

            }
            console.log("responseSizeTotal:", responseSizeTotal, "byte");

        }
    );

    // 閉じるボタン
    q$("input[id='close_result']").on('click',
        function () {
            stop = true;
            q$("#search_resource").css('display', 'none');
        }
    );

}