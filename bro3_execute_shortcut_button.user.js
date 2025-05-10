// ==UserScript==
// @name        bro3_execute_shortcut_button
// @description 北伐画面の上部に新しいショートカットボタンを追加します。
// @include     http*://*.3gokushi.jp/npc_expedition*
// @exclude     http*://*.3gokushi.jp/maintenance*
// @exclude     http*://info.3gokushi.jp/*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect     3gokushi.jp
// @grant       GM_addStyle
// @author      tetu
// @version     1.0
// ==/UserScript==

const subdomain = window.location.hostname.split('.')[0]; // サブドメイン取得

const buttonData = [
  { name: "武将戦7", url: `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=1007` },
  { name: "武将戦20", url: `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=1020` },
  { name: "部隊戦5", url: `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=2005` },
  { name: "部隊戦12", url: `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=2012` },
  { name: "同盟戦7", url: `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=4007` }
];

function clearExistingButtons() {
  buttonData.forEach(({ name }) => {
    document.querySelectorAll(`button[data-name="${name}"]`).forEach(btn => btn.remove());
  });
}

function createButtons() {
  buttonData.forEach(({ name, url }) => {
    if (document.querySelector(`button[data-name="${name}"]`)) return;

    const button = document.createElement("button");
    button.textContent = name;
    button.style.marginRight = "10px";
    button.classList.add("same-league");
    button.setAttribute("data-name", name);
    button.onclick = () => {
      window.location.href = url;
    };

    const northBtn = document.querySelector(".btn_help");
    if (northBtn) {
      northBtn.parentNode.insertBefore(button, northBtn);
    }
  });
}

// 0.5秒ごとにボタンの再描画
setInterval(() => {
  clearExistingButtons();
  createButtons();
}, 500);
