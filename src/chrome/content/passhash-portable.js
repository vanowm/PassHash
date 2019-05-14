var browser = new Object();
browser.version = parseInt(navigator.appVersion);
browser.isNetscape = false;
browser.isMicrosoft = false;
if (navigator.appName.indexOf("Netscape") != -1) 
    browser.isNetscape = true;
else if (navigator.appName.indexOf("Microsoft") != -1)
    browser.isMicrosoft = true;

var siteTagLast = '';
var masterKeyLast = '';
var isSha3 = false;

function onLoad()
{
    if (browser.isMicrosoft)
    {
        document.getElementById('reveal').disabled = true;
        document.getElementById('reveal-text').disabled = true;
    }
    document.getElementById('site-tag').focus();
    setTimeout('checkChange()',1000);
}

function validate(form) 
{
    var siteTag   = document.getElementById('site-tag');
    var masterKey = document.getElementById('master-key');
    if (!siteTag.value)
    {
        siteTag.focus();
        return false;
    }
    if (!masterKey.value)
    {
        masterKey.focus();
        return false;
    }
    return true;
}

function onClear()
{
  document.getElementById('site-tag').value = "";
  document.getElementById('master-key').value = "";
  update();
}
function update(nofocus) 
{
    var siteTag   = document.getElementById('site-tag');
    var masterKey = document.getElementById('master-key');
    var hashWord  = document.getElementById('hash-word');
    //var hashapass = b64_hmac_sha1(masterKey.value, siteTag.value).substr(0,8);
    var hashWordSize       = document.getElementById("hashWordSize").value;
    var requireDigit       = document.getElementById("digit").checked;
    var requirePunctuation = document.getElementById("punctuation").checked;
    var requireMixedCase   = document.getElementById("mixedCase").checked;
    var restrictSpecial    = document.getElementById("noSpecial").checked;
    var restrictDigits     = document.getElementById("digitsOnly").checked;
    if (!siteTag.value || !masterKey.value)
    	return;

    hashWord.value = PassHashCommon.generateHashWord(
            siteTag.value,
            masterKey.value,
            hashWordSize,
            requireDigit,
            requirePunctuation,
            requireMixedCase,
            restrictSpecial,
            restrictDigits,
            isSha3);
    if (!nofocus)
      hashWord.focus();

    siteTagLast = siteTag.value;
    masterKeyLast = masterKey.value;
}

function onEnterField(fld, msg)
{
    // Select the field
    try
    {
        fld.select();
    }
    catch (ex) {}
    // Set the prompt
    document.getElementById('prompt').innerHTML = msg;
}

function checkChange()
{
    var siteTag   = document.getElementById('site-tag');
    var masterKey = document.getElementById('master-key');
    var hashWord  = document.getElementById('hash-word');
    if (siteTag.value != siteTagLast || masterKey.value != masterKeyLast)
    {
        hashWord.value = '';
        siteTagLast = siteTag.value;
        masterKeyLast = masterKey.value;
        onUpdate();
    }
    setTimeout('checkChange()', 1000);
}

function onLeaveResultField(hashWord)
{
    document.getElementById('prompt').innerHTML = '';
}

function onLeaveField(fld)
{
    // Remove the selection (is this the best way?)
    var v = fld.value;
    fld.value = '';
    fld.value = v;
    // Remove the prompt
    document.getElementById('prompt').innerHTML = '';
}

function onReveal(fld)
{
    var masterKey = document.getElementById('master-key');
    try
    {
        if (fld.checked)
            masterKey.setAttribute("type", "");
        else
            masterKey.setAttribute("type", "password");
    } catch (ex) {}
    document.getElementById('master-key').focus();
}

function onNoSpecial(fld)
{
    document.getElementById('punctuation').disabled = fld.checked;
    update();
}

function onDigitsOnly(fld)
{
    document.getElementById('punctuation').disabled = fld.checked;
    document.getElementById("digit"      ).disabled = fld.checked;
    document.getElementById("punctuation").disabled = fld.checked;
    document.getElementById("mixedCase"  ).disabled = fld.checked;
    document.getElementById("noSpecial"  ).disabled = fld.checked;
    update();
}

function onBump()
{
    var siteTag = document.getElementById("site-tag");
    siteTag.value = PassHashCommon.bumpSiteTag(siteTag.value);
    update();
}

function onSelectSiteTag(fld)
{
    var siteTag = document.getElementById('site-tag');
    siteTag.value = fld[fld.selectedIndex].text;
    var options = fld[fld.selectedIndex].value;
    document.getElementById("digit"      ).checked  = (options.search(/d/i) >= 0);
    document.getElementById("punctuation").checked  = (options.search(/p/i) >= 0);
    document.getElementById("mixedCase"  ).checked  = (options.search(/m/i) >= 0);
    document.getElementById("noSpecial"  ).checked  = (options.search(/r/i) >= 0);
    document.getElementById("digitsOnly" ).checked  = (options.search(/g/i) >= 0);
    document.getElementById('punctuation').disabled = (options.search(/[rg]/i) >= 0);
    document.getElementById("digit"      ).disabled = (options.search(/g/i) >= 0);
    document.getElementById("punctuation").disabled = (options.search(/g/i) >= 0);
    document.getElementById("mixedCase"  ).disabled = (options.search(/g/i) >= 0);
    document.getElementById("noSpecial"  ).disabled = (options.search(/g/i) >= 0);
    document.getElementById("sha3"       ).checked  = (options.search(/s/i) >= 0);
    isSha3 = document.getElementById("sha3").checked;
    var sizeMatch = options.match(/[0-9]+/);
    var hashWordSize = (sizeMatch != null && sizeMatch.length > 0
                                ? parseInt(sizeMatch[0])
                                : 26);
		document.getElementById("hashWordSize").value = hashWordSize;
		onUpdate();
    if (validate())
        update();
}

function onLeaveSelectSiteTag(fld)
{
    // Remove the prompt
    document.getElementById('prompt').innerHTML = '';
}

function filter(obj)
{
	let s = obj.selectionStart,
			e = obj.selectionEnd,
			val = Math.min(~~obj.getAttribute("max"), Math.max(~~obj.getAttribute("min"), ~~obj.value.replace(/[^0-9]/g, "")));
	obj.value = val;

	if (e !== null)
		obj.selectionEnd = e;
	if (s !== null)
		obj.selectionStart = s;
}

function onSha3Change()
{
	isSha3 = document.getElementById("sha3").checked;
	update();
}

function onUpdate(obj)
{
	let isSize = true;
	if (!obj)
	{
		isSize = false;
	}
	obj = document.getElementById("hashWordSize");
	if (isSize)
	{
		filter(obj);
	}
	if (obj.value > 26)
	{
		document.getElementById("sha3").checked = true;
		document.getElementById("sha3").disabled = true;
	}
	else
	{
		document.getElementById("sha3").checked = isSha3;
		document.getElementById("sha3").disabled = false;
	}
	update(true);

	if (!isSize || obj.value == this.hashWordSizePrev)
		return;

	this.hashWordSizePrev = obj.value;
}