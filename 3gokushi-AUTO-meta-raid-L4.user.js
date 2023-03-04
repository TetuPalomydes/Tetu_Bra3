// ==UserScript==
// @name           3gokushi-AUTO-meta-raid-L4
// @description    ブラウザ三国志でレイドが捗るかもしれないツール_☆4以下固定
// @version        2.3.0.1
// @namespace      3gokushi-AUTO-meta
// @include        http://*.3gokushi.jp/*
// @include        https://*.3gokushi.jp/*
// @exclude        http://info.3gokushi.jp/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// @grant 	GM_openInTab
// @grant 	GM_addStyle
// @grant	GM_getValue
// @grant	GM_setValue
// @grant	GM_deleteValue
// 更新履歴　2023.03.02　取り急ぎワールドの暴走対応
// ==/UserScript==




var ua = window.navigator.userAgent;

if (ua.indexOf("Firefox") > 0 && comp_version(GM_info.version, '>=', '4')) {
	// Firefox+GreaseMonkey4ではjQueryとjQuery-uiの読み込み方を変える

	// GreaseMonkeyラッパー関数の定義
	initGMWrapper();

	// load jQuery
//	q$ = $;

} else {
	// load jQuery
//	jQuery.noConflict();
//	q$ = jQuery;

}

var UPDATE_MIN=cloadData('meta-raid_periodic_time',1800,1);
var current_min = UPDATE_MIN;

var path = location.pathname;
//討伐画面は処理しない add 2017.08.09
if (!path.match(/event_battle/)){return;}
var deckfile = null;

//討伐画面に遷移
function moveBattleScreen ( entry_id, ssid){

	var h = document.createElement('form');
	h.action = '/card/event_battle_attack.php';
	h.method = 'post';
	document.body.appendChild(h);

	var f = document.createElement('input');
	f.type = 'hidden';
	f.name = 'entry_id';
	f.value = entry_id;
	h.appendChild(f);


	var e = document.createElement('input');
	e.type = 'hidden';
	e.name = 'SSID';
	e.value = ssid;
	h.appendChild(e);

	h.submit();
}



function showBattleComment( entry_id, ssid) {
 console.log('start');

	var postData = {
		mode                :'post_comment',
		entry_id            : entry_id,
		target_card         : 0,
		deck_set_flg        : '1',
		rem_attack_num      : 3,
		p                   : '',
		ssid                : ssid,
		use_attack_up_flg   : 0,
		buy_attack_up_flg   : 1,
		use_gauge_up_flg    : 0,
		buy_gauge_up_flg    : 1,
		use_force_end_flg   : 0,
		buy_force_end_flg   : 1,
		l:0,
	};


	console.log('コメントへ～');
	 $.post( '/card/event_battle_attack.php', postData )
	 .then( function( html ) {
	 	console.log('成功したっぽい');
	 	//console.log(html);
	 })
	// 処理失敗
	.fail( function(  ) {
		console.log("えら～");
	});
}

function csaveData(key, value, local, ev) {
	if (local) key = location.hostname + key;
	if (ev) {
	    value = JSON.stringify(value);
	}
	GM_setValue(key, value);
}

function cloadData(key, value, local, ev) {
	if (local) key = location.hostname + key;
	var ret = GM_getValue(key, value);
	if (ev && ret) {
	    ret = JSON.parse(ret);
	}
	return  ret;
}


//■■■■■■■■■■■■■■■■■■■

//■ プロトタイプ

//. String.prototype
$.extend(String.prototype,{toInt:function(){return parseInt(this.replace(/,/g,""),10);},toFloat:function(){return parseFloat(this.replace(/,/g,""));},repeat:function(num){var str=this,result="";for(;num>0;num>>>=1,str+=str)if(num&1)result+=str;return result;},getTime:function(){if(!/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(this))throw new Error("Invalid string");var date=this.replace(/-/g,"/");return~~((new Date(date)).getTime()/1E3);}});
//. Number.prototype
$.extend(Number.prototype,{toInt:function(){return this;},toFloat:function(){return this;},toRound:function(decimal){decimal=decimal===undefined?0:decimal;var num=Math.pow(10,decimal);return Math.round(this*num)/num;},toFloor:function(decimal){decimal=decimal===undefined?0:decimal;var num=Math.pow(10,decimal);return Math.floor(this*num)/num;},toFormatNumber:function(decimal,replaceNaN){decimal=decimal===undefined?0:decimal;if(isNaN(this))return replaceNaN||"";var num=this.toFloor(decimal),result=new String(num);while(result!=(result=result.replace(/^(-?\d+)(\d{3})/,"$1,$2")));if(decimal>0&&num%1===0)result+="."+"0".repeat(decimal);return result;},toFormatDate:function(format){var date=new Date(this*1E3);return date.toFormatDate(format);},toFormatTime:function(format){format=format||"hh:mi:ss";var h,m,s;if(this<=0)h=m=s=0;else {h=Math.floor(this/3600);m=Math.floor((this-h*3600)/60);s=Math.floor(this-h*3600-m*60);}if(h>=100)format=format.replace("hh",h);else format=format.replace("hh",("00"+h).substr(-2));format=format.replace("mi",("00"+m).substr(-2));format=format.replace("ss",("00"+s).substr(-2));return format;}});
//. Date.prototype
$.extend(Date.prototype,{toFormatDate:function(format){format=format||"yyyy/mm/dd hh:mi:ss";format=format.replace("yyyy",this.getFullYear());format=format.replace("mm",this.getMonth()+1);format=format.replace("dd",this.getDate());format=format.replace("hh",("00"+this.getHours()).substr(-2));format=format.replace("mi",("00"+this.getMinutes()).substr(-2));format=format.replace("ss",("00"+this.getSeconds()).substr(-2));return format;}});
//. Array.prototype
$.extend(Array.prototype,{unique:function(){var result=[],temp={};for(var i=0,len=this.length;i<len;i++)if(!temp[this[i]]){temp[this[i]]=true;result.push(this[i]);}return result;}});



//TargetBusho 戦闘ターゲットのクラス
var TargetBusho = function( element ) {
	this.analyze( element );
};
$.extend( TargetBusho.prototype,{
	dmyhp: 0,
	hprem: 0,
	hpmax: 0,
	dmyjn: 0,
	join : 0,
	dmyat: 0,
	atk  : 0,
	bonus: 0,
	type: '',
	entry_id: 0,
	disable : 1,
	discover_man :'',
	target : 0,
	deadline : "",
	link : null,
	analyze: function( elm ) {

		var [dmyhp, hprem, hpmax] = $(elm).find('DT:contains("HP")+DD').text().match(/([\d,]+)\/([\d,]+)/),
			[dmyjn, join] = $(elm).find('DT:contains("参戦人数")+DD').text().match(/(\d+)\/\d+/),
			[dmyat, atk]  = $(elm).find('DT:contains("戦闘回数")+DD').text().match(/(\d+)\/\d+/),
			[dmbonus, bonus]  = $(elm).find('DT:contains("同盟ボーナス")+DD').text().match(/(\d+)/),
			type = $(elm).find('DT:contains("ダメージ判定")+DD').text(),
			//entry_id = $(elm).find('DT:contains("戦闘No")+DD A').attr('href'),
			entry_id = $(elm).find('DT:contains("戦闘No")+DD').text(),
			disable = $(elm).find('.Battle_detail_disable').length,
			deadline = $(elm).find('DT:contains("残り時間")+DD').text();

		//発見者
		var discover_man = $(elm).find('DT:contains("発見者")+DD').eq(0).text();
		if( disable > 0 ) { return; }

		dmyhp = dmyhp.replace(/,/g,'');
		hprem = hprem.replace(/,/g,'');
		hpmax = hpmax.replace(/,/g,'');

		this.dmyhp=dmyhp;
		this.hprem=hprem;
		this.hpmax=hpmax.toInt();
		this.dmyjn=dmyjn;
		this.bonus=bonus.toInt();
		this.join =join.toInt();
		this.dmyat=dmyat;
		this.atk  =atk.toInt();
		this.type=type;
		this.entry_id=entry_id;
		this.disable =disable.toInt();
		this.discover_man=discover_man;
		this.deadline = deadline;
		this.link = $(".Battle_detail a");
//		if(type === "知力戦" && hpmax >= 6000000)this.target = 1;
		if(hpmax = 200000)this.target = 1;  //レアのHP変更により変える必要ありそう
	},
});


//. remoeve Array.toJSON
// → https://gist.github.com/moonlit-g/394abb62c3460363d0aa
( function() {
	if( window.Array ) {
		if( window.Array.prototype.toJSON ) {
			delete window.Array.prototype.toJSON;
		}
	}
})();

