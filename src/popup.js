function refreshPopup(){
    rebuildTable();
    rebuildKeywordTable();
}

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
    tblElem.innerHTML = "<th colspan=2>Blocked Keywords</th>";
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
	nodataElem.className = "nodisp";
	if(!hasAnyElements(channels)){
	    nodataElem.className = "";
	    return;
	}
    }

    tblElem.innerHTML = "<th colspan=2>Blocked Channels</th>";
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
    blockChannelCore({ "chName": this.id }, rebuildTable);  //core function present in utils.js
}

function unblockKeywordEvent(){
    var keyword, keywordId;
    keywordId = this.id + "";
    chrome.storage.sync.get("keywordIndex", function(items){
	items = items || {}; items.keywordIndex = items.keywordIndex || {};
	keyword = items.keywordIndex[keywordId];
	blockKeywordCore(keyword, false, refreshPopup);  //core function present in utils.js
    });
}

function blockKeywordEvent(){
    var keyword; var inputElem;
    inputElem = document.querySelector("div input#keywordInput");
    if(!inputElem) return;
    keyword = inputElem.value || inputElem.innerText || "";
    if(keyword.length == 0) return;
    blockKeywordCore(keyword, true, refreshPopup);  //core function present in utils.js
}

document.addEventListener("DOMContentLoaded", function(){
    refreshPopup();
});
