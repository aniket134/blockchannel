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
    var tr; var tblElem; var buttonElem; var inputElem;
    var hasAnyElems; var keyword; var keywords; var keywordIndex;
    keywords = items.keywords;
    keywordIndex = items.keywordIndex;
    hasAnyElems = hasAnyElements(keywords);  //utils.js
    tblElem = document.getElementById("keywordTable");

    //check required variables and set initial state
    if(!tblElem) return;
    tblElem.innerHTML = "";

    //keywords present
    tblElem.innerHTML = "<th colspan=2>Blocked Keywords</th>";
    tr = "<tr>";
    tr += "<td><input type=\"text\" id=\"keywordInput\"  /></td>";
    tr += "<td style=\"width: 100px;\">";
    tr += "<button id=\"keywordButton\" class=\"block\">Block</button>";
    tr += "</td>";
    tr += "</tr>";
    tblElem.innerHTML += tr;
    for(keyword in keywords){
	tr = "<tr>";
	tr += "<td>" + keyword + "</td>";
	tr += "<td>";
	tr += "<button id=\"" + keywords[keyword][0] + "\">Unblock</button>";
	tr += "</td>";
	tr += "</tr>";
	tblElem.innerHTML += tr;
    }

    //add event listeners    
    for(keyword in keywords){
	document.getElementById(keywords[keyword][0]).addEventListener(
	    "click", unblockKeywordEvent);
    }

    buttonElem = document.querySelector("button#keywordButton");
    if(buttonElem) buttonElem.addEventListener("click", blockKeywordEvent);

    inputElem = document.querySelector("input#keywordInput");
    if(inputElem){
	inputElem.focus();
	inputElem.addEventListener("keypress", function (e) {
	    keywordKeyoressEvent(e);
	});
	inputElem.addEventListener("input", validateKeyword);
    }
}

function populateTable(channels){
    var chName; var tr; var nodataElem; var chURL; var tblElem;
    tblElem = document.getElementById("table");
    nodataElem = document.getElementById("nodata");
    
    if(!tblElem) return;
    tblElem.innerHTML = "";
    if(nodataElem){
	nodataElem.className = "nodisp";
	if(!hasAnyElements(channels)){  //utils.js
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
    blockChannelCore({ "chName": this.id }, rebuildTable);  //db.js
}

function validateKeyword(){
    var key, keyword, inputElem;
    inputElem = document.querySelector("div input#keywordInput");
    if(!inputElem) return;
    keyword = inputElem.value || inputElem.innerText || "";

    if(keyword.length > 0 && hasInvalidChars(keyword)){  //utils.js
	inputElem.style.backgroundColor = "#e6bdbd";
	return false;
    }
    else{
	inputElem.style.backgroundColor = "white";
	if(keyword.length > 0) return true;
	else return false;
    }
}

function keywordKeyoressEvent(event){
    if(!validateKeyword()) return;
    if(13 == event.keyCode) blockKeywordEvent();
}

function unblockKeywordEvent(){
    var keyword, keywordId;
    keywordId = this.id + "";
    chrome.storage.sync.get("keywordIndex", function(items){
	items = items || {}; items.keywordIndex = items.keywordIndex || {};
	keyword = items.keywordIndex[keywordId];
	blockKeywordCore(keyword, false, rebuildKeywordTable);  //db.js
    });
}

function blockKeywordEvent(){
    var keyword; var inputElem;
    inputElem = document.querySelector("div input#keywordInput");
    if(!inputElem) return;
    keyword = inputElem.value || inputElem.innerText || "";
    if(keyword.length == 0) return;
    blockKeywordCore(keyword, true, rebuildKeywordTable);  //db.js
}

document.addEventListener("DOMContentLoaded", function(){
    refreshPopup();
});
