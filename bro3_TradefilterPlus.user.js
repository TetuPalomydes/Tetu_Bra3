// ==UserScript==
// @name         bro3_TradefilterPlus
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  「Cのみ」の横に「10TP出品」と「期限が表示された分」チェックボックスを追加
// @include      https://w1.3gokushi.jp/card/trade.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ページの特定の要素を安全に取得
    const targetElement = document.querySelector('input[value="Cのみ"]');
    if (targetElement && targetElement.parentNode) {
        const parentNode = targetElement.parentNode;

        // 「10TP出品」チェックボックスを作成
        const tpCheckboxLabel = document.createElement('label');
        tpCheckboxLabel.style.marginLeft = '10px'; // レイアウト調整

        const tpCheckbox = document.createElement('input');
        tpCheckbox.type = 'checkbox';
        tpCheckbox.id = 'filter_check_tp';
        tpCheckbox.onclick = function() {
            toggle_tp_only(this.checked);
            if (!this.checked) {
                location.reload(); // チェックボックスがfalseに設定されたときだけページを再読み込み
            }
        };

        tpCheckboxLabel.appendChild(tpCheckbox);
        tpCheckboxLabel.appendChild(document.createTextNode('10TP出品'));

        // 「本日期限分」チェックボックスを作成
        const dateCheckboxLabel = document.createElement('label');
        dateCheckboxLabel.style.marginLeft = '10px'; // レイアウト調整

        const dateCheckbox = document.createElement('input');
        dateCheckbox.type = 'checkbox';
        dateCheckbox.id = 'filter_check_date';
        dateCheckbox.onclick = function() {
            toggle_date_only(this.checked);
            if (!this.checked) {
                location.reload(); // チェックボックスがfalseに設定されたときだけページを再読み込み
            }
        };


        dateCheckboxLabel.appendChild(dateCheckbox);
        dateCheckboxLabel.appendChild(document.createTextNode('期限あり'));

        // チェックボックスをページに挿入
        parentNode.appendChild(tpCheckboxLabel);
        parentNode.appendChild(dateCheckboxLabel);
    }

    // TP出品のみの表示制御
    function toggle_tp_only(isChecked) {
        const rows = document.querySelectorAll("#trade > div > table > tbody > tr");
        rows.forEach(row => {
            if (row.classList.contains('tradeTop')) {
                row.style.display = ""; // tradeTopは常に表示
            } else {
                const tpValue = row.querySelector("td:nth-child(8) > strong");
                if (tpValue && tpValue.textContent.trim() === "10") {
                    row.style.display = isChecked ? "" : "none";
                } else {
                    row.style.display = "none";
                }
            }
        });
    }

// 表示制御の関数
function toggle_date_only(isChecked) {
    const rows = document.querySelectorAll("#trade > div > table > tbody > tr");
    rows.forEach(row => {
        if (row.classList.contains('tradeTop')) {
            row.style.display = ""; // tradeTopは常に表示
        } else {
            const limitCell = row.querySelector("td.limit");
            if (limitCell && limitCell.textContent.includes('---')) {
                row.style.display = "none"; // '---' を含む行は非表示
            } else {
                row.style.display = ""; // それ以外の行は表示
            }
        }
    });
}

})();