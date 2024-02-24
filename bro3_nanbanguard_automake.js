// ==UserScript==
// @name        bro3_nanbanguard_automake
// @description 南蛮衛兵自動装填（1時間毎確認）
// @include     https://*.3gokushi.jp/user/
// @include     https://*.3gokushi.jp/council/npc_assault.php
// @exclude     http*://*.3gokushi.jp/maintenance*
// @grant       none
// @author      tetu
// @version     0.1
// ==/UserScript==

//【使い方】
//プロフで設定＞軍議所の南蛮ページを開けば自動装填
//そのまま軍議所の南蛮ページで放置すると毎時見に行く
//自動OKは危なっかしいので封印 128～135行 と 149行目の // を削除すれば自動でOKを押すようになります。

// ラジオボタンを作成する関数
function createRadioButton(name, value, label) {
    var radioButton = document.createElement('input');
    radioButton.type = 'radio';
    radioButton.name = name;
    radioButton.value = value;
    var labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.insertBefore(radioButton, labelElement.firstChild);

    return labelElement;
}

// セレクタを作成する関数
function createSelectBox(name, options) {
    var select = document.createElement('select');
    select.name = name;

    options.forEach(function(option) {
        var optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        select.appendChild(optionElement);
    });

    return select;
}

// 資源・NPC探索設定のリンク要素を取得
var linkElement = document.evaluate('/html/body/div[3]/div[3]/div[2]/div[2]/div[1]/div[3]/div/ul[1]/li[6]/a', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
if (linkElement) {
    var parentElement = linkElement.parentElement; // リンク要素の親要素を取得
    var radioButton1 = createRadioButton('unit_type', '318', '戦斧兵');
    var radioButton2 = createRadioButton('unit_type', '319', '双剣兵');
    var radioButton3 = createRadioButton('unit_type', '320', '大錘兵');

    var selectOptions = [
        { value: '100000', label: '100000' },
        { value: '300000', label: '300000' },
        { value: '600000', label: '600000' },
        { value: '1000000', label: '1000000' },
        { value: '1500000', label: '1500000' },
        { value: '2000000', label: '2000000' }
    ];
    var selectBox = createSelectBox('unit_quantity', selectOptions);

    parentElement.appendChild(document.createTextNode(' | ')); // 仕切りを追加
    parentElement.appendChild(radioButton1);
    parentElement.appendChild(radioButton2);
    parentElement.appendChild(radioButton3);
    parentElement.appendChild(selectBox);

    // ローカルストレージから値を取得してセットする
    var selectedUnitType = localStorage.getItem('selected_unit_type');
    var selectedUnitQuantity = localStorage.getItem('selected_unit_quantity');
    if (selectedUnitType && selectedUnitQuantity) {
        document.querySelector('input[type="radio"][name="unit_type"][value="' + selectedUnitType + '"]').checked = true;
        document.querySelector('select[name="unit_quantity"]').value = selectedUnitQuantity;
    }

    // ラジオボタンとセレクタの選択が変更されたときにローカルストレージに値を保存する
    parentElement.addEventListener('change', function(event) {
        if (event.target.tagName === 'INPUT' && event.target.type === 'radio' && event.target.name === 'unit_type') {
            localStorage.setItem('selected_unit_type', event.target.value);
        } else if (event.target.tagName === 'SELECT' && event.target.name === 'unit_quantity') {
            localStorage.setItem('selected_unit_quantity', event.target.value);
        }
    });
} else {
    console.error('資源・NPC探索設定のリンク要素が見つかりませんでした。');
}

// ラジオボタンをクリックする関数
function clickRadioButtonWithValue(value) {
    var radioButton = document.querySelector('input[type="radio"][name="unit_id"][value="' + value + '"]');
    if (radioButton) {
        radioButton.click();
    } else {
        console.error('ラジオボタンが見つかりませんでした。');
    }
}

// セレクトボックスの値を設定する関数
function setSelectValue(value) {
    var select = document.querySelector('.level-select');
    if (select) {
        select.value = value;
    } else {
        console.error('セレクトボックスが見つかりませんでした。');
    }
}

// XPathを使用して要素を見つける関数
function findElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// 要素をクリックする関数
function clickElement(element) {
    if (element) {
        element.click();
    } else {
        console.error('要素が見つかりませんでした。');
    }
}

// XPathを使用して要素を見つけてクリックする
const xpath = '/html/body/div[3]/div[3]/div[2]/div[2]/div[1]/div[3]/div/div[3]/div/div[2]/table/tbody/tr[7]/td/input';
const buttonElement = findElementByXPath(xpath);

// OKボタンをクリックする関数
//function clickOkButton() {
//    var okButton = document.getElementById('b3_dialog_input_ok');
//    if (okButton) {
//        okButton.click();
//    } else {
//        console.error('OKボタンが見つかりませんでした。');
//    }
//}

// ラジオボタンとセレクトボックスの値を指定して自動化手順を実行する関数
function automateProcessWithOkButton(unitValue, selectValue) {
    // ラジオボタンをクリック
    clickRadioButtonWithValue(unitValue);

    // セレクトボックスの値を設定
    setSelectValue(selectValue);

    // ボタンをクリック
    clickElement(buttonElement);

    // OKボタンをクリック
 //   clickOkButton();
}

// ユニットとセレクトボックスの値を取得
var unitValue = localStorage.getItem('selected_unit_type'); // ローカルストレージからユニットの値を取得
var selectValue = localStorage.getItem('selected_unit_quantity'); // ローカルストレージからセレクトボックスの値を取得

// 自動化する手順を実行する
automateProcessWithOkButton(unitValue, selectValue);

// 一時間後にリロード（F5）を実行する
function reloadPageAfterOneHour() {
    setTimeout(function() {
         location.reload();
     }, 3600000); // 3600000ミリ秒 = 1時間
 }
 
 // 関数を呼び出して一時間後にリロードをスケジュールする
 reloadPageAfterOneHour();
