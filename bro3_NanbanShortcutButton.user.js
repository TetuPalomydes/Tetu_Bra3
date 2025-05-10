// ==UserScript==
// @name        bro3_NanbanShortcutButton
// @description 南蛮画面にショートカットボタンを追加
// @include     https://*.3gokushi.jp/npc_assault*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @grant       none
// ==/UserScript==

(function() {
  'use strict';

  const subdomain = window.location.hostname.split('.')[0];

  const categories = {
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

  function addShortcutButton(shortcut, topOffset, leftOffset) {
    const button = document.createElement('button');
    button.style.width = '80px';
    button.style.height = '25px';
    button.style.background = shortcut.bgColor;
    button.style.color = shortcut.textColor;
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.innerText = shortcut.name;

    button.style.position = 'absolute';
    button.style.top = `${topOffset}px`;
    button.style.left = `${leftOffset}px`;
    button.style.transform = 'translateX(-50%)';
    button.style.zIndex = '1000';

    button.addEventListener('click', function() {
      window.location.href = `https://${subdomain}.3gokushi.jp/npc_assault/?npc_assault_id=${shortcut.npcId}`;
    });

    const targetElement = document.querySelector('.npc-assault-top-img');
    if (targetElement) {
      targetElement.style.position = 'relative';
      targetElement.appendChild(button);
    }
  }

  window.addEventListener('load', function() {
    let topOffset = 70;
    Object.keys(categories).forEach(category => {
      let leftOffset = 50;
      let rowCounter = 0;
      categories[category].forEach((shortcut, index) => {
        if (index % 3 === 0 && index !== 0) { // 3つごとに改行
          rowCounter++;
          leftOffset = 50;
        }
        addShortcutButton(shortcut, topOffset + (rowCounter * 35), leftOffset);
        leftOffset += 90; // Adjust horizontal spacing between buttons
      });
      topOffset += (rowCounter + 1) * 35; // Adjust vertical spacing between categories
    });
  });
})();