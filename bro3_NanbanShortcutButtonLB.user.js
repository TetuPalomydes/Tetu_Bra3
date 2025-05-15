// ==UserScript==
// @name        bro3_NanbanShortcutButtonlegacybrowser
// @description 旧ブラウザ用南蛮画面にショートカットボタンを追加
// @include     https://*.3gokushi.jp/npc_assault*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @grant       none
// ==/UserScript==

(function() {
  'use strict';

  if (window.hasRunNanbanShortcut) return; // 重複実行防止
  window.hasRunNanbanShortcut = true;

  var subdomain = window.location.hostname.split('.')[0];

  var categories = {
    '進攻': [
        { name: '進攻100', npcId: '100', bgColor: '#00a34f', textColor: '#FFFFFF' },
        { name: '進攻101', npcId: '101', bgColor: '#00a34f', textColor: '#FFFFFF' }
    ],
    '強攻': [
      { name: '強攻81', npcId: '1081', bgColor: '#8610b0', textColor: '#FFFFFF' },
      { name: '強攻82', npcId: '1082', bgColor: '#8610b0', textColor: '#FFFFFF' },
      { name: '強攻83', npcId: '1083', bgColor: '#8610b0', textColor: '#FFFFFF' },
    ],
    '猛攻': [
      { name: '猛攻9', npcId: '2009', bgColor: '#de0051', textColor: '#FFFFFF' },
      { name: '猛攻13', npcId: '2013', bgColor: '#de0051', textColor: '#FFFFFF' },
      { name: '猛攻19', npcId: '2019', bgColor: '#de0051', textColor: '#FFFFFF' },
      { name: '猛攻25', npcId: '2025', bgColor: '#de0051', textColor: '#FFFFFF' },
      { name: '猛攻31', npcId: '2031', bgColor: '#de0051', textColor: '#FFFFFF' }
    ]
  };

  // 既存のボタンを削除する関数
  function clearExistingButtons() {
    var targetElement = document.querySelector('.npc-assault-top-img');
    if (targetElement) {
      var buttons = targetElement.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        targetElement.removeChild(buttons[i]);
      }
    }
  }

  // ボタンを追加する関数
function addButtons() {
  var targetElement = document.querySelector('.npc-assault-top-img');
  if (!targetElement) return;

  var topOffset = 70;
  var categoriesKeys = Object.keys(categories);
  for (var i = 0; i < categoriesKeys.length; i++) {
    var category = categoriesKeys[i];
    var leftOffset = 50;
    var rowCounter = 0;
    var shortcuts = categories[category];
    for (var j = 0; j < shortcuts.length; j++) {
      if (j % 3 === 0 && j !== 0) {
        rowCounter++;
        leftOffset = 50;
      }
      // ボタン作成と追加
      var shortcut = shortcuts[j];
      var button = document.createElement('button');
      button.style.width = '80px';
      button.style.height = '25px';
      button.style.background = shortcut.bgColor;
      button.style.color = shortcut.textColor;
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      button.innerText = shortcut.name;

      button.style.position = 'absolute';
      button.style.top = (topOffset + (rowCounter * 35)) + 'px';
      button.style.left = leftOffset + 'px';
      button.style.transform = 'translateX(-50%)';
      button.style.zIndex = '1000';

      // クリックイベント
      (function(npcId) {
        button.onclick = function() {
          window.location.href = 'https://' + subdomain + '.3gokushi.jp/npc_assault/?npc_assault_id=' + npcId;
        };
      })(shortcut.npcId);

      targetElement.style.position = 'relative';
      targetElement.appendChild(button);
      leftOffset += 90;
    }
    topOffset += (rowCounter + 1) * 35;
  }
}

  // 定期的にボタンを再描画（動的変化に対応）
  setInterval(function() {
    clearExistingButtons();
    addButtons();
  }, 5000); // 5秒ごとに更新

})();
