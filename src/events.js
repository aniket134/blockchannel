// Desc: Recieves message from content_script.
//       https://developer.chrome.com/extensions/runtime#event-onMessage
// Params:
//  request: request object, must contain the following:
//             "event": string identifying an event
//             "data": any data associated with that event
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    var badgeText;
    console.log("[EV] msg recieved: " + JSON.stringify(request));

    switch(request.event){
    case "setBadge":
	badgeText = request.data;
	setBadge(badgeText);
	break;
    default:
	console.log("[EV] nonsense msg");
	break;
    }
});

function setBadge(text){
    if(!text) return;
    chrome.browserAction.setBadgeBackgroundColor({ "color": "#3e3a3a" });
    chrome.browserAction.setBadgeText({ "text": text.toString() });
}

/******************************************************/
/******************    PRIVATE    *********************/
/******************************************************/
function isYoutube(url){
    console.log("[EV] url: " + url);
    if(url.startsWith("https://www.youtube.com")) return true;
    if(url.startsWith("http://www.youtube.com")) return true;
    if(url.startsWith("https://youtube.com")) return true;
    if(url.startsWith("http://youtube.com")) return true;
    if(url.startsWith("www.youtube.com")) return true;
    if(url.startsWith("youtube.com")) return true;
    return false;
}

// use this to execute content script file
function executeContentScript(tabId, event){
    console.log("[EV] executing content script: " + event);
    chrome.tabs.executeScript(tabId, {file: "content_script.js"});
}

// use this to send msgs to content script
function sendToContentScript(msg){
    console.log("[EV] sending msg: " + JSON.stringify(msg));
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	chrome.tabs.sendMessage(tabs[0].id, msg);
    });
}

function __sendChannels(){
    chrome.storage.sync.get("channels", function(items){
	console.log("[EV] items: " + JSON.stringify(items));
	items = items || {}; items.channels = items.channels || {};
	sendToContentScript(items);
    });
}

// chPath: string: channel path
// chName: string: channel name
function __blockChannel(chPath, chName){
    chrome.storage.sync.get("channels", function(items){
	console.log("[EV] __blockChannel, old: " + JSON.stringify(items));
	items = items || {}; items.channels = items.channels || {};

	//mark as blocked/unblocked
	if(items.channels[chName]) delete items.channels[chName];
	else items.channels[chName] = chPath;

	//update storage
	chrome.storage.sync.set(items, function(){
	    if(chrome.runtime.lastError) console.log("[EV] error: " + JSON.stringify(chrome.runtime.lastError));
	    else console.log("[EV] saved");
	    __sendChannels();
	});
    });
}

/************ TESTING related code **********/
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(!request.test) return;

    //recieve test message
    console.log("[EV] test msg recieved: " + request.text);

    // send a test RESPONSE
    sendResponse("test response from events.js");

    // send a test MESSAGE
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	var msg = { "test": true, "text": "test message from events.js" };
	chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
	    console.log("[EV] response to test msg recieved: " + response);
	});
    });
});

// can be used if needed
/*
chrome.webNavigation.onDOMContentLoaded.addListener(function(details) {
    console.log("[EV] details: " + details.tabId);
    if(!isYoutube(details.url)) return;
    executeContentScript(details.tabId, "onDOMContentLoaded");
});

chrome.webNavigation.onCompleted.addListener(function(details) {
    console.log("[EV] details: " + details.tabId);
    if(!isYoutube(details.url)) return;
    executeContentScript(details.tabId, "onCompleted");
});
*/
