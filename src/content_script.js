Pg_Type = {
	NONE: 0,
	CHANNEL: 1,
	VIDEO: 2
}
function main(){
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    /*************************/
    /*  Start of ytl object  */
    ytl = {
	clog: function(msg){ if(ytl.isDebug) console.log("[CS] " + msg); },
	
	isBlocked: function(chName, channels){
	    if(channels && chName && channels[chName]) return true;
	    return false;
	},
	
	blockChannel: function(chnInfo){
	    if(!chnInfo) return;
	    chrome.storage.sync.get("channels", function(items){
		items = items || {}; items.channels = items.channels || {};
		//mark as blocked/unblocked
		if(items.channels[chnInfo.chName]) delete items.channels[chnInfo.chName];
		else items.channels[chnInfo.chName] = [ chnInfo.channelId, chnInfo.chURL ];
		//update storage
		chrome.storage.sync.set(items, function(){
		    if(chrome.runtime.lastError) ytl.clog("save error: " + JSON.stringify(chrome.runtime.lastError));
		    else{ ytl.addButton(chnInfo, items.channels); }
		});
	    });
	},

	ytbPageType: function(){
	    var index, url;
	    url = document.location.toString();
	    index = url.indexOf("youtube.com");
	    if(index<0 || index>20) return Pg_Type.NONE;
	    index += 11;
	    if(url.substr(index).startsWith("/channel/")) return Pg_Type.CHANNEL;
	    if(url.substr(index).startsWith("/user/")) return Pg_Type.CHANNEL;
	    if(url.substr(index).startsWith("/watch")) return Pg_Type.VIDEO;
	    return Pg_Type.NONE;
	},
	
	getChnInfo: function(){
	    var channelId, chURL, chName, ret, pgType, elem;
		pgType = ytl.ytbPageType();
	    if(pgType === Pg_Type.NONE) return null;
		else if(pgType === Pg_Type.CHANNEL){
			channelId = document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions button");
			chURL = document.body.querySelector("div#appbar-nav a");
			chName = document.body.querySelector("div.primary-header-upper-section-block h1.branded-page-header-title span.qualified-channel-title-text a.spf-link.branded-page-header-title-link"); 
			if(!channelId || !chURL || !chName){
				ytl.clog("couldn't find page data: ");
				if(!channelId) ytl.clog("channelId, "); if(!chURL) ytl.clog("chURL, "); if(!chName) ytl.clog("chName");
				return null;
			}
			channelId = channelId.getAttribute("data-channel-external-id") || "";
			chURL = chURL.getAttribute("href") || "";
			chURL = chURL.substr(chURL.lastIndexOf("/", chURL.lastIndexOf("/")-1)) || "";
			chName = chName.innerText || "";
		}
		else if(pgType === Pg_Type.VIDEO){
			elem = document.body.querySelector("#watch7-user-header .yt-user-info a");
			if(elem){ channelId = elem.getAttribute("href"); chName = elem.innerText; }
			elem = document.body.querySelector("#watch7-user-header a");
			if(elem) chURL = elem.getAttribute("href");
			if(!channelId || !chURL || !chName){
				ytl.clog("couldn't find page data: ");
				if(!channelId) ytl.clog("channelId, "); if(!chURL) ytl.clog("chURL, "); if(!chName) ytl.clog("chName");
				return null;
			}
		}
		if(channelId.length > 0 && chURL.length > 0 && chName.length > 0){
			ret = {};
			ret.pgType = pgType;
			ret.channelId = channelId;
			ret.chName = chName;
			ret.chURL = chURL;
			//ytl.printPageData(ret);
			return ret;
		}
		return null;
	},
	
	addButton: function(chnInfo, channels){
	    var siblingSpan, wrapperSpan, button, buttonSpn;
	    if(!chnInfo) return;
	    while(document.getElementById("block-channel")) document.getElementById("block-channel").parentNode.remove();
		//find sibling element
		if(chnInfo.pgType === Pg_Type.CHANNEL) siblingSpan = document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span span.subscription-preferences-overlay-container") || document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span span.yt-subscription-button-disabled-mask");
		else if(chnInfo.pgType === Pg_Type.VIDEO) siblingSpan = document.body.querySelector("#watch7-subscription-container .yt-subscription-button-subscriber-count-branded-horizontal.yt-subscriber-count");
		if(!siblingSpan) return;
		//create new button element
		wrapperSpan = document.createElement("span");
		wrapperSpan.setAttribute("class", "channel-header-subscription-button-container");
		button = document.createElement("button");
		button.setAttribute("id", "block-channel");
		button.setAttribute("class", "yt-uix-button yt-uix-button-size-default no-icon-markup yt-can-buffer yt-uix-button-subscribed-branded");
		button.style.padding = "0px 8px 0px 8px";
		button.addEventListener("click", function() { ytl.buttonClick(chnInfo); });
		buttonSpn = document.createElement("span");
		if(ytl.isBlocked(chnInfo.chName, channels)) buttonSpn.innerText = "Unblock";
		else buttonSpn.innerText = "Block";
		//add new button element using its sibling
		button.appendChild(buttonSpn);      //add child-span in button
		wrapperSpan.appendChild(button);    //add button to wrapper-span
		siblingSpan.parentNode.insertBefore(wrapperSpan, siblingSpan);
	},
	
	buttonClick: function(chnInfo){ ytl.blockChannel(chnInfo); },
	printPageData: function(ret){ ytl.clog("data: " + ret.chName + ":" + ret.channelId + ":" + ret.chURL); },
	resetData: function(){ ytl.isDebug = true; },

	loadDataAndAddBtn: function(){
		ytl.clog("loading data");
	    ret = ytl.getChnInfo();
	    if(!ret) return;
	    chrome.storage.sync.get("channels", function(items){
		ytl.addButton(ret, items.channels);
	    });
	},
	
	initBodyObserver: function(){
	    if(ytl.bodyObserver) ytl.bodyObserver.disconnect();
	    ytl.bodyObserver = new MutationObserver(function(mutations) {
		ytl.clog("in button observer");
		if(ytl.ytbPageType() > 0){
		    if(!document.getElementById("block-channel")) ytl.loadDataAndAddBtn();
		    return;
		}

		// setup some other observers, only the first time
		if(document.getElementById("feed") && !ytl.feedObserver){
		    ytl.clog("creating feed observer");
		    ytl.feedObserver = new MutationObserver(function(mutations){ ytl.hideVideos(); });
		    ytl.feedObserver.observe(document.getElementById("feed"), {subtree: true, childList: true });
		    ytl.hideVideos();
		}
		if(document.getElementById("content") && !ytl.contentObserver){
		    ytl.clog("creating content observer");
		    ytl.contentObserver = new MutationObserver(function(mutations){ ytl.hideVideos(); });
		    ytl.contentObserver.observe(document.getElementById("content"), {subtree: true, childList: true });
		    ytl.hideVideos();
		}
		if(document.getElementById("watch7-sidebar-modules") && !ytl.sidebarObserver){
		    ytl.clog("creating sidebar observer");
		    ytl.sidebarObserver = new MutationObserver(function(mutations){ ytl.hideVideos(); });
		    ytl.sidebarObserver.observe(document.getElementById("watch7-sidebar-modules"), {subtree: true, childList: true });
		    ytl.hideVideos();
		}
	    });
	    ytl.bodyObserver.observe(document.body, {attributes: true, subtree: true});
	},
	
	hideVideos: function(){
	    if(ytl.ytbPageType() > 0) return;
	    chrome.storage.sync.get("channels", function(items){
		var i, li, liElems, name, cnt;
		if(!items.channels){ ytl.clog("nothing to hide"); return; }

		//hide individual videos - I
		liElems = document.querySelectorAll(".yt-shelf-grid-item"); cnt = 0;
		if(liElems){
		    ytl.hideElements(liElems, "div div.yt-lockup-dismissable div.yt-lockup-content div a", items.channels);
		} else { ytl.clog("Couldn't find yt-shelf-grid-item items."); }

		//hide individual videos - II
		liElems = document.querySelectorAll("#content .expanded-shelf-content-item-wrapper"); cnt = 0;
		if(liElems){
		    ytl.hideElements(liElems, "li div div div div div div div.yt-lockup-content div.yt-lockup-byline a", items.channels);
		} else { ytl.clog("Couldn't find expanded-shelf-content-item-wrapper."); }

		//hide complete sections
		liElems = document.querySelectorAll("#feed .section-list .item-section"); cnt = 0;
		if(liElems){
		    ytl.hideElements(liElems, "li div div div div h2 a", items.channels);
		} else { ytl.clog("Couldn't find section-list sections."); }

		//hide sidebar videos
		liElems = document.querySelectorAll("#watch7-sidebar-modules .video-list-item");
		if(liElems){
		    ytl.hideElements(liElems, "div div a span.stat.attribution", items.channels);
		} else { ytl.clog("Couldn't find sidebar videos."); }
	    });
	},

	hideElements: function(elems, qSelector, channels){
	    var name, i, elem, cnt;
	    cnt = 0;
	    for(i=0; i<elems.length; i++){
		elem = elems[i];
		if(elem.style.display === "none") continue;
		name = elem.querySelector(qSelector);
		if(name) name = name.innerText.trim();
		if(!name || !channels[name]) continue;
		elem.style.display = "none"; cnt++;
	    }
	    ytl.clog("Hidden " + cnt + " elements.");
	},
	
	initialize: function(){
	    ytl.resetData();
	    ytl.loadDataAndAddBtn();
	    ytl.initBodyObserver();
	}
    }
    /*  End of ytl object  */
    /***********************/

    ytl.initialize();
};

main();
