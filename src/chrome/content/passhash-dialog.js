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
var PassHash =
{
		// These variables track whether or not dialog regions are hidden.
		optionsHidden: false,
		notesHidden:   true,

		// These variables are initialized to preference defaults and some are kept
		// in sync with control state, as appropriate.
		guessSiteTag:        null,
		rememberSiteTag:     null,
		rememberMasterKey:   null,
		revealSiteTag:       null,
		revealHashWord:      null,
		guessFullDomain:     null,
		requireDigit:        null,
		requirePunctuation:  null,
		requireMixedCase:    null,
		restrictSpecial:     null,
		restrictDigits:      null,
		hashWordSize:        null,
		sha3:                null,
		masterKeyAddTag:     null,
		restrictPunctuation: null,
		hashWord:						 "",
		title: document.title,
		accept: false,
		save: true,
		lastOptions: {
			requireDigit: null,
			requirePunctuation: null,
			requireMixedCase: null,
			restrictSpecial: null,
			restrictDigits: null,
			hashWordSize: null,
//			restrictPunctuation: null,
			sha3: null
		},
		defaultOptions: {},
		arguments: null,
		onLoad: function()
		{
			this.arguments = window.arguments;
			let ctlAccept = document.documentElement.getButton("accept");
			ctlAccept.parentNode.insertBefore(document.getElementById("save"), ctlAccept);

			document.title = this.title + " v" + PassHashCommon.phCore.addon.version;
			var ctlSiteTag            = document.getElementById("site-tag");
			var ctlMasterKey          = document.getElementById("master-key");
			var ctlRequireDigit       = document.getElementById("requireDigit");
			var ctlRequirePunctuation = document.getElementById("requirePunctuation");
			var ctlRequireMixedCase   = document.getElementById("requireMixedCase");
			var ctlRestrictSpecial    = document.getElementById("noSpecial");
			var ctlRestrictDigits     = document.getElementById("digitsOnly");
			var ctlHashWordSize       = document.getElementById("hashWordSize");
			var ctlSha3               = document.getElementById("sha3");
			var ctlRestrictPunctuation= document.getElementById("restrictPunctuation");
			var prefs = PassHashCommon.loadOptions();
			this.guessSiteTag       = prefs.guessSiteTag;
			this.rememberSiteTag    = prefs.rememberSiteTag;
			this.rememberMasterKey  = prefs.rememberMasterKey;
			this.revealSiteTag      = prefs.revealSiteTag;
			this.revealHashWord     = prefs.revealHashWord;
			this.guessFullDomain    = prefs.guessFullDomain;
			this.requireDigit       = prefs.requireDigit;
			this.requirePunctuation = prefs.requirePunctuation;
			this.requireMixedCase   = prefs.requireMixedCase;
			this.restrictSpecial    = false;
			this.restrictDigits     = false;
			this.hashWordSize       = prefs.hashWordSize;
			this.sha3               = prefs.sha3;
			this.restrictPunctuation = prefs.restrictPunctuation;
			this.masterKeyAddTag    = prefs.masterKeyAddTag;
			if (prefs.restoreLast)
			{
				try
				{
					let opts = JSON.parse(prefs.lastOptions);
					for(let i in opts)
					{
						if (i in this.lastOptions)
						{
							this[i] = opts[i];
							this.lastOptions[i] = opts[i];
						}
					}
				}catch(e){console.log(e)};
			}
			this.onUnmask();
			var defaultSiteTag = "";
			var domain = PassHashCommon.getDomain(window.arguments[0].input);
			var defaultSiteTag = "";
			if (this.guessSiteTag && domain != null)
					defaultSiteTag = (this.guessFullDomain || PassHashCommon.isIP(domain) ? domain : domain.split(".")[0]);

			let data = PassHashCommon.phCore.loadSecureValue(domain);
			this._data = data;
			ctlSiteTag.value = this.rememberSiteTag ? data[0] || defaultSiteTag : defaultSiteTag;
			ctlMasterKey.value = this.rememberMasterKey ? data[1] || "" : "";
			this.masterKeySaved = data[1];
			this.siteTagSaved = data[0];
			var strDefOptions = (ctlMasterKey.value ? "" : this.getOptionString());
			var strOptions = data[2] || strDefOptions;
/*

			ctlSiteTag.value = PassHashCommon.loadSecureValue(
															this.rememberSiteTag,
															"site-tag",
															domain,
															defaultSiteTag);
			ctlMasterKey.value = PassHashCommon.loadSecureValue(
															this.rememberMasterKey,
															"master-key",
															domain,
															"");

			// Assume if there's a master key present without an options string
			// that we're on a site that was last accessed under an older version
			// of this extension, i.e. before hash word options were supported.  If
			// so, force it to start with cleared options for backward
			// compatibility.  Otherwise use the preferences as the default.
			var strDefOptions = (ctlMasterKey.value ? "" : this.getOptionString());
			var strOptions2 = PassHashCommon.loadSecureValue(true, "options", domain, strDefOptions);
*/
//log(data);
			Object.assign(this, new PassHashCommon.parseOptionString(strOptions));
			let that = this,
					firstCheckbox = 1;

			for (let i = 1; i < 31; i++)
			{
				let checkbox = document.createElement("checkbox");
				checkbox.id = "restrictPunctuation" + i;
				checkbox.className = "restrictPunctuation";
				checkbox.setAttribute("tooltiptext", PassHashCommon.punctuation[i-1]);
				checkbox.setAttribute("label", String.fromCharCode(32 + i + (i > 15 ? i > 22 ? i > 27 ? 63 : 36 : 10 : 0)));
				if (i > 15)
					checkbox.className += " extra";

				checkbox.addEventListener("command", function(e)
				{
					if (!e.shiftKey || !firstCheckbox)
						firstCheckbox = i;
					else if (firstCheckbox && i != firstCheckbox)
					{
						for(let c,v,n = i > firstCheckbox ? firstCheckbox+1 : i; n < (i < firstCheckbox ? firstCheckbox : i + 1); n++)
						{
							c = document.getElementById("restrictPunctuation" + n),
							v = document.getElementById("restrictPunctuation" + firstCheckbox).checked;
							c.checked = v;
						}
					}
					let r = that.restrictPunctuationGet();
					if (this.checked)
						r &= ~(1 << i);
					else
					{
						r |= 1 << i;
						if (r == PassHashCommon.phCore.optionBits.restrictPunctuation - 1)
						{
							r = that.restrictPunctuation;
							this.checked = true;
						}
					}
//					if (r == (PassHashCommon.phCore.optionBits.restrictPunctuation ^ PassHashCommon.phCore.optionBits.restrictPunctuationLegacy) && !that._data.restrictPunctuation)
//wtf?
					if (r == (PassHashCommon.phCore.optionBits.restrictPunctuation ^ PassHashCommon.phCore.optionBits.restrictPunctuationLegacy))
						r = 0;
					else if (r != PassHashCommon.phCore.optionBits.restrictPunctuationLegacy)
						r |= 1;

					that.restrictPunctuation = r
					that.update();
				}, false);
				if (!(this.restrictPunctuation >> i & 1))
					if (i <= 15 || (i > 15 && (!data || (data && this.restrictPunctuation))))
						checkbox.setAttribute("checked", true);

				ctlRestrictPunctuation.appendChild(checkbox);
			}
			let first = null, checked, changed, last;
			document.addEventListener("dragstart", function(e)
			{
				first = (e.target.id.match(/^restrictPunctuation([0-9]+)$/)||0)[1] || null;
				checked = !e.target.checked;
			}, false);

			ctlRestrictPunctuation.addEventListener("mouseover", function(e)
			{
				if (!first)
					return;

				let id = (e.target.id.match(/^restrictPunctuation([0-9]+)$/) || 0)[1];
				if (!id)
					return;

				for(let i = 1; i < 31; i++)
				{
					let checkbox = document.getElementById("restrictPunctuation" + i);
					if ((i < first && i < id) || (i > first && i > id))
					{
						checkbox.removeAttribute("_checked");
						continue;
					}
					if (checkbox.getAttribute("_checked") != checked)
						changed = true;

					checkbox.setAttribute("_checked", checked);
				}
				last = e.target;
			}, false);

			document.addEventListener("mouseup", function(e)
			{
				for(let i = 1; i < 31; i++)
				{
					let obj = document.getElementById("restrictPunctuation" + i),
							c = obj.getAttribute("_checked"),
							changed = false;

					if (c !== null && c !== "")
					{
						obj.removeAttribute("_checked");
						obj.checked = c == "true";
						changed = true;
					}
				}
				if (changed)
				{
					let r = that.restrictPunctuationGet();
					if (r == PassHashCommon.phCore.optionBits.restrictPunctuation - 1)
					{
						last.checked = true;
						r = that.restrictPunctuationGet() | 1;
					}
					else if (r != PassHashCommon.phCore.optionBits.restrictPunctuationLegacy)
						r |= 1;

					that.restrictPunctuation = r
					that.update();
				}
				first = changed = null;
			}, false);
			// This is the only time we write to the option controls.  Otherwise we
			// just react to their state changes.
			ctlRequireDigit.checked        = this.requireDigit;
			ctlRequirePunctuation.checked  = this.requirePunctuation;
			ctlRequireMixedCase.checked    = this.requireMixedCase;
			ctlRestrictSpecial.checked     = this.restrictSpecial;
			ctlRestrictDigits.checked      = this.restrictDigits;
			ctlSha3.checked                = this.sha3;
			this.updateCheckboxes();

			ctlHashWordSize.value = this.hashWordSize;

			this.notesHidden = document.getElementById("notes").hidden;
			this.optionsHidden = document.getElementById("options-box").hidden;
			this.updateOptionsVisibility();     // Hide the options
			this.updateNotesVisibility();       // Hide the notes
//V@no
/*
//original
        if (ctlSiteTag.value)
        {
            ctlMasterKey.select();
            ctlMasterKey.focus();
        }
        else
        {
            ctlSiteTag.select();
            ctlSiteTag.focus();
        }
*/
if (!ctlMasterKey.value)
{
	if (this.masterKeyAddTag && ctlSiteTag.value)
		ctlMasterKey.value = " " + ctlSiteTag.value;

	ctlMasterKey.setSelectionRange(0,0);
}
else
{
	ctlMasterKey.select();
}
ctlMasterKey.focus();
let r = this.updateHashWord(data.timePasswordChanged > 1605669384000 && data.timePasswordChanged < 1619499600000); //v1.2.1 to 1.3.1

//log(this.hashWord);
this.hashWordSaved = this.hashWord;
this.masterKeyInitial = ctlMasterKey.value;
this.siteTagInitial = ctlSiteTag.value;
			for(let i in this.lastOptions)
			{
				this.defaultOptions[i] = this[i];
			}
			window.focus();
		},//onLoad()

		restrictPunctuationGet(f)
		{
			let r = 0;
			for (let i = 1; i < 31; i++)
			{
				if (!document.getElementById("restrictPunctuation" + i).checked)
					r |= 1 << i;
			}

			return r
		},

		onAccept: function(e)
		{
			if (!this.update())
				return false
this.accept = true;

			let r = this.restrictPunctuationGet();

			if (r == (PassHashCommon.phCore.optionBits.restrictPunctuation ^ PassHashCommon.phCore.optionBits.restrictPunctuationLegacy))
				this.restrictPunctuation = 0;
			else
				this.restrictPunctuation = r | 1;

			let domain = PassHashCommon.getDomain(this.arguments[0].input),
					strOptions = this.getOptionString(),
					ctlMasterKey = document.getElementById("master-key"),
					ctlSiteTag = document.getElementById("site-tag"),
					siteTag = this.rememberSiteTag ? ctlSiteTag.value : "",
					masterKey = this.rememberMasterKey ? ctlMasterKey.value : "";
//					if (siteTag != this._data[0] || masterKey != this._data[1] || strOptions != this._data[2])
//					if ((this._data.length && (siteTag != this._data[0] || masterKey != this._data[1])) || this.masterKeyInitial != ctlMasterKey.value || this.siteTagInitial != ctlSiteTag.value)

					if (document.getElementById("save").checked
							&& (	(this._data.length && this._data.toString() != [siteTag, masterKey, strOptions].toString())
										|| this.masterKeyInitial != ctlMasterKey.value
										|| this.siteTagInitial != ctlSiteTag.value
								)
						)
					{
						PassHashCommon.phCore.saveSecureValue(domain, siteTag, masterKey, strOptions);
					}

/*
					PassHashCommon.saveSecureValue(
															this.rememberSiteTag,
															"site-tag",
															domain,
															document.getElementById("site-tag").value);
					PassHashCommon.saveSecureValue(
															this.rememberMasterKey,
															"master-key",
															domain,
															document.getElementById("master-key").value);
					PassHashCommon.saveSecureValue(true, "options", domain, strOptions);
*/
			for(let i in this.lastOptions)
			{
				this.lastOptions[i] = this[i];
			}
			PassHashCommon.phCore.pref("lastOptions", JSON.stringify(this.lastOptions));
			this.arguments[0].output = this.hashWord;
			this.arguments[0].callback(this.hashWord);
			return true;
		},//onAccept()

		onCancel: function(e)
		{
			if (!this.accept)
			{
				this.arguments[0].callback(null);
			}


			return true;
		},

		onSettings: function()
		{
			let output = {};
//			chrome://passhash/content/passhash-options.xul
        window.openDialog("chrome://passhash/content/passhash-options.xul", "dlgopt",
                          "modal,centerscreen", output);
				var prefs = PassHashCommon.loadOptions();
				this.rememberSiteTag = prefs.rememberSiteTag;
				this.rememberMasterKey = prefs.rememberMasterKey;
/*
				if (!prefs.restoreLast)
				{
					for(let i in this.lastOptions)
					{
						this.lastOptions[i] = this.defaultOptions[i];
						if (this[i] == this.lastOptions[i])
					}
					document.getElementById("requireDigit").checked        = this.requireDigit;
					document.getElementById("requirePunctuation").checked  = this.requirePunctuation;
					document.getElementById("requireMixedCase").checked    = this.requireMixedCase;
//					document.getElementById("noSpecial").checked     = this.restrictSpecial;
//					document.getElementById("digitsOnly").checked      = this.restrictDigits;
					document.getElementById("sha3").checked                = this.sha3;
					document.getElementById("hashWordSize").value = this.hashWordSize;

					this.updateCheckboxes();
				}
*/
				this.revealSiteTag      = PassHashCommon.phCore.pref("revealSiteTag");
				this.revealHashWord     = PassHashCommon.phCore.pref("revealHashWord");
				this.onUnmask();

		},
		
		onOptions: function()
		{
				this.optionsHidden = !this.optionsHidden;
				this.updateOptionsVisibility();
		},

		onDisclosure: function()
		{
				this.notesHidden = !this.notesHidden;
				this.updateNotesVisibility();
		},

		updateOptionsVisibility: function()
		{
				document.getElementById("options-box").hidden = this.optionsHidden;
				var strName = (this.optionsHidden ? "passhashOptionsLabel1" : "passhashOptionsLabel2");
				var label = document.getElementById("passhash_strings").getString(strName);
				document.getElementById("options").label = label;
				window.sizeToContent();
		},

		updateNotesVisibility: function()
		{
				document.getElementById("notes").hidden = this.notesHidden;
				var strName = (this.notesHidden ? "passhashDisclosureLabel1" : "passhashDisclosureLabel2");
				var label = document.getElementById("passhash_strings").getString(strName);
				document.documentElement.getButton("disclosure").label = label;
				window.sizeToContent();
		},

		onUnmask: function(noupdate)
		{
				var ctlSiteTag   = document.getElementById("site-tag");
				var ctlMasterKey = document.getElementById("master-key");
				var ctlHashWord  = document.getElementById("hash-word");
				if (document.getElementById("unmask").checked)
				{
						ctlSiteTag  .setAttribute("type", "");
						ctlMasterKey.setAttribute("type", "");
						ctlHashWord .value = this.hashWord;
						ctlHashWord.removeAttribute("type");
				}
				else
				{
						ctlSiteTag  .setAttribute("type", this.revealSiteTag  ? "" : "password");
						ctlMasterKey.setAttribute("type", "password");
						ctlHashWord .value = this.revealHashWord ? this.hashWord : this.hashWord.replace(/./g, "\u25CF");
						if (!this.revealHashWord)
							ctlHashWord.setAttribute("type", "password");

				}
				if (!noupdate)
					this.update();
		},

		onBlurSiteTag: function()
		{
				var ctlSiteTag = document.getElementById("site-tag");
				ctlSiteTag.value = ctlSiteTag.value.replace(/^[ \t]*(.*)[ \t]*$/, "$1");
		},

		onBumpSiteTag: function()
		{
				var ctlSiteTag = document.getElementById("site-tag");
				ctlSiteTag.value = PassHashCommon.bumpSiteTag(ctlSiteTag.value);
				this.update();
		},

		setHashWord: function(txt)
		{
			this.hashWord = txt;
			this.onUnmask(true);
		},
		// Generate hash word if possible
		// Returns:
		//  0 = Hash word ok, but unchanged
		//  1 = Site tag bad or missing
		//  2 = Master key bad or missing
		//  3 = Hash word successfully generated
		updateHashWord: function(buggy)
		{
				var ctlSiteTag   = document.getElementById("site-tag");
				var ctlMasterKey = document.getElementById("master-key");
				let ctlHashWord = document.getElementById("hash-word");
				let ctlSave = document.getElementById("save");
				var r = 0;
				if (!ctlSiteTag.value)
						r = 1;
				else if (!ctlMasterKey.value)
						r = 2;


				ctlMasterKey.classList.toggle("error", (!ctlMasterKey.value));
				if (this.masterKeySaved)
					ctlMasterKey.classList.toggle("saved", this.masterKeySaved == ctlMasterKey.value);
				if (this.siteTagSaved)
					ctlSiteTag.classList.toggle("saved", this.siteTagSaved == ctlSiteTag.value);

				ctlSiteTag.classList.toggle("error", (!ctlSiteTag.value));
				document.getElementById("site-tag-bump").disabled = (!ctlSiteTag.value);
				document.getElementById("copy").disabled = r;
				document.documentElement.getButton("accept").disabled = r;
				if (r)
				{
					this.setHashWord("");
					ctlHashWord.classList.toggle("saved", false);
					return r;
				}
				// Change the hash word and determine whether or not it was modified.
				var hashWordOrig = this.hashWord;
				this.setHashWord(PassHashCommon.generateHashWord({
					siteTag:  ctlSiteTag.value,
					masterKey: ctlMasterKey.value,
					hashWordSize: this.hashWordSize,
					requireDigit: this.requireDigit,
					requirePunctuation: this.requirePunctuation,
					requireMixedCase: this.requireMixedCase,
					restrictSpecial: this.restrictSpecial,
					restrictDigits: this.restrictDigits,
					sha3: this.sha3,
					restrictPunctuation: this.restrictPunctuation,
					buggy: buggy
				}));

				if ((this.hashWordSaved || typeof(this.hashWordSaved) == "undefined"))
				{
					ctlHashWord.classList.toggle("saved", ((typeof(this.hashWordSaved) == "undefined" || this.hashWordSaved == this.hashWord) && this.masterKeySaved === ctlMasterKey.value && this.siteTagSaved === ctlSiteTag.value));

					if (ctlHashWord.value !== ""
								&& (	(this._data.length
											&& this._data.toString() != [ctlSiteTag.value, ctlMasterKey.value, this.getOptionString()].toString()
											&& ctlMasterKey.value !== "" && ctlSiteTag.value !== "")
										|| (this.masterKeyInitial !== undefined && this.masterKeyInitial != ctlMasterKey.value)
										|| (this.siteTagInitial !== undefined && this.siteTagInitial != ctlSiteTag.value)
									)
					)
					{
						if ("__checked" in ctlSave)
						{
							ctlSave.checked = ctlSave.__checked;
							delete ctlSave.__checked
						}

						ctlSave.disabled = false;
					}
					else
					{
						if (!("__checked" in ctlSave))
							ctlSave.__checked = ctlSave.checked;

						ctlSave.checked = false;
						ctlSave.disabled = true;
					}
				}

				if (this.hashWord != hashWordOrig)
						return 3;   // It was modified

				return 0;       // It was not modified
		},

		onRequireDigitChanged: function()
		{
				this.requireDigit = document.getElementById("requireDigit").checked;
				this.update();
		},

		onRequirePunctuationChanged: function()
		{
				this.requirePunctuation = document.getElementById("requirePunctuation").checked;
				this.update();
		},

		onRequireMixedCaseChanged: function()
		{
				this.requireMixedCase = document.getElementById("requireMixedCase").checked;
				this.update();
		},

		onRestrictSpecialChanged: function()
		{
				this.restrictSpecial = document.getElementById("noSpecial").checked;
				this.update();
		},

		onRestrictDigitsChanged: function()
		{
				this.restrictDigits = document.getElementById("digitsOnly").checked;
				this.update();
		},

		onHashWordSizeChanged: function(event)
		{
				let hashWordSizeObj = document.getElementById("hashWordSize"),
						v = PassHashCommon.getValue(hashWordSizeObj, "hashWordSize");

				this.hashWordSize = v;
				if (this.hashWordSizeLast == this.hashWordSize)
					return;

				this.hashWordSizeLast = this.hashWordSize;
				this.update(false);
		},

		updateCheckboxes: function()
		{
				document.getElementById("requireDigit").disabled =
								this.restrictDigits;
				document.getElementById("requirePunctuation").disabled =
								(this.restrictSpecial || this.restrictDigits);
				if (this.restrictSpecial || this.restrictDigits || !this.requirePunctuation)
					document.getElementById("restrictPunctuation").setAttribute("disabled", "");
				else
					document.getElementById("restrictPunctuation").removeAttribute("disabled");

				document.getElementById("requireMixedCase").disabled =
								this.restrictDigits;
				document.getElementById("noSpecial").disabled =
								this.restrictDigits;
				document.getElementById("digitsOnly").disabled =
								false;  // Can always add digits-only as a further restriction
				if (this.hashWordSize > 26)
				{
					document.getElementById("sha3").disabled = true;
					document.getElementById("sha3").checked = true;
				}
				else
				{
					document.getElementById("sha3").disabled = false;
					document.getElementById("sha3").checked = this.sha3;
				}
		},

		// Determines where to focus and generates the hash word when adequate
		// information is available.
		update: function(focus)
		{
				this.updateCheckboxes();
				let r = this.updateHashWord();

				if (focus === false)
					return true;
				switch (r)
				{
						case 1:
								document.getElementById("site-tag").focus();
								return false;
						case 2:
								document.getElementById("master-key").focus();
								return false;
						case 3:
								document.documentElement.getButton("accept").focus();
								return false;
				}
				document.documentElement.getButton("accept").focus();
				return true;
		},

		getOptionString: function()
		{
			let b = ~~this.hashWordSize;
			for(let i in PassHashCommon.phCore.optionBits)
			{
				if (i == "restrictPunctuationLegacy")
					continue;

				if (i == "restrictPunctuation")
				{
					if (this[i])
						b += parseFloat("0." + (this[i] | 1));
				}
				else if (i != "hashWordSize" && this[i])
					b += PassHashCommon.phCore.optionBits[i];
			}
			return b;

/*				var opts = '';
				if (this.requireDigit)
						opts += 'd';
				if (this.requirePunctuation)
						opts += 'p';
				if (this.requireMixedCase)
						opts += 'm';
				if (this.restrictSpecial)
						opts += 'r';
				if (this.restrictDigits)
						opts += 'g';
				if (this.sha3)
						opts += 's';
				opts += this.hashWordSize.toString();
				return opts;
*/
		},

		onSha3Changed: function()
		{
				this.sha3 = document.getElementById("sha3").checked;
				this.update();
		},

		onCopy: function()
		{
			let node = document.getElementById("hash-word" ),
					text = this.hashWord,
					that = this;

			if (that.timer || text.replace(/(^\s+|\s+$)/g, "") === "")
				return;

			Components.classes["@mozilla.org/widget/clipboardhelper;1"]
				.getService(Components.interfaces.nsIClipboardHelper)
				.copyString(text);

			node.classList.toggle("flash", true);
			that.timer = setTimeout(function()
			{
				node.classList.toggle("flash", false);
				delete that.timer;
			}, 1000);
		},
		
		selectHashWord: function(e)
		{
				e.target.select();
			if (e.target.getAttribute("type") != "password")
			{
				return true;
			}

			if (e.type == "copy")
				return false;

			if (e.type == "popupshowing")
			{
				for(let i = 0; i < e.originalTarget.childNodes.length; i++)
				{
					if (e.originalTarget.childNodes[i].getAttribute("cmd") == "cmd_copy")
					{
						e.originalTarget.childNodes[i].disabled = true;
						break;
					}
				}
				return true;
			}
			return true;
		}

}

window.addEventListener("unload", function(e)
{
	PassHash.onCancel();
}, false);