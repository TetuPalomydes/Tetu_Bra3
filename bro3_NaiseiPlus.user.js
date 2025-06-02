// ==UserScript==
// @name         bro3_NaiseiPlus
// @namespace    bro3_NaiseiPlus
// @description  内政画面の武将切り替え動作をワンクリックにするツール
// @version      1.01
// @include      https://*.3gokushi.jp/card/domestic_setting*
// @include      http://*.3gokushi.jp/card/domestic_setting*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ページ読み込み完了を待つ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNaiseiPlus);
    } else {
        initNaiseiPlus();
    }

    function initNaiseiPlus() {
        // 確認ダイアログを無効化
        disableConfirmDialogs();

        // 初期化処理
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(init, 500);
            });
        } else {
            setTimeout(init, 500);
        }
    }

    function init() {
        // スクロール位置復元処理
        restoreScrollPosition();
        
        // 武将選択用のラジオボタンを追加
        addQuickChangeRadioButtons();
    }

    function disableConfirmDialogs() {
        // 確認ダイアログを無効化
        if (typeof window.confirm === 'function') {
            const originalConfirm = window.confirm;
            window.confirm = function(message) {
                // 内政関連の確認は自動でOK
                if (message && (message.includes('内政') || message.includes('変更'))) {
                    return true;
                }
                return originalConfirm.call(window, message);
            };
        }
    }

    function addQuickChangeRadioButtons() {
        // 現在の内政官情報を取得
        const currentDomesticInfo = getCurrentDomesticInfo();

        // 内政解除＋デッキ下げボタンを追加
        if (currentDomesticInfo.isSet) {
            addDomesticReleaseButton(currentDomesticInfo);
        }

        // すべてのテーブルを検索して武将を探す
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            
            rows.forEach(row => {
                // 武将情報を取得
                const generalInfo = getGeneralInfoFromRow(row);
                
                // 内政設定可能な武将で、内政中でない場合
                if (generalInfo && generalInfo.canSetDomestic && !generalInfo.isDomesticActive) {
                    // 「選択」列を探す
                    const selectCell = findSelectCell(row);
                    if (selectCell) {
                        addNaiseiRadioButton(selectCell, generalInfo, currentDomesticInfo);
                    }
                }
            });
        });
    }

    function findSelectCell(row) {
        const cells = row.querySelectorAll('td, th');
        
        // 「選択」という文字が含まれるセルを探す
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (cell.textContent && cell.textContent.trim().includes('選択')) {
                return cell;
            }
        }
        
        // ラジオボタンがあるセルを探す
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (cell.querySelector('input[type="radio"]')) {
                return cell;
            }
        }
        
        return null;
    }

    function getCurrentDomesticInfo() {
        // 現在内政中の武将情報を取得
        const domesticForm = document.querySelector('form input[name="mode"][value="u_domestic"]');
        if (domesticForm) {
            const idInput = domesticForm.parentElement.querySelector('input[name="id"]');
            return {
                id: idInput ? idInput.value : null,
                isSet: true
            };
        }
        return { id: null, isSet: false };
    }

    function getGeneralInfoFromRow(row) {
        // 武将名を取得
        const nameElement = row.querySelector('.illust a');
        const name = nameElement ? nameElement.textContent.trim() : null;

        if (!name) return null;

        // 既存のラジオボタンから武将IDを取得（内政設定可能な武将の場合）
        const existingRadio = row.querySelector('input[type="radio"][name="id"]');

        if (existingRadio) {
            // 内政設定可能な武将の場合（関銀屏など）
            return {
                id: existingRadio.value,
                name: name,
                canSetDomestic: true,
                isDomesticActive: false
            };
        }

        // 内政中の武将の場合（小虎など）
        if (row.textContent.includes('内政中')) {
            // 武将カードのリンクからIDを抽出
            const cardLink = row.querySelector('a[href*="cardWindow_"]');
            if (cardLink) {
                const href = cardLink.getAttribute('href');
                const match = href.match(/cardWindow_(\d+)/);
                if (match) {
                    return {
                        id: match[1],
                        name: name,
                        canSetDomestic: false,
                        isDomesticActive: true
                    };
                }
            }

            // フォームのhiddenフィールドからIDを取得
            const parentForm = row.closest('form');
            if (parentForm) {
                const hiddenIdInput = parentForm.querySelector('input[name="domestic_id"]');
                if (hiddenIdInput) {
                    return {
                        id: hiddenIdInput.value,
                        name: name,
                        canSetDomestic: false,
                        isDomesticActive: true
                    };
                }
            }
        }

        return null;
    }

    function addNaiseiRadioButton(selectCell, generalInfo, currentDomesticInfo) {
        // 既存のボタンがあるかチェック
        if (selectCell.querySelector('.naisei-radio-container')) {
            return;
        }

        // ラジオボタンのコンテナを作成
        const naiseiContainer = document.createElement('div');
        naiseiContainer.className = 'naisei-radio-container';
        naiseiContainer.style.cssText = `
            margin-top: 8px;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f8f9fa;
            text-align: center;
        `;

        // ラジオボタンを作成
        const naiseiRadio = document.createElement('input');
        naiseiRadio.type = 'radio';
        naiseiRadio.name = 'naisei_quick_change';
        naiseiRadio.value = generalInfo.id;
        naiseiRadio.id = 'naisei_radio_' + generalInfo.id;
        naiseiRadio.style.cssText = `
            width: 18px;
            height: 18px;
            margin-right: 5px;
            vertical-align: middle;
            accent-color: #4169e1;
            border: 2px solid #ff6666;
            border-radius: 50%;
            cursor: pointer;
        `;

        // ラベルを作成
        const naiseiLabel = document.createElement('label');
        naiseiLabel.htmlFor = 'naisei_radio_' + generalInfo.id;
        naiseiLabel.textContent = '内政官に変更';
        naiseiLabel.style.cssText = `
            color: #4169e1;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
            vertical-align: middle;
        `;

        // クリックイベントを追加
        naiseiRadio.addEventListener('change', function() {
            if (this.checked) {
                // スクロール位置を保存
                saveScrollPosition(generalInfo.id);
                
                handleNaiseiChange(generalInfo, currentDomesticInfo);
            }
        });

        // コンテナに追加
        naiseiContainer.appendChild(naiseiRadio);
        naiseiContainer.appendChild(naiseiLabel);
        selectCell.appendChild(naiseiContainer);
    }

    function addDomesticReleaseButton(currentInfo) {
        // 既存の内政解除ボタンを探す
        const originalReleaseButton = document.querySelector('input[type="submit"][value="設定されている武将を解除する"]');
        if (!originalReleaseButton) return;

        // 「内政」タイトル部分を探す
        let domesticTitle = null;

        // タイトル要素を探す
        const titleElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .header, th');
        for (const element of titleElements) {
            if (element.textContent && element.textContent.trim() === '内政') {
                domesticTitle = element;
                break;
            }
        }

        // 見つからない場合は全要素から探す
        if (!domesticTitle) {
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                if (element.textContent && element.textContent.trim() === '内政' &&
                    element.children.length === 0) {
                    domesticTitle = element;
                    break;
                }
            }
        }

        if (!domesticTitle) return;

        // タイトル要素の親要素を取得
        const titleContainer = domesticTitle.parentElement;
        if (!titleContainer) return;

        // 親要素に相対位置を設定
        titleContainer.style.position = 'relative';

        // ボタンを作成
        const releaseButton = originalReleaseButton.cloneNode(true);
        releaseButton.style.cssText = `
            background: linear-gradient(to bottom, #ff6b6b, #ee5a52);
            color: white;
            border: 1px solid #ff4757;
            padding: 3px 6px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 3px;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            white-space: nowrap;
            position: absolute;
            left: 5px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
        `;

        // ホバー効果
        releaseButton.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(to bottom, #ee5a52, #ff3742)';
        });

        releaseButton.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(to bottom, #ff6b6b, #ee5a52)';
        });

        // クリックイベント：元のボタンをクリック
        releaseButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // 確認ダイアログを無効化
            const originalConfirm = window.confirm;
            const originalConfirmOnClick = window.confirmOnClick;

            window.confirm = function() { return true; };
            window.confirmOnClick = function() { return true; };

            try {
                // 元のボタンのフォームを直接送信
                const form = originalReleaseButton.form;
                if (form) {
                    // onclickイベントを一時的に削除
                    originalReleaseButton.onclick = null;

                    // フォームのaction URLを直接取得して移動
                    const formAction = form.action;
                    const formElements = form.elements;
                    const params = [];
                    
                    for (let i = 0; i < formElements.length; i++) {
                        const element = formElements[i];
                        if (element.name && element.value) {
                            params.push(encodeURIComponent(element.name) + '=' + encodeURIComponent(element.value));
                        }
                    }

                    // URLパラメータとして送信
                    window.location.href = formAction + '?' + params.join('&');
                } else {
                    // フォームが見つからない場合は元のボタンをクリック
                    originalReleaseButton.click();
                }
            } finally {
                // 確認ダイアログ関数を元に戻す
                window.confirm = originalConfirm;
                if (originalConfirmOnClick) {
                    window.confirmOnClick = originalConfirmOnClick;
                }
            }
        });

        // タイトルコンテナにボタンを追加
        titleContainer.appendChild(releaseButton);
    }

    function handleNaiseiChange(generalInfo, currentInfo) {
        // 現在の内政官と同じ場合は何もしない
        if (currentInfo.isSet && currentInfo.id === generalInfo.id) {
            return;
        }

        // 確認ダイアログを削除し、直接処理実行
        executeNaiseiChange(generalInfo.id);
    }

    function executeNaiseiChange(newGeneralId) {
        // 既存のラジオボタンをチェック状態にする
        const targetRadio = document.querySelector('input[type="radio"][name="id"][value="' + newGeneralId + '"]');
        if (targetRadio) {
            targetRadio.checked = true;

            // 既存の「内政官をチェックした武将に変更」ボタンを探してクリック
            const changeButton = document.querySelector('input[type="submit"][value*="内政官をチェックした武将に変更"]');
            if (changeButton) {
                // ボタンのフォームを送信
                changeButton.form.submit();
                return;
            }
        }

        // 直接新しい武将を設定
        const setUrl = '/card/domestic_setting.php?mode=domestic&id=' + newGeneralId;
        window.location.href = setUrl;
    }

    // スクロール位置を保存する関数
    function saveScrollPosition(generalId) {
        try {
            const scrollInfo = {
                scrollY: window.scrollY || window.pageYOffset || document.documentElement.scrollTop,
                scrollX: window.scrollX || window.pageXOffset || document.documentElement.scrollLeft,
                generalId: generalId,
                timestamp: Date.now()
            };
            
            sessionStorage.setItem('naisei_scroll_position', JSON.stringify(scrollInfo));
        } catch (e) {
            // エラーは無視
        }
    }

    // スクロール位置を復元する関数
    function restoreScrollPosition() {
        try {
            const savedScrollInfo = sessionStorage.getItem('naisei_scroll_position');
            if (!savedScrollInfo) return;

            const scrollInfo = JSON.parse(savedScrollInfo);
            
            // 5分以内の保存データのみ有効
            if (Date.now() - scrollInfo.timestamp > 5 * 60 * 1000) {
                sessionStorage.removeItem('naisei_scroll_position');
                return;
            }
            
            // 少し遅延してからスクロール（DOM構築完了を待つ）
            setTimeout(function() {
                // まず対象武将の近くにスクロール
                scrollToGeneral(scrollInfo.generalId);
                
                // その後、保存された正確な位置にスクロール
                setTimeout(function() {
                    window.scrollTo(scrollInfo.scrollX, scrollInfo.scrollY);
                }, 300);
            }, 200);

            // 使用済みデータを削除
            sessionStorage.removeItem('naisei_scroll_position');
            
        } catch (e) {
            sessionStorage.removeItem('naisei_scroll_position');
        }
    }

    // 特定の武将の近くにスクロールする関数
    function scrollToGeneral(generalId) {
        try {
            // ラジオボタンやテーブル行から武将を探す
            const targetElements = [
                document.querySelector('input[type="radio"][name="id"][value="' + generalId + '"]'),
                document.querySelector('#naisei_radio_' + generalId),
                ...Array.from(document.querySelectorAll('td')).filter(td => 
                    td.textContent && td.textContent.includes(generalId))
            ].filter(el => el);

            if (targetElements.length > 0) {
                const targetElement = targetElements[0];
                
                // 要素の位置を取得
                const rect = targetElement.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // 要素が画面中央に来るようにスクロール（少し上にオフセット）
                const targetY = rect.top + scrollTop - (window.innerHeight / 3);
                
                window.scrollTo({
                    top: Math.max(0, targetY),
                    behavior: 'smooth'
                });
            }
        } catch (e) {
            // エラーは無視
        }
    }

})();
