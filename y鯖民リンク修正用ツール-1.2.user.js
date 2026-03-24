// ==UserScript==
// @name         y鯖民リンク修正用ツール
// @namespace    0009
// @version      1.2.0
// @description  y鯖民リンク修正（Chrome / Firefox / レガシーブラウザ対応）
// @match        https://*.app.mbga-platform.jp/gadgets/*
// @grant        none
// @compatible   chrome firefox
// ==/UserScript==
// version	date
// 1.0.1		2025/12/25	攻防戦対応。ボタン廃止。
// 1.2.0		2026/03/03	Firefox・レガシーブラウザ対応（ES5互換・URL未使用・MutationObserver未対応時はポーリング）
// 1.2.0		2026/03/12	wd パラメータ付きリンクを対象鯖のホストに書き換え（EMCマッチング結果等でC鯖へ正しく飛ばす）

(function () {
    'use strict';

    var doc = document;

    /* IE11 等で Element#closest が無い場合の簡易ポリフィル */
    if (typeof Element !== 'undefined' && !Element.prototype.closest) {
        Element.prototype.closest = function (sel) {
            var el = this;
            var matches = el.matches || el.webkitMatchesSelector || el.msMatchesSelector;
            if (!matches) return null;
            while (el && el.nodeType === 1) {
                if (matches.call(el, sel)) return el;
                el = el.parentElement;
            }
            return null;
        };
    }

    /* ワールド名：英数字・ハイフンのみ許可（サブドメインインジェクション防止） */
    function isSafeWorld(w) {
        return typeof w === 'string' && /^[a-zA-Z0-9-]+$/.test(w);
    }

    /* ===============================
     * 共通：first_login URL 生成（ES5互換・テンプレートリテラル未使用）
     * パラメータは encodeURIComponent でエスケープ（クエリインジェクション防止）
     * =============================== */
    function buildLoginUrl(world, ts, p, cd) {
        if (!isSafeWorld(world)) return null;
        return 'https://' + world + '.3gokushi.jp/user/first_login.php'
            + '?ts=' + encodeURIComponent(ts) + '&p=' + encodeURIComponent(p)
            + '&cd=' + encodeURIComponent(cd) + '&ch=y';
    }

    /* ===============================
     * URL 文字列からホスト名の先頭（ワールド名）を取得（URL API 未使用で IE/レガシー対応）
     * =============================== */
    function getWorldFromUrlString(urlStr) {
        if (!urlStr) return null;
        var i = urlStr.indexOf('//');
        if (i === -1) return null;
        var rest = urlStr.substring(i + 2);
        var j = rest.indexOf('/');
        var host = (j === -1) ? rest : rest.substring(0, j);
        return host.split('.')[0] || null;
    }

    /* ===============================
     * クエリ文字列から wd= の値を取得（URL API 未使用）
     * =============================== */
    function getWdFromQuery(queryStr) {
        if (!queryStr) return null;
        var m = queryStr.match(/(?:^|&)wd=([^&]*)/);
        return m ? m[1] : null;
    }

    /* ===============================
     * wd パラメータ付き *.3gokushi.jp リンクを対象鯖のホストに書き換え
     * 例: w0.3gokushi.jp/...?wd=c4 → c4.3gokushi.jp/...?wd=c4（C鯖で開く）
     * =============================== */
    function rewriteWdLink(href) {
        if (!href || href.indexOf('3gokushi.jp') === -1) return null;
        var q = href.indexOf('?');
        if (q === -1) return null;
        var pathAndQuery = href.substring(q);
        var wd = getWdFromQuery(pathAndQuery);
        if (!wd || !isSafeWorld(wd)) return null;
        var currentWorld = getWorldFromUrlString(href);
        if (currentWorld === wd) return null;
        var start = href.indexOf('//');
        if (start === -1) return null;
        var rest = href.substring(start + 2);
        var pathStart = rest.indexOf('/');
        var pathAndQueryFull = pathStart === -1 ? '/' : rest.substring(pathStart);
        var newHost = wd + '.3gokushi.jp';
        return 'https://' + newHost + pathAndQueryFull;
    }

    /* ===============================
     * selectServer(onclick) 解析
     * =============================== */
    function parseSelectServer(onClickAttr) {
        if (!onClickAttr || onClickAttr.indexOf('selectServer') === -1) return null;

        var m = onClickAttr.match(
            /selectServer\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/
        );
        if (!m) return null;

        var world = getWorldFromUrlString(m[1]);
        if (!world) return null;

        return {
            world: world,
            ts: m[2],
            p: m[3],
            cd: m[4]
        };
    }

    /* ===============================
     * ① choiseServer 変換
     * =============================== */
    function convertChoiseServer(root) {
        root = root || doc;
        var anchors = root.querySelectorAll(
            '.choiseServer a:not([data-converted])'
        );
        var i, a, data;
        for (i = 0; i < anchors.length; i++) {
            a = anchors[i];
            data = parseSelectServer(a.getAttribute('onclick'));
            if (!data) continue;
            a.href = buildLoginUrl(data.world, data.ts, data.p, data.cd) || a.href;
            a.removeAttribute('onclick');
            a.target = '_blank';
            a.setAttribute('rel', 'noopener noreferrer');
            a.setAttribute('data-converted', '1');
        }
    }

    /* ===============================
     * ② emcJoinButton joinEvent 変換
     * =============================== */
    function convertJoinEvent(root) {
        root = root || doc;
        var anchors = root.querySelectorAll(
            '.emcJoinButton .Button.joinEvent a:not([data-converted])'
        );
        var i, a, parent, classes, k, world, data;
        for (i = 0; i < anchors.length; i++) {
            a = anchors[i];
            parent = a.closest ? a.closest('.Button.joinEvent') : null;
            if (!parent) continue;

            world = null;
            classes = parent.classList ? [].slice.call(parent.classList) : [];
            for (k = 0; k < classes.length; k++) {
                if (/^e[1-4]$/.test(classes[k])) {
                    world = classes[k];
                    break;
                }
            }
            if (!world) continue;

            data = parseSelectServer(a.getAttribute('onclick'));
            if (!data) continue;

            a.href = buildLoginUrl(world, data.ts, data.p, data.cd) || a.href;
            a.removeAttribute('onclick');
            a.target = '_blank';
            a.setAttribute('rel', 'noopener noreferrer');
            a.setAttribute('data-converted', '1');
        }
    }

    /* ===============================
     * ③ wd パラメータ付きリンクのホスト書き換え（EMCマッチング結果等・C鯖／E鯖へ正しく飛ばす）
     * =============================== */
    function convertWdLinks(root) {
        root = root || doc;
        var anchors = root.querySelectorAll('a[href*="3gokushi.jp"][href*="wd="]:not([data-wd-converted])');
        var i, a, newHref;
        for (i = 0; i < anchors.length; i++) {
            a = anchors[i];
            newHref = rewriteWdLink(a.getAttribute('href'));
            if (!newHref) continue;
            a.href = newHref;
            a.setAttribute('data-wd-converted', '1');
            if (!a.target) a.target = '_blank';
            if (!a.getAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer');
        }
    }

    /* ===============================
     * 初回実行（既に存在する DOM）
     * =============================== */
    function runAll(root) {
        convertChoiseServer(root || doc);
        convertJoinEvent(root || doc);
        convertWdLinks(root || doc);
    }

    runAll();

    /* ===============================
     * DOM 変化を監視（MutationObserver 非対応時はポーリングでレガシー対応）
     * =============================== */
    function startObserver() {
        if (typeof MutationObserver !== 'undefined') {
            var observer = new MutationObserver(function (mutations) {
                var i, j, node;
                for (i = 0; i < mutations.length; i++) {
                    var nodes = mutations[i].addedNodes;
                    for (j = 0; j < nodes.length; j++) {
                        node = nodes[j];
                        if (node && node.nodeType === 1) runAll(node);
                    }
                }
            });
            if (doc.body) {
                observer.observe(doc.body, { childList: true, subtree: true });
            }
            return;
        }
        setInterval(function () { runAll(); }, 1500);
    }

    if (doc.body) {
        startObserver();
    } else {
        if (doc.addEventListener) {
            doc.addEventListener('DOMContentLoaded', startObserver);
        } else {
            setInterval(function () {
                if (doc.body) {
                    startObserver();
                }
            }, 100);
        }
    }
})();
