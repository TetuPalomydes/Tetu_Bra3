// ==UserScript==
// @name         bro3_NaiseiPlus
// @namespace    bro3_NaiseiPlus
// @description  内政画面の武将切り替え動作をワンクリックにするツール
// @version      1.0
// @include      httpS://*.3gokushi.jp/card/domestic_setting*
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
        // 内政設定画面かどうかを確認
        if (!document.querySelector('form[name="input_domestic"]') && !document.querySelector('.domesticGeneralListTbl')) {
            return;
        }

        // 確認ダイアログを無効化（内政解除用）
        disableConfirmDialogs();

        addQuickChangeRadioButtons();

        // ページ読み込み時にデッキ下げ処理があるかチェック
        checkDeckDropAction();
    }

    function disableConfirmDialogs() {
        // 確認ダイアログ関数を無効化
        if (typeof window.confirmOnClick === 'function') {
            window.confirmOnClick = function() { return true; };
        }

        // 元のconfirm関数も保存して無効化
        if (!window.originalConfirm) {
            window.originalConfirm = window.confirm;
        }
        window.confirm = function() { return true; };
    }

    function addQuickChangeRadioButtons() {
        // 武将テーブルを全て取得（複数のテーブルがある場合に対応）
        const domesticTables = document.querySelectorAll('.domesticGeneralListTbl');
        if (domesticTables.length === 0) return;

        // 現在内政中の武将情報を取得
        const currentDomesticInfo = getCurrentDomesticInfo();

        // 内政中の武将がいる場合、上のテーブルの左側にボタンを追加
        if (currentDomesticInfo.isSet) {
            addDomesticReleaseAndDeckDropButton(currentDomesticInfo);
        }

        // 各テーブルを処理
        domesticTables.forEach(domesticTable => {
            // 武将行を取得して処理
            const generalRows = domesticTable.querySelectorAll('tr');

            generalRows.forEach((row, index) => {
                // ヘッダー行はスキップ
                if (index === 0) return;

                // 選択列（最初の列）のみを対象とする
                const selectCell = row.querySelector('td:first-child');
                if (!selectCell) return;

                // スキル列かどうかをチェック（スキル列には追加しない）
                if (selectCell.classList.contains('skill') ||
                    selectCell.querySelector('.skill') ||
                    selectCell.textContent.includes('LV') ||
                    selectCell.querySelector('a[href*="skill"]')) {
                    return;
                }

                // 武将情報を取得
                const generalInfo = getGeneralInfoFromRow(row);
                if (!generalInfo) return;

                // 内政官設定用のラジオボタンを追加（内政中でない武将のみ）
                addNaiseiRadioButton(selectCell, generalInfo, currentDomesticInfo);
            });
        });

        // 説明を追加（最初のテーブルの前に）
        if (domesticTables.length > 0) {
            addInstructionPanel(domesticTables[0]);
        }
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
        // 「内政中」というテキストがある場合
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
        // 内政中の武将の場合は何も追加しない
        if (generalInfo.isDomesticActive) {
            return;
        }

        // 内政設定可能な武将（関銀屏など）にのみラジオボタンを追加
        if (generalInfo.canSetDomestic) {
            // 内政官設定用のコンテナを作成
            const naiseiContainer = document.createElement('div');
            naiseiContainer.style.cssText = `
                margin-top: 8px;
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #ffe6e6;
            `;

            // ラジオボタンを作成
            const naiseiRadio = document.createElement('input');
            naiseiRadio.type = 'radio';
            naiseiRadio.name = 'naisei_quick_select';
            naiseiRadio.value = generalInfo.id;
            naiseiRadio.id = 'naisei_radio_' + generalInfo.id;
            naiseiRadio.checked = false;

            // ラジオボタンのスタイル設定（互換性向上版）
            const radioStyle = [
                'width: 18px',
                'height: 18px',
                'margin-right: 5px',
                'cursor: pointer',
                '-webkit-appearance: none',
                '-moz-appearance: none',
                'appearance: none',
                'border: 2px solid #ff6666',
                'border-radius: 50%',
                'background: #ffffff',
                'position: relative',
                '-webkit-transform: scale(1.2)',
                '-moz-transform: scale(1.2)',
                '-ms-transform: scale(1.2)',
                'transform: scale(1.2)'
            ].join('; ');
            
            naiseiRadio.style.cssText = radioStyle;

            // ホバー効果を追加
            naiseiRadio.addEventListener('mouseenter', function() {
                this.style.background = '#ffcccc';
                this.style.webkitTransform = 'scale(1.3)';
                this.style.mozTransform = 'scale(1.3)';
                this.style.msTransform = 'scale(1.3)';
                this.style.transform = 'scale(1.3)';
            });

            naiseiRadio.addEventListener('mouseleave', function() {
                this.style.background = '#ffffff';
                this.style.webkitTransform = 'scale(1.2)';
                this.style.mozTransform = 'scale(1.2)';
                this.style.msTransform = 'scale(1.2)';
                this.style.transform = 'scale(1.2)';
            });

            // ラベルを作成
            const naiseiLabel = document.createElement('label');
            naiseiLabel.htmlFor = 'naisei_radio_' + generalInfo.id;
            naiseiLabel.style.cssText = `
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                color: #4169e1;
            `;
            naiseiLabel.textContent = '内政官に変更';

            // クリックイベントを追加
            naiseiRadio.addEventListener('change', function() {
                if (this.checked) {
                    handleNaiseiChange(generalInfo, currentDomesticInfo);
                }
            });

            naiseiLabel.addEventListener('click', function(e) {
                e.preventDefault();
                naiseiRadio.checked = true;
                handleNaiseiChange(generalInfo, currentDomesticInfo);
            });

            // コンテナに追加
            naiseiContainer.appendChild(naiseiRadio);
            naiseiContainer.appendChild(naiseiLabel);

            // セルに追加
            selectCell.appendChild(naiseiContainer);
        }
    }

    function addDomesticReleaseAndDeckDropButton(currentInfo) {
        // 既存の内政解除ボタンを探す
        const originalReleaseButton = document.querySelector('input[type="submit"][value="設定されている武将を解除する"]');
        if (!originalReleaseButton) return;

        // 「内政」タイトル部分をシンプルに探す
        let domesticTitle = null;

        // まずは一般的なタイトル要素を探す
        const titleElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .header, th');
        for (let i = 0; i < titleElements.length; i++) {
            const element = titleElements[i];
            if (element.textContent && element.textContent.trim() === '内政') {
                domesticTitle = element;
                break;
            }
        }

        // 見つからない場合は全要素から探す
        if (!domesticTitle) {
            const allElements = document.querySelectorAll('*');
            for (let i = 0; i < allElements.length; i++) {
                const element = allElements[i];
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
        
        // ボタンスタイル（互換性向上版）
        const buttonStyle = [
            'background: linear-gradient(to bottom, #ff6b6b, #ee5a52)',
            'color: white',
            'border: 1px solid #ff4757',
            'padding: 3px 6px',
            'font-size: 12px',
            'font-weight: bold',
            'border-radius: 3px',
            'cursor: pointer',
            'box-shadow: 0 1px 2px rgba(0,0,0,0.2)',
            'white-space: nowrap',
            'position: absolute',
            'left: 5px',
            'top: 50%',
            '-webkit-transform: translateY(-50%)',
            '-moz-transform: translateY(-50%)',
            '-ms-transform: translateY(-50%)',
            'transform: translateY(-50%)',
            'z-index: 10'
        ].join('; ');
        
        releaseButton.style.cssText = buttonStyle;

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

            // 確認ダイアログとconfirmOnClick関数を無効化
            const originalConfirm = window.confirm;
            const originalConfirmOnClick = window.confirmOnClick;

            window.confirm = function() { return true; };
            window.confirmOnClick = function() { return true; };

            try {
                // 元のボタンのフォームを直接送信
                const form = originalReleaseButton.form;
                if (form) {
                    // onclickイベントを一時的に削除
                    const originalOnclick = originalReleaseButton.onclick;
                    originalReleaseButton.onclick = null;

                    // フォームのaction URLを直接取得して移動
                    const formAction = form.action;
                    
                    // FormData/URLSearchParams互換性対応
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

        // タイトルコンテナにボタンを追加（絶対位置で重ねる）
        titleContainer.appendChild(releaseButton);
    }

    function handleNaiseiChange(generalInfo, currentInfo) {
        // 現在の内政官と同じ場合は何もしない
        if (currentInfo.isSet && currentInfo.id === generalInfo.id) {
            return;
        }

        // 確認ダイアログを削除し、直接処理実行
        executeNaiseiChange(generalInfo.id, currentInfo);
    }

    function executeNaiseiChange(newGeneralId, currentInfo) {
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

    function addInstructionPanel(domesticTable) {
        // 説明パネルを作成
        const instructionPanel = document.createElement('div');
        instructionPanel.style.cssText = `
            background: #e8f4fd;
            border: 1px solid #4169e1;
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
            font-size: 12px;
            color: #2c5aa0;
        `;

        instructionPanel.innerHTML = `
            <strong>🔧 内政官クイック変更</strong><br>
            内政設定可能な武将の「選択」欄にある <span style="color: #4169e1;">●内政官に変更</span> をクリックすると、ワンクリックで内政官を変更できます。<br>
        `;

        // テーブルの前に挿入
        domesticTable.parentElement.insertBefore(instructionPanel, domesticTable);
    }

    // ページ読み込み時にデッキ下げ処理があるかチェック
    function checkDeckDropAction() {
        // デッキ下げ機能は削除
        return;
    }

})();