Pg_Type = {
    NONE: 0,
    CHANNEL: 1,
    VIDEO: 2
}
function main() {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    /*************************/
    /*  Start of ytl object  */
    ytl = {
	cerr: function (err) { console.log("[CS ERR] " + err); },
	clog: function (msg) { if (ytl.isDebug) console.log("[CS] " + msg); },
	printPageData: function (ret) { ytl.clog(ret.chName + ": " + ret.chId + ": " + ret.chURL); },
	resetData: function () { ytl.isDebug = false; },
	isBlocked: function (chName, channels) {
	    if (channels && chName && channels[chName]) return true;
	    return false;
	},

	sendMessage: function(event, data, callback){
	    chrome.runtime.sendMessage({"event": event, "data": data}, function(response){
		if(callback) callback(response);
	    });
	},

	//calls core function in db.js
	buttonClick: function (chnInfo) { blockChannelCore(chnInfo, ytl.addPageButton); },

	ytbPageType: function () {
	    var index, url;
	    url = document.location.toString();
	    index = url.indexOf("youtube.com");
	    if (index < 0 || index > 20) return Pg_Type.NONE;
	    index += 11;
	    if (url.substr(index).startsWith("/channel/")) return Pg_Type.CHANNEL;
	    if (url.substr(index).startsWith("/user/")) return Pg_Type.CHANNEL;
	    if (url.substr(index).startsWith("/watch")) return Pg_Type.VIDEO;
	    return Pg_Type.NONE;
	},

	/*
	  CALLED BY: addPageButton
	*/
	getPageInfo: function () {
	    var chId, chIdElem, chURL, chURLElem, chName, chNameElem, ret, pgType, elem;
	    pgType = ytl.ytbPageType();
	    if (pgType === Pg_Type.NONE) return null;
	    else if (pgType === Pg_Type.CHANNEL) {
		//channel id
		chIdElem = document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions button");
		if (chIdElem) chId = chIdElem.getAttribute("data-channel-external-id");
		if (chId) chId = "/channel/" + chId;
		if (!chId) {
		    chIdElem = document.body.querySelector("#c4-header-bg-container a.spf-link");
		    if (chIdElem) chId = chIdElem.getAttribute("href");
		}
		if (!chId) {
		    chIdElem = document.body.querySelector("#c4-primary-header-contents div.primary-header-upper-section-block span.qualified-channel-title-text a.spf-link");
		    if (chIdElem) chId = chIdElem.getAttribute("href");
		}
		//channel name
		chNameElem = document.body.querySelector("div.primary-header-upper-section-block h1.branded-page-header-title span.qualified-channel-title-text a.spf-link.branded-page-header-title-link");
		if (chNameElem) chName = chNameElem.innerText;
		//channel URL
		chURLElem = document.body.querySelector("div#appbar-nav a");
		if (chURLElem) chURL = chURLElem.getAttribute("href");
	    }
	    else if (pgType === Pg_Type.VIDEO) {
		//channel id
		chIdElem = document.body.querySelector("#watch7-user-header .yt-user-info a");
		if (chIdElem) chId = chIdElem.getAttribute("href");
		//channel name
		chNameElem = chIdElem;
		if (chNameElem) chName = chNameElem.innerText;
		//channel URL
		chURLElem = document.body.querySelector("#watch7-user-header a");
		if (chURLElem) chURL = chURLElem.getAttribute("href");
	    }
	    chId = chId || ""; chName = chName || ""; chURL = chURL || "";
	    if ((chId.length > 0 || chURL.length > 0) && chName.length > 0) {
		ret = {};
		ret.pgType = pgType;
		ret.chId = chId;
		ret.chName = chName;
		ret.chURL = chURL;
		ytl.printPageData(ret);
		return ret;
	    }
	    else {
		ytl.cerr("some channel info not found: " + chId + "," + chName + "," + chURL);
	    }
	    return null;
	},

	addPageButton: function () {
	    var chnInfo, siblingSpan, wrapperSpan, button, buttonSpn, items, isChnBlocked;
	    chnInfo = ytl.getPageInfo();
	    if (!chnInfo) return;
	    chrome.storage.sync.get("channels", function (items) {
		items = items || {};
		isChnBlocked = ytl.isBlocked(chnInfo.chName, items.channels);
		if(document.getElementById("block-channel")){
		    if(isChnBlocked === (document.getElementById("block-channel").innerText === "Unblock")) return;
		}
		while (document.getElementById("block-channel")) document.getElementById("block-channel").parentNode.remove();
		//find sibling element
		if (chnInfo.pgType === Pg_Type.CHANNEL) siblingSpan = document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span span.subscription-preferences-overlay-container") || document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span span.yt-subscription-button-disabled-mask") || document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span");
		else if (chnInfo.pgType === Pg_Type.VIDEO) siblingSpan = document.body.querySelector("#watch7-subscription-container .yt-subscription-button-subscriber-count-branded-horizontal.yt-subscriber-count") || document.body.querySelector("#watch7-subscription-container span.subscription-preferences-overlay-container");
		if (!siblingSpan) { ytl.cerr("sibling span not found"); return };
		//create new button element
		wrapperSpan = document.createElement("span");
		wrapperSpan.setAttribute("class", "channel-header-subscription-button-container");
		button = document.createElement("button");
		button.setAttribute("id", "block-channel");
		button.setAttribute("class", "yt-uix-button yt-uix-button-size-default no-icon-markup yt-can-buffer yt-uix-button-subscribed-branded");
		button.style.padding = "0px 8px 0px 8px";
		button.addEventListener("click", function () { ytl.buttonClick(chnInfo); });
		buttonSpn = document.createElement("span");
		if (isChnBlocked) buttonSpn.innerText = "Unblock";
		else buttonSpn.innerText = "Block";
		//add new button element using its sibling
		button.appendChild(buttonSpn);      //add child-span in button
		wrapperSpan.appendChild(button);    //add button to wrapper-span
		siblingSpan.parentNode.insertBefore(wrapperSpan, siblingSpan);
	    });
	},

	addPopupButton: function () {
	    /*
	      https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
	    */

	    // var chnInfo, siblingSpan, wrapperSpan, button, buttonSpn, items, channels, frame, hrefs;
	    //is popup open
	    // if ($("iframe")) frame = $("iframe").contents().filter("iframe");
	    // if(frame) frame = frame.contents();
	    // if(!frame) return;
	    // var hrefs = frame.filter("a");
	},

	initBodyObserver: function () {
	    if (ytl.bodyObserver) ytl.bodyObserver.disconnect();
	    ytl.bodyObserver = new MutationObserver(function (mutations) {
		if (ytl.ytbPageType() > 0) {
		    ytl.addPageButton();
		    // ytl.addPopupButton();
		}

		// setup some other observers, only the first time
		if (document.getElementById("feed") && !ytl.feedObserver) {
		    ytl.clog("creating feed observer");
		    ytl.feedObserver = new MutationObserver(function (mutations) { ytl.hideVideos(); });
		    ytl.feedObserver.observe(document.getElementById("feed"), { subtree: true, childList: true });
		    ytl.hideVideos();
		}
		if (document.getElementById("content") && !ytl.contentObserver) {
		    ytl.clog("creating content observer");
		    ytl.contentObserver = new MutationObserver(function (mutations) { ytl.hideVideos(); });
		    ytl.contentObserver.observe(document.getElementById("content"), { subtree: true, childList: true });
		    ytl.hideVideos();
		}
		if (document.getElementById("watch7-sidebar-modules") && !ytl.sidebarObserver) {
		    ytl.clog("creating sidebar observer");
		    ytl.sidebarObserver = new MutationObserver(function (mutations) { ytl.hideVideos(); });
		    ytl.sidebarObserver.observe(document.getElementById("watch7-sidebar-modules"), { subtree: true, childList: true });
		    ytl.hideVideos();
		}
	    });
	    ytl.bodyObserver.observe(document.body, { attributes: true, subtree: true });
	},

	hideVideos: function () {
	    chrome.storage.sync.get(["keywords", "keywordIndex", "channels"], function (items) {
		items = items || {};
		var liElems, cnt;
		cnt = 0;
		if (!items.channels && !items.keywords) { ytl.cerr("nothing to hide"); return; }

		//don't hide videos on a channel page
		if (ytl.ytbPageType() != Pg_Type.CHANNEL) {
		    //hide individual videos - Home
		    liElems = document.querySelectorAll(".yt-shelf-grid-item");
		    if (liElems) {
			cnt += ytl.hideElements(liElems, items,
					 "div div.yt-lockup-dismissable div.yt-lockup-content div a",
					 "div div.yt-lockup-dismissable div.yt-lockup-content h3 a");
		    } else { ytl.cerr("Couldn't find yt-shelf-grid-item items."); }

		    //hide individual videos - Trending
		    liElems = document.querySelectorAll("#content ul li.expanded-shelf-content-item-wrapper");
		    if (liElems) {
			cnt += ytl.hideElements(liElems, items,
					 "div.yt-lockup-content div.yt-lockup-byline a",
					 "div.yt-lockup-content h3.yt-lockup-title a");
		    } else { ytl.cerr("Couldn't find expanded-shelf-content-item-wrapper."); }

		    //hide complete sections
		    liElems = document.querySelectorAll("#feed .section-list .item-section");
		    if (liElems) {
			cnt += ytl.hideElements(liElems, items,
					 "li div.shelf-title-row span.branded-page-module-title-text");
		    } else { ytl.cerr("Couldn't find section-list sections."); }

		    //hide sidebar videos
		    liElems = document.querySelectorAll("#watch7-sidebar-modules .video-list-item");
		    if (liElems) {
			cnt += ytl.hideElements(liElems, items,
					 "div.content-wrapper a span.stat.attribution",
					 "div.content-wrapper a span.title");
		    } else { ytl.cerr("Couldn't find sidebar videos."); }
		}

		//handle channel page
		else{
		    //hide channels on the right sidebar on a channel page
		    liElems = document.querySelectorAll(".branded-page-related-channels-list .branded-page-related-channels-item");
		    if (liElems) {
			cnt += ytl.hideElements(liElems, items,
					 "span div h3.yt-lockup-title a");
		    } else { ytl.cerr("Couldn't find related channels."); }

		    //hide channels on the channels tab on a channel page
		    liElems = document.querySelectorAll("#channels-browse-content-grid .channels-content-item");
		    if (liElems) {
			cnt += ytl.hideElements(liElems, items,
						"div div h3.yt-lockup-title a");
		    } else { ytl.cerr("Couldn't find related channels."); }
		}

		//update extension icon
		if(cnt > 0){
		    ytl.clog("Hidden " + cnt + " elements.");
		    ytl.sendMessage("setBadge", cnt);
		}
	    });
	},

	hideElements: function (elems, items, chnSelector, keywordSelector) {
	    var name, i, elem, cnt, channels, keywords, keyword;
	    channels = items.channels;
	    keywords = items.keywords;
	    cnt = 0;

	    for (i = 0; i < elems.length; i++) {
		elem = elems[i];
		if (elem.style.display === "none"){
		    cnt++;
		    continue;
		}

		//channel match
		if(channels){
		    name = elem.querySelector(chnSelector);
		    if (name) name = name.innerText.trim();
		    name = name || "";
		    if (name.length > 0 && channels[name]){
			ytl.clog("Hiding channel " + name);
			elem.style.display = "none"; cnt++;
			continue;
		    }
		}

		//keyword match
		if(keywords && keywordSelector){
		    name = elem.querySelector(keywordSelector);
		    if (name) name = name.innerText;
		    name = name || "";
		    if(name.length <= 0) continue;
		    name = name.toLowerCase();
		    for(keyword in keywords){
			if(name.indexOf(keywords[keyword][1]) >= 0){
			    ytl.clog("Hiding keywork " + name);
			    elem.style.display = "none"; cnt++;
			    break;
			}
		    }
		}
	    }
	    return cnt;
	},

	initialize: function () {
	    ytl.resetData();
	    ytl.initBodyObserver();
	}
    }
    /*  End of ytl object  */
    /***********************/

    ytl.initialize();
};

main();
