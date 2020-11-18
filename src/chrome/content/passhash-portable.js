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
var options = {restrictPunctuation: 0};

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
    var requireDigit       = document.getElementById("requireDigit").checked;
    var requirePunctuation = document.getElementById("requirePunctuation").checked;
    var requireMixedCase   = document.getElementById("requireMixedCase").checked;
    var restrictSpecial    = document.getElementById("restrictSpecial").checked;
    var restrictDigits     = document.getElementById("restrictDigits").checked;
    if (!siteTag.value || !masterKey.value)
    	return;

    hashWord.value = PassHashCommon.generateHashWord({
			siteTag: siteTag.value,
			masterKey: masterKey.value,
			hashWordSize: hashWordSize,
			requireDigit: requireDigit,
			requirePunctuation: requirePunctuation,
			requireMixedCase: requireMixedCase,
			restrictSpecial: restrictSpecial,
			restrictDigits: restrictDigits,
			sha3: isSha3,
			restrictPunctuation: options.restrictPunctuation
    });
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
    document.getElementById('requirePunctuation').disabled = fld.checked;
		if (fld.checked)
    	document.getElementById('restrictPunctuation').setAttribute("disabled", true);
    else
    	document.getElementById('restrictPunctuation').removeAttribute("disabled");
    update();
}

function onDigitsOnly(fld)
{
    document.getElementById('requirePunctuation').disabled = fld.checked;
    document.getElementById("requireDigit"      ).disabled = fld.checked;
    document.getElementById("requireMixedCase"  ).disabled = fld.checked;
    document.getElementById("restrictSpecial"  ).disabled = fld.checked;
		if (fld.checked)
    	document.getElementById('restrictPunctuation').setAttribute("disabled", true);
    else
    	document.getElementById('restrictPunctuation').removeAttribute("disabled");
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
    var val = parseFloat(fld[fld.selectedIndex].value);
    if (isNaN(val) || val != fld[fld.selectedIndex].value)
    	val = fld[fld.selectedIndex].value;

    options = new PassHashCommon.parseOptionString(val);

		for(var i in optionBits)
		{
			if (i == "restrictPunctuationLegacy")
				continue;

			if (i == "restrictPunctuation")
			{
				var rp = options[i];
				for(let i = 1; i < 31; i++)
				{
					let obj = document.getElementById("restrictPunctuation" + i),
							checked = (!(rp >> i & 1) && (i <= 15 || (i > 15 && rp !== null)));

					obj.checked = checked;
					if (checked)
					{
						obj.setAttribute("checked", true);
						obj.parentNode.setAttribute("checked", true);
					}
					else
					{
						obj.removeAttribute("checked");
						obj.parentNode.removeAttribute("checked");
					}
						
				}
			}
			else if (i == "hashWordSize")
				document.getElementById(i).value = options[i];
			else
				document.getElementById(i).checked = options[i];
		}
    document.getElementById('requirePunctuation').disabled = options.restrictSpecial || options.restrictDigits;
    document.getElementById("requireDigit"      ).disabled = options.restrictDigits
    document.getElementById("requireMixedCase"  ).disabled = options.restrictDigits
    document.getElementById("restrictSpecial"  ).disabled = options.restrictDigits
    isSha3 = document.getElementById("sha3").checked;
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
	var s = obj.selectionStart,
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
	var isSize = true;
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

function onRestrictPunctuation(obj)
{
	let bit = ~~obj.id.replace("restrictPunctuation", "");

	let r = options.restrictPunctuation;
	if (obj.checked)
		r &= ~(1 << bit);
	else
	{
		r |= 1 << bit;
		if (r == 32767)
		{
			r = options.restrictPunctuation;
			obj.checked = true;
		}
	}
	if (obj.checked)
	{
		obj.parentNode.setAttribute("checked", true);
		obj.setAttribute("checked", true);
	}
	else
	{
		obj.parentNode.removeAttribute("checked");
		obj.removeAttribute("checked");
	}

	options.restrictPunctuation = r
	update();
}
function onRequirePunctuation(obj)
{
	if (obj.checked)
  	document.getElementById('restrictPunctuation').removeAttribute("disabled");
  else
  	document.getElementById('restrictPunctuation').setAttribute("disabled", true);

	update();
}