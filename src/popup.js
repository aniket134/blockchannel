function rebuildTable(){
    chrome.storage.sync.get("channels", function(items){
	items = items || {}; items.channels = items.channels || {};
	populateTable(items.channels);
    });
}

function rebuildKeywordTable(){
    chrome.storage.sync.get(["keywords", "keywordIndex"], function(items){
	items = items || {}; items.keywords = items.keywords || {};
	items.keywordIndex = items.keywordIndex || {};
	populateKeywordsTable(items);
    });
}

function populateKeywordsTable(items){
    var tr; var tblElem; var buttonElem; var hasAnyElems;
    var keyword; var keywords; var keywordIndex;
    keywords = items.keywords;
    keywordIndex = items.keywordIndex;
    hasAnyElems = hasAnyElements(keywords);
    tblElem = document.getElementById("keywordTable");

    //check required variables and set initial state
    if(!tblElem) return;
    tblElem.innerHTML = "";

    //keywords present
    tblElem.innerHTML = "<th colspan=2>Blocked Keywords</th><th></th>";
    tr = "<tr>";
    tr += "<td><input type=\"text\" id=\"keywordInput\"/></td>";
    tr += "<td style=\"width: 100px;\">";
    tr += "<button id=\"keywordButton\" class=\"block\">Block</button>";
    tr += "</td>";
    tr += "</tr>";
    tblElem.innerHTML += tr;
    for(keyword in keywords){
	tr = "<tr>";
	tr += "<td>" + keyword + "</td>";
	tr += "<td>";
	tr += "<button id=\"" + keywords[keyword] + "\">Unblock</button>";
	tr += "</td>";
	tr += "</tr>";
	tblElem.innerHTML += tr;
    }

    //add event listeners    
    for(keyword in keywords){
	document.getElementById(keywords[keyword]).addEventListener(
	    "click", unblockKeywordEvent);
    }

    buttonElem = document.querySelector("button#keywordButton");
    if(buttonElem) buttonElem.addEventListener("click", blockKeywordEvent);
}

function populateTable(channels){
    var chName; var tr; var nodataElem; var chURL; var tblElem;
    tblElem = document.getElementById("table");
    nodataElem = document.getElementById("nodata");
    
    if(!tblElem) return;
    tblElem.innerHTML = "";
    if(nodataElem){
	nodataElem.innerHTML = "";
	if(!hasAnyElements(channels)){
	    nodataElem.innerHTML = "No channels have been blocked yet.";
	    return;
	}
    }

    tblElem.innerHTML = "<th colspan=2>Blocked Channels</th><th></th>";
    for(chName in channels){
	chURL = channels[chName];
	if(chURL) chURL = chURL[0] || chURL[1];
	tr = "<tr>";
	tr += "<td><a href=\"https://www.youtube.com" +
	    chURL + "\" target=\"_blank\">" +
	    chName + "</a></td>";
	tr += "<td style=\"width: 100px;\">";
	tr += "<button id=\"" + chName + "\">Unblock</button>";
	tr += "</td>";
	tr += "</tr>";
	tblElem.innerHTML += tr;
    }
    for(chName in channels){
	document.getElementById(chName).addEventListener("click", blockEvent);
    }
}

function blockEvent(){
    //console.log("blocking event: " + this.id);
    blockChannel(this.id);
}

function unblockKeywordEvent(){
    var keyword, keywordId;
    keywordId = this.id + "";
    chrome.storage.sync.get("keywordIndex", function(items){
	items = items || {}; items.keywordIndex = items.keywordIndex || {};
	keyword = items.keywordIndex[keywordId];
	blockKeyword(keyword, false);
    });
}

function blockKeywordEvent(){
    var keyword; var inputElem;
    inputElem = document.querySelector("div input#keywordInput");
    if(!inputElem) return;
    keyword = inputElem.value || inputElem.innerText || "";
    if(keyword.length == 0) return;
    blockKeyword(keyword, true);
}

function blockKeyword(keyword, blocking){
    //console.log("blockKeyword: " + keyword + ", " + blocking);
    var keywordId;
    chrome.storage.sync.get(["keywords", "keywordIndex"], function(items){
	//console.log("blockKeyword, old: " + JSON.stringify(items));
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
		rebuildKeywordTable();
	    }
	});
    });
}

function blockChannel(chName, channelId, chURL){
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
		rebuildTable();
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

document.addEventListener("DOMContentLoaded", function(){
    rebuildTable();
    rebuildKeywordTable();
});
