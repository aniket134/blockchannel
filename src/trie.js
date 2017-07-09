//public functions
function trie_addWord(word, trie){
    if(isEmptyStr(word)) return;  //utils.js
    if(!trie["nc"]) trie["nc"] = 0;
    for(var i = 0; i < word.length; i++){
	addWordPrivate(word.substr(i), trie);
    }
}

function trie_removeWord(word, trie){
    removeWordPrivate(word, trie);
    if(!trie["nc"]) delete trie["nc"];
}

//private functions
function addWordPrivate(word, trie){
    var c, curNode;
    if(isEmptyStr(word)) return;  //utils.js
    curNode = trie;
    for(var i = 0; i < word.length; i++){
	c = word[i];
	if(!curNode[c]){
	    curNode[c] = { "nc" : 0 };
	    curNode["nc"] = curNode["nc"] + 1;
	}
	curNode = curNode[c];
    }
    return;
}

function removeWordPrivate(word, trie){
    var c, cnt;
    cnt = 0;
    if(isEmptyStr(word)) return cnt;  //utils.js
    for(var i = 0; i < word.length; i++){
	c = word[i];
	if(!trie[c]) continue;

	removeWordPrivate(word.substr(i), trie[c]);
	if(trie[c]["nc"] <= 0){
	    delete trie[c];
	    cnt++;
	}
    }
    trie["nc"] = trie["nc"] - cnt;
    return cnt;
}
