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
		clog: function (msg) { if (ytl.isDebug) console.log("[CS] " + msg); },
		printPageData: function (ret) { ytl.clog(ret.chName + ": " + ret.chId + ": " + ret.chURL); },
		resetData: function () { ytl.isDebug = false; },
		isBlocked: function (chName, channels) {
			if (channels && chName && channels[chName]) return true;
			return false;
		},
		buttonClick: function (chnInfo) { ytl.blockChannel(chnInfo); },

		blockChannel: function (chnInfo) {
			if (!chnInfo) return;
			chrome.storage.sync.get("channels", function (items) {
				items = items || {}; items.channels = items.channels || {};
				//mark as blocked/unblocked
				if (items.channels[chnInfo.chName]) delete items.channels[chnInfo.chName];
				else items.channels[chnInfo.chName] = [chnInfo.chId, chnInfo.chURL];
				//update storage
				chrome.storage.sync.set(items, function () {
					if (chrome.runtime.lastError) ytl.clog("save error: " + JSON.stringify(chrome.runtime.lastError));
					else { ytl.addPageButton(); }
				});
			});
		},

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
				ytl.clog("some channel info not found: " + chId + "," + chName + "," + chURL);
			}
			return null;
		},

		addPageButton: function () {
			var chnInfo, siblingSpan, wrapperSpan, button, buttonSpn, items, channels;
			chnInfo = ytl.getPageInfo();
			if (!chnInfo) return;
			chrome.storage.sync.get("channels", function (items) {
				channels = items.channels;
				while (document.getElementById("block-channel")) document.getElementById("block-channel").parentNode.remove();
				//find sibling element
				if (chnInfo.pgType === Pg_Type.CHANNEL) siblingSpan = document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span span.subscription-preferences-overlay-container") || document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span span.yt-subscription-button-disabled-mask") || document.body.querySelector("div.primary-header-upper-section-block div.primary-header-actions span");
				else if (chnInfo.pgType === Pg_Type.VIDEO) siblingSpan = document.body.querySelector("#watch7-subscription-container .yt-subscription-button-subscriber-count-branded-horizontal.yt-subscriber-count") || document.body.querySelector("#watch7-subscription-container span.subscription-preferences-overlay-container");
				if (!siblingSpan) { ytl.clog("sibling span not found"); return };
				//create new button element
				wrapperSpan = document.createElement("span");
				wrapperSpan.setAttribute("class", "channel-header-subscription-button-container");
				button = document.createElement("button");
				button.setAttribute("id", "block-channel");
				button.setAttribute("class", "yt-uix-button yt-uix-button-size-default no-icon-markup yt-can-buffer yt-uix-button-subscribed-branded");
				button.style.padding = "0px 8px 0px 8px";
				button.addEventListener("click", function () { ytl.buttonClick(chnInfo); });
				buttonSpn = document.createElement("span");
				if (ytl.isBlocked(chnInfo.chName, channels)) buttonSpn.innerText = "Unblock";
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
					if (!document.getElementById("block-channel")) ytl.addPageButton();
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
			chrome.storage.sync.get("channels", function (items) {
				var i, li, liElems, name, cnt;
				if (!items.channels) { ytl.clog("nothing to hide"); return; }

				//don't hide videos on a channel page
				if (ytl.ytbPageType() != Pg_Type.CHANNEL) {
					//hide individual videos - I
					liElems = document.querySelectorAll(".yt-shelf-grid-item"); cnt = 0;
					if (liElems) {
						ytl.hideElements(liElems, "div div.yt-lockup-dismissable div.yt-lockup-content div a", items.channels);
					} else { ytl.clog("Couldn't find yt-shelf-grid-item items."); }

					//hide individual videos - II
					liElems = document.querySelectorAll("#content .expanded-shelf-content-item-wrapper"); cnt = 0;
					if (liElems) {
						ytl.hideElements(liElems, "li div div div div div div div.yt-lockup-content div.yt-lockup-byline a", items.channels);
					} else { ytl.clog("Couldn't find expanded-shelf-content-item-wrapper."); }

					//hide complete sections
					liElems = document.querySelectorAll("#feed .section-list .item-section"); cnt = 0;
					if (liElems) {
						ytl.hideElements(liElems, "li div div div div h2 a", items.channels);
					} else { ytl.clog("Couldn't find section-list sections."); }

					//hide sidebar videos
					liElems = document.querySelectorAll("#watch7-sidebar-modules .video-list-item");
					if (liElems) {
						ytl.hideElements(liElems, "div div a span.stat.attribution", items.channels);
					} else { ytl.clog("Couldn't find sidebar videos."); }
				}

				//handle channel page
				else{
					//hide channels on the right sidebar on a channel page
					liElems = document.querySelectorAll(".branded-page-related-channels-list .branded-page-related-channels-item");
					if (liElems) {
						ytl.hideElements(liElems, "span div h3.yt-lockup-title a", items.channels);
					} else { ytl.clog("Couldn't find related channels."); }

					//hide channels on the channels tab on a channel page
					liElems = document.querySelectorAll("#channels-browse-content-grid .channels-content-item");
					if (liElems) {
						ytl.hideElements(liElems, "div div h3.yt-lockup-title a", items.channels);
					} else { ytl.clog("Couldn't find related channels."); }
				}
			});
		},

		hideElements: function (elems, qSelector, channels) {
			var name, i, elem, cnt;
			cnt = 0;
			for (i = 0; i < elems.length; i++) {
				elem = elems[i];
				if (elem.style.display === "none") continue;
				name = elem.querySelector(qSelector);
				if (name) name = name.innerText.trim();
				if (!name || !channels[name]) continue;
				elem.style.display = "none"; cnt++;
			}
			ytl.clog("Hidden " + cnt + " elements.");
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
