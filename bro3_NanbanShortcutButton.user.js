// ==UserScript==
// @name        bro3_NanbanShortcutButton
// @description 南蛮画面にショートカットボタンを追加
// @version     1.1
// @include     https://*.3gokushi.jp/npc_assault*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @grant       none
// ==/UserScript==
// 2025/05/21 1.1 猛攻編の南蛮衛兵配置設定が関数の競合で動かなくなっていたので修正

(function() {
  'use strict';

  // 既存の機能が完全に読み込まれた後に実行するように変更
  function initializeShortcutButtons() {
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

    let topOffset = 70;
    Object.keys(categories).forEach(category => {
      let leftOffset = 50;
      let rowCounter = 0;
      categories[category].forEach((shortcut, index) => {
        if (index % 3 === 0 && index !== 0) {
          rowCounter++;
          leftOffset = 50;
        }
        addShortcutButton(shortcut, topOffset + (rowCounter * 35), leftOffset);
        leftOffset += 90;
      });
      topOffset += (rowCounter + 1) * 35;
    });
  }

  // 南蛮衛兵配置設定の機能を修正
  function fixUnitDivideFunction() {
    const originalOnChangeUnitDivide = window.onChangeUnitDivide;
    if (originalOnChangeUnitDivide) {
      window.onChangeUnitDivide = function(target, target_type, unit_id, max_unit_count, org_rate) {
        try {
          let new_rate = Math.min(100, Math.max(0, Math.floor(target.value)));
          target.value = new_rate;

          let buddy_target_type = target_type ^ 3;
          let buddy_id_suffix = buddy_target_type + "_" + unit_id;
          let buddy_rate = 100 - new_rate;
          
          const buddyRateElement = document.getElementById('unit_divide_rate_' + buddy_id_suffix);
          if (buddyRateElement) {
            buddyRateElement.value = buddy_rate;
          }

          let new_count = Math.floor(max_unit_count * (new_rate / 100));
          const countElement = document.getElementById('unit_divide_count_' + target_type + '_' + unit_id);
          const buddyCountElement = document.getElementById('unit_divide_count_' + buddy_id_suffix);
          
          if (countElement && buddyCountElement) {
            countElement.innerText = new_count;
            buddyCountElement.innerText = max_unit_count - new_count;
          }

          const changed_class = 'npc-assault-unit-divide-changed';
          const elements = document.getElementsByClassName('unit_divide_cell_' + unit_id);
          const changedFlagElement = document.getElementById('unit_divide_changed_flg_' + unit_id);
          
          if (changedFlagElement) {
            changedFlagElement.value = new_rate !== org_rate ? 1 : 0;
          }

          for (let element of elements) {
            if (new_rate !== org_rate) {
              element.classList.add(changed_class);
            } else {
              element.classList.remove(changed_class);
            }
          }

          const submitButton = document.getElementById('unit-divide-submit');
          if (submitButton) {
            const changedFlags = document.querySelectorAll('[id*="unit_divide_changed_flg_"]');
            const is_changed = Array.from(changedFlags).some(element => element.value > 0);
            submitButton.disabled = !is_changed;
          }
        } catch (error) {
          console.error('ユニット分割処理でエラーが発生しました:', error);
        }
      };
    }
  }

  // DOMContentLoadedとloadの両方のイベントを待機
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        initializeShortcutButtons();
        fixUnitDivideFunction();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      initializeShortcutButtons();
      fixUnitDivideFunction();
    }, 1000);
  }

  window.addEventListener('load', function() {
    setTimeout(() => {
      initializeShortcutButtons();
      fixUnitDivideFunction();
    }, 1000);
  });
})();
