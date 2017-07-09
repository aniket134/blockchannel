function isEmptyStr(str){
    str = str || "";
    if(str.length > 0) return false;
    return true;
}

function hasAnyElements(elements){
    var elem;
    if(!elements) return false;
    for(elem in elements) { return true; }
    return false;
}

function hasInvalidChars(str){
    if(!str) return true;
    if(str.length <= 0) return true;
    if(str.match(/^[\w- |+=@#;:,.?]+$/)) return false;
    return true;
}
