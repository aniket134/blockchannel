function rebuildTable(){
    chrome.storage.sync.get("channels", function(items){
	items = items || {};
	populateTable(items.channels);
    });
}

function populateTable(channels){
    var chName; var tr; var nodataElem; var chURL;
    var tblElem = document.getElementById("table");
    if(!hasAnyChannels(channels)){
	nodataElem = document.getElementById("nodata");
	nodataElem.innerHTML = "No channels have been blocked yet.";
	tblElem.innerHTML = "";
	return;
    }
    if(!tblElem) return;
    tblElem.innerHTML = "<th colspan=2>Blocked Channels</th><th></th>";
    
    for(chName in channels){
	chURL = channels[chName];
	if(chURL) chURL = chURL[0] || chURL[1];
	tr = "<tr>";
	tr += "<td><a href=\"https://www.youtube.com" + chURL + "\" target=\"_blank\">" + chName + "</a></td>";
	tr += "<td>";
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
    console.log("blocking: " + this.id);
    blockChannel(this.id);
}

function blockChannel(chName, channelId, chURL){
    chrome.storage.sync.get("channels", function(items){
	console.log("blockChannel, old: " + JSON.stringify(items));
	items = items || {}; items.channels = items.channels || {};

	//mark as blocked/unblocked
	if(items.channels[chName]) delete items.channels[chName];
	else items.channels[chName] = [ channelId, chURL ];
	
	//update storage
	chrome.storage.sync.set(items, function(){
	    if(chrome.runtime.lastError) console.log("save error: " + JSON.stringify(chrome.runtime.lastError));
	    else{
		rebuildTable(items.channels);
		var event = new Event("refreshPopup");
		document.dispatchEvent(event);
	    }
	});
    });
}

function hasAnyChannels(channels){
    var count; var chName;
    count = 0;
    if(!channels) return false;
    for(chName in channels) { count++; }
    if(count>0) return true;
    return false;
}

document.addEventListener("DOMContentLoaded", function(){
    rebuildTable();
});