(function($) {

	//. autoPager
	(function($) {
		var $window = $(window),
			$document = $(document),
			fetchPage = {},
			nextPage, container, defaults = {
				next: '',
				contants: '',
				container: '',
				load: function(page) {
					return $.get(page);
				},
				loaded: function(html) {},
				ended: function() {}
			},
			options = $.extend({}, defaults);
//console.log('metaraid_test1');

		$.autoPager = function(_options) {
			options = $.extend({}, defaults, _options);
			nextPage = getNext(document);
			container = $(options.container);
			if (container.length !== 0) {
				$window.scroll(pageScroll);
			}
			return this;
		};
		$.extend($.autoPager, {});

		function getNext(html) {
			var nextPage;
			if ($.isFunction(options.next)) {
				//2017.08.09 とりあえずエラーなので変更　なにを取得したいのか読み取れない・・・・・
				//討伐対象武将の複数ページ読み込み用みたい
				nextPage = $(html).find(options.next).attr('href');
				//nextPage = options.next(html)
			} else {
				nextPage = $(html).find(options.next).attr('href');
			}
			return nextPage;
		}

		function pageScroll() {
			var containerBottom = container.offset().top + container.height(),
				documentBottm = $document.scrollTop() + $window.height();
			if (containerBottom < documentBottm) {
				pageLoad();
			}
		}

		function pageLoad() {
			if (nextPage === undefined) {
				return;
			}
			if (fetchPage[nextPage]) {
				return;
			}
			fetchPage[nextPage] = true;
			var jqXhr = options.load(nextPage);
			jqXhr.pipe(function(html) {
				nextPage = getNext(html);
				options.loaded(html);
				if (!nextPage) {
					options.ended();
				}
				pageScroll();
			});
		}
	})(jQuery);

	//■ MetaStorage
	var MetaStorage=(function(){var storageList={},storagePrefix='IM.',eventListener=new Object(),propNames='expires'.split(' ');function MetaStorage(name){var storageName=storagePrefix+name,storage,storageArea;storageArea=MetaStorage.keys[storageName];if(!storageArea){throw new Error('「'+storageName+'」このストレージ名は存在しません。');}storage=storageList[storageName];if(storage===undefined){storage=new Storage(storageArea,storageName);loadData.call(storage);storageList[storageName]=storage;}return storage;}$.extend(MetaStorage,{keys:{},registerStorageName:function(storageName){storageName=storagePrefix+storageName;MetaStorage.keys[storageName]='local';},registerSessionName:function(storageName){storageName=storagePrefix+storageName;MetaStorage.keys[storageName]='session';},clearAll:function(){$.each(MetaStorage.keys,function(key,value){localStorage.removeItem(key);});storageList={};},import:function(string){var importData=JSON.parse(string),keys=MetaStorage.keys;this.clearAll();$.each(importData,function(key,value){if(keys[key]){localStorage.setItem(key,importData[key]);}});},export:function(){var exportData={};$.each(MetaStorage.keys,function(key,value){var stringData=localStorage.getItem(key);if(stringData){exportData[value]=stringData;}});return JSON.stringify(exportData);},change:function(name,callback){var storageName=storagePrefix+name;$(eventListener).on(storageName,callback);}});function Storage(storageArea,storageName){this.storageArea=storageArea;this.storageName=storageName;this.data={};return this;}$.extend(Storage.prototype,{clear:function(){this.data={};clearData.call(this);},get:function(key){return this.data[key];},set:function(key,value){this.data[key]=value;saveData.call(this);},remove:function(key){delete this.data[key];saveData.call(this);},begin:function(){this.transaction=true;this.tranData=$.extend({},this.data);},commit:function(){var trans=this.transaction;delete this.transaction;delete this.tranData;if(trans){saveData.call(this);}},rollback:function(){delete this.transaction;this.data=this.tranData;delete this.tranData;},toJSON:function(){return JSON.stringify(this.data);}});function loadData(){this.data=load(this.storageArea,this.storageName);}function saveData(){if(this.transaction){return;}save(this.storageArea,this.storageName,this.data);}function clearData(){var storageArea;if(this.transaction){return;}if(this.storageArea=='local'){storageArea=localStorage;}else if(this.storageArea=='session'){storageArea=sessionStorage;}storageArea.removeItem(this.storageName);}function load(storageArea,storageName){var parseData={},stringData,storage;if(storageArea=='local'){storage=localStorage;}else if(storageArea=='session'){storage=sessionStorage;}stringData=storage.getItem(storageName);if(stringData){try{parseData=JSON.parse(stringData);}catch(e){}}return parseData;}function save(storageArea,storageName,data){var stringData=JSON.stringify(data),storage;if(storageArea=='local'){storage=localStorage;}else if(storageArea=='session'){storage=sessionStorage;}if($.isEmptyObject(data)){storage.removeItem(storageName);}else{storage.setItem(storageName,stringData);}}$(window).on('storage',function(event){var storageName=event.originalEvent.key,storage;if(!MetaStorage.keys[storageName]){return;}storage=storageList[storageName];if(storage!==undefined){loadData.call(storage);}$(eventListener).trigger(storageName,event);});return MetaStorage;})();
	MetaStorage.registerStorageName( 'RAID' );

	//■ Env
	var Env = (function() {
		return {
			//. path - アクセスパス
			path: location.pathname.match(/[^\/]+(?=(\/|\.))/g) || [],

			//. externalFilePath - 外部ファイルへのパス
			externalFilePath: (function() {
				var href = $('LINK[type="image/x-icon"][href^="/"]').attr('href') || '';
				href = href.match(/^.+(?=\/)/) || '';
				return href;
			})(),

			//. ajax - 一部のajax通信の判定に使用
			ajax: false,

			// セッションID
			ssid: ( document.cookie.match(/SSID=([^;\s]+)/) || [] )[1],
		};
	})();
	//■ Util
	var Util = {
		//. wait
		wait: function( ms ) {
			var dfd = $.Deferred();
			window.setTimeout( function() { dfd.resolve(); }, ms );
			return dfd;
		},
	};
	//■ Data
	var Data = {
		//. style
		style: '' +

		/* ajax用 */
		'.imc_ajax_load { position: fixed; top: 0px; left: 0px; padding: 2px; background-color: #fff; border-right: solid 3px #999; border-bottom: solid 3px #999; border-bottom-right-radius: 5px; z-index: 3001; }' +

		/* お知らせダイアログ用 */
		'.imc_dialog { position: fixed; top: 145px; left: 0px; width: 100%; height: 0px; z-index: 3000; }' +
		'.imc_dialog_content { min-width: 300px; font-size: 1.2em; color: Black; font-weight: bold; text-align: center; padding: 10px 20px; margin: 3px auto; border-radius: 10px; }' +
		'.imc_dialog_content { box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.5), inset -1px -1px 2px rgba(255, 255, 255, 0.7), 3px 3px 4px rgba(0, 0, 0, 0.7); }' +
		'.imc_dialog_content UL { display: inline-block; }' +
		'.imc_dialog_content LI { text-align: left; }' +
		'.imc_dialog_content.imc_infomation { border: solid 2px #06f; background-color: #eff; }' +
		'.imc_dialog_content.imc_alert { border: solid 2px #c00; background-color: #fee; }' +

		/* overlay用 z-index: 2000 */
		'#imi_overlay { position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 20000; }' +
		'#imi_overlay .imc_overlay { position: absolute; width: 100%; height: 100%; background-color: #000; opacity: 0.75;}' +

		/* ダイアログメッセージ用 */
		'#imi_dialog_container { position: relative; margin: auto; width: 500px; height: auto; background-color: #f1f0dc; border: solid 2px #666; overflow: hidden; }' +
		'#imi_dialog_container .imc_dialog_header { background-color: #ccc; padding: 8px; font-weight: bold; }' +
		'#imi_dialog_container .imc_dialog_body { margin: 8px 0px 8px 8px; padding-right: 8px; font-size: 12px; height: 200px; overflow: auto; }' +
		'#imi_dialog_container .imc_dialog_footer { margin: 5px; padding: 5px 10px; border-top: solid 1px black; text-align: right; }' +
		'#imi_dialog_container .imc_message { margin: 4px; }' +
		'#imi_dialog_container BUTTON { margin-left: 8px; padding: 5px; min-width: 60px; border: solid 1px #999; border-radius: 3px; cursor: pointer; color: #000; background: -moz-linear-gradient(top, #fff, #ccc); box-shadow: 1px 1px 2px #ccc; }' +
		'#imi_dialog_container BUTTON:hover { background: -moz-linear-gradient(bottom, #fff, #ccc); }' +
		'#imi_dialog_container BUTTON:active { border-style: inset; }' +
		'#imi_dialog_container BUTTON:disabled { color: #666; border-style: solid; background: none; background-color: #ccc; cursor: default; }' +

		'#log_table {  width: auto;    *border-collapse: collapse;    border-spacing: 0;  font-size:14px;} ' +
		'#logs th {  color: #fff;  padding: 8px 15px;  background: #258;  background:-moz-linear-gradient(rgba(34,85,136,0.7), rgba(34,85,136,0.9) 50%);  background:-webkit-gradient(linear, 100% 0%, 100% 50%, from(rgba(34,85,136,0.7)), to(rgba(34,85,136,0.9)));  font-weight: bold;  border-left:1px solid #258;  border-top:1px solid #258;  border-bottom:1px solid #258;  line-height: 120%;  text-align: center;  text-shadow:0 -1px 0 rgba(34,85,136,0.9);  box-shadow: 0px 1px 1px rgba(255,255,255,0.3) inset;}'+
		'#logs th:first-child {  border-radius: 5px 0 0 0;}'+
		'#logs th:last-child {  border-radius:0 5px 0 0;  border-right:1px solid #258;  box-shadow: 2px 2px 1px rgba(0,0,0,0.1), 0px 1px 1px rgba(255,255,255,0.3) inset;}'+
		'#logs td {  padding: 8px 15px;  border-bottom: 1px solid #84b2e0;  border-left: 1px solid #84b2e0;  text-align: center;    box-shadow: 2px 2px 1px rgba(0,0,0,0.1);}'+
		'#logs tr td:last-child {  border-right: 1px solid #84b2e0;}'+
		'#logs tr {  background: #fff;}'+
		'#logs tr:nth-child(2n+1) {  background: #f1f6fc;}'+
		'#logs tr:last-child td {  box-shadow: 2px 2px 1px rgba(0,0,0,0.1);}'+
		'#logs tr:last-child td:first-child {  border-radius: 0 0 0 5px;}'+
		'#logs tr:last-child td:last-child {  border-radius: 0 0 5px 0;}'+
		'#logs tr:hover {  background: #bbd4ee;  cursor:pointer;}' +


		'',

		//. images
		images: {
			ajax_load: "data:image/gif;base64,R0lGODlhIAAgAPUAAP%2F%2F%2FwAAAPr6%2BsTExOjo6PDw8NDQ0H5%2Bfpqamvb29ubm5vz8%2FJKSkoaGhuLi4ri4uKCgoOzs7K6urtzc3D4%2BPlZWVmBgYHx8fKioqO7u7kpKSmxsbAwMDAAAAM7OzsjIyNjY2CwsLF5eXh4eHkxMTLCwsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH%2FC05FVFNDQVBFMi4wAwEAAAAh%2FhpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh%2BQQJCgAAACwAAAAAIAAgAAAG%2F0CAcEgkFjgcR3HJJE4SxEGnMygKmkwJxRKdVocFBRRLfFAoj6GUOhQoFAVysULRjNdfQFghLxrODEJ4Qm5ifUUXZwQAgwBvEXIGBkUEZxuMXgAJb1dECWMABAcHDEpDEGcTBQMDBQtvcW0RbwuECKMHELEJF5NFCxm1AAt7cH4NuAOdcsURy0QCD7gYfcWgTQUQB6Zkr66HoeDCSwIF5ucFz3IC7O0CC6zx8YuHhW%2F3CvLyfPX4%2BOXozKnDssBdu3G%2FxIHTpGAgOUPrZimAJCfDPYfDin2TQ%2BxeBnWbHi37SC4YIYkQhdy7FvLdpwWvjA0JyU%2FISyIx4xS6sgfkNS4me2rtVKkgw0JCb8YMZdjwqMQ2nIY8BbcUQNVCP7G4MQq1KRivR7tiDEuEFrggACH5BAkKAAAALAAAAAAgACAAAAb%2FQIBwSCQmNBpCcckkEgREA4ViKA6azM8BEZ1Wh6LOBls0HA5fgJQ6HHQ6InKRcWhA1d5hqMMpyIkOZw9Ca18Qbwd%2FRRhnfoUABRwdI3IESkQFZxB4bAdvV0YJQwkDAx9%2BbWcECQYGCQ5vFEQCEQoKC0ILHqUDBncCGA5LBiHCAAsFtgqoQwS8Aw64f8m2EXdFCxO8INPKomQCBgPMWAvL0n%2Fff%2BjYAu7vAuxy8O%2FmyvfX8%2Ff7%2FArq%2Bv0W0HMnr9zAeE0KJlQkJIGCfE0E%2BPtDq9qfDMogDkGmrIBCbNQUZIDosNq1kUsEZJBW0dY%2Fb0ZsLViQIMFMW%2BRKKgjFzp4fNokPIdki%2BY8JNVxA79jKwHAI0G9JGw5tCqDWTiFRhVhtmhVA16cMJTJ1OnVIMo1cy1KVI5NhEAAh%2BQQJCgAAACwAAAAAIAAgAAAG%2F0CAcEgkChqNQnHJJCYWRMfh4CgamkzFwBOdVocNCgNbJAwGhKGUOjRQKA1y8XOGAtZfgIWiSciJBWcTQnhCD28Qf0UgZwJ3XgAJGhQVcgKORmdXhRBvV0QMY0ILCgoRmIRnCQIODgIEbxtEJSMdHZ8AGaUKBXYLIEpFExZpAG62HRRFArsKfn8FIsgjiUwJu8FkJLYcB9lMCwUKqFgGHSJ5cnZ%2FuEULl%2FCX63%2Fx8KTNu%2BRkzPj9zc%2F0%2FCl4V0%2FAPDIE6x0csrBJwybX9DFhBhCLgAilIvzRVUriKHGlev0JtyuDvmsZUZlcIiCDnYu7KsZ0UmrBggRP7n1DqcDJEzciOgHwcwTyZEUmIKEMFVIqgyIjpZ4tjdTxqRCMPYVMBYDV6tavUZ8yczpkKwBxHsVWtaqo5tMgACH5BAkKAAAALAAAAAAgACAAAAb%2FQIBwSCQuBgNBcck0FgvIQtHRZCYUGSJ0IB2WDo9qUaBQKIXbLsBxOJTExUh5mB4iDo0zXEhWJNBRQgZtA3tPZQsAdQINBwxwAnpCC2VSdQNtVEQSEkOUChGSVwoLCwUFpm0QRAMVFBQTQxllCqh0kkIECF0TG68UG2O0foYJDb8VYVa0alUXrxoQf1WmZnsTFA0EhgCJhrFMC5Hjkd57W0jpDsPDuFUDHfHyHRzstNN78PPxHOLk5dwcpBuoaYk5OAfhXHG3hAy%2BKgLkgNozqwzDbgWYJQyXsUwGXKNA6fnYMIO3iPeIpBwyqlSCBKUqEQk5E6YRmX2UdAT5kEnHKkQ5hXjkNqTPtKAARl1sIrGoxSFNuSEFMNWoVCxEpiqyRlQY165wEHELAgAh%2BQQJCgAAACwAAAAAIAAgAAAG%2F0CAcEgsKhSLonJJTBIFR0GxwFwmFJlnlAgaTKpFqEIqFJMBhcEABC5GjkPz0KN2tsvHBH4sJKgdd1NHSXILah9tAmdCC0dUcg5qVEQfiIxHEYtXSACKnWoGXAwHBwRDGUcKBXYFi0IJHmQEEKQHEGGpCnp3AiW1DKFWqZNgGKQNA65FCwV8bQQHJcRtds9MC4rZitVgCQbf4AYEubnKTAYU6eoUGuSpu3fo6%2Bka2NrbgQAE4eCmS9xVAOW7Yq7IgA4Hpi0R8EZBhDshOnTgcOtfM0cAlTigILFDiAFFNjk8k0GZgAxOBozouIHIOyKbFixIkECmIyIHOEiEWbPJTTQ5FxcVOMCgzUVCWwAcyZJvzy45ADYVZNIwTlIAVfNB7XRVDLxEWLQ4E9JsKq%2BrTdsMyhcEACH5BAkKAAAALAAAAAAgACAAAAb%2FQIBwSCwqFIuicklMEgVHQVHKVCYUmWeUWFAkqtOtEKqgAsgFcDFyHJLNmbZa6x2Lyd8595h8C48RagJmQgtHaX5XZUYKQ4YKEYSKfVKPaUMZHwMDeQBxh04ABYSFGU4JBpsDBmFHdXMLIKofBEyKCpdgspsOoUsLXaRLCQMgwky%2BYJ1FC4POg8lVAg7U1Q5drtnHSw4H3t8HDdnZy2Dd4N4Nzc%2FQeqLW1bnM7rXuV9tEBhQQ5UoCbJDmWKBAQcMDZNhwRVNCYANBChZYEbkVCZOwASEcCDFQ4SEDIq6WTVqQIMECBx06iCACQQPBiSabHDqzRUTKARMhSFCDrc%2BWNQIcOoRw5%2BZIHj8ADqSEQBQAwKKLhIzowEEeGKQ0owIYkPKjHihZoBKi0KFE01b4zg7h4y4IACH5BAkKAAAALAAAAAAgACAAAAb%2FQIBwSCwqFIuicklMEgVHQVHKVCYUmWeUWFAkqtOtEKqgAsgFcDFyHJLNmbZa6x2Lyd8595h8C48RagJmQgtHaX5XZUUJeQCGChGEin1SkGlubEhDcYdOAAWEhRlOC12HYUd1eqeRokOKCphgrY5MpotqhgWfunqPt4PCg71gpgXIyWSqqq9MBQPR0tHMzM5L0NPSC8PCxVUCyeLX38%2B%2FAFfXRA4HA%2BpjmoFqCAcHDQa3rbxzBRD1BwgcMFIlidMrAxYICHHA4N8DIqpsUWJ3wAEBChQaEBnQoB6RRr0uARjQocMAAA0w4nMz4IOaU0lImkSngYKFc3ZWyTwJAALGK4fnNA3ZOaQCBQ22wPgRQlSIAYwSfkHJMrQkTyEbKFzFydQq15ccOAjUEwQAIfkECQoAAAAsAAAAACAAIAAABv9AgHBILCoUi6JySUwSBUdBUcpUJhSZZ5RYUCSq060QqqACyAVwMXIcks2ZtlrrHYvJ3zn3mHwLjxFqAmZCC0dpfldlRQl5AIYKEYSKfVKQaW5sSENxh04ABYSFGU4LXYdhR3V6p5GiQ4oKmGCtjkymi2qGBZ%2B6eo%2B3g8KDvYLDxKrJuXNkys6qr0zNygvHxL%2FV1sVD29K%2FAFfRRQUDDt1PmoFqHgPtBLetvMwG7QMes0KxkkIFIQNKDhBgKvCh3gQiqmxt6NDBAAEIEAgUOHCgBBEH9Yg06uWAIQUABihQMACgBEUHTRwoUEOBIcqQI880OIDgm5ABDA8IgUkSwAAyij1%2FjejAARPPIQwONBCnBAJDCEOOCnFA8cOvEh1CEJEqBMIBEDaLcA3LJIEGDe%2F0BAEAIfkECQoAAAAsAAAAACAAIAAABv9AgHBILCoUi6JySUwSBUdBUcpUJhSZZ5RYUCSq060QqqACyAVwMXIcks2ZtlrrHYvJ3zn3mHwLjxFqAmZCC0dpfldlRQl5AIYKEYSKfVKQaW5sSENxh04ABYSFGU4LXYdhR3V6p5GiQ4oKmGCtjkymi2qGBZ%2B6eo%2B3g8KDvYLDxKrJuXNkys6qr0zNygvHxL%2FV1sVDDti%2FBQccA8yrYBAjHR0jc53LRQYU6R0UBnO4RxmiG%2FIjJUIJFuoVKeCBigBN5QCk43BgFgMKFCYUGDAgFEUQRGIRYbCh2xACEDcAcHDgQDcQFGf9s7VkA0QCI0t2W0DRw68h8ChAEELSJE8xijBvVqCgIU9PjwA%2BUNzG5AHEB9xkDpk4QMGvARQsEDlKxMCALDeLcA0rqEEDlWCCAAAh%2BQQJCgAAACwAAAAAIAAgAAAG%2F0CAcEgsKhSLonJJTBIFR0FRylQmFJlnlFhQJKrTrRCqoALIBXAxchySzZm2Wusdi8nfOfeYfAuPEWoCZkILR2l%2BV2VFCXkAhgoRhIp9UpBpbmxIQ3GHTgAFhIUZTgtdh2FHdXqnkaJDigqYYK2OTKaLaoYFn7p6j0wOA8PEAw6%2FZ4PKUhwdzs8dEL9kqqrN0M7SetTVCsLFw8d6C8vKvUQEv%2BdVCRAaBnNQtkwPFRQUFXOduUoTG%2FcUNkyYg%2BtIBlEMAFYYMAaBuCekxmhaJeSeBgiOHhw4QECAAwcCLhGJRUQCg3RDCmyUVmBYmlOiGqmBsPGlyz9YkAlxsJEhqCubABS9AsPgQAMqLQfM0oTMwEZ4QpLOwvMLxAEEXIBG5aczqtaut4YNXRIEACH5BAkKAAAALAAAAAAgACAAAAb%2FQIBwSCwqFIuicklMEgVHQVHKVCYUmWeUWFAkqtOtEKqgAsgFcDFyHJLNmbZa6x2Lyd8595h8C48RahAQRQtHaX5XZUUJeQAGHR0jA0SKfVKGCmlubEhCBSGRHSQOQwVmQwsZTgtdh0UQHKIHm2quChGophuiJHO3jkwOFB2UaoYFTnMGegDKRQQG0tMGBM1nAtnaABoU3t8UD81kR%2BUK3eDe4nrk5grR1NLWegva9s9czfhVAgMNpWqgBGNigMGBAwzmxBGjhACEgwcgzAPTqlwGXQ8gMgAhZIGHWm5WjelUZ8jBBgPMTBgwIMGCRgsygVSkgMiHByD7DWDmx5WuMkZqDLCU4gfAq2sACrAEWFSRLjUfWDopCqDTNQIsJ1LF0yzDAA90UHV5eo0qUjB8mgUBACH5BAkKAAAALAAAAAAgACAAAAb%2FQIBwSCwqFIuickk0FIiCo6A4ZSoZnRBUSiwoEtYipNOBDKOKKgD9DBNHHU4brc4c3cUBeSOk949geEQUZA5rXABHEW4PD0UOZBSHaQAJiEMJgQATFBQVBkQHZKACUwtHbX0RR0mVFp0UFwRCBSQDSgsZrQteqEUPGrAQmmG9ChFqRAkMsBd4xsRLBBsUoG6nBa14E4IA2kUFDuLjDql4peilAA0H7e4H1udH8%2FPs7%2B3xbmj0qOTj5mEWpEP3DUq3glYWOBgAcEmUaNI%2BDBjwAY%2BdS0USGJg4wABEXMYyJNvE8UOGISKVCNClah4xjg60WUKyINOCUwrMzVRARMGENWQ4n%2FjpNTKTm15J%2FCTK2e0MoD%2BUKmHEs4onVDVVmyqdpAbNR4cKTjqNSots07EjzzJh1S0IADsAAAAAAAAAAAA%3D",
			map_resource_barren: '',
			map_resource_wood  : '',
			map_resource_stone : '',
			map_resource_iron  : '',
			map_resource_rice  : '',
			map_resource_wsi   : '',
			map_resource_wsir  : '',
			bg_label    : 'data:image/png;base64,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',
			bg_label_cur: 'data:image/png;base64,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',
		},

		//. sounds
		sounds: {
			enemy_raid: "data:video/ogg;base64,T2dnUwACAAAAAAAAAAAxNwAAAAAAAK0iScQBHgF2b3JiaXMAAAAAAcBdAAAAAAAAN7AAAAAAAACpAU9nZ1MAAAAAAAAAAAAAMTcAAAEAAACxrfujDj3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FFA3ZvcmJpcy0AAABYaXBoLk9yZyBsaWJWb3JiaXMgSSAyMDEwMTEwMSAoU2NoYXVmZW51Z2dldCkAAAAAAQV2b3JiaXMiQkNWAQBAAAAYQhAqBa1jjjrIFSGMGaKgQsopxx1C0CGjJEOIOsY1xxhjR7lkikLJgdCQVQAAQAAApBxXUHJJLeecc6MYV8xx6CDnnHPlIGfMcQkl55xzjjnnknKOMeecc6MYVw5yKS3nnHOBFEeKcacY55xzpBxHinGoGOecc20xt5JyzjnnnHPmIIdScq4155xzpBhnDnILJeecc8YgZ8xx6yDnnHOMNbfUcs4555xzzjnnnHPOOeecc4wx55xzzjnnnHNuMecWc64555xzzjnnHHPOOeeccyA0ZBUAkAAAoKEoiuIoDhAasgoAyAAAEEBxFEeRFEuxHMvRJA0IDVkFAAABAAgAAKBIhqRIiqVYjmZpniZ6oiiaoiqrsmnKsizLsuu6LhAasgoASAAAUFEUxXAUBwgNWQUAZAAACGAoiqM4juRYkqVZngeEhqwCAIAAAAQAAFAMR7EUTfEkz%2FI8z%2FM8z%2FM8z%2FM8z%2FM8z%2FM8z%2FM8DQgNWQUAIAAAAIIoZBgDQkNWAQBAAAAIIRoZQ51SElwKFkIcEUMdQs5DqaWD4CmFJWPSU6xBCCF87z333nvvgdCQVQAAEAAAYRQ4iIHHJAghhGIUJ0RxpiAIIYTlJFjKeegkCN2DEEK4nHvLuffeeyA0ZBUAAAgAwCCEEEIIIYQQQggppJRSSCmmmGKKKcccc8wxxyCDDDLooJNOOsmkkk46yiSjjlJrKbUUU0yx5RZjrbXWnHOvQSljjDHGGGOMMcYYY4wxxhgjCA1ZBQCAAAAQBhlkkEEIIYQUUkgppphyzDHHHANCQ1YBAIAAAAIAAAAcRVIkR3IkR5IkyZIsSZM8y7M8y7M8TdRETRVV1VVt1%2FZtX%2FZt39Vl3%2FZl29VlXZZl3bVtXdZdXdd1Xdd1Xdd1Xdd1Xdd1XdeB0JBVAIAEAICO5DiO5DiO5EiOpEgKEBqyCgCQAQAQAICjOIrjSI7kWI4lWZImaZZneZaneZqoiR4QGrIKAAAEABAAAAAAAICiKIqjOI4kWZamaZ6neqIomqqqiqapqqpqmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpAqEhqwAACQAAHcdxHEdxHMdxJEeSJCA0ZBUAIAMAIAAAQ1EcRXIsx5I0S7M8y9NEz%2FRcUTZ1U1dtIDRkFQAACAAgAAAAAAAAx3M8x3M8yZM8y3M8x5M8SdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TQNCQ1YCAGQAABCTkEpOsVdGKcYktF4qpBST1HuomGJMOu2pQgYpB7mHSiGloNPeMqWQUgx7p5hCyBjqoYOQMYWw19pzz733HggNWREARAEAAMYgxhBjyDEmJYMSMcckZFIi55yUTkompaRWWsykhJhKi5FzTkonJZNSWgupZZJKayWmAgAAAhwAAAIshEJDVgQAUQAAiDFIKaQUUkoxp5hDSinHlGNIKeWcck45x5h0ECrnGHQOSqSUco45p5xzEjIHlXMOQiadAACAAAcAgAALodCQFQFAnAAAgJBzijEIEWMQQgkphVBSqpyT0kFJqYOSUkmpxZJSjJVzUjoJKXUSUiopxVhSii2kVGNpLdfSUo0txpxbjL2GlGItqdVaWqu5xVhzizX3yDlKnZTWOimtpdZqTa3V2klpLaTWYmktxtZizSnGnDMprYWWYiupxdhiyzW1mHNpLdcUY88pxp5rrLnHnIMwrdWcWss5xZh7zLHnmHMPknOUOimtdVJaS63VmlqrNZPSWmmtxpBaiy3GnFuLMWdSWiypxVhaijHFmHOLLdfQWq4pxpxTiznHWoOSsfZeWqs5xZh7iq3nmHMwNseeO0q5ltZ6Lq31XnMuQtbci2gt59RqDyrGnnPOwdjcgxCt5Zxq7D3F2HvuORjbc%2FCt1uBbzUXInIPQufimezBG1dqDzLUImXMQOugidPDJeJRqLq3lXFrrPdYafM05CNFa7inG3lOLvdeem7C9ByFayz3F2IOKMfiaczA652JUrcHHnIOQtRahey9K5yCUqrUHmWtQMtcidPDF6KCLLwAAYMABACDAhDJQaMiKACBOAIBByDmlGIRKKQihhJRCKClVjEnImIOSMSellFJaCCW1ijEImWNSMsekhBJaKiW0EkppqZTSWiiltZZajCm1FkMpqYVSWiultJZaqjG1VmPEmJTMOSmZY1JKKa2VUlqrHJOSMSipg5BKKSnFUlKLlXNSMuiodBBKKqnEVFJpraTSUimlxZJSbCnFVFuLtYZSWiypxFZSajG1VFuLMdeIMSkZc1Iy56SUUlIrpbSWOSelg45K5qCkklJrpaQUM%2BakdA5KyiCjUlKKLaUSUyiltZJSbKWk1lqMtabUWi0ltVZSarGUEluLMdcWS02dlNZKKjGGUlprMeaaWosxlBJbKSnGkkpsrcWaW2w5hlJaLKnEVkpqsdWWY2ux5tRSjSm1mltsucaUU4%2B19pxaqzW1VGNrseZYW2%2B11pw7Ka2FUlorJcWYWouxxVhzKCW2klJspaQYW2y5thZjD6G0WEpqsaQSY2sx5hhbjqm1WltsuabUYq219hxbbj2lFmuLsebSUo01195jTTkVAAAw4AAAEGBCGSg0ZCUAEAUAABjDGGMQGqWcc05Kg5RzzknJnIMQQkqZcxBCSClzTkJKLWXOQUiptVBKSq3FFkpJqbUWCwAAKHAAAAiwQVNicYBCQ1YCAFEAAIgxSjEGoTFGKecgNMYoxRiESinGnJNQKcWYc1Ayx5yDUErmnHMQSgkhlFJKSiGEUkpJqQAAgAIHAIAAGzQlFgcoNGRFABAFAAAYY5wzziEKnaXOUiSpo9ZRayilGkuMncZWe%2Bu50xp7bbk3lEqNqdaOa8u51d5pTT23HAsAADtwAAA7sBAKDVkJAOQBABDGKMWYc84ZhRhzzjnnDFKMOeecc4ox55yDEELFmHPOQQghc845CKGEkjnnHIQQSuicg1BKKaV0zkEIoZRSOucghFJKKZ1zEEoppZQCAIAKHAAAAmwU2ZxgJKjQkJUAQB4AAGAMQs5Jaa1hzDkILdXYMMYclJRii5yDkFKLuUbMQUgpxqA7KCm1GGzwnYSUWos5B5NSizXn3oNIqbWag8491VZzz733nGKsNefecy8AAHfBAQDswEaRzQlGggoNWQkA5AEAEAgpxZhzzhmlGHPMOeeMUowx5pxzijHGnHPOQcUYY845ByFjzDnnIISQMeaccxBC6JxzDkIIIXTOOQchhBA656CDEEIInXMQQgghhAIAgAocAAACbBTZnGAkqNCQlQBAOAAAACGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBC6JxzzjnnnHPOOeecc84555xzzjknAMi3wgHA%2F8HGGVaSzgpHgwsNWQkAhAMAAApBKKViEEopJZJOOimdk1BKKZGDUkrppJRSSgmllFJKCKWUUkoIHZRSQimllFJKKaWUUkoppZRSOimllFJKKaWUyjkppZNSSimlRM5JKSGUUkoppYRSSimllFJKKaWUUkoppZRSSimlhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEAgC4GxwAIBJsnGEl6axwNLjQkJUAQEgAAKAUc45KCCmUkFKomKKOQikppFJKChFjzknqHIVQUiipg8o5CKWklEIqIXXOQQclhZBSCSGVjjroKJRQUiollNI5KKWEFEpKKZWQQkipdJRSKCWVlEIqIZVSSkgllRBKCp2kVEoKqaRUUgiddJBCJyWkkkoKqZOUUiolpZRKSiV0UkIqKaUQQkqplBBKSCmlTlJJqaQUQighhZRSSiWlkkpKIZVUQgmlpJRSKKGkVFJKKaWSUikAAODAAQAgwAg6yaiyCBtNuPAAFBqyEgAgAwBAlHTWaadJIggxRZknDSnGILWkLMMQU5KJ8RRjjDkoRkMOMeSUGBdKCKGDYjwmlUPKUFG5t9Q5BcUWY3zvsRcBAAAIAgAEhAQAGCAomAEABgcIIwcCHQEEDm0AgIEImQkMCqHBQSYAPEBESAUAiQmK0oUuCCGCdBFk8cCFEzeeuOGEDm0QAAAAAAAQAPABAJBQABER0cxVWFxgZGhscHR4fICEBAAAAAAACAB8AAAkIkBERDRzFRYXGBkaGxwdHh8gIQEAAAAAAAAAAEBAQAAAAAAAIAAAAEBAT2dnUwAAgDsAAAAAAAAxNwAAAgAAAFOS9qkqAQELbnFsi15dcmNocFd0W2xJY2uKalhwSWp1i4tVa1xvcHFvbm5ucW9yAArWt%2Fm5iAFEAAAAAOwibherdJCAbSgfAEC5%2FvJSOKF18elFzTkVFuanCaWDUDC4%2BP8k3ckaNEGzufNoynI%2FNmL8feHp%2F6u6tScQpNH5he0EbqR%2B4ifTvrGuFiU%2FjBajl6v7Z9FybLPweRlNbp6F41IvYm0%2BNdNxdC0B%2FDTgRcuLpT2A2V8dAMAHcHEA0j5M%2BGaC08v%2B%2Fel3QlsnTc5NsHvduuzu%2FtcKKQDkSMWQh0QJTlb7%2F748cPkLm%2FagCEZkmfJF48f%2FRhMWJ190Oo0T5EYD0SDE%2FOVna7dGcgMAUK0nRp1M0IWj48jvYg00vavnT%2Fct2hg8AAAcuAC4P1MSACQwsYDj%2BdHmZOLnwWn2kGwJtPmYAQAAQP%2B0uwEBgSJQWtN5%2B9%2BSxijY01c%2BUhWQMtr8NZY6n1iuLzkUjqBBqdxt07ZwwSuJT2V%2BQ1xzbAQgAY767%2Fvp1wMy6VsfLuQr9Fzk0leYC4BEB5g8HdFLjAAk7i5pgBwYwblm93ef5ax7ZVQQpRPt3MUCvB2VgwjPhrnbDC2X2j2AqknCqd%2FfL%2Fk%2BXg07vQLsjLdkpxe4FAXYGbrf%2BBOWNWTc3eAYPwxB2Lx9gSLFx3XVWIUyX6Cbylls%2FH9%2FZ5GhZJkBAUADQCX6VLgW9LTTk1f0L%2B0BIOazJkAPjGmrAxMFuj2xPf3efpqnwTDss2F9uFfw6kYFAAAAAPLiizWiaevjsX0pL02neZoudjNU7v9PlsKB2KW9pafXRt9raD1cbicbEmAYds63BPSiu8vM9NOGAwAoTgMAkEIcCwAQP%2F07IZdqbD1YclBL%2Bd%2FOKIfhxUhTxPkwMzBLUvjfWYhWpbxK17Pex3bqSRoOAbD5Cwv0bVb1%2BUd33IP4ipmddZA71nQPjh%2B3F9JHuj%2F4SO%2FrrqIjrRkvwFoFhhEdzDVAJRU4lA6a3hhJz806AByC0G3TW1nQoAICv%2FQ1CATEVfvXCbMIlOLQia2fvyk1pp2Ab%2BNgAQEgdpj95O4IOuHT0oRXiqiSX2QR2HOKMEd7eYleaSVYloLV2%2B1wAeQopmO1pn0igWlnUwHw1dQ71w2bhM1v8OJiMG01briTo6%2BV365WOgIM4GClPq3cBIrHRrrxEdYhuV%2Fb2mmkIBrxeDz%2FtJ9dnuizI9jW5bz0bCVoLUFYf6U8DqaAJ2NrMXULAhS9k0srWksbAwAAcKAD2L%2BtBGgAimDrZGS6Ztw%2BDxNylYLU5ocoCQBAAGmuv5wgDQFZESC3y9nVz4eff20AgsYXUNLw%2Bu%2Be0MjAMMXFKQYs6M9Jde7RfMMCNABgOz7%2FJx23J6M%2BwhgDNL3rDJ%2F0LdoYdABxATggAHbzVx8AHAcTEmxurLN3vTC6qMUwH7ZQ25%2BkAQAAcPH3lxQEQLXi4iRg8f6l%2F5y%2FrionMdFFUBHJpbb2s8TR77UCRTVO0Ige3n6%2B1cwmon2pxUvf1Dh5egBBN0T%2F9bj2vBy%2FkzNeWbm0MQAAAH4AMfB5ONLZ9pA6Nw%2BmB%2BYCbQpDRgAAoIDX9tfTIJU%2F64enVeoigQCAtcN8PBOFk8q%2B5%2BrdCDHs%2Fdn1iDVkHr2b%2B%2BP27QFxtHW9BCS705M%2FeBdtDAAAwALpc24DAMBiS6BuHad%2FbR1uH2qbmTEgTjYcAAAAMIy3duzIeXv4X8dIiUrdOIoTL%2F8O9aqHOZ0eD1QczQPNNbh6OjHMHIrDJmw8WGnnX5YXxSCQAFKhK8bSOD1LMvICUABS8Ot1L74A7LJTF1Z8%2BXjgd2sPeqDJagO8OA1Nlz5bMRnJiofj0Lxpe%2Fz88q4NGQAACmB48uUaYXj84v81ladBbIB4m8It%2FFz7L9ezA%2BXPnwZFjnTq7MrnnAQBJmnnjMt3GdJ3upt%2BJPZ9TqJjVeICWAVrGPFg9smlgNDLtFnUYunvMAAFhLLdFw1oKdJvbrZWBcBFkR9vedrJl%2Fk4Vx78FweAbpGoCw8VO9bb47cNliBOC4mef4Sm691prFoAAKla%2BDXBHTENgAYfq21GAuymi%2FKKr6G90AFzj5oGIPYAom7dVavt%2BqVluX2ZIJjjrlhPPOt7AABkdJ0gKIgoOIDN11WgE59e99fCNetf2ZMy%2BkAHt%2BmczwHsKtbH0bm0LwDLa6oAUG7cvxe%2Bj%2F1gYlzXDKI0MXRYvPe2njvgl6eNhjAGB6BgzdHs6zwqsAYGlojxzvL2%2FPZDbgzVpyQt1iSJ%2Bzoo42AWlFRpxPiuLxUTbzk%2BT2Cs1jqgcTwcvdPLn%2B4XbQwAAMCBA7B%2FBQAo5XHUbdakdAxvGerV6pHLOBsCAEBVUbT%2BmiSUe0kjqPhyevth54t1a9aGQ7lpzWE1EIlyfN2XT%2FyLQSAKSDjz3gEfq%2F1ucgDiBPD2%2F3W%2FPXubEtDQlVF5ClLZWx8u7St0vkjSqQu0T5HoAFof0wFGGJi9rCOFRuKTg8ZJ%2B%2BRfLj9LdKQkqu9MpOm6YSGEYNUw7V7rszWGQ3GjzhJ%2Fmul13F8lMqAVJ3vmm%2BN0YCNczOKVjHLh7OR1fSQ5lujMR3LgT26stFEOa9w9AAMQ%2FeBn701uuCkL4hZSKwDS%2BePo%2B%2F0rAxy9pu5y7UsbAwAAMIBG3xz3AACg9Hj638E%2BD%2Ba20cOVPCyo%2FXcBAACg0sGtf6biJ5MOPJcSdhddv3nrMvZleKjEIr1pMq4%2B07135Otcv%2B4hXQgMoBI4%2BaJOE144lf99IgcUoQrAdn4VcgL0rtOfdyZMO7AOTiTAANgDFD1x8eP3gXd%2BAwAAPBbS%2FHXeQIb%2F759sNFKVqQoo9y31z%2Bspu3vRclAAil20xF3h1dO%2FkTGcd3UACZAz4876NHATnUH4g20Y0ne62%2F7I4vucRQePYdtV8BhhwVyzwMgCgKp58feeW4EhkCBNIsuhrjQACsHkNTiANwAAZDmvM6Xz9tOvIXvsdSdTOQsefa37gAXIYDcZ9dI6okNxR%2BmkTtnqSjlB0VKTKvUo754w0y3q4pEAJsf3DeSo6fO8hvaQQO%2FuDwBqDxBcOLe8vHzuhZdeXF5WJRQ4YixwreodAgAI%2BJgg4kBAAAF85IQIwC5f9e9uxcZzdMmufLqaKRr0twHkLk7Xfob2CLAf%2BdlNdbgE8AHQ1Fu3bWrivrumb2JUWLx%2BXng6bjk9KrHuKErXqXkQMLcoH5vAufadlD78jK31CPSY%2FUyjRJSxBlr%2FncH0w1Nkh2hj2AMpmWVmxmr7pV%2B1PvOUlKxGPEoCJL2L8Sf9oo0BAHEBOCAAdr1d9lZAOhhYkIfn%2Fw2M%2B73Bdlob2gW56WehAgBwKaeW7rgjBEpEvKLqY7bc%2BrP157Nn%2ByUEoZBYe3CJzfLpvuXr4%2BOBEBSuWtVoc%2FLf6MPAbHJpWMpAF87%2B7hwJAADUwK3n9r8GOtlbXyjkmrtfRO17QF0gINEBRPYDjABmL6eB0prdmij2qVu35O%2B2XkDKmHaiZdW4v%2B4IqYFOR4cdf60YAu41rtrug%2FQ5lP%2Fr5gbow7lcxx%2FsHeRGiPH6dOz8qHAeHv4eK42tA5Zb6MWcl9%2FudQOGjwanC0Gzvfvw%2BXY57LzcObIZbBcAAAwrfr3bmFYJXB9k9pI7XyVZV6oLMCQ6QLa2pyMxwgYMrexsAM23ray%2FXp7OHzcHPv6RJoiq2D%2F96lxV%2BQhwaQ3nD5x%2BUoFCsglR4XFRe2t5i58QwCdldANefTnmXhW18Nl1fb3UdLL9iikAAMoRPM19CPPXG76%2FJsClUJiF%2BlO0oWs97a6V6QM0QN3VA5VPEQIkw9N3WqFtaWNEAQCA2ANYccf%2Bv8%2BfrYRPmrSICrV9w0G6AnA2urV%2FBjSWU%2BR8eczYpn%2Be%2FuIAAFHHoz87AOXDf%2Bm%2Fa6h%2BuiEF4MJ2%2B7mFbBAWfmUpDL2TF63AtrQxLAAA0Kz2AgMD3t%2BfvV9eyr40rqKBou1mIYZIDWC435fhSdIfY2BKppcgm8LW1d7pkkf1CppMv1iVbmh7s74EAEAAXFe7rTtapFzKBPdYRfO%2BiO6rg1msgSvBNZlOH2DqdFb0tFOTV2Ab2gNAx0%2B7CzCBsXY7QM7wPVx%2F3X1wlrktq0C0qD7g4VFwAgAAALB84CJhpPP25L%2FTSLkr5beIBTHnPN4ePS2SK0q3TwMwAGJAf%2FylXFJWOiAIGOORl9p3Om5%2Fdez1nnnVqeIDWKugYwTga4ByEAq4xvDaHGwPPzEJQMDYE2b57seMl1btSOi126oAkvXw%2BLJEwAvY8frxI%2F8Cu2ltFoeyQD6WQ7pZqa3hDi%2B505k1eg3c9BkgAZJh%2BL7uZnWhoaSSdjuBMd53Wk9a%2FuV1H7yDOua5BtWIxGavDFIAimach%2BmTfSbJFDs%2B9NlRuHjShtF668uoRa9MAE1%2FvYEkIT%2FnD%2B9y6wEQQAM2cLioezR1y%2FsNRqAFIZIgV%2FDephjfu5%2B9AYAQay%2F%2BehZf%2B55MRk43vnhX2wP%2BZ9pPmuXL933wqn0EtFsFuRskJlvTwUzlQOPI%2FfkD%2F%2B%2F9FOC%2B%2BHPYWSiAUgBAxjVezkv8LDk%2FGUQcSM60xgqgZ5rv9z9RJQOABAxCjo6NoQytcBGB3t14qtSK6IApAtx2t9LpcBZrp00NqOuOZqBSBx5Yuq5%2BNwjOWXTQnJmbq%2BCSEQ6GtQfKeikOVDDi8fD8XkOEmE8Cv3TyHQE8CKXfqxJEgVKAWjquD7MwjJUj2%2FgdJfqBmHTF8RKggic%2FK75VkSRRT1YqE8yhrj%2FlQMcC7NHPv%2FmcSAlTQMojJ%2FPYAd5nOq58F%2BTlnEQH9MGxA4pVsL%2BQ2FCWU0B5sxhNT3%2BCnXIFcA1ao0e%2FfXlFsO5rK7egyb0z9%2FQOPWqe6fc0IAKg4AtgQWPluX9kqU7DzGQAiEGDF3qxcsTfaN%2FFFAAA%2B%2FBdOja7kA6rJQWg47MH3oc6Tb8DXs%2BZV52H8gFYA5CYr%2BmgMgU4BOH3PT5cVClAOXL4WsHkiaKGemsptRBAFG4dp0N%2FhgUAqQfHCGA5fWEjvaUMADw6iE9%2BbHztSYYi3bsEu4v2JE8R4QBqoHL%2FlapidxCtkTp48F5lwwXeV9pNm%2BXb9Z5FB%2FiFWFuDKyQ2e5oQAFCX%2F2b18YUF0GYUUhGIlo%2Fq47QYF5M47gB0ST8Aou5r%2B8jfjwIDAKwOQN39PZbvq%2Bvwy5OxywWhxQfYv%2BmWK9Rv8xw9SEDLiBO2%2FvJf2HdRAEh4ds91D95n2q02%2FdXLM4sOQq62Bn8KGCBbA5DMPAKo%2B8TD9XfsPo2A5KHxaratRAUcBjElPQcANAKAaw51l5fM%2FruFR3%2FKnN0cdQJdWY8VMAECojrqkeUD3t0Xq0U%2B%2FtcYANgNxBNcZ3vleTcLsICuoVrGtq0BHojaT34BXp5DdBBV2HYNDCMsmGXFJABgsXWf0GF71wSLUnNcCg4fTEtLAQAAOE9P%2BK%2FsV1FMytUvWgD2G6DnaQDMwUqtrrrc28rn0Ob%2FRh0IVE9JrPFPYViJ%2FMYW7aQapUbjPq4V0eo0CTD0Q2UIHmg6b%2F0U5OWeJYe0Sg%2FAGqxhBDD00mSA4jmYLv0kNOICADLn0b%2Fv%2FJCwABe5WvqOs32jIAyr1Pd8iFhVNJDOPCwB5wFAba8qfchRxtQXv1CfTrA2oDtaKVOQECp7tDoQnDMj7lEf5QG7nQYAPICZ0L3aT2dnUwAAgIsAAAAAAAAxNwAAAwAAAE2oTR4ocHdocXNvbnFwcG5ubmpibGpgamRpZmNoY2RoZWZgYWRhX2hhZmZkaf6HOm391ODlmXhVXoBt13A6IwBrVREJCgA6PSb%2Fdwz3Ugwrx5oUJG1MtACgJBwVfT3JTi7IlO5DhkwBKEgOiNCvkXjoUMDABT3i%2Fevwi3UmAAAnClIB%2B6Lt1PdvOfUX2cUFJlaTq9b2LZcO%2BDZTe3%2F%2BZ9pNW%2FLq655Fh1T0AliDa4cRwOy1lAEEjWnq1O3aRkoBQNlqRp7%2Fu9IB1JAaSfDuEUAISJBd6NiYKhuoBOncXLFWwx8JoF7PW5oZHVeu%2FiyNQZKgq%2BcbmzZouckNNjtXkDTko%2FP666C8dThHHhIJkoO17A%2F%2BLd5n2k2b%2Fhq6r6JPtS5ouwZfjAC8k%2BQkAEBA1OPwa69AsTt%2FXHqoKnAYYCdQJeLvp3OirV7EWtlYADQUPOAA%2F%2B3FoHfovDj%2F6QFY26iVorRTbtxKe1V21BIA8lmf9Uw6L0bmwMK3K%2F4B%2Fme6bn9173ofkqqrsLmGLpGYrwEqmRUAbs7r%2FdmTHUt2fHX88uQAKBRAFntQKBerxi7QwLTVeNIDSEB%2FNc%2BCspZcLzLWG4kAEnjb6nvde5vZe5IpWnqRpovZCeNLXANOqGnl1S1o2ixKRQ9AWaY0NwP%2BV9qvNP3b9TPxDuEjvIFiDS8YYcGwBiiHgNJAjF4ewt6sDABQ83C6eb49cV1aAOdsRKPdBoAKcmt03RgFIDDk08hWWjfhRaHNHGPsAGDoDCfZ1FKSCMI4uAQSUVvVr8kCEAFqzif7C7OhmylYdGkt7bMC%2Fmc6bf0U5PuZRKdTB7Vdg08k5muAWj0pAJKD3Nl4l10miK1HUsd6AQAAwBbK6KeJn6%2BlzmSM%2F%2FwAIgCSW56ewGYpfF99lmEAkKCB3PVv4Wq%2FiNCOXWpsFwTMN0ob2QCAtFi2frssZC5VDspxr%2FI4%2Flc6b3935Gt33kFzJm67CqKZETrMVpVBqgAQe8u%2Ft99ucRRTr0yZ7dZmAACAlpJdjpYs6LmCjv%2FWWgidGABHgmMBxcp7V%2Fk2zv3t5%2BcmAFAArVm56lKNSH6YqXxHYAKZAQbzbUXjiYeCVauN3AMeaDpvNe3LyxNFh%2BdM3G4N2t9%2BRgBDr3ABoAjj6%2F7cfredQG60JYtb6xMUAABsCmqJumYdIURs5ekxTLn3gwWKDgoLJzoIDgh5mkwzxowbnY5daWi6FKkYpNdHIjmsHLwOL2ADhSOb981iERrw4GyeDh5Iuq407dXXcxEdYl3QXIOHxLwnBgNwkXD1oS8mfg0EduDe%2F552Ls2ZxmL174OwRNMSpAe9CmAav%2FnaInNSJADKJhh68fiG557%2Fm1FhQEsNVtHyarT%2BtLJrTmCBYgjbDDrHPkNsUoKOJju4KGkpxwDeNzqu1O3V92fiHeZD3HYN2geJzW5NBaAap83JS7%2BfT2wDgBqDROn%2BijsM3Ojv506howX0hicx8ahm4F%2F7er%2BICAmAB0Qi863vsx%2F2%2BK4f9kCzW4NSKvfn4%2FxairORUkM5upeeZkevOwEUQPCf%2FtAA3je6bn8W8Hp3UdN7CDfXQCGxoQ8mgAyDeXx5z%2F%2BH7okc1EPhPn5cZnUV1COVysDQsOBjFvYWxpR9CIPvFwSAAL46rDjG6n7YtOUcv32S5wRwWHk2tg%2BxQ9hs32MSYJJevIveFb5msSAp%2BJIlfwD%2BV7rd%2FnTk9Z4k1amC5ipomYwQMNcAOTiAS2m%2FlGJ74IUWQHjLjJb901sBQPScfiL2YQcAIDrq6Dhcq8f5vyL9ZULZer99n%2BAA4KiRPcqgOsLJhBeZYHveS%2FZ6ItRE57z4%2FiOKy%2FxhOwjHrF%2FVDt5Xuj1U5Levd%2BRVrcu1NcjOCGBYA1RMARSkm4c777qV7KCu0U8m3PavVQDw%2BFn6iQAFUACtVyZX9CSf89EOhaGWQpMAGqBgEwAfTlhf1gSi%2BHFJIuQGHknwq7QCHWLP%2F5NTg2TaDDNoBNq%2BKMUV%2Fle63%2F50FJxdcsjqoLar4DACmL2SBQAoIbnIdqIGIOrhMg7atwQAAGiyZlEuPncHhaWffPAVp6zJmacBf51tA3G4cWs9GLZ4bcBCekILSd%2B0QBI7aLBTYHaEztlmC8ac0V0epDg8RzIdSN5nut0u8jt0V95BWwrpKjhMvgbowQAABryfOx0TGno9G%2F2NBQCFpuUVy31Yx23VlXKHYxNIQHR9a%2FjfLw4JJA9Y3u4dkPx1d7FuDnXr%2FR4NG0Dn%2FOpeL%2Blt7Q6gAZQq8ycM%2Fje6XSnLl69zEh3UF2JzDWCEh7lGQskFALg2H%2FzAawJEfGqGT0KfBQ7QQPhkwj4AAAFxWcd5xqvqPPZunlrBuIsPBaAE0dA4AM3JvChlqZgMERlLXV3NSmx1lw6QvFP5exMyaa9SqXF1EiXr%2Fle6W%2F105OWZRAf5StRcgxYEIywYussCAF9O1%2FjuC4M2XKI5OhoEuuYoAABZvHwergyVm%2F%2FhKT8DQWWA1C10OA4AwDho3ZVKNIw%2F1BVOzgHQ0OR5slDJkMe%2FAtSTvu%2B%2BteenOgIUGHonAd5Hutwuy1f%2BrLxD1txcBSuQmT2LAQCiGid8uQDA0Yp7jH22e4t8FXfpgd3eYp8eT78FNI5ul27z8rw7lL82VLgcbk4QGkGpPXuvsrOYj5fdEABww2B32RYOBxZK%2B5yVAv4nutsq8yX0dNGRty5oWQWPEQa8uywAwPG0ZbNrFrgG0%2BnET2tUAIC%2BNTzq24%2FxGyuEIKRiPjVBnyorGiNOQLltxy9dhZ69%2FZYNlrAqqcg5BXVV3n5cb0UD2PGDbeSuJ%2FWUC6%2BgYPzz6%2Bn%2BV7rf%2Bkzw%2BkTJQdbo5CqwkNgMxwWA9srW%2FzYjXe5YzDe8dl3gwhxjCp9R4avRewHlcg%2B3y1U6AUgnQgkCIR3Hz52z7u%2By18rsaqcAeW0rXDfaJUEgUW%2Fk0oZoX40WQfaqdkwC3le6nJb56usdeUeiFeYqWJDYUJZZAAiB7qae%2F%2FhRM9bq49Z5x%2FYkHPcsKTgPK3MLjwJpwXNnS8QLAgBwAsA431eFbTOc%2FUMwePA1D7UYduuBHUTXVIb7BdCdc90xzYWLNCfVE8Y9WVcH%2Fje6Xy3La%2BjskiP3YEmugm9GYhLpJRMAUJX54gsrcM61Xb7%2B5Yl000x8YcDAaamOYR%2BL3CehAIARPPMPd8GPNPDuUoXKBER%2FgapxYx%2BNWFBvjwb0bua5OZFkHAFUOv3jw3pFy1UA%2Fje6m5TlJbi76EgPqLkKbiGx2R2XACiuiz2rHAiAJO08z%2BGpsi81przdqLGs9NQfCi5De%2BT7GghQOBAAtkVdj551z3rkyfkdYIEmaxctq%2FzvP8P5A9b%2B%2B2Q%2BtyClWYKbaGMA%2Fke675fly%2BvdRYfMlaS6BgsjgNkHEwBSsBL%2B7345AyJqVvwWFQAAMBZovviMNLVWiGUUCUA4%2F3rQVS124jXqoI867eushzly%2BtmJCDgwKe5d3tA22LH7CfDw7s5lxWIogEkPidVWqT7eR3puvSX4PiOvOmdTdRXACMDWAF0CAPLi%2FtmBv%2FeawGBRi2Clv2hWwNNO%2BSI1AAAKwG8Zr0pdh%2F9Ne72KZWIgUixwDhBANjYyLQ%2BKQ1TPDHZTKswWARm8N7h%2BSnGgiALteAUeSHpXPgtyvaPcQT2LJFfBJRKbvZQAgJhuH5zs6QBCWLzk87%2FQ6bfH%2FXSyAwAccMbFPMmLZMYOAOBBAtHvDpWvzcIo%2Faker6GpOkBzE5Eh192vE1afArB8Mpx8SekKFH%2BvXXsN3le66xflxddTRe13JTdXgWTyHlwCFJq3Rg7avjicFgxDsOqh8u3YqETm6jblat8loutdb4%2B%2F%2BlFxxwc40Dupk75v0XVOXfV2w%2FHbBAAueeW9RfXePbezrpNB4%2B02Ulx9coZIlysEHAA%2BOPpNPx35urvcQT0CJVfBQWKzZyYAkGAo7Yd33hmV%2FXC7F57HdN3YnlJQARCUPyOrzy1bI4YAAIGj2444YFUd5RTFq%2FP1roZFI6DPeEy7729ZDyl9WqJf7IryQAayvV6Y4x05BN5Hevaz%2FAruKmp5hVBrGAF4t0poYAjbh92mKy4OYNI0MsvndiiOlzN36Jy9KTWtr9rq1%2BOqsKCuHDio0PFf%2FVGxPgr379Jo2xDw1JxmZ0buRBhrVAcRuP4HgV3OVpzN1ALF3e0bA95Hup8U5dvXO%2FJa3lXsWQUwSaRHQgBQ%2BTHQrX8GAmDd28VgrDCdw7EMACBBX409n4uFa1WAFDcVvXdqYdj7nx%2FJi4ZAk9gevCW3X7rbfm2lAgqP%2BfdmdO5NArh112iYSt43eidvibw%2BkXcQR4B0FcA0S8cEAHB43G%2F8U5iiWHms3tfXz8exDg4toXmE3Yz5XHwY5dysA1idTApbOfZVD%2Fwnu4YmNAAkxpOXhpi962vfAZ33vaOz6IumLwSOKf3J1g7eJ3rrNwdfu%2FMO8hFwrIIfpqE7zgAAHSyWwx%2BiAFYfR%2F3gbe6Yxh5vJizUHhyFY%2Fh5W99YeQAKbw%2FkCAr1jjPWPIabfQMLEZYdUNcCsL3q014BJLZ3S7hdla7bbHJBHBmoSPUI%2Fld6nBT56vvUokN6IKiuAsE0u2MCAIJhkAMzCwAtr%2FeyMS%2BieG79lwaIAMIjIi67%2BH2D6gQLe5Cso%2BtjlY95UfkwVKg%2BE4AAs2VjLWfIm%2B5BO%2BHwb9YCbPcQgvOmQN89AT5I%2BuiXeQk9Wu5IjKoNk5fBBMAyue6nSkxemCqiKTFkA57PP99GCUes9bTeC3VnXC%2FVyNVwUEh34W5aV4lj%2FmyMAJxAwpqhW1g0PvygB2FKanx2NTWBQYU%2F7KyCreocHjj6m74Z%2BH606GiOBMk1%2BGHyXnIVAOBB%2B3B3pcDJf%2BhCD7k%2BfUjKZAaA1BM7Sue9sCddXXgSYEt5wB0qf7VKK4esHyreYGAFmtcoh%2FEEUDBxfeq1poBi3fXNbE%2FHC6TXW86TKoqbygHeR3rsZfkSOjXvyB1IchVcMQ1rgGByAAAsXw97k0byqDHWrYAA4LR848uX1GFC3mQTVIpwLIiLHPLfU3cADgBqbPXI6nnhdfq%2BwmbMsbnV%2BVlYoAf3L1qQki21QEw6dkKR3hd61lm%2B%2Bj6D6GiKMbkKHiMAX9OBYwwAlGrl1%2B8xALTgzg%2BEAHANGVzaiAIIsFqaFj8d8Yq7IDo3H4VTYCcOUJTp6e3LfKBLS38g0gJCqF3z6aCUz88GMjTytYuNVeZ5AjAmbSwZHij6KIp8Ce4qOZqHAMlV8BgBDN3KGAJAzCSOXJQGQKPriv1PCAAAvd9VZorjdbmuZ2zUKy3hD9ABFchTaziUZe%2FQ6i%2FJJsa0Rj83K5w9OgYfKPQKrcsTCkUkr4LDx7LK6h%2B8MhAA%2Fjf6qDN%2F9f3WkiM5EyVXgUZGAMMaICQAoES6bv8vAIJZ3AgC6QoEcKnN5GhGV0AdWFnPwu8b2pya0hVsp1JYB6CDADKbl1FouUIgW%2BpBQx3j4%2BIvjgIPn8aKDy6U8pLD0g9aHv43ehZFuXp5gqjznYWaawDT0IMJAJBN4gutv9sDgD3iHNnfY%2BPfkUIuvNa4AG9Agz8PXa0fCt9z0QbwJKSHyJV8LGkZN4tRdePdBBylNFwajC5Z7l80SVOw%2B4WnQdcMXS3rp8uOskIvAE9nZ1MABFm7AAAAAAAAMTcAAAQAAABbZhhZGGJhYGZlY2ZhZmRnZmNpZmVnYWRkYmJiX%2F43%2BvYyv%2Fp6K1HnG1ByFSimIRwTALC9uTbGLmgBl6%2F3Ntc4HIXx1UotEUi94tDlFoYji6%2FxqwEWAIKArFb2fj%2FuD2bpMN6Bk1d6ZXwetq%2BWY7H3XG4VoBlV73f3Phz3BcwTHkj6FoVffb%2Bj5DCF4lmDw%2BSlkwAKCGfz7sQEAMLntkxln6fiQlc5AQkCMn%2BeEzvl0UaOKyMLKFJXk47A1oeDtp5aPwJovWitUa9lQ13vo%2FGiJC0ZiN%2B3n%2FsWhx2nUQjrAd5Heqssr8EH0ZEcDclVABLzbmUOAKgjw9vsAoC%2BLf1ZlQq%2BbbZhJSCMvhm%2BmqRBkX98cgYAMhsItnnuiuYfhuGXQ6veBY2Ais6FQ6haLTikGk4zdeEzEeQay9wcLcfRHP43%2BtaZX13fWtT9RpSu",
			info: "data:video/ogg;base64,T2dnUwACAAAAAAAAAAAvRAAAAAAAAG3XaiwBHgF2b3JiaXMAAAAAAcBdAAAAAAAAN7AAAAAAAACpAU9nZ1MAAAAAAAAAAAAAL0QAAAEAAABOZpY0Dj3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FFA3ZvcmJpcy0AAABYaXBoLk9yZyBsaWJWb3JiaXMgSSAyMDEwMTEwMSAoU2NoYXVmZW51Z2dldCkAAAAAAQV2b3JiaXMiQkNWAQBAAAAYQhAqBa1jjjrIFSGMGaKgQsopxx1C0CGjJEOIOsY1xxhjR7lkikLJgdCQVQAAQAAApBxXUHJJLeecc6MYV8xx6CDnnHPlIGfMcQkl55xzjjnnknKOMeecc6MYVw5yKS3nnHOBFEeKcacY55xzpBxHinGoGOecc20xt5JyzjnnnHPmIIdScq4155xzpBhnDnILJeecc8YgZ8xx6yDnnHOMNbfUcs4555xzzjnnnHPOOeecc4wx55xzzjnnnHNuMecWc64555xzzjnnHHPOOeeccyA0ZBUAkAAAoKEoiuIoDhAasgoAyAAAEEBxFEeRFEuxHMvRJA0IDVkFAAABAAgAAKBIhqRIiqVYjmZpniZ6oiiaoiqrsmnKsizLsuu6LhAasgoASAAAUFEUxXAUBwgNWQUAZAAACGAoiqM4juRYkqVZngeEhqwCAIAAAAQAAFAMR7EUTfEkz%2FI8z%2FM8z%2FM8z%2FM8z%2FM8z%2FM8z%2FM8DQgNWQUAIAAAAIIoZBgDQkNWAQBAAAAIIRoZQ51SElwKFkIcEUMdQs5DqaWD4CmFJWPSU6xBCCF87z333nvvgdCQVQAAEAAAYRQ4iIHHJAghhGIUJ0RxpiAIIYTlJFjKeegkCN2DEEK4nHvLuffeeyA0ZBUAAAgAwCCEEEIIIYQQQggppJRSSCmmmGKKKcccc8wxxyCDDDLooJNOOsmkkk46yiSjjlJrKbUUU0yx5RZjrbXWnHOvQSljjDHGGGOMMcYYY4wxxhgjCA1ZBQCAAAAQBhlkkEEIIYQUUkgppphyzDHHHANCQ1YBAIAAAAIAAAAcRVIkR3IkR5IkyZIsSZM8y7M8y7M8TdRETRVV1VVt1%2FZtX%2FZt39Vl3%2FZl29VlXZZl3bVtXdZdXdd1Xdd1Xdd1Xdd1Xdd1XdeB0JBVAIAEAICO5DiO5DiO5EiOpEgKEBqyCgCQAQAQAICjOIrjSI7kWI4lWZImaZZneZaneZqoiR4QGrIKAAAEABAAAAAAAICiKIqjOI4kWZamaZ6neqIomqqqiqapqqpqmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpAqEhqwAACQAAHcdxHEdxHMdxJEeSJCA0ZBUAIAMAIAAAQ1EcRXIsx5I0S7M8y9NEz%2FRcUTZ1U1dtIDRkFQAACAAgAAAAAAAAx3M8x3M8yZM8y3M8x5M8SdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TdM0TQNCQ1YCAGQAABCTkEpOsVdGKcYktF4qpBST1HuomGJMOu2pQgYpB7mHSiGloNPeMqWQUgx7p5hCyBjqoYOQMYWw19pzz733HggNWREARAEAAMYgxhBjyDEmJYMSMcckZFIi55yUTkompaRWWsykhJhKi5FzTkonJZNSWgupZZJKayWmAgAAAhwAAAIshEJDVgQAUQAAiDFIKaQUUkoxp5hDSinHlGNIKeWcck45x5h0ECrnGHQOSqSUco45p5xzEjIHlXMOQiadAACAAAcAgAALodCQFQFAnAAAgJBzijEIEWMQQgkphVBSqpyT0kFJqYOSUkmpxZJSjJVzUjoJKXUSUiopxVhSii2kVGNpLdfSUo0txpxbjL2GlGItqdVaWqu5xVhzizX3yDlKnZTWOimtpdZqTa3V2klpLaTWYmktxtZizSnGnDMprYWWYiupxdhiyzW1mHNpLdcUY88pxp5rrLnHnIMwrdWcWss5xZh7zLHnmHMPknOUOimtdVJaS63VmlqrNZPSWmmtxpBaiy3GnFuLMWdSWiypxVhaijHFmHOLLdfQWq4pxpxTiznHWoOSsfZeWqs5xZh7iq3nmHMwNseeO0q5ltZ6Lq31XnMuQtbci2gt59RqDyrGnnPOwdjcgxCt5Zxq7D3F2HvuORjbc%2FCt1uBbzUXInIPQufimezBG1dqDzLUImXMQOugidPDJeJRqLq3lXFrrPdYafM05CNFa7inG3lOLvdeem7C9ByFayz3F2IOKMfiaczA652JUrcHHnIOQtRahey9K5yCUqrUHmWtQMtcidPDF6KCLLwAAYMABACDAhDJQaMiKACBOAIBByDmlGIRKKQihhJRCKClVjEnImIOSMSellFJaCCW1ijEImWNSMsekhBJaKiW0EkppqZTSWiiltZZajCm1FkMpqYVSWiultJZaqjG1VmPEmJTMOSmZY1JKKa2VUlqrHJOSMSipg5BKKSnFUlKLlXNSMuiodBBKKqnEVFJpraTSUimlxZJSbCnFVFuLtYZSWiypxFZSajG1VFuLMdeIMSkZc1Iy56SUUlIrpbSWOSelg45K5qCkklJrpaQUM%2BakdA5KyiCjUlKKLaUSUyiltZJSbKWk1lqMtabUWi0ltVZSarGUEluLMdcWS02dlNZKKjGGUlprMeaaWosxlBJbKSnGkkpsrcWaW2w5hlJaLKnEVkpqsdWWY2ux5tRSjSm1mltsucaUU4%2B19pxaqzW1VGNrseZYW2%2B11pw7Ka2FUlorJcWYWouxxVhzKCW2klJspaQYW2y5thZjD6G0WEpqsaQSY2sx5hhbjqm1WltsuabUYq219hxbbj2lFmuLsebSUo01195jTTkVAAAw4AAAEGBCGSg0ZCUAEAUAABjDGGMQGqWcc05Kg5RzzknJnIMQQkqZcxBCSClzTkJKLWXOQUiptVBKSq3FFkpJqbUWCwAAKHAAAAiwQVNicYBCQ1YCAFEAAIgxSjEGoTFGKecgNMYoxRiESinGnJNQKcWYc1Ayx5yDUErmnHMQSgkhlFJKSiGEUkpJqQAAgAIHAIAAGzQlFgcoNGRFABAFAAAYY5wzziEKnaXOUiSpo9ZRayilGkuMncZWe%2Bu50xp7bbk3lEqNqdaOa8u51d5pTT23HAsAADtwAAA7sBAKDVkJAOQBABDGKMWYc84ZhRhzzjnnDFKMOeecc4ox55yDEELFmHPOQQghc845CKGEkjnnHIQQSuicg1BKKaV0zkEIoZRSOucghFJKKZ1zEEoppZQCAIAKHAAAAmwU2ZxgJKjQkJUAQB4AAGAMQs5Jaa1hzDkILdXYMMYclJRii5yDkFKLuUbMQUgpxqA7KCm1GGzwnYSUWos5B5NSizXn3oNIqbWag8491VZzz733nGKsNefecy8AAHfBAQDswEaRzQlGggoNWQkA5AEAEAgpxZhzzhmlGHPMOeeMUowx5pxzijHGnHPOQcUYY845ByFjzDnnIISQMeaccxBC6JxzDkIIIXTOOQchhBA656CDEEIInXMQQgghhAIAgAocAAACbBTZnGAkqNCQlQBAOAAAACGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBC6JxzzjnnnHPOOeecc84555xzzjknAMi3wgHA%2F8HGGVaSzgpHgwsNWQkAhAMAAApBKKViEEopJZJOOimdk1BKKZGDUkrppJRSSgmllFJKCKWUUkoIHZRSQimllFJKKaWUUkoppZRSOimllFJKKaWUyjkppZNSSimlRM5JKSGUUkoppYRSSimllFJKKaWUUkoppZRSSimlhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEAgC4GxwAIBJsnGEl6axwNLjQkJUAQEgAAKAUc45KCCmUkFKomKKOQikppFJKChFjzknqHIVQUiipg8o5CKWklEIqIXXOQQclhZBSCSGVjjroKJRQUiollNI5KKWEFEpKKZWQQkipdJRSKCWVlEIqIZVSSkgllRBKCp2kVEoKqaRUUgiddJBCJyWkkkoKqZOUUiolpZRKSiV0UkIqKaUQQkqplBBKSCmlTlJJqaQUQighhZRSSiWlkkpKIZVUQgmlpJRSKKGkVFJKKaWSUikAAODAAQAgwAg6yaiyCBtNuPAAFBqyEgAgAwBAlHTWaadJIggxRZknDSnGILWkLMMQU5KJ8RRjjDkoRkMOMeSUGBdKCKGDYjwmlUPKUFG5t9Q5BcUWY3zvsRcBAAAIAgAEhAQAGCAomAEABgcIIwcCHQEEDm0AgIEImQkMCqHBQSYAPEBESAUAiQmK0oUuCCGCdBFk8cCFEzeeuOGEDm0QAAAAAAAQAPABAJBQABER0cxVWFxgZGhscHR4fICEBAAAAAAACAB8AAAkIkBERDRzFRYXGBkaGxwdHh8gIQEAAAAAAAAAAEBAQAAAAAAAIAAAAEBAT2dnUwAAgEcAAAAAAAAvRAAAAgAAAOIizV8qAQEBdHFogXZNUmx9dXVlc39ud3Vue3FwZmheYGNiYGhoZGltamRsaGNgAAoG7KjTm8ym12fC0g0OYBtQma%2FeJtldtOfPzWliQmvkZOdx17I9%2BV%2B9y%2FZoO6EZPKrv7Bu5OIFa9Ufrcb2Yl%2Bw2lphwrnk%2BakRpBfcoXOc8b2HF0GCWXK7bfLVc4HFyT6N5PnSL30aO7SHA22UDCEiovPN%2FKwAcydBg9zrYB8ABsN8MB1gAZwGAWLywtQiZbbf9d5uRuLQ9B5qO82aOC61z%2FB0XNI%2FdwYCxf1fbg95oGvVAFn%2Fvu%2FhSHBnJrUULDwVFcRazFo3x34ccAEXjASME%2FE782rHUPkcCCUoJgiCARosG6ublBSRHXry08FvgWwWAjvbGAtBPAAf4ANwvALjp3%2F2BkCNtQyIjAOA2Xo5a%2BYWR%2BJgPZ0sb5ubYCpqKWilCJ7oVQSm87o7MWCb7XJK2RlViDewB3FahwohcsXOaElUBHCoL%2FawK%2BZMrvzcA%2BnhcHX0uH16JGXtvF%2F6A4wAADxiAjQd7AGiEBxzAXAVYgMIgvv3z3ziq4Sn4sFkaBAAAAAAAlJ3UjR0AUMkxuQsIAGpDRQCZgEQAJh0pm37XEADArQqwiBEoUaAg%2F0D1%2FhYGAADfLAkA8EKEOqu%2BPgAog6wQAFQE2EoE%2Bht4dyYBFjlc2cTLm08hpri%2BexbYD%2BABA4aNB7sCwGvDBvjZWIBBPQxuSzAyCEotlh9UAAAAAAcUsJNyAwCYI1cBAEBdWysDYCsAgBF%2F%2BeCYAwDgvRXAb%2BFX7QoAfMgwo0oZwM78JMwaTmiAHQHoOwKeMT29AALAXz5YABTFpcLdyB%2Bw%2F0sAOLS3CYAzAGla%2FYwLgyPfLgAAsJAkYF76C6gdUaaTHGYABNav3hcgKZeIIq5zs0xaYD9FqCj8LPivBACoeMCfsFUAHMOlw336fIBzI4AFtLcJgAtAmsr65JGE7SaM4yROaQAjfhHUYs%2BL5UG9JdJszqM1SiFEEJ00MzJPVOIIG4IT%2FWsCwD2xA77SPyQA7r%2Bi%2FYetDBzJPQCHfgGOGrHpLGwCiAGYJmsHghfpHl3rhZUqoq7%2BvFp%2BrmMrvZ1oN5VwGbFVxoX7ZiT8aPTj3XHcEsI6kCjQEL55mVYdOe%2BjjpqGQ3LpNt4AlfVPEuJX%2Bfmmx7CUVVAWgDlJucahLGiRAFpZ7CfZJfpHiVpRB3fBAxfAa%2BMALGyDUQA0aZrgxA%2BTOs1Rniaqx%2BqpZgDQPf7pBQAAKGhMOyima1NRABwBoByA6aYVGxPMxwmYpSsVk%2FcJNWDifo3PKLVepV%2BsOl7qjy0ejowXBTVMYf9Idm%2FZrxGAR5DwEaAVVVWA%2FnsuXjmcjJ2v4F0t8vnnmsfyrMCzACwscACdRCsA4JhGCvQtGdkTo771AIdWAKCOdwIAAMKrAgjAoA0AmDMAONCvo472AEAIwOCzAsDG%2FldCF34t4%2BmNhITkxcJQtr7G0YFbL2BhN3AC88A9EV8BZAG6mPuvAAYANtmbdvXv6F1JRi2gR8wugGABbMEBWHhwAH0BNGmk4ETNE2PDQ6qg%2BWckASA58REAAABUfQuATFooALgDGQA2a5t6tAUAAEC%2BZxB6GikAOn8n9XsmNhBA%2F1gBW7PPiR2AaCj4g1PoA%2FdE%2FCPAXBEBFXP%2FsggIHMEc%2F8oeviSIRihOLTYA6ADWAODmIdWCx1MeHI%2BkBfkIa2V7uqpxZ82kIKhzqx4EweXBX6WNBmJV3zGEZrlFEATQjLkYZrN8tnx1pzQo5NGsswXIblGixigSzN%2BhHIEqnlj7g6kcxxwtx%2F1I%2BJaY6AXgAAq0mgvwAua4D9BVLi5rQ2fCCzYQl7t9OBxt5cpT6SeGw03O7%2Bm8fBPD4Q8hn087PkxouVgNgrnZ%2FGlJOP50zKxpHw5VIE8TCB0hZPij%2FVyw48aR3W2f3ZL3Haraf2V2d1QPitQdmjmsUPES7GHRlzXR9gc3vS8AXwCQHB3oxp0A8uhdKQDAcHj7Uts68K%2FaygIAxON%2FSwLgSgDVJoADOtoY2wI1L%2FV4zjQyjMDugSen9AAFFECe9u1fLV0eC%2FCKQGIDgTKhMdR%2FlMRWcJMGYMAXWPAfaLydA4%2B%2BJgjvmQLpB7kUNb75m7r2i9gjY57ugMLD5U5%2BAAf8AoAYM4wCMKu7CwDgfkn1HADRDrydXVDwH04VAID3ZQUAPAMWAACmVt6K0lvLBQAAYJNevXTnRFnghD5Itl7N%2Bc9zvkzeH9EAuOPpQD%2FAPjlcaWr2QNuLUwIAVonrk85rtIZEVnZn2u%2BB3OsLwC8AUGY2CqAAINb1CgC%2BsTflCHpJtiIAQB0%2FUwDArQo2AAC4bfAsijStzikFAAAOocnMAiioAuph6%2FVJnsSuE3iSANBwBjcd9lGFsFd8sRx%2F9C52HgCgxmNgjA0%2BA19qZl7dCwQkycS%2Bxee3AEcV8rIVBRx0AJvN0KaFQHPX3sfdmjC1tXLyanqb2ujW2pO78nLLB1l9ZERmcQkGn7188fScOQj9daHl0piMyOL5Xf981mp08NkLnycsWh5U48HsfJUoriD%2B%2F%2F9LNgNnAYZuDQIz6tZxsH2IswEczz0Ky0w7e4Av2JzAFABoD4UBwB5BG8DxTQD%2FKwEAl%2BCdntrtFBzduKblqHxVAFQnlzVIQCKVKXNGpR%2FfTe6bqcfvUOhL6cbKXTUXchUitPL1WGAzAhm5lft1UU0AASAAj48dCoAqeEw44T1BB1qJLJzfpdO7JFt0de8CQAbAJh8bXLAcYAFt8L5%2BwBoS807zkxACCs0Q3Te6AoSEbvjO632zkgFguP13WgD%2F07LGRcaBAp8CAAzXPx4Ebl5OCwAAAODAtUUpAOCFV%2BID50a%2FHgeK2IIQ5XrPw9ZGKJKgd8%2BfeBcAnAcABz5pnI7VuWKUmNHd7ALAA7BobXDJ%2FAUAQ%2FT1AqxCgtxfdUWclscwkCdDAICjBmI%2FAgCu%2FyjA9opCDQEML%2FJkAIB5TfuVC%2FqFAgAAOABAoAAAjOwG%2BErcQQzec38UQSTRa2styc4ZTNEsHqqUhgGARioAPnmcLO2XTo8SKQJO35OgJ8Qi0QFQQfoLABbpKgL6KiRg6m8GMuZ4BjAtAADfYdGvAgDA1VMBjncCpAEv1KcJAAB0WM4EZwj8TOxnCgCggO8JigMAfXESVXLoP7kog1oLdu7qofkIH7B00b0UACBVAf5onI7t106NEnIhXxy7AHABCGINnxQAHgAUasQqHoDjuhx7Y6mR6FDtOgAAIoWYKgBAf1kBFL71KgIAME0BAEDBJQMA%2BE7YUAAceBsHBwD%2BqBPlqJsf3xJsAPe78JeqBHgJ4BRJAx5J7M9dL5VuGa5CPpWfAfsBsdbwSAsA5hoJfBUPIPFteSpNrhaAfuoGAHhtFzUNAKDmywA4AIBPthsCDjCHSogFDgDwGkAEAA7eE2U18cuqIQLgPw47qdPQupIFXsnU7NgC3j0kCQop%2FmjsbzrXKqRHppW9B3g4fQ0fpAsYeCMaUPNdJ4capi%2FHqRfbAQC%2Bl5AnJgDA1agApAEAytsOC4CH9ygHfqHUAZBvpwAKdFSNvV81Wi8lI%2FH304yx8GoEs2YBwKcaAN4onO7aL1UsFu5CTuuyDWdnFQQLQJobsQrgk5MBAL7Xoj8CAHBoZwCAdEm0COBUAQDMdlAA2NGM9%2BAuAF5QhN2VjhHUpUUA73l6kSGnZmQmZbhSrkcgbuRg4e1qBDMVAL7Ymy6daxWbh6eAk1l2QO6tgqAAUABFugrQVwHiXykAAJs2lXADAHC1IgDAy%2FVoAACCAwD4PQoA4N0AAAAAYgcA4P6Qt%2Fl3HDdrgfcgIdUE%2F8dFBSnbhIj9gGYH9QlAgDyDAv6468%2Ftx0S3jEkBH1oP8CBvDRcUAGb2RwPg49n%2BEyshUBOop20AABhKdwAAeF0QAODHzAIAIIDOTBDNToAd9dAKAJ6UJipLdSskZcSUUyU6Fd970KMfCxywYbYpAovzaEgA%2Fnir065rF9aIcu679j0hfxUO6QKGtI8G5%2BwAAL5T1M83AIBzDoAGAKA%2B4UQAsOz8vVqWN1NiJAg2eA0PAWArAtyv0VmRzhmyuPidtKV7E7pCAwDW8dyABAn6FQF4TRoA%2Fojrta5rpVeJSkS8HrxbhUvSBx1Q5Dy6XzkAwGuYunIAwI%2FLCjAPAQEIusFbowBQyN1RKOBetc9sp9uAnwTRVfCzdAsg29J1bL%2FACCb9XFX0nn35gBn5G1%2BFZNmGXjYYEXTiNR4agAL%2BeKuGntdJaBnpaLnnwIL3qyBJJ8l%2BABqAh772TRmJhwCssQMAuBrD%2F2QAAGwV4PhSIyIAIQD4CZLuQvU%2BSgBbIYTA%2BQFZADBqBfBDZooDgf0vAHsZwHVVdgZw%2FgwUe70FKQC7%2BJ0CAN4Y63VdL50eHlnklgduFT6ZDwCG2aNXWwsA4N6OOhABgHrtFcDbBABikKpCuAVkHK%2FXdAboHjs%2FPe4i6gB8YKFxdR8XAZSDTRiWgP0kC8YbqAYAWF81dmZwymwsSQJ%2BJwCF3ATeGOsP7ddKD6IKvB6wvwqPdJr9dED3F%2B0BAMoOTacBgGIvAM1abwgUvAVQsHqVva4vAeAkSk18FS%2BLgPSasNZe74hyGcBfdkbYQGeW4KIITT8F9GNH7aEGL4hecNz%2FZhNADiFeTQMK8QC%2B2OoPXdcuNItMGpYDsb2GD%2FKDDihmY%2FQ%2BNQEAoLeXfBgGAMr3E4DtFoADubuodoeqxov%2BflS8YO%2BzVI92cXQdACwk4prw8b4T0XJVyIAuk43%2BDRa3dcKWNQu%2FVq8EVSD8jMgTQSzH79kACxMknsjqD63rRDeiirz2D6xV%2BCCdI2bX1DYAgKs16MIAALgKCQCA%2BhueBm9HXhSBkCjjkD9LF2UIwrkSuqlPMo%2BRAks7hp8XbfDVCPQm0c4wUE%2FOGDcP8HSvUSvbxNYg5b6xQGJovAos6IqMDn4Y66Wda6d2RhV43YPTV0GQzrT3Xi%2FbAwB8z8hBEwCANgMA1ONJ%2Fw2eBjATBctJtd8JoH8BJox3G8YBsU%2BLh5WDhpoVDrD%2FFhoVa%2BB9jp3RCXThPHolQzcl2Gpl%2BICFy1EAKAB%2BuJqYzrWSe8QUFzivB%2ByswgXpAUj7Aei%2BEwEArrrR7wAA4PtEAObJCghAGKGFfYIrgAMA3AiOLJLmBN4UZwyLeDe8BYAqgPMNx%2BrMqHxSc4TTQJtFLPZaZ8KpjQaAb718s0Cgg1QBoJTSlA5%2B6OqF9pdO9ohKJJcFcm8VDulIEyM0yQ4AwC0qow0A4HUEgP49L%2FfpxXpMgHfEgL%2BmMQD3pwBiPMgAI654WtEUDQ3g1wTsk4h%2BV9QgvwwUDClj7PbiS8RidHBZe2P4IFrwPviF1N%2BIBp7I6ruel4hzxCRvmuVB7qzhkvQApHEAek0bAIBjiupYAAD4caoAwToAAIGqyAERpaAUAPTr78M98hYAnXdiSK1XCwCJBr8WvoXrgaGhBS4DoDR0VOkAdIlXWgACenQarPoIC14I6yWdl4o9YpKvee07vF%2BDxFxAwf2%2BCsBdqQAAr0OCiwoAYGhrAigAAN9GEAEAKHsAAMCkI%2BflkXqOAAA6myGqe3wXFAC8nWITMY6s0Pu9om4LZnZm4nmw12cNNgBVAE9nZ1MAAICjAAAAAAAAL0QAAAMAAABXsQSSLlpcXmFrZGRlY19gYVhgWF1iXV1VXVdbWl5SVFRPVFxUUlpVWFJbU1VWVVVZU1IeKJuU9WvEOqMXfd8sB9wqSPhZgFRrgIbvDQEAfCfRjDsAwPe4AjQpAAClUIhdAQACQNp7VVzrmS3ACcXyFa9PgAY4%2Fm%2BrIkV6yqCxsPFJgDpRCgCHBgD3igDeJ1tJ6i%2BanGf04llveRC%2Fhk%2FSmRUN7uoAAJhtYc4AAP2dCpD899tb3FIHACO6hJlz6GL%2BHQDu1yCwzTaAfV%2FFO3KEetTTPo1BhyUMZ3D%2FHMD6r2wHJTQA%2BBpJAP4HmyT1F82eM3oJPOstD%2BLW8IjvAFCYfm9USicAQN8pTIgAQPUHBMDXCwBAGgoTAMC%2FhjdA2uI9rl%2BXOxuAe07CyQS%2BN4MqxQbZpPzdsOxJ8%2B4pL3j7AkggFgB8qgD%2Bx%2BonzZfAzh07eV89wAH7axDkmTW6Qr3L9gAnAPCkZACATZtoRwYA%2BMYAAMz4VpCtIfX5v4H69RMSiqwawHvjCHKnxVlBvV5ahjSMc41vJsC4n6piYgcQlytQQJJfDSAA3oeaJs0Xxe8RkySWHWB7DQLzAcBQAIjo%2Bl8SAMBVRpowAMAcEoBmMoAClawcgwwAVAVtBgDOLwAASuLaU8XCjKEKAIvPyNrBzq8igJS6Hj7UnGzxSfBwhtEGXeYkSHN7KAJysv%2FaBE50BgHeh5q0%2Bosm26IXeH1gfw0Cc3JN1dM0AMBVi3grDQBw3SEA%2BL4frlcBXwDA4pMUFcuVjDKg97YaG5jV3AOw6pujXw3qhfNNDAEnLVpUJgE219XHjzcIxgICX0lIxNp5wwlBdIYL3meatPo1klWiFzmvPUFfwwXmTNU7F%2BwAAHp7zRebAIAfzwkA2CzzitKPSQAsXmKMYl%2BUAfr1OBCamk8lsPb8XHVfuUXq8hhySOGpImAnVD0AOd8rAvoAaWqApFkxilxwjJgNAP6X6rfOi2Zni17g9UCuNRzMA5DqPCB8EwEAsFNtGQAA%2BlQB4noABcgwG%2B1vJlUCWAsAVv%2Bv876cBMCcTMDN4XcCZA0QV%2BcrSew41wqPwB8Bi4Dc7eYKfP%2FhF62fESDNq%2FOeB7oH3lfqh9Y18LPFJBfPsgKyr%2BESc2T1zoo9AMAxReW8CQDw3SgA9snDR3QXBYBGydMy8K6uAuD%2BDhKKaStz8KnfFgk3wWulekZIxdzjxBiAt%2F8rHlE3O4CqkSBCEHEuA%2BmaPbQG3jfqh9ZL4OeOGi3e5eHtrEFifgeAYdLO67QBAOp1FP0NAQBgKkBOFQAgK5ShAAC8YaiQ%2BJ57ehhLAaCxeypB%2BOcpAAYaejDSDsH%2BA%2BiHDXIJn98ANfAaMGk26EOXCDXeN%2BqH1kuQ94gZvRDLNrC3Bkk6Bl0DBP%2BnAgB8JyDhBgDgvlcALiqgwDMANHmUznPHIwGMeSNq%2BDWvFgCc3wewB1sIdfQYuS7Gbwks95HIEM5oQsrj4W2Arg4khMjKjgP%2BZ%2Bq31kXze0U%2FB7zCgdhZw8P8BQBFAUC9u30IAGBORe0CAKA2kxUg2gEAVIQyBADAv%2BoUAOQ1QgEUeO%2FHJU3LBaBzfFRZ3m8LAFKcdcfIAYA83zBCog9AAXTjqEACpSMA3qfqLa2LZrvEDE1veRC%2Fhoc5eUSjUtsAALAX2goAoL8YALz123WHKHYA6Bw%2B2QpUsAHg%2FhSAQAAwUoCGfjFMpTsNqENtIbH6ANpr%2FSbEVCLFoEeDhU8JAP6XqtadF012xgxVlgduDR%2BYDwCGVL3XJFsAgM0aiA4A1GsUgL5LEBcAAFEAgLouBdDVOeRRFADonFCtwEjlRQECkvBSi9b%2BHFugA8ql%2F2igWK%2FSTJptrLPGBwj4VwGADv53qobWRbGzxQwb4wG%2FCgI%2BzZ5XAXxCMgDAVQPLBQBwTDAAQAHKDgBgGlu%2FRVuhVuclXk2A841pIBEB4Nroi8QZafCVSEmRGkKvTwCayXOt9pOXgDMEMgDed6qG5kXjLkkRCjvArYIgfQBQcK0B5C%2BmAABsOqmkCACwKQFoUhUAoB0IZgAA%2Fzs8BGJqS4iApwHwU93GsDQ4wRIGeOfvAMiaTkmMtjhEGfZhgFUcKjQ0%2FwGWpwP%2BB6pa%2B1WTs0QVlbM8sL8KF6SzAEBHr%2BU0AIDbwqQMAPj9qgAAvIIAUBHMHYtSYYcE9siWsfKfeyaw7teAdluFWQUY8l%2BMi8yYutfG0jznz%2F6aQB%2FAbL0YpAyLf7uA0K8GF95Xyq31FcjZIhMWwPYqHHQ6ICs662wBAGZ78moEAHy%2BB2CwHgBgNgDB9xB1DAI4j2zsb2wSAtjwviGSyl2p7WweQ1rq5ML%2F5IuH9fCM6XuaZqXlWBIs7XYkCZroAN43KtLWt8K9OsvRbeMB%2B6twCV8ApmZ4OQDAfZh4cQYAuF9SAAEA4FUiZE9pk4BK1zAyJML5xgAW8QKsIxHYf1Zn0EF%2FdS8K6F9f94jcDTuwEvuFBJxk97OQohgXBR4osqH9W1N3ixl6ZQGwvQoSPrNCdFoAAO4D8ncYAKC3KgD7r1wKSA23OlHN%2FYaA3gGRSGT%2FnTOpDC37gTEsja5BvifAcb6Zn%2BUkcEwoycJHdogJ2AbeB4pp51VRZ4ksvoyFB9YqSMyRarIKNQAA90miJwYAwLFXAC7dbZk%2BkEqPDW%2FOCeA%2BCoCgxYProM9YREPTmfRzkoId8JyCNA1m46MWZcIUaNFvSKBFOUKsUisjcwEeKLJz50uTk54rGIHoq%2FBIF4Cs3rk9GQCgUkWyCQBwNVkBAADgPYQLTg7OnnQzqsLaT54TQL9nALWDjjwMhdYTz8Gdh7GI4PNUEk0foGL4HknDa%2BoABAv%2BN4pL%2BxfkzK5yKBywswqPvIAhq3fOQgAA3iX6xwAA6IcAKEABvNsA2OwNHw68R5lU9%2FGtiO58moA50IIpvZZIWzQOJ9Cz%2FgC2y46vTL3KYPn4F4QNvAS7oKMB%2Fhfy6%2FYvTU46S6HwwN4aHmZPFZ3b2gAANmlkuwEAajMBADPskD6dBGjWCbXUnNa%2FgoS9YQehe0bogPNJk4HXKtgPRBM0eInWoM0ofzIx8EtJzZJ4rUYgLyIW3ieyc%2Bs14C6RA%2BMDO2sQmKcDUuVen7UDAFy1UEsAAPA9KgAkCwBQCg5mOQfQOe7zQaHfAgKwIF51jcoeFkdGzRbKSSDXck7%2FgFPI0sU5cGuEOFs7h9KS9XvZJUBrDx4IknP7a6BOekqhcMCvgoAPLnVfSgQA6G2hqwEAcBEAeh2Zh3YKyddmglr9%2BhtAJTLpMKRTBa4aS5MS9ZLxBLx37%2FBOrTybw8%2FpVmhe6BR7oAM%2BCKJz%2B2ukTm6XgxFwaxCYZwGkHNxhAwCAPYw7AMDrqgBoigJQBBkAG5gAQBEnZFimLDWSI9AgvmLxAQ2GFLGUQAfCq%2BMzzqUKaZUrZRJ9FhBJ%2BgIe%2BOFzz6umTtrnUHjgV%2BGQU66EapgGAKhkmAsA4HgKgId1J4EEgYHP30wglJ2OeqQugeVd1MJGKBdJ2oTqzo4HCR7Ve%2BUkCu0aXcBElWYrmkJvHywe%2BEFD%2B%2BvMNpGHAuBW4WCOLIkuWwCAoxUsEQDgfr0CcIZ8lQEhadYn4KAWNwLaNhLtXkF0Jww1wBBSeJraa0vJKObw%2B0tE5fUT6QJCCx0HHviBuetl4idJCowH%2FBokpimFfOEAAEeHuzIAwFVaATzUACxeqHTNxfHPkg2%2Fksa5WMDnWGuA8IOnT1gy6YQPcobT7Kju%2Bk4Cqn0caNzdilOim1IFHggiY%2FvLzE5JisRGwPYqSPjkLjvW2gAAHBPg3wgAgKEAvF9to70oFo%2BfRDXHSNPo2QEIOvrX7CFVF0qbW25NCSFlUuqMyT7FQKt3i2kdZxWKyvnLcSb%2BzlCKAx3%2B54G5%2Fdr5yS0pGB9YqyDhU3JRIw0AQNmJ3i0AAPdjCoD1xoFHSer9RB17LWiwOJoF55FIg5o4ZlgT0B%2FnJv0NSY9HUKIKU%2BS%2FwWuOYP7WEW%2Fq8AAeCBLDcUHHxyMdjED0VQA%2BU0nsWAEA%2Bk6RoQIAfI8CgA2qNZ6XWkXZ7GVF6RMcCEUsAvg7Z7Logp1Lgc8uGoFRlEfgFK5NunP3VbqMwEsVGskCvvch83Fgwi3BImIEZ60CmIPLiXcBAPheQQMDAOA7AQBHWy0pL1epA12GpdajLzO7LfS4wHYijWNyzYtoNMW6jvdfs53E0Z%2Fc0CsZXmVk7CPWsrqveWBHWeULHtgRreurs7eHCoyAvgYBN7mceGoAALy2kDMFALhPFQAEgAPdt3W9elPUydzgMJhMgLdYFF38XFlbmi7M%2FNWawxHZN1jmwzLrirFe15P%2F05O2jf49AL7HIUP7VyW3%2BwuMQO6sQWBOpnA8MQEANl3oXwIAUFYBQFEAD22fqvea9UoIpq2mB9QLkGg%2BIC295%2BC4nAJmnb6zPtwli4JlM2NM1ZOpJwpoS%2BSwdK45FAHe1xFj%2B2snJ6ECI5B7axCkCkm8mQAA2Knc0QAA9J0CgF8fAE37exRYxJtABHnvMRj8YztjvMOwIfUmSGC9traXCmyfqhVad%2F%2FK6rCl5eFgvmIBvsdRXftXxzv9BUbArQF4tkpi1wAAOKaqXnIAgNc1AGAO4GjmJ57%2BSveeUDr5UbjN2UOmu2SjUWrgAg%2FiXBu8a1AHvWwu9RUG3mqn6Gc6eVcwzBna%2Bm%2FmWmBbA963Ma3z2vEmVGB84FfhwK2SE%2B8ZAOB7FCYUAMD3AgC0K872oTJT6tl2pJvjYoZhw0HlqXlMEjEzy6JWEklxXPJ3xqrPMmqndd5%2F6oWPKmfdvXNmvscJZedrZo%2F7C4yAWwXIEXKMNhMA4DsECwcAeO1WAHgf8B7CftRNCR7SHXS51erQkd3FnJSajCwnSgmV5Szn8LRHhhUusIzYnCs%2BFHlylsMY4ImuDb7HMV37ayUf35cIGA%2F4NUg4T0ji2wEAjikwLACA3kYB0GMBjsKJL73CY29MtlFee%2FoCVPyYsSka3blC778AcSd8tXxqLTW0fhvpur1i2KV2zIhnYGwM3qdJks51ko8Hh9kIxK1BYuVcElYLAAC2cDACAFSSAuC%2BATyQPpPBXGmY%2B2EOZens5hCi60o3HS56k9LKky6SfAdcnbMO97XujEHUX9WYtrTYtNN0AN7HCa39UuWdwYPxgV8DZDlJvBUAQN8BX2YAgPtUBcDMEmDZZfb8SGOdtunvnqOMHasv7X%2BuYqWNBRq2le0pI30gyheRsrgv5EykkquFtlp3Ngx8YBPel%2BlC62WWD8GDEdDXADxLToSsAACvaeRzBQD47gEAGy146Kbv1rk3%2BPkmG%2BHY%2BEAftVQF6Ryl1w5Fs3OLr3IOA%2F12X2XUuVPMUoh3p3437Xo5V%2B2tt2%2FlAb6XaWnzOpMbcwTyA9YaIJGdJH4FAOC1hZ4XAID7FAGAhPMTj2VBXVR8Ru38GAqfw6qCAwfOA0oq9AFOfOD1ppW8obyzS1MhyvbdcVr92QnJ9dAT3pcZk%2BZ1ZicJCUYg%2BxoELKQQZwYAwKZLxaoAALNVANBtApauv9P0k5Q7RhpgNQ4VJ%2FHVjjlU45T7n40DY6Ko%2FB48gfEw5I7WRXTe6Mkz%2BFgsC09nZ1MABGa7AAAAAAAAL0QAAAQAAADEnHtoDU5NUU5KT0RLPDAuYUm%2BtxlC8%2Bjsdt%2FBCORag4BnSeKrAgCQojomAAB9uyCArgga3bf1nhdZmi29RgvTe0MND1GFEO5RVqbzqdbvke1wbR7lNTjtHK0BGSBcdRLep1mS5tzJTfBgBPQ1AJMkcdkEADgmIy8oAMDrGgBQdHBAbX%2FHLvQ1fArA%2FpZlqb%2FyXJFjhQ1qBU173uG9jhUP8h1Zf1GQC55JFJtLAd6X2bj63PkiODACdtZw4NnJiVsGAMB3RP8BAPDvZQDACjjoa8njGYIQdXTzxzbahXdd6XgFbsyZnQLQCl2gPqMKq0%2FmUE5pMiKaG9gsCKUMAN6X2Zlqr3wRLDA%2BsLcGCZMk8Z4GALgPIXc1AACvHQoAGrQrmPZkiVQF3PCj57hjcpMiTzi0wrC1dhY6OpYzJ7O90CiXb1F1PrTpQulLAt6XOamyTnIQTCAH3BokZoQknpkAALOdcMEBANxQCiBmcY%2Fyj65ZzVIm1d4ND18jdUpozAsX"
		},

	};

	//■ Log
	var Log = function(bufferCount)
	{
		this.init(bufferCount);
	};

	$.extend( Log.prototype,{
//		storage : MetaStorage('RAID'),
		buffer : [],
		count : 0,
		max : 0,
		init: function(bufferCount){
			if (bufferCount === undefined)
			    this.max = 0;
			else this.max = bufferCount;
			this.buffer = new Array(bufferCount);
			this.count = 0;     // 追加データ数
		},
	// データ追加
	// 除去（上書き）されたデータ数を返す
		add: function(data)
		{
			    var lastIndex = (this.count % this.buffer.length);

			// リングバッファの先頭にデータ追加
			if(this.count >= this.max){
				this.buffer.pop();
			}
			else this.count++;
			this.buffer.unshift(data);
		    this.save();
		    return (this.count <= this.buffer.length ? 0 : 1);
		},
		// データ取得
		get: function(index)
		{
		    return   this.buffer[index];
		},
		// データ数取得
		// バッファのデータ数と追加データ数の小さい方を返す
		getCount: function()
		{
		    return Math.min(this.buffer.length, this.count);
		},
		save: function()
		{
			csaveData('meta-raid_logs_buf',this.buffer,1,1);
			csaveData('meta-raid_logs_count',this.count,1);

		},
		load: function()
		{
			if(cloadData('meta-raid_logs_count',0,1)!= 0){
				this.buffer = cloadData('meta-raid_logs_buf',0,1,1);
				this.count = cloadData('meta-raid_logs_count',0,1);
			}

		},
		clear: function()
		{
			GM_deleteValue('meta-raid_logs_buf');
			GM_deleteValue('meta-raid_logs_count');
		},

	});
	var logs = new Log(30);
	logs.load();

//console.log('metaraid_test3');
	//■ Display
	var Display = (function() {

		var $sysmessage;

		function Dialog( options ) {
			var $overlay = $('<div id="imi_overlay"><div class="imc_overlay" /><div id="imi_dialog_container" /></div>'),
				$container = $overlay.find('#imi_dialog_container'),
				self = this,
				$body, $footer;

			options = $.extend( { width: 500, height: 200, top: '25%' }, options );

			$overlay.appendTo('BODY');

			if ( options.title ) {
				$container.append('<div class="imc_dialog_header">' + options.title + '</div>');
			}

			$body = $('<div class="imc_dialog_body" />');
			$container.append( $body );

			if ( options.content ) {
				$body.append( options.content );
			}

			if ( options.buttons ) {
				$footer = $('<div class="imc_dialog_footer" />');
				$.each( options.buttons, function( key, callback ) {
					$footer.append(
						$('<button/>').text( key ).click(function() {
							if ( !$(this).attr('disabled') ) { callback.call( self ); }
						})
						);
				});
				$container.append( $footer );
				this.buttons = $footer.find('BUTTON');
			}

			$container.css('top', options.top);
			$container.css('width', options.width);
			$body.css('height', options.height);

			this.append = function() {
				$body.append( arguments[ 0 ] );
			};

			this.message = function( text ) {
				var $div = $('<div class="imc_message">' + text + '</div>');

				$body.append( $div );
				$div.get( 0 ).scrollIntoView();

				return this;
			};

			this.close = function() {
				$overlay.remove();
			};

			return this;
		}

		function show( msg, sound, timeout, cssClass ) {
			if ( !$sysmessage ) {
				$sysmessage = $('<div class="imc_dialog" />').appendTo( document.body );
			}

			var $span = $('<span/>').addClass('imc_dialog_content').addClass( cssClass ).html( msg ).appendTo( document.body );
			$span.width( $span.outerWidth() ).css('display', 'block').appendTo( $sysmessage );

			timeout = timeout || 3000;
			window.setTimeout(function() { remove( $span ); }, timeout);

//			if ( sound && Data.sounds.info ) {
//				var audio = new Audio( Data.sounds.info );
//				audio.volume = 0.6;
//				audio.play();
//			}
		}

		function remove( $span ) {
			$span.remove();

			if ( $sysmessage.children().length === 0 ) {
				$sysmessage.remove();
				$sysmessage = null;
			}
		}

		//. return
		return {
			info: function( msg, sound, timeout ) {
				show( msg, sound, timeout, 'imc_infomation' );
			},
			alert: function( msg, sound, timeout ) {
				sound = ( sound === undefined ) ? true : sound;
				show( msg, sound, timeout, 'imc_alert' );
			},
			dialog: function( options ) {
				return new Dialog( options );
			}
		};
	})();

	//■ Page
	var Page = function() {
		var path = arguments[0],
			key = '/' + path.join('/'),
			actionList = Page.actionList,
			extentionList = Page.extentionList,
			action;

		action = new Page.pageaction();

		if (actionList[key]) {
			$.extend(action, actionList[key]);
		}

		if (extentionList[key]) {
			action.callbacks = extentionList[key];
		}

		return action;
	};
	//. Page
	$.extend(Page, {

		//.. actionList
		actionList: {},

		//.. extentionList
		extentionList: {},

		//.. registerAction
		registerAction: function() {
			var args = Array.prototype.slice.call(arguments),
				obj = args.pop(),
				key = '/' + args.join('/'),
				list = this.actionList;

			if (list[key]) {
				$.extend(list[key], obj);
			} else {
				list[key] = obj;
			}
		},

		//.. getAction
		getAction: function() {
			var args = Array.prototype.slice.call(arguments),
				action = args.pop(),
				key = '/' + args.join('/'),
				list = this.actionList;

			if (list[key] && list[key][action]) {
				return list[key][action];
			} else {
				return $.noop;
			}
		},

		//.. registerExtention
		registerExtention: function() {
			var args = Array.prototype.slice.call(arguments),
				obj = args.pop(),
				list = this.extentionList;

			if (!$.isFunction(obj)) {
				return;
			}

			args.forEach(function(key) {
				var callbacks;

				if (list[key]) {
					callbacks = list[key];
				} else {
					list[key] = callbacks = $.Callbacks();
				}

				callbacks.add(obj);
			});
		},

		//.. form
		form: function(action, data, new_tab) {
			var $form = $('<form/>');

			$form.css('display', 'none').attr({
				action: action,
				method: 'post'
			});
			if (new_tab) {
				$form.attr('target', '_blank');
			}

			$.each(data, function(key, value) {
				if ($.isArray(value)) {
					$.each(value, function(idx, value2) {
						value2 = (value2 === null || value2 === undefined) ? '' : value2;
						$form.append($('<input/>').attr({
							name: key,
							value: value2
						}));
					});
				} else {
					value = (value === null || value === undefined) ? '' : value;
					$form.append($('<input/>').attr({
						name: key,
						value: value
					}));
				}
			});

			$form.appendTo(document.body).submit();
			$form.remove();
		},

		//.. ajax
		ajax: function(url, options) {
			return $.ajax(url, options)
				.pipe(function(html) {
					var $html = $(html);

					if ($html.find('img[alt="セッションタイムアウト"]').length > 0) {
						Display.alert('セッションタイムアウトしました。');
						return $.Deferred().reject();
					} else if (html.indexOf('<title>メンテナンス中') >= 0) {
						Display.alert('メンテナンス中です。');
						return $.Deferred().reject();
					}

					['TABLE.stateTable', '#chatComment', '#chatComment_i', '#chatComment_g', '#chatComment_s5_h'].forEach(function(selecter) {
						var $elem = $html.find(selecter);
						if ($elem.length == 0) {
							return;
						}
						$(selecter).replaceWith($elem);
					});
					$('#commentBox').trigger('update');

					return html;
				});
		},

		//.. get
		get: function(url, data) {
			return Page.ajax(url, {
				type: 'get',
				data: data
			});
		},

		//.. post
		post: function(url, data) {
			return Page.ajax(url, {
				type: 'post',
				data: data
			});
		},

		//.. move
		move: function(url) {
			window.setTimeout(function() {
				location.href = url;
			}, 1000);
		},

		//.. action
		action: function() {},

		//.. pageaction
		pageaction: function() {},

		//.. noaction
		noaction: function() {}
	});
	//. Page.action.prototype
	$.extend(Page.action.prototype, {

		//.. execute
		execute: function() {
			this.addStyle();
			this.main();
		},

		//.. addStyle
		addStyle: function() {
			var style = Data.style;

			if (this.style) {
				style += this.style;
			}

			GM_addStyle(style);
		},

		//.. main
		main: function() {}
	});
	//. Page.pageaction.prototype
	$.extend(Page.pageaction.prototype, {
		//.. execute
		execute: function() {
			this.addStyle();
			this.ajaxLoadingIcon();
			this.commentLink();
			this.main();
			if ( this.callbacks ) {
				this.callbacks.fire();
			}

			this.escapeSpecialCharacters();
		},

		//.. addStyle
		addStyle: function() {
			var style = Data.style;

			if (this.style) {
				style += this.style;
			}

			GM_addStyle(style);
		},

		//.. ajaxLoadingIcon
		ajaxLoadingIcon: function() {
			$(document)
			.on('ajaxStart', function() {
				if( $('#imi_ajax_load').length == 0 ) {
					$('body').append('<span id="imi_ajax_load" class="imc_ajax_load" style="display: none;"><img src="' + Data.images.ajax_load + '"></span>');
				}
				$('#imi_ajax_load').show();
			})
			.on('ajaxStop', function() {
				$('#imi_ajax_load').hide();
			});
		},

		//.. commentLink
		commentLink: function() {
		},

		//.. escapeSpecialCharacters
		escapeSpecialCharacters: function() {
			//特殊文字
			var SpecialCharacters = '&shy;/&zwnj;/&zwj;/&lrm;/&rlm;/&#8203;',
				sc = SpecialCharacters.split('/'),
				sclist = $('<div/>').html(SpecialCharacters).html().split('/');

			$('A[href^="/user/"]').each(escape);
			$('A[href^="/alliance/info.php"]').each(escape);
			$('A[href^="/land.php"]').each(escape);

			function escape() {
				var $this = $(this),
					text = $this.text();

				if ($this.has('IMG, .img_face').length > 0) {
					return;
				}

				for (var i = 0; i < sclist.length; i++) {
					text = text.replace(sclist[i], sc[i], 'g');
				}

				if (text == '') {
					text = '(未設定)';
				}

				$this.text(text);
			}
		},

		//.. main
		main: function() {}
	});
	//. Page.noaction.prototype
	$.extend(Page.noaction.prototype, {

		//.. execute
		execute: function() {}
	});


	//武将カードのクラス
	var BushoCard = function( element ){
		if(element !== undefined)this. analyze( element );
	};
	$.extend( BushoCard.prototype,{
		element:  null,
		id: 0,
		no: 0,
		name: 0,
		level: 0,
		cost : 0,
		branch: 0,
		beat  : 0,
		ex_beat : 0,
		rarity : 0,
		atk  : 0,
		int  : 0,
		def_sw  : 0,
		def_sp  : 0,
		def_bw  : 0,
		def_hs  : 0,
		speed  : 0,
		pow_atk : 0,
		pow_int : 0,
		pow_def : 0,
		pow_spd : 0,
		pow : 0,
		tid: 0,
		skills : null,
		last_attack : null,
		getData: function(){
			var data =
				{
				element:  this.element,
				id: this.id,
				no: this.no,
				name: this.name,
				level: this.level,
				cost : this.cost,
				branch: this.branch,
				beat  : this.beat,
				ex_beat : this.ex_beat,
				atk  : this.atk,
				int  : this.int,
				def_sw  : this.sw,
				def_sp  : this.sp,
				def_bw  : this.bw,
				def_hs  : this.hs,
				speed  : this.speed,
				pow_atk : this.pow_atk,
				pow_int : this.pow_int,
				pow_def : this.pow_def,
				pow_spd : this.pow_spd,
				pow : this.pow,
				tid: this.tid,
				skills : this.skills,
				last_attack : this.last_attack,
				rarity : this.rarity,
				};
			return data;
		},
		setData: function(data){
				 this.element = data.element;
				 this.id = data.id;
				 this.no = data.no;
				 this.name = data.name;
				 this.level = data.level;
				 this.cost = data.cost;
				 this.branch = data.branch;
				 this.beat = data.beat;
				 this.ex_beat = data.ex_beat;
				 this.atk = data.atk;
				 this.int = data.int;
				 this.sw = data.def_sw;
				 this.sp = data.def_sp;
				 this.bw = data.def_bw;
				 this.hs = data.def_hs;
				 this.speed = data.speed;
				 this.pow_atk = data.pow_atk;
				 this.pow_int = data.pow_int;
				 this.pow_def = data.pow_def;
				 this.pow_spd = data.pow_spd;
				 this.pow = data.pow;
				 this.tid = data.tid;
				 this.skills = data.skills;
				 this.last_attack = data.last_attack;
				 this.rarity = data.rarity;

		},

		analyze: function( elm ) {
			try{
				this.element = elm;
				var $status = $('.right .statusParameter1', elm);
				var self = this;
				this.skills = $('.back_skill', elm);
				var re = /inlineId=cardWindow_(\d+)/;
				$("div.illustMini a",elm).attr("href").match(re);
				this.tid = RegExp.$1;
				this.no    = $status.find('TR:eq(0) TD:eq(0)').text().toInt();
				this.name  = $('.illustMini', elm).text();
				this.level = $status.find('TR:eq(2) TD:eq(0)').text().toInt();
				this.cost  = $status.find('TR:eq(3) TD:eq(0)').text().toFloat();
				this.branch= $status.find('TR:eq(4) TD:eq(0)').text();
				this.beat  = $status.find('TR:eq(6) TD:eq(0)').text().toInt();
				this.atk   = $status.find('TR:eq(0) TD:eq(1)').text().toInt();
				this.int   = $status.find('TR:eq(1) TD:eq(1)').text().toFloat();
				this.def_sw= $status.find('TR:eq(2) TD:eq(1)').text().toInt();
				this.def_sp= $status.find('TR:eq(3) TD:eq(1)').text().toInt();
				this.def_bw= $status.find('TR:eq(4) TD:eq(1)').text().toInt();
				this.def_hs= $status.find('TR:eq(5) TD:eq(1)').text().toInt();
				this.speed = $status.find('TR:eq(9) TD:eq(1)').text().toFloat();
				this.ex_beat  = this.beat;
//計算式は変更があるだろう
				this.pow_atk = 2000 + this.atk*1.3;
				this.pow_int = (this.int > 25 ? this.int - 25 : 0) * 2200 + 2000;
				this.pow_def = ( this.def_sw + this.def_sp + this.def_bw + this.def_hs ) / 4 * 1.1 + 2000;
				this.pow_spd = (this.speed > 15 ? this.speed - 15 : 0) * 400 + 2000;
				this.pow     = 0;

				this.rarity = $('.rarerity img',elm).attr('title');


			}catch(e){
				console.log(elm.html());
			}


		},
		click: function( eid, rem, type,stamina,deck) {
			var at_sid = (rem==3 ? 1: 0);
			var postData = {
				mode                : 'set',
				entry_id            : eid,
				target_card         : this.tid,
				deck_set_flg        : 1,
				attack_sid	    : at_sid,
				rem_attack_num      : rem,
				p                   : '',
				ssid                : Env.ssid,
				stamina_num	    : stamina,
				use_attack_up_flg   : 0,
				buy_attack_up_flg   : 1,
				use_gauge_up_flg    : 0,
				buy_gauge_up_flg    : 1,
				use_force_end_flg    : 0,
				buy_force_end_flg    : 1,			};
console.log("name:"+this.name +" LV:"+this.level + " beat:"+ this.beat + " ex_beat:"+ this.ex_beat+" tid:"+this.tid+" eid:"+eid+" rem:"+rem+" type:"+type+' stamina'+stamina+" ssid:"+ Env.ssid);
			var upURL='/card/event_battle_attack.php?entry_id=' + eid + '&target_card=' +this.tid;
			var false_flg = 0;
			var self = this;
			var $doc;
			var paramstr = $.param(postData);
console.log("battle set");
console.log(paramstr);
			$.get('/card/event_battle_attack.php?'+paramstr,function(data){
				$doc = $(data);
			})
			.then( function(  ){
				return 	$.get('/event_battle/npc_battle_check_general_enabled.php?entry_id='+eid+'&SSID=');

			})
			.then( function(  ) {
console.log("battle atk");
				$("#deck_file [name=mode]",$doc).val("atk");
				var $form = $("#deck_file",$doc);
				var data = $form.serialize();

				return $.ajax({
				        url: $form.attr('action'),
				        type: $form.attr('method'),
				        data: $form.serialize(),
				        })
				.then(
				function(data, status, xhr){

					var $body = $(data);
					var now = new Date();
					var last_attack = now.getTime();

					var resultData = {
						time	: last_attack,
						type	: type,
						No	: eid,
						Num	: rem,
						Name	: self.name,
						Level	: self.level,
						Skills	: [],
						Damage	: 0,
						Ex	: 0,
						Beat	: parseInt(self.ex_beat),
					};
					result = $("#resultBox",$body).text().trim();
					if(result === undefined || result.length == 0)result = $("#resultBox-min",$body).text().trim();


					if(result !== undefined && result.length){
						Display.info(result,30);
						resultData.Skills = result.match(/は(.*?)発動/g);
						if(resultData.Skills == null)resultData.Skills=["なし"];
						else {
							for(i=0;i<resultData.Skills.length;i++)[dummy,resultData.Skills[i]] = resultData.Skills[i].match(/は(.*?)発動/);
						}
						[dummy,resultData.Damage] =result.match(/は(.*?)のダメージを与えた/);
						[dummy,resultData.Ex] = result.match(/は(.*?)の経験値を得た/);
						logs.add(JSON.stringify(resultData));
					}
					else {
console.log(data);
						false_flg = 1;

					}
					self.ex_beat = 20;
					self.last_attack = last_attack;
					deck.save();
				},
				function(data, status, xhr){
					false_flg=1;
					console.log("エラ～");
					self.ex_beat = 20;
					self.last_attack = last_attack;
					deck.save();

				});
			})

			// 処理終了
			.then( function(  ) {
				if(false_flg){
					GM_deleteValue('meta-raid_cardfile_num');
					console.log("えら～");
					location.href = location.origin + '/card/event_battle_top.php';
				}
				else {
				Page.form( '/card/event_battle_attack.php', postData );
				}
			})
			// 処理失敗
			.fail( function(  ) {
				console.log("えら～");
			});
		},

	});



	//ファイルのクラス
	var CardFile = function($body,callback){
		this. init($body,callback);
	};
	$.extend( CardFile.prototype,{
		cards : [],
		update_time : null,
		save: function(){
			csaveData('meta-raid_cardfile_update_time',this.update_time.getTime(),1);
			csaveData('meta-raid_cardfile_num',this.cards.length,1);

			var datas = [];
			for(i=0;i<this.cards.length;i++)datas.push(this.cards[i].getData());
			csaveData('meta-raid_cardfile_cards',datas,1,1);
		},
		load: function(){
			this.update_time = new Date(cloadData('meta-raid_cardfile_update_time',0,1));
			var datas = cloadData('meta-raid_cardfile_cards',undefined,1,1);
			for(i=0;i<cloadData('meta-raid_cardfile_num',0,1);i++){
				this.cards[i] = new BushoCard();
				this.cards[i].setData(datas[i]);
			}


		},
		init: function($html,callback) {
			if(cloadData('meta-raid_cardfile_update_time',undefined,1) === undefined ||
			   cloadData('meta-raid_cardfile_num',undefined,1) === undefined ||
			   cloadData('meta-raid_cardfile_cards',undefined,1) === undefined ){

				this.update_time = new Date();
					this.analyze($html,callback);
			}
			else {
				this.load();
				var now = new Date();
				if(now.getTime() - this.update_time.getTime() > 1000 * current_min){
					this.cards = [];
					this.update_time = new Date();
					this.analyze($html,callback);
				}
				else callback(this);
			}

		},
		analyze: function( $html ,callback) {
			var self=this;
			var nextU;
				$obj = $("<body>").html($html);
				var card_count = $('.cardStatusDetail',$obj).length;
				if( card_count > 0 ) {
					for( var i = 0; i < card_count; i++ ) {
						this.cards.push(new BushoCard($('.cardStatusDetail',$obj).eq(i)));
					}
				}

				nextU = $obj.find('ul.pager li.last a').attr('href');
			if(nextU !== undefined){
				$.get(nextU)
				.done(
				 function( text ) {
					var $text = $(text);
					self.analyze($text,callback);
					return;
					}
				);
				return;
			}
			else{
				this.save();
				callback(self);
				return;
			}
		},
		updateBeat: function(){
/*			var now = new Date();

			var diff = (now.getTime() - this.update_time.getTime()) / 1000;
			for(var i=0;i<this.cards.length;i++){
				var base = this.cards[i].beat;
				if(this.cards[i].last_attack){
					diff = (now.getTime() - this.cards[i].last_attack) / 1000;
					base = 20;
				}

				if(base < 100){
					var charge_time = (100 - base) * 108;
					if(diff > charge_time){
						this.cards[i].ex_beat = (diff - charge_time) / 216 + 100;
					}
					else{
						this.cards[i].ex_beat = diff/108 + base;
					}
				}
				else{
					this.cards[i].ex_beat = diff / 216 + base;
				}

				if(this.cards[i].ex_beat > 300)this.cards[i].ex_beat = 300;
			}
*/			this.save();
		},
		getReccomend: function( type ){
			var max_pow = 0;
			var max_id = 0;
			var max_ref = -1;
			this.updateBeat();

			var ig_list = [];
			ig_list = cloadData('meta-raid_ignore_list',undefined,1,1);



			for(var i=0;i<this.cards.length;i++){
				var card = this.cards[i];
				var $skills = $(this.cards[i].skills);
//console.log("name:"+card.name +" LV:"+card.level + " beat:"+ card.beat + " ex_beat:"+ card.ex_beat);
				if(cloadData('meta-raid_unlimit_cost1',0,1) && card.cost == 1)continue;
				if(card.level < cloadData('meta-raid_limit_lv_num',0,1))continue;
				if(card.ex_beat < 101 )continue;
				if(cloadData("meta-raid_ignore_flg",0,1) && $.inArray(card.tid,ig_list)!=-1)continue;

				switch( type ) {
					case '攻撃戦': card.pow = card.pow_atk; break;
					case '知力戦': card.pow = card.pow_int; break;
					case '防御戦': card.pow = card.pow_def; break;
					case '速度戦': card.pow = card.pow_spd; break;
				}

				var skill_pow = 0;
				$skills.children('LI').each( function() {
					var $passive = $('.skill_name.red', this );
					var detail = $('DIV', this).text();
					var current_pow = 0;
					if( type == '攻撃戦' ) {
						var m = detail.match( /攻撃力[がを]*([\d\.]+)%/ ) || [];
						if( m.length ) {
							current_pow = m[1].toFloat();
							if(current_pow>100)current_pow = 100;
						}
					}
					else if( type == '知力戦' ) {
						;
					}
					else if( type == '防御戦' ) {
						var m = detail.match(/防御力[全て]*[がを]*([\d\.]+)%/) || [];
						if( m.length ) {
							current_pow = m[1].toFloat();
							if(current_pow>100)current_pow = 100;
						}
					}
					else if( type == '速度戦' ) {
						var m = detail.match( /(移動速度|移速)[がを]*([\d\.]+)%/ ) || [];
						if( m.length ) {
							current_pow = m[2].toFloat();
							if(current_pow>100)current_pow = 100;
						}
					}
					if( !$passive.length ) {
						current_pow /= 4;
					}
					skill_pow += current_pow;
				});

				if (skill_pow > 100)skill_pow = 100;

				var rare_pow = 100;
				switch(card.rarity){
                    case 'SL': rare_pow += 240;break;
					case 'L': rare_pow += 200;break;
					case 'UR': rare_pow += 160; break;
					case 'SR': rare_pow += 120;break;
					case 'R': rare_pow += 80;break;
					case 'UC': rare_pow += 40;break;
				}
				card.pow =  card.pow * (( card.ex_beat + rare_pow)  / 100 ) * (1+skill_pow/100);

				if(cloadData('meta-raid_limit_power',0,1) && card.pow <= 67000)continue;
				if(max_pow < card.pow){
					max_pow = card.pow;
					max_tid = card.tid;
					max_ref = i;
				}
			}
			return max_ref == -1 ? 0:this.cards[max_ref];
		},
	});


	//■ Raid
	var Raid = {
		style: '.comment_text A { display: inline !important; }',


		pauseLink: function() {
			var default_value = ['一時停止','再開'];
			var raid_pause = 0;

			raid_pause = cloadData('meta-raid_raid_pause',0,1);
			if(raid_pause)raid_pause = 1;
			else raid_pause = 0;


			var $pause = $('<input>')
			.attr({type:'button', value:default_value[raid_pause], id:'raid_pause', style:"width:100px;height:30px"})
			.on( 'click', function() {
				raid_pause = raid_pause ? 0 : 1;
				csaveData('meta-raid_raid_pause',raid_pause,1);
				location.reload();
			});

			return $pause;

		},

		logLink: function(){
			var default_value = ['ログ表示','ログ非表示'];
			var raid_log = 0;

			if (cloadData('meta-raid_raid_log',0,1)==0){csaveData('meta-raid_raid_log',0,1);}

			raid_log = cloadData('meta-raid_raid_log',0,1);
			if(raid_log)raid_log = 1;
			else raid_log = 0;


			var $log = $('<input>')
			.attr({type:'button', value:default_value[raid_log], id:'raid_log', style:"width:100px;height:30px;"})
			.on( 'click', function() {
				raid_log = cloadData('meta-raid_raid_log',0,1);
				raid_log = raid_log ? 0 : 1;
				csaveData('meta-raid_raid_log',raid_log,1);
				location.reload();
			});
			if(cloadData('meta-raid_raid_log',0,1)){

				var html = '<div><center><table id="logs">' +
					   '<tr><th>#</th><th>日時</th><th>判定</th><th>No</th><th>回</th><th>名前</th><th>LV</th><th>討伐</th><th>発動スキル</th><th>ダメージ</th><th>経験値</th></tr>';
				for(i=0;i<logs.getCount();i++){
					var resultData = JSON.parse(logs.get(i));
					var Time = new Date(resultData.time);
					var timestr = Time.getFullYear()+"/"+(Time.getMonth()+1)+"/"+Time.getDate() + " "+Time.getHours()+":"+Time.getMinutes()+":"+Time.getSeconds();

					if(resultData.Skills === null)resultData.Skills = "なし";
					else resultData.Skills = resultData.Skills.join("<br>");
					html += (	"<tr><td>" +(i+1)+"</td>" +
							"<td>" + timestr + "</td>" +
							"<td>" + resultData.type + "</td>" +
							"<td>" + resultData.No + "</td>" +
							"<td>" + resultData.Num + "</td>" +
							"<td>" + resultData.Name + "</td>" +
							"<td>" + resultData.Level + "</td>" +
							"<td>" + resultData.Beat + "</td>" +
							"<td>" + resultData.Skills + "</td>" +
							"<td>" + resultData.Damage + "</td>" +
							"<td>" + resultData.Ex + "</td></tr>");
				}
				html+="</table></center></div>";

				Display.dialog({
					title: '戦闘ログ',
					content: html,
					buttons: {
						'初期化': function() {
							logs.clear();
							csaveData('meta-raid_raid_log',0,1);
//							storage.set('raid_log',false);
							$("#raid_log").val("ログ表示");
							this.close();
						},
						'閉じる': function() {
							csaveData('meta-raid_raid_log',0,1);
//							storage.set('raid_log',false);
							$("#raid_log").val("ログ表示");
							this.close();
						},
					},
					width : 1000,
					hight : 700,

				});
			}
			return $log;


		},

		configLink: function() {

			var $ignoreButton = $('<input>')
			.attr({type:"button",value:"追加",id:"IDaddBtn",class:"btn btn-default"})
			.on('click', function(){
console.log("追加");
				$("#IDlist").append($('<li><div id="IDlist_'+$("#IDlist li").length+'" class="input-group"><input class="form-control" value="0"></div></li>'));
				var query = "#IDlist_"+($("#IDlist li").length-1);
				var $delbtn = $('<input>')
				.attr({type:"button",value:"削除",class:"delbtn btn btn-danger"})
				.on('click',function(){
console.log("削除");
					$(this).parents('li').remove();
				});

				$(query).append($delbtn);
			});
			var $idUL = $('<UL>')
			.attr({id:"IDlist", class:"list-unstyled"});
			var $ignoreList = $('<div>');
			var $ignoreInput = $('<input>')
			.attr({type:"checkbox",name:"ignore_flg",value:"ignore_flg",id:"ignore_flg"});
			if(cloadData('meta-raid_ignore_flg',0,1))$ignoreInput.attr({checked:"checked"});
			$ignoreList.append($ignoreInput);
			$ignoreList.append("叩かない武将をIDで指定する");
			$ignoreList.append($ignoreButton);
			$ignoreList.append($idUL);



			var $setting = $('<input>')
			.attr({type:'button', value:'討伐戦設定', id:'imi_raid_setting',class:'left damage_ranking_updater', style:"width:100px;height:30px"})
			.on( 'click', function() {

				var horihori_owner=cloadData('meta-raid_horihori_owner',"",1);


				var limit_lv_num=cloadData('meta-raid_limit_lv_num',50,1);
				var limit_bonus=cloadData('meta-raid_limit_bonus',0,1);
				var limit_hprem=cloadData('meta-raid_limit_hprem',200000,1);
				var periodic_time=cloadData('meta-raid_periodic_time',1800,1);
				var rem_stamina=cloadData('meta-raid_rem_stamina',10,1);

				var auto_attack = cloadData('meta-raid_auto_attack',true,1);
				var auto_deffence = cloadData('meta-raid_auto_deffence',true,1);
				var auto_speed = cloadData('meta-raid_auto_speed',true,1);
				var auto_int = cloadData('meta-raid_auto_int',true,1);



				var html = '' +
				//'<div><input type="checkbox" name="set_is_attack"' + (storage.get('set_is_attack')?' checked ' : '') + '>セットと同時に攻撃する</div>' +
				//'<div><input type="checkbox" name="hide_beat100"'  + (storage.get('hide_beat100') ?' checked ' : '') + '>討伐100未満を表示しない</div>' +
				//'<div><input type="checkbox" name="hide_levelmax"' + (storage.get('hide_levelmax')? 'checked ' : '') + '>カンスト武将を表示しない</div>' +
				//'<div><input type="checkbox" name="remain_attack"' + (storage.get('remain_attack')?' checked ' : '') + '>戦闘回数回復アイテムを購入して使う(50CP)</div>' +
				//'<div><input type="checkbox" name="recover_gauge"' + (storage.get('recover_gauge')?' checked ' : '') + '>討伐ゲージ回復アイテムを購入して使う(100CP)</div>' +
//				'<div><input type="checkbox" name="priority_300"'  + (storage.get('priority_300') ?' checked ' : '') + '>オススメ武将は討伐300を優先する</div>' +
				'<div>オート有効' +
				'<div><input type="checkbox" name="auto_type" value="auto_attack" id="auto_attack"' + (auto_attack ?' checked ' : '') + '>攻撃戦 ' +
				'<input type="checkbox" name="auto_type" value="auto_deffence" id="auto_deffence"' +(auto_deffence ?' checked ' : '') + '>防御戦 ' +
				'<input type="checkbox" name="auto_type" value="auto_speed" id="auto_speed"' +(auto_speed ?' checked ' : '') + '>速度戦 ' +
				'<input type="checkbox" name="auto_type" value="auto_int" id="auto_int"' +(auto_int ?' checked ' : '') + '>知力戦 </div></div>' +
				'<div><input type="checkbox" name="horihori_man"'  + (cloadData('meta-raid_horihori_man',0,1) ?' checked ' : '') + '>掘るので２枠のみで殴る</div>' +
				'<label>自分の戦闘判定用　自分の名前<input type="text"  name="horihori_owner" value="' + horihori_owner + '"></label>' +
				'<div><input type="checkbox" name="unlimit_cost1"'  + (cloadData('meta-raid_unlimit_cost1',0,1) ?' checked ' : '') + '>コスト1でも殴る</div>' +
				'<label>殴る最低レベル<input type="text"  name="limit_lv_num" value="' + limit_lv_num + '"></label>' +
				'<div><input type="checkbox" name="limit_power"'  + (cloadData('meta-raid_limit_power',0,1) ?' checked ' : '') + '>能力の低い武将では殴らない</div>' +
				'<div><input type="checkbox" name="target_world"'  + (cloadData('meta-raid_target_world',0,1) ?' checked ' : '') + '>ワールドを対象とする</div>' +
				'<div><label>叩きに行く  同盟ボーナス値<input type="text"  style="width:60px;" name="limit_bonus" value="' + limit_bonus + '"></label>' +
				'<label>  討伐武将のHP<input type="text" style="width:120px;" name="limit_hprem" value="' + limit_hprem + '"></label></div>' +
				'<div><label>叩きに行く体力<input type="text" style="width:60px;"  name="rem_stamina" value="' + rem_stamina + '"></label></div>' +
				'<div><label>デッキファイル更新間隔(秒)<input type="text" style="width:60px;"  name="periodic_time" value="' + periodic_time + '"></label></div>' +
				'';


				Display.dialog({
					title: '討伐戦設定',
					content: html,
					buttons: {
						'決定': function() {
							//storage.set('set_is_attack', $('[name="set_is_attack"]').prop('checked') );
							//storage.set('hide_beat100',  $('[name="hide_beat100"]' ).prop('checked') );
							//storage.set('hide_levelmax', $('[name="hide_levelmax"]').prop('checked') );
							//storage.set('remain_attack', $('[name="remain_attack"]').prop('checked') );
							//storage.set('recover_gauge', $('[name="recover_gauge"]').prop('checked') );
							csaveData('meta-raid_auto_attack',  $('[id="auto_attack"]' ).prop('checked'),1 );
							csaveData('meta-raid_auto_deffence',  $('[id="auto_deffence"]' ).prop('checked'),1 );
							csaveData('meta-raid_auto_speed',  $('[id="auto_speed"]' ).prop('checked'),1 );
							csaveData('meta-raid_auto_int',  $('[id="auto_int"]' ).prop('checked'),1 );
							csaveData('meta-raid_horihori_man',  $('[name="horihori_man"]' ).prop('checked'),1 );
							csaveData('meta-raid_horihori_owner',  $('[name="horihori_owner"]' ).val(),1 );
							csaveData('meta-raid_unlimit_cost1',  $('[name="unlimit_cost1"]' ).prop('checked'),1 );
							csaveData('meta-raid_limit_lv_num',  $('[name="limit_lv_num"]' ).val(),1 );
							csaveData('meta-raid_limit_power',  $('[name="limit_power"]' ).prop('checked'),1 );
							csaveData('meta-raid_target_world',  $('[name="target_world"]' ).prop('checked'),1 );
							csaveData('meta-raid_ignore_flg',  $('[name="ignore_flg"]' ).prop('checked'),1 );
							csaveData('meta-raid_limit_bonus',  $('[name="limit_bonus"]' ).val(),1 );
							csaveData('meta-raid_limit_hprem',  $('[name="limit_hprem"]' ).val(),1 );
							csaveData('meta-raid_periodic_time',  $('[name="periodic_time"]' ).val(),1 );
							csaveData('meta-raid_rem_stamina',  $('[name="rem_stamina"]' ).val(),1 );

							var ig_num = $("#IDlist li").length;
							var ig_list = [];
							for(i=0;i<ig_num;i++){
								var query = "#IDlist_"+i + " input";
								ig_list.push($(query).val());
							}
							csaveData('meta-raid_ignore_list', ig_list, 1, 1);



							this.close();
						},
						'キャンセル': function() {
							this.close();
						},
					},
				});
				$(".imc_dialog_body").append($ignoreList);
				var ig_list = cloadData('meta-raid_ignore_list',undefined,1,1);
				if(ig_list !== undefined){
					for(i=0;i<ig_list.length;i++){
						$($ignoreButton).click();
						var query = "#IDlist_"+ i + " input.form-control";
						$(query).val(ig_list[i]);
					}
				}
			});

			return $setting;
		},
	};


	//■ /card/event_battle_top .. レイドトップ
	Page.registerAction('card', 'event_battle_top', {
		style: '.npcBusho a { color: #39c; font-weight: bold; }',

		main: function() {
			var cur_stamina = $('.cur_stamina').text()-0;
			var self = this;

			// 討伐数とかを初期非表示に
			// $('#show_punitive').hide();
			$('#npcTitle').click( function() { $('#show_punitive3').toggle(); } );
			this.layouter( $('.npcBusho') );

			var myself   = $('#npcSearchBtn LI IMG[src$="btn_enter_battle.png"]').length > 0,
				alliance = $('#npcSearchBtn LI IMG[src$="btn_alliance_battle.png"]').length > 0,
				world    = $('#npcSearchBtn LI IMG[src$="btn_world_battle.png"]').length > 0;

			$('#show_punitive3').before( Raid.configLink() );
			$('#show_punitive3').before( Raid.pauseLink() );
			$('#show_punitive3').before( Raid.logLink() );

			if(cloadData('meta-raid_raid_pause',0,1)){
//			if(storage.get('raid_pause')){
				return;
			}

			// 解析
			$('.npcBusho').each( function() {
				var $this = $(this),
					[dmyhp, hprem, hpmax] = $this.find('DT:contains("HP")+DD').text().match(/([\d,]+)\/([\d,]+)/),
					[dmyjn, join] = $this.find('DT:contains("参戦人数")+DD').text().match(/(\d+)\/\d+/),
					[dmyat, atk]  = $this.find('DT:contains("戦闘回数")+DD').text().match(/(\d+)\/\d+/),
					[dmbonus, bonus]  = $this.find('DT:contains("同盟ボーナス")+DD').text().match(/(\d+)/),
					type = $this.find('DT:contains("ダメージ判定")+DD').text(),
					deadline = $this.find('DT:contains("残り時間")+DD').text(),
					entry_id = $this.find('DT:contains("戦闘No")+DD A').attr('href'),
					disable = $this.find('.Battle_detail_disable').length;



				if( disable > 0 ) { return false; }

				hprem = hprem.replace(/,/g,'');

				// 残りHPが0の場合は確認するために表示
				if( hprem == 0 ) {
					location.href = location.origin + entry_id;
				}
			});


			Util.wait( 5000 )
			.done( function() {
				//console.log('test0001');

				//戦闘中の戦種を抽出
				var battle_cards = [];
				$('.npcBusho').each( function() {battle_cards.push( new TargetBusho( this ) );});

				var battle_type01="";
				var battle_type02="";
				if( battle_cards.length > 0 ) {battle_type01=battle_cards[0].type;}
				if( battle_cards.length > 1 ) {battle_type02=battle_cards[1].type;}

				for( var i = 0; i < battle_cards.length; i++ ) {

					if( battle_cards[i].deadline == "00:00:00" ) {
console.log("time up!");
						battle_cards[i].link.click();
					}
				}

				//自分が掘った武将検索
				var owner_battle_Flg=false;
				for( var i = 0; i < battle_cards.length; i++ ) {
					if (cloadData('meta-raid_horihori_owner',"",1)==battle_cards[i].discover_man){
						owner_battle_Flg=true;
						if(i == 0) battle_type01="";
						if(i == 1) battle_type02="";
					}
				}

				//掘る人用に２枠調整
				var max_Battle=3;
				if ( cloadData('meta-raid_horihori_man',0,1) && !owner_battle_Flg){
					max_Battle=2;
				}


				if ($('.npcBusho').size()<max_Battle && cur_stamina >= cloadData('meta-raid_rem_stamina',10,1)-0) {

					var scope;
					if(cloadData('meta-raid_target_world',0,1)) scope=3; else scope=2 ;
					//ここでターゲットを探してあったら遷移
					self.autoPager2("/card/event_battle_top.php?p=1&filter_hp=2&scope="+scope,battle_type01 , battle_type02, owner_battle_Flg);

				}else {
					//自分の殴り中へ遷移してみる
					var cards = [];
					$('.npcBusho').each( function() {cards.push( new TargetBusho( this ) );});
					if( cards.length > 0 ) {
						var targetBusyo = cards.filter( function( c ) {
							var auto_flg = false;
							switch(c.type){
								case '攻撃戦': auto_flg = cloadData('meta-raid_auto_attack',1,1); break;
								case '知力戦': auto_flg = cloadData('meta-raid_auto_int',1,1); break;
								case '防御戦': auto_flg = cloadData('meta-raid_auto_deffence',1,1); break;
								case '速度戦': auto_flg = cloadData('meta-raid_auto_speed',1,1); break;

								}

								if(c.atk == 3 && cur_stamina < cloadData('meta-raid_rem_stamina',10,1)-0)auto_flg = 0;
							 return (c.atk>0 && (c.bonus == 200 || cloadData('meta-raid_target_world',0,1)) && auto_flg) ;
							});
						if (targetBusyo.length > 0) {
							//戦闘画面に遷移
							moveBattleScreen(targetBusyo[0].entry_id,Env.ssid);
						}
						else {

							var targetBusyo_02 = cards.filter( function( c ) {
								var auto_flg = false;
								switch(c.type){
									case '攻撃戦': auto_flg = cloadData('meta-raid_auto_attack',1,1); break;
									case '知力戦': auto_flg = cloadData('meta-raid_auto_int',1,1); break;
									case '防御戦': auto_flg = cloadData('meta-raid_auto_deffence',1,1); break;
									case '速度戦': auto_flg = cloadData('meta-raid_auto_speed',1,1); break;

									}
console.log("rem:"+c.atk);
console.log("stamina:"+cur_stamina);
console.log("bonus:"+c.bonus);
console.log("hprem:"+c.hprem);
console.log("raid_limit_bonus:"+cloadData("meta-raid_limit_bonus",0,1));
console.log("raid_limit_hprem:"+cloadData("meta-raid_limit_hprem",200000,1));
console.log("raid_target_world:"+cloadData("meta-raid_target_world",0,1));

								if(c.atk == 3 && cur_stamina < cloadData('meta-raid_rem_stamina',10,1)-0)auto_flg = 0;
							 return (c.atk>0 && (c.hprem-0 <= cloadData('meta-raid_limit_hprem',200000,1)-0 || c.bonus-0 >= cloadData('meta-raid_limit_bonus',0,1)-0) && auto_flg) ;
							});
							if (targetBusyo_02.length > 0) {
								//戦闘画面に遷移
								moveBattleScreen(targetBusyo_02[0].entry_id,Env.ssid);
								return;
							}
						}
					}
					//次のリロード時間を設定
console.log("wait 60sec for next reload");
					window.setTimeout( function() { location.reload(); }, 60000 );
				}

			});

		},


		autoPager2: function(url, battle_type01 , battle_type02 ,owner_battle_Flg) {
console.log("pager2:"+url);
			var self = this;
			var $html;
			$.get(url, function(data){
				$html = $(data)
			})
			.then( function(  ) {
					cards = [];
				if(cloadData('meta-raid_target_world',0,1) && !$html.find('.npcBusho')){
					autoPager2('/card/event_battle_top.php?p=1&scope=4', battle_type01 , battle_type02 ,owner_battle_Flg);
					return;
				}
				// 武将情報の取得
				$html.find('.npcBusho').each( function() {
					cards.push( new TargetBusho( this ) );
				});

				if( cards.length > 0 ) {

					var targetBusyo = cards.filter( function( c ) {
						var auto_flg = false;
						switch(c.type){
							case '攻撃戦': auto_flg = cloadData('meta-raid_auto_attack',1,1); break;
							case '知力戦': auto_flg = cloadData('meta-raid_auto_int',1,1); break;
							case '防御戦': auto_flg = cloadData('meta-raid_auto_deffence',1,1); break;
							case '速度戦': auto_flg = cloadData('meta-raid_auto_speed',1,1); break;
							}
							 return (c.target && c.atk==3  && c.type!==battle_type01 && c.type!==battle_type02 && auto_flg) ;
					});

					if (targetBusyo.length > 0) {

						//戦闘画面に遷移
						moveBattleScreen(targetBusyo[0].entry_id,Env.ssid);
						return;
					} else {

						var targetBusyo_02 = cards.filter( function( c ) {
							var auto_flg = false;
							switch(c.type){
								case '攻撃戦': auto_flg = cloadData('meta-raid_auto_attack',1,1); break;
								case '知力戦': auto_flg = cloadData('meta-raid_auto_int',1,1); break;
								case '防御戦': auto_flg = cloadData('meta-raid_auto_deffence',1,1); break;
								case '速度戦': auto_flg = cloadData('meta-raid_auto_speed',1,1); break;
								}
						 return (c.atk>0 && (c.bonus >= 0) && auto_flg) ;
						});
						if (targetBusyo_02.length > 0) {
							//戦闘画面に遷移
							moveBattleScreen(targetBusyo_02[0].entry_id,Env.ssid);
							return;
						} else {
							var targetBusyo_03 = cards.filter( function( c ) {
							var auto_flg = false;
							switch(c.type){
								case '攻撃戦': auto_flg = cloadData('meta-raid_auto_attack',1,1); break;
								case '知力戦': auto_flg = cloadData('meta-raid_auto_int',1,1); break;
								case '防御戦': auto_flg = cloadData('meta-raid_auto_deffence',1,1); break;
								case '速度戦': auto_flg = cloadData('meta-raid_auto_speed',1,1); break;
								}
							 return (c.target && c.atk==3 && c.bonus>100 && auto_flg) ;
						});
							if (targetBusyo_03.length > 0) {
								//戦闘画面に遷移
								moveBattleScreen(targetBusyo_03[0].entry_id,Env.ssid);
								return;

							} else {
								var targetBusyo_04 = cards.filter( function( c ) {
								var auto_flg = false;
								switch(c.type){
									case '攻撃戦': auto_flg = cloadData('meta-raid_auto_attack',1,1); break;
									case '知力戦': auto_flg = cloadData('meta-raid_auto_int',1,1); break;
									case '防御戦': auto_flg = cloadData('meta-raid_auto_deffence',1,1); break;
									case '速度戦': auto_flg = cloadData('meta-raid_auto_speed',1,1); break;
									}
								 return (c.target && c.atk==3  && cloadData('meta-raid_target_world',0,1) && auto_flg) ;
							});
								if (targetBusyo_04.length > 0) {
									//戦闘画面に遷移
									moveBattleScreen(targetBusyo_04[0].entry_id,Env.ssid);
									return;
								}

							}
						}
					}
					var nextURL = $html.find('ul.pager li.last a').attr('href');
if(nextURL===undefined)console.log($html.html());
console.log("next:"+nextURL);
					if(nextURL){
						nextURL = nextURL.replace(/&amp;/g, '&');
						self.autoPager2(nextURL,battle_type01,battle_type02,owner_battle_Flg);
						return;
					}
				}
				//次のリロード時間を設定
				Display.info('候補がいないのでトップにもどります。');
				window.setTimeout( function() { location.href = location.origin + '/card/event_battle_top.php'; }, 60000 );

			})
			.fail( function(  ) {
				console.log("えら～");
			});
		},


		//. autoPager
		autoPager: function() {
			var self = this;

			$.autoPager({
				container: '.pager',
				next: function(html) {
					var $html = $(html),
						$pager = $html.find('UL.pager:last'),
						source = $pager.find('LI.last A:first').attr('href') || '',
						match = source.match(/p=(\d+)/),
						nextPage;

					if (match) {
						nextPage = match[1].toInt();
					}
					return nextPage;
				},
				load: function(nextPage) {
					var s = location.search.match(/scope=(\d+)/) || '';
					return Page.get('/card/event_battle_top.php', {
						p: nextPage,
						scope: s[1],
					});
				},
				loaded: function(html) {
					var $html = $(html),
						$npc_list = $html.find('.npcBusho');

					$npc_list.insertAfter('.npcBusho:last');
					self.layouter( $npc_list );
				},
				ended: function() {
					Display.info('全ページ読み込み完了');
				}
			});
		},

		layouter: function( $list ) {
			$list.each( function() {
				var $this = $(this);
				// 戦闘リンクの置換
				$this.find('DT:contains("戦闘No")+DD').replaceWith( function() {
					var text = $(this).text();
					return '<dd><a href=/card/event_battle_attack.php?entry_id=' + text + '>' + text + '</a></dd>';
				});
			});
		},
	});

	// レイド実行画面
	Page.registerAction('card', 'event_battle_attack', {
		style: '' +
		'.power   { z-index:1; position:absolute; width:100%; left:0px; top:85px; background-color:silver; opacity:0.7; font-size:16px; font-weight:bold; color:blue; padding: 5px 0px; text-align:center;}' +
		'.beatmax { background-color: gold !important;}' +
		'.recommend { background-color: lightcoral !important; }' +
		'',
//		storage: MetaStorage('RAID'),


		main: function() {

			this.layouter();
			if(cloadData('meta-raid_raid_pause',0,1)){
//			if(this.storage.get('raid_pause')){
				return;
			}

			var now = new Date();
			deckfile = new CardFile($('body').html(),this.autoAttack);


		},

		layouter: function() {
			var self = this;
			var rem = $(".remaining_battle_count").text().match(/(\d)\/\d/)[1];
			var label = $('#l').val();
			var $card = $('.cardStatusDetail');
			// 設定リンクを追加
			$('.npcframe:first').before( Raid.configLink() );
			$('.npcframe:first').before( Raid.pauseLink() );
			$('.npcframe:first').before( Raid.logLink() );

			if(cloadData('meta-raid_raid_pause',0,1)){
//			if(this.storage.get('raid_pause')){
				return;
			}


			// 戦闘回数が残っていなくて回数アップのチェックが外れているときはメッセージを表示
			if( rem == 0 ) {
				Display.alert('戦闘回数が残っていません');
			}

		},
		returnTop: function(temp){
			current_min=cloadData('meta-raid_periodic_time',1800,1);
			Util.wait( 3*60*1000 )
			.done( function(){
			location.href = location.origin + '/card/event_battle_top.php';
			});
		},
		// 自動攻撃
		//  同盟ボーナスが200%の時か不明の時に殴る
		//  残り攻撃回数がない場合は同盟に公開
		autoAttack: function(deck) {

			var battle = $('.battle_Column_mid_v2').text();
			var gauge = $('.damage_bonus div:eq(0)').text();
			var bonus = $('.damage_bonus div:eq(2)').text().match(/([\d]+)%/)[1] - 0;
			var remain = $(".remaining_battle_count").text().match(/(\d)\/\d/)[1] - 0;
			var type = $('#infoBox').text().match(/ダメージ判定：(.*)/)[1]; // 戦闘タイプ
			var nop    = $('#infoBox span:eq(2)').text().match(/(\d+)\/(\d+)/)[1];  // 参戦人数
			var $alliance = $('#busho_desk_Box .battle_Column_btn_v2:first A[onclick^="return changeScope"]');  // 同盟公開ボタン
			var $recommend = $('.cardStatusDetail.recommend');  // オススメ
			var $sendbutton = $('#send_button[onclick^="return confirmPostComment"]');  // 送信ボタン
			var stamina = $('.cur_stamina').text() - 0;
			var hprem = $('.justify span:eq(1)').text().match(/([\d,]+)\/[\d,]+/)[1];
			hprem = hprem.replace(/,/g,'') - 0;

			if(gauge.match(/---/))gauge = 0;
			else gauge = gauge.match(/([\d]+)%/)[1] - 0;

console.log("rem:"+remain);
console.log("stamina:"+stamina);
console.log("gauge:"+gauge);
console.log("bonus:"+bonus);
console.log("hprem:"+hprem);
console.log("raid_limit_bonus:"+cloadData("meta-raid_limit_bonus",150,1));
console.log("raid_limit_hprem:"+cloadData("meta-raid_limit_hprem",200000,1));
console.log("raid_target_world:"+cloadData("meta-raid_target_world",0,1));

			//残戦闘回数が０の時TOP画面に戻る
			if (remain == 0) {
				Display.info('残戦闘回数が０なのでTOP画面に戻ります');
				Util.wait(3000)
				.done( function() {
					location.href = location.origin + '/card/event_battle_top.php';
				});

			}
			// オススメでワンパン
			else if( remain == 3 ) {
				var card = deck.getReccomend(type);
				var 	eid = $('#entry_id').val();
				if(card == 0){
					Display.alert('攻撃できる武将がいません');
					//次のリロード時間を設定　※TOPに戻るというのもありかも
					GM_deleteValue('meta-raid_cardfile_num');
					window.setTimeout( function() { location.href = location.origin + '/card/event_battle_top.php'; }, 60000 );
					return;
				}
				card.click(eid, remain, type,stamina,deck);


			}
			// 残り攻撃回数がある場合は、200%か参戦人数20人以上の場合に殴る
			else if((remain>0)&&((bonus>=cloadData('meta-raid_limit_bonus',150,1)-0)||(cloadData("meta-raid_target_world",0,1))||hprem<=cloadData('meta-raid_limit_hprem',200001,1)-0)) {
				var card = deck.getReccomend(type);
				var 	eid = $('#entry_id').val();

				if(card == 0){
					Display.alert('攻撃できる武将がいません');
					//次のリロード時間を設定　※TOPに戻るというのもありかも
					GM_deleteValue('meta-raid_cardfile_num');
					window.setTimeout( function() { location.href = location.origin + '/card/event_battle_top.php'; }, 60000 );
					return;
				}
				card.click(eid, remain, type,stamina,deck);

			}
			// 条件を満たしていない時はTop画面に遷移しないとうまくいかないフォーム情報ダイアログがでてしまう
			else {
				Display.alert('自動攻撃の条件を満たしていません TOP画面に戻ります');
				//次のリロード時間を設定　※TOPに戻るというのもありかも
				window.setTimeout( function() { location.href = location.origin + '/card/event_battle_top.php'; }, 5000 );

			}
		},
	});

	// レイド結果 / 完了時は1秒後にトップへ戻るor閉じる
	Page.registerAction('card', 'event_battle_result', {
		main: function() {
			if( $('.complete').length > 0 ) {
				Util.wait( 3000 )
				.done( function() {
//					if( MetaStorage('RAID').get('result_newtab') ) {
					if( cloadData('meta-raid_result_newtab',0,1) ) {
						window.close();
					}
					else {
						location.href = location.origin + '/card/event_battle_top.php';
					}
				});
			}
			else {
				location.href = location.origin + '/card/event_battle_top.php';
			}
		},
	});

	//■■■■■■■■■■■■■■■■■■■

	//■ 実行
	Page(Env.path).execute();

	//■■■■■■■■■■■■■■■■■■■

})(jQuery);

