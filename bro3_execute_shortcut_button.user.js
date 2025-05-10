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

// 新しいボタンを作成
window.onload = function() {
  createCustomButton("武将戦7", `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=1007`);
  createCustomButton("武将戦20", `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=1020`);
  createCustomButton("部隊戦5", `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=2005`);
  createCustomButton("部隊戦12", `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=2012`);
  createCustomButton("同盟戦7", `https://${subdomain}.3gokushi.jp/npc_expedition/index.php?stage_id=4007`);
};

// 新しい関数
function createCustomButton(name, url) {
  const button = document.createElement("button");
  button.textContent = name;
  button.style.marginRight = "10px";
  button.classList.add("same-league");
  button.onclick = function() {
    window.location.href = url;
  };

  const northBtn = document.querySelector(".btn_help");
  if (northBtn) {
    northBtn.parentNode.insertBefore(button, northBtn);
  }
}