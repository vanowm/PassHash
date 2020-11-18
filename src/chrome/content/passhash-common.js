/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Password Hasher
 *
 * The Initial Developer of the Original Code is Steve Cooper.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): (none)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var log = console.log.bind(console);
var PassHashCommon =
{
    // Artificial host name used for for saving to the password database
    host: "passhash.passhash",

    log: function(msg)
    {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(msg);
    },

		phCore: {},

    loadOptions: function()
    {
        let opts = this.phCore.opts,
        		type = {
							boolean: "Bool",
							number: "Int"
        		},
        		prefs = this.phCore._prefs;
        var forceSave = false;
        if (!opts.shortcutKeyCode)
        {
            // Set shortcut key to XUL-defined default.
            forceSave = true;
            var elementKey = document.getElementById("key_passhash");
            if (elementKey != null)
            {
                opts.shortcutKeyCode = elementKey.getAttribute("key");
                if (!opts.shortcutKeyCode)
                    opts.shortcutKeyCode = elementKey.getAttribute("keycode");
            }
        }
        if (!opts.shortcutKeyMods)
        {
            // Set shortcut modifiers to XUL-defined default.
            forceSave = true;
            var elementKey = document.getElementById("key_passhash");
            if (elementKey != null)
                opts.shortcutKeyMods = elementKey.getAttribute("modifiers");
        }
        // Force saving options if the key options are not present to give them visibility
        if (forceSave)
            this.phCore.saveOptions(opts);

        return opts;
    },

		isIP: function(domain)
		{
			return domain.match(/^(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))(%.+)?))$/);
		},

    // TODO: There's probably a better way
    getDomain: function(input)
    {
        var h = input.host.split(".");
        if (!h.length)
        	return null;
        else if (h.length == 1 || this.isIP(input.host))
					return input.host;

        // Handle domains like co.uk
        if (h.length > 2 && h[h.length-1].length == 2 && h[h.length-2] == "co")
            return h[h.length-3] + '.' + h[h.length-2] + '.' + h[h.length-1];
        return h[h.length-2] + '.' + h[h.length-1];
    },

    // IMPORTANT: This function should be changed carefully.  It must be
    // completely deterministic and consistent between releases.  Otherwise
    // users would be forced to update their passwords.  In other words, the
    // algorithm must always be backward-compatible.  It's only acceptable to
    // violate backward compatibility when new options are used.
    // SECURITY: The optional adjustments are positioned and calculated based
    // on the sum of all character codes in the raw hash string.  So it becomes
    // far more difficult to guess the injected special characters without
    // knowing the master key.
    // TODO: Is it ok to assume ASCII is ok for adjustments?
    generateHashWord: function(opt)
/*
                siteTag,
                masterKey,
                hashWordSize,
                requireDigit,
                requirePunctuation,
                requireMixedCase,
                restrictSpecial,
                restrictDigits,
                sha3)
*/
    {
    	let siteTag = opt.siteTag,
    			masterKey = opt.masterKey,
    			hashWordSize = opt.hashWordSize,
    			restrictDigits = opt.restrictDigits,
    			requirePunctuation = opt.requirePunctuation,
    			requireMixedCase = opt.requireMixedCase,
    			restrictSpecial = opt.restrictSpecial,
    			requireDigit = opt.requireDigits,
    			restrictPunctuation = opt.restrictPunctuation,
    			sha3 = opt.sha3;
        // Start with the SHA1-encrypted master key/site tag.
        var s;
        if (sha3 || hashWordSize > 26)
        {
        	var hash = sha3_512.create();
							hash.update(masterKey);
							hash.update(siteTag);
							hash.update(String(hashWordSize));
					s = btoa(hash.hex());
        }
        else
        {
	        s = b64_hmac_sha1(masterKey, siteTag);
	      }


        // Use the checksum of all characters as a pseudo-randomizing seed to
        // avoid making the injected characters easy to guess.  Note that it
        // isn't random in the sense of not being deterministic (i.e.
        // repeatable).  Must share the same seed between all injected
        // characters so that they are guaranteed unique positions based on
        // their offsets.
        var sum = 0;
        for (var i = 0; i < s.length; i++)
            sum += s.charCodeAt(i);

        // Restrict digits just does a mod 10 of all the characters
        if (restrictDigits)
        {
            s = PassHashCommon.convertToDigits(s, sum, hashWordSize);
        }
        else
        {
            // Inject digit, punctuation, and mixed case as needed.
            if (requireDigit)
                s = PassHashCommon.injectSpecialCharacter(s, 0, 4, sum, hashWordSize, 48, 10);
 
            if (requirePunctuation && !restrictSpecial)
                s = PassHashCommon.injectSpecialCharacter(s, 1, 4, sum, hashWordSize, 33, 15, restrictPunctuation);
            else if (restrictPunctuation)
            {
							s = s.replace(/[^a-zA-Z0-9]+/g, function(c, i, s)
							{
								let r = sum;
								do
								{
									r = r + c.charCodeAt(0) + i;
									r = Math.floor(r % 124);
								}
								while(!((r > 47 && r < 58) || (r > 64 && r < 91) || (r > 96 && r < 123)))
								return String.fromCharCode(r);
							});
            }
            if (requireMixedCase)
            {
                s = PassHashCommon.injectSpecialCharacter(s, 2, 4, sum, hashWordSize, 65, 26);
                s = PassHashCommon.injectSpecialCharacter(s, 3, 4, sum, hashWordSize, 97, 26);
            }
            // Strip out special characters as needed.
            if (restrictSpecial)
                s = PassHashCommon.removeSpecialCharacters(s, sum, hashWordSize);
        }
       // Trim it to size.
        return s.substr(0, hashWordSize);
    },

    // This is a very specialized method to inject a character chosen from a
    // range of character codes into a block at the front of a string if one of
    // those characters is not already present.
    // Parameters:
    //  sInput   = input string
    //  offset   = offset for position of injected character
    //  reserved = # of offsets reserved for special characters
    //  seed     = seed for pseudo-randomizing the position and injected character
    //  lenOut   = length of head of string that will eventually survive truncation.
    //  cStart   = character code for first valid injected character.
    //  cNum     = number of valid character codes starting from cStart.
    injectSpecialCharacter: function(sInput, offset, reserved, seed, lenOut, cStart, cNum, filter)
    {
        var pos0 = seed % lenOut;
        var pos = (pos0 + offset) % lenOut;
				var list = "";
        if (filter === undefined || filter === null)
        {
	        // Check if a qualified character is already present
	        // Write the loop so that the reserved block is ignored.
	        for (var i = 0; i < lenOut - reserved; i++)
	        {
	            var i2 = (pos0 + reserved + i) % lenOut
	            var c = sInput.charCodeAt(i2);
	            if (c >= cStart && c < cStart + cNum)
	                return sInput;  // Already present - nothing to do
	        }
					for(let i = 0; i < cNum; i++)
						list += String.fromCharCode(cStart + i);
      	}
      	else
      	{
					list = PassHashCommon.phCore.filter2string(~~filter ^ PassHashCommon.phCore.optionBits["restrictPunctuation" + (filter ? "" : "Legacy")]);
      	}
        var sHead   = (pos > 0 ? sInput.substring(0, pos) : "");
//        var sInject = String.fromCharCode(((seed + sInput.charCodeAt(pos)) % cNum) + cStart);
        var sInject = list.substr(((seed + sInput.charCodeAt(pos)) % list.length), 1);
        var sTail   = (pos + 1 < sInput.length ? sInput.substring(pos+1, sInput.length) : "");
        return (sHead + sInject + sTail);
    },

    // Another specialized method to replace a class of character, e.g.
    // punctuation, with plain letters and numbers.
    // Parameters:
    //  sInput = input string
    //  seed   = seed for pseudo-randomizing the position and injected character
    //  lenOut = length of head of string that will eventually survive truncation.
    removeSpecialCharacters: function(sInput, seed, lenOut)
    {
        var s = '';
        var i = 0;
        while (i < lenOut)
        {
            var j = sInput.substring(i).search(/[^a-z0-9]/i);
            if (j < 0)
                break;
            if (j > 0)
                s += sInput.substring(i, i + j);
// https://github.com/wijjo/passhash/issues/3
            s += String.fromCharCode((seed + i + j) % 26 + 65);
//            s += String.fromCharCode((seed + i) % 26 + 65);
            i += (j + 1);
        }
        if (i < sInput.length)
            s += sInput.substring(i);
        return s;
    },
    // Convert input string to digits-only.
    // Parameters:
    //  sInput = input string
    //  seed   = seed for pseudo-randomizing the position and injected character
    //  lenOut = length of head of string that will eventually survive truncation.
    convertToDigits: function(sInput, seed, lenOut)
    {
        var s = '';
        var i = 0;
        while (i < lenOut)
        {
            var j = sInput.substring(i).search(/[^0-9]/i);
            if (j < 0)
                break;
            if (j > 0)
                s += sInput.substring(i, i + j);
// https://github.com/wijjo/passhash/issues/3
            s += String.fromCharCode((seed + sInput.charCodeAt(i)) % 10 + 48);
//            s += String.fromCharCode((seed + sInput.charCodeAt(i) + j) % 10 + 48);
            i += (j + 1);
        }
        if (i < sInput.length)
            s += sInput.substring(i);
        return s;
    },

    bumpSiteTag: function(siteTag)
    {
        var tag = siteTag.replace(/^[ \t]*(.*)[ \t]*$/, "$1");    // redundant
        if (tag)
        {
            var splitTag = tag.match(/^(.*):([0-9]+)?$/);
            if (splitTag == null || splitTag.length < 3)
                tag += ":1";
            else
                tag = splitTag[1] + ":" + (parseInt(splitTag[2]) + 1);
        }
        return tag;
    },

		isVisible: function(node)
		{
			let style = node.ownerDocument.defaultView.getComputedStyle(node);
			return !(style.display == "none" || style.visibility == "hidden");
		},


    // Returns true if an HTML node is some kind of text field.
    isTextNode: function(node)
    {
        try
        {
            let name = node.localName.toUpperCase();
            if (name == "TEXTAREA" || name == "TEXTBOX" ||
                        (name == "INPUT" &&
                            (["text", "password", "search", "email", "url"].indexOf(node.type) != -1 && this.isVisible(node))))
                return true;
        }
        catch(e) {console.log(e);}
        return false;
    },

    // From Mozilla utilityOverlay.js
    // TODO: Can I access it directly?
    openUILinkIn: function(url, where)
    {
        if (!where)
            return;

        if ((url == null) || (url == ""))
            return;

        // xlate the URL if necessary
        if (url.indexOf("urn:") == 0)
            url = xlateURL(url);        // does RDF urn expansion

        // avoid loading "", since this loads a directory listing
        if (url == "")
            url = "about:blank";

        if (where == "save")
        {
            saveURL(url, null, null, true);
            return;
        }

        var w = (where == "window") ? null : this.getTopWin();
        if (!w)
        {
            openDialog(getBrowserURL(), "_blank", "chrome,all,dialog=no", url);
            return;
        }
        var browser = w.document.getElementById("content");

        switch (where)
        {
            case "current":
                browser.loadURI(url);
                w.content.focus();
                break;
            case "tabshifted":
            case "tab":
                var tab = browser.addTab(url);
                if ((where == "tab") ^ this.getBoolPref("browser.tabs.loadBookmarksInBackground",
                                                        false))
                {
                    browser.selectedTab = tab;
                    w.content.focus();
                }
                break;
        }
    },

    // From Mozilla utilityOverlay.js
    getTopWin: function()
    {
        var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].
                                getService();
        var windowManagerInterface = windowManager.QueryInterface(
                                        Components.interfaces.nsIWindowMediator);
        var topWindowOfType = windowManagerInterface.getMostRecentWindow("navigator:browser");

        if (topWindowOfType)
            return topWindowOfType;

        return null;
    },

    // From Mozilla utilityOverlay.js
    getBoolPref: function(prefname, def)
    {
        try
        {
            var pref = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefBranch);
            return pref.getBoolPref(prefname);
        }
        catch(ex)
        {
            return def;
        }
    },
   getResourceFile: function(uri)
    {
        var handler = Components.classes["@mozilla.org/network/protocol;1?name=file"]
                            .createInstance(Components.interfaces.nsIFileProtocolHandler);
        var urlSrc = Components.classes["@mozilla.org/network/standard-url;1"]
                            .createInstance( Components.interfaces.nsIURL );
        urlSrc.spec = uri;
        var chromeReg = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                            .getService( Components.interfaces.nsIChromeRegistry );
        var urlIn = chromeReg.convertChromeURL(urlSrc);
        return handler.getFileFromURLSpec(urlIn.spec);
    },

    openInputFile: function(fileIn)
    {
        var streamIn = Components.classes["@mozilla.org/network/file-input-stream;1"]
                            .createInstance(Components.interfaces.nsIFileInputStream);
        streamIn.init(fileIn, 0x01, 0444, 0);
        streamIn.QueryInterface(Components.interfaces.nsILineInputStream);
        return streamIn;
    },

    openOutputFile: function(fileOut)
    {
        var streamOut = Components.classes["@mozilla.org/network/file-output-stream;1"]
                                 .createInstance(Components.interfaces.nsIFileOutputStream);
        streamOut.init(fileOut, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
        return streamOut;
    },

    streamWriteLine: function(stream, line)
    {
        stream.write(line, line.length);
        stream.write("\n", 1);
    },

    // Expand variables and return resulting string
    expandLine: function(lineIn)
    {
        var strings = document.getElementById("pshOpt_strings");
        var lineOut = "";
        var splicePos = 0;
        var re = /[$][{][ \t]*([^ }]+)[^}]*[}]/g;
        var match;
        while ((match = re.exec(lineIn)) != null)
        {
            lineOut += lineIn.substr(splicePos, match.index);
            try
            {
                lineOut += strings.getString(match[1]);
            }
            catch (ex)
            {
                alert("Couldn't find string \"" + match[1] + "\"");
                lineOut += "???" + match[1] + "???";
            }
            splicePos = re.lastIndex;
        }
        lineOut += lineIn.substr(splicePos);
        return lineOut;
    },

    // Expand variables and write line to output stream
    streamWriteExpandedLine: function(stream, line)
    {
        PassHashCommon.streamWriteLine(stream, PassHashCommon.expandLine(line));
    },

    browseFile: function(file, where)
    {
        var handler = Components.classes["@mozilla.org/network/protocol;1?name=file"]
                            .createInstance(Components.interfaces.nsIFileProtocolHandler);
        PassHashCommon.openUILinkIn(handler.getURLSpecFromFile(file), where);
    },

    pickHTMLFile: function(titleTag, defaultName)
    {
        var title = document.getElementById("pshOpt_strings").getString(titleTag);
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var picker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        if (defaultName)
            picker.defaultString = defaultName;
        picker.appendFilters(nsIFilePicker.filterHTML);
        picker.init(window, title, nsIFilePicker.modeSave);
        var file;
        do
        {
            var action = picker.show();
            if (action == 1)
                return null;
            file = picker.file;
            if (! /\.html{0,1}$/.test(picker.file.path))
                file.initWithPath(picker.file.path + ".html");
            picker.defaultString = file.leafName;
        }
        while (file.exists() && (action == 0));
        return file;
    },

		parseOptionString: function(s)
		{
			if (typeof(s) == "number")
			{
				for(let i in PassHashCommon.phCore.optionBits)
				{
					if (i == "restrictPunctuationLegacy")
						continue;

					if (i == "restrictPunctuation")
					{
						let m = ("" + s).match(/([0-9]+)([^0-9]([0-9]+))?/) || 0;
						this[i] = ~~m[3];
					}
					else if (i == "hashWordSize")
						this[i] = s & PassHashCommon.phCore.optionBits[i];
					else
						this[i] = s & PassHashCommon.phCore.optionBits[i] ? true : false;
				}
			}
			else
			{
				this.requireDigit       = (s.search(/d/i) >= 0);
				this.requirePunctuation = (s.search(/p/i) >= 0);
				this.requireMixedCase   = (s.search(/m/i) >= 0);
				this.restrictSpecial    = (s.search(/r/i) >= 0);
				this.restrictDigits     = (s.search(/g/i) >= 0);
				this.restrictPunctuation  = 0;
				this.sha3               = (s.search(/s/i) >= 0);
				var sizeMatch = s.match(/[0-9]+/);
				this.hashWordSize = (sizeMatch != null && sizeMatch.length > 0
																		? parseInt(sizeMatch[0])
																		: 8);
			}
			return this;
		},
		punctuation: [
			"Exclamation point",
			"Double quotes",
			"Number sign",
			"Dollar sign",
			"Percent sign",
			"Ampersand",
			"Single quote",
			"Opening parenthesis",
			"Closing parenthesis",
			"Asterisk",
			"Plus sign",
			"Comma",
			"Minus sign - hyphen",
			"Period",
			"Slash",
			"Colon",
			"Semicolon",
			"Less than sign",
			"Equal sign",
			"Greater than sign",
			"Question mark",
			"At symbol",
			"Opening bracket",
			"Backslash",
			"Closing bracket",
			"Caret - circumflex",
			"Underscore",
			"Opening brace",
			"Vertical bar",
			"Closing brace"
		]

    //NB: Make sure not to add a comma after the last function for older IE compatibility.
};


if (Components && Components.utils && Components.utils.import)
	Components.utils.import("resource://passhash/passhash-module.jsm", PassHashCommon);
