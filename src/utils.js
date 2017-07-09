

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


function blockKeywordCore(keyword, blocking, successCallback){
    //console.log("blockKeywordCore: " + keyword + ", " + blocking);
    var keywordId;
    chrome.storage.sync.get(["keywords", "keywordIndex"], function(items){
	//console.log("blockKeywordCore, old: " + JSON.stringify(items));
	items = items || {}; items.keywords = items.keywords || {};
	items.keywordIndex = items.keywordIndex || {};

	//mark as blocked/unblocked
	if(!blocking && items.keywords[keyword]){
	    keywordId = items.keywords[keyword];
	    if(items.keywords[keyword]) delete items.keywords[keyword];
	    if(items.keywordIndex[keywordId]) delete items.keywordIndex[keywordId];
	}
	if(blocking && !items.keywords[keyword]){
	    keywordId = keyword + "-ID";
	    items.keywords[keyword] = keywordId;
	    items.keywordIndex[keywordId] = keyword;
	}
	
	//update storage
	chrome.storage.sync.set(items, function(){
	    if(chrome.runtime.lastError) console.log("save error: " + JSON.stringify(chrome.runtime.lastError));
	    else{
		if(successCallback) successCallback();
	    }
	});
    });
}

function hasAnyElements(elements){
    var elem;
    if(!elements) return false;
    for(elem in elements) { return true; }
    return false;
}
