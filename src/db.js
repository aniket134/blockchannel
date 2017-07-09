function blockChannelCore(chnInfo, successCallback){
    var chName, channelId, chURL;
    if (!chnInfo) return;
    chName = chnInfo.chName;
    channelId = chnInfo.chId;
    chURL = chnInfo.chURL;
    chrome.storage.sync.get("channels", function(items){
	//console.log("blockChannel, old: " + JSON.stringify(items));
	items = items || {}; items.channels = items.channels || {};

	//mark as blocked/unblocked
	if(items.channels[chName]) delete items.channels[chName];
	else items.channels[chName] = [ channelId, chURL ];
	
	//update storage
	chrome.storage.sync.set(items, function(){
	    if(chrome.runtime.lastError) console.log("save error: " + JSON.stringify(chrome.runtime.lastError));
	    else{
		if(successCallback) successCallback();
	    }
	});
    });
}

// Desc: Blocks/unblocks a keyword.
//       Globals changed:
//         keywords[keyword] = [keywordId, lowerCaseKeyword]
//         keywordIndex[keywordId] = keyword
//         keywordTrie = see trie.js
// Params:
//           keyword: string to block/unblock
//          blocking: true for blocking, false (default) for unblocking
//   successCallback: function to callback when successfully blocked/unblocked
function blockKeywordCore(keyword, blocking, successCallback){
    //console.log("blockKeywordCore: " + keyword + ", " + blocking);
    var keywordId;
    if(hasInvalidChars(keyword)) return;  //utils.js

    chrome.storage.sync.get(["keywords", "keywordIndex", "keywordTrie"], function(items){
	//console.log("blockKeywordCore, old: " + JSON.stringify(items));
	items = items || {}; items.keywords = items.keywords || {};
	items.keywordIndex = items.keywordIndex || {}; items.keywordTrie = items.keywordTrie || {};

	//mark as blocked/unblocked
	if(!blocking && items.keywords[keyword]){
	    keywordId = items.keywords[keyword][0];
	    if(items.keywords[keyword]){
		delete items.keywords[keyword];
		delete items.keywordIndex[keywordId];
		trie_removeWord(keyword, items.keywordTrie);
	    }
	}
	if(blocking && !items.keywords[keyword]){
	    keywordId = keyword + "-ID";
	    items.keywords[keyword] = [];
	    items.keywords[keyword][0] = keywordId;
	    items.keywords[keyword][1] = keyword.toLowerCase();
	    items.keywordIndex[keywordId] = keyword;
	    trie_addWord(keyword, items.keywordTrie);
	}

	//console.log(items.keywordTrie);
	console.log(items);
	
	//update storage
	chrome.storage.sync.set(items, function(){
	    if(chrome.runtime.lastError) console.log("save error: " + JSON.stringify(chrome.runtime.lastError));
	    else{
		if(successCallback) successCallback();
	    }
	});
    });
}