//----------------------//
// Greasemonkey Wrapper //
//----------------------//
// Firefox + GreaseMonkey4 でGMラッパー関数を動かすための定義
function initGMWrapper() {
	// @copyright		2009, James Campos
	// @license		cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
	if ((typeof GM_getValue == 'undefined') || (GM_getValue('a', 'b') == undefined)) {
		GM_addStyle = function (css) {
			var style = document.createElement('style');
			style.textContent = css;
			document.getElementsByTagName('head')[0].appendChild(style);
		};
		GM_deleteValue = function (name) {
			sessionStorage.removeItem(name);
			localStorage.removeItem(name);
		};
		GM_getValue = function (name, defaultValue) {
			var value;
			value = sessionStorage.getItem(name);
			if (!value) {
				value = localStorage.getItem(name);
				if (!value) {
					return defaultValue;
				}
			}
			var type = value[0];
			value = value.substring(1);
			switch (type) {
			case 'b':
				return value == 'true';
			case 'n':
				return Number(value);
			default:
				return value;
			}
		};
		GM_setValue = function (name, value) {
			value = (typeof value)[0] + value;
			try {
				localStorage.setItem(name, value);
			} catch (e) {
				localStorage.removeItem(name);
				sessionStorage.setItem(name, value);
				throw e;
			}
		};
	}
}

function comp_version(a,op,b)
{
  a = a.split('.');
  b = b.split('.');

  var ia,ib;
  var limit = Math.max(a.length,b.length);
  while(limit--)
    {
      ia = parseInt(a.shift() || 0);
      ib = parseInt(b.shift() || 0);

      if(ia != ib)
        break;
     }
   return eval([ia,op,ib].join(' '));
}

