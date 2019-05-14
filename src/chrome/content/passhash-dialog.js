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

var PassHash =
{
		// These variables track whether or not dialog regions are hidden.
		optionsHidden: false, //V@no
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
		title: document.title,

		onLoad: function()
		{
				document.title = this.title + " v" + PassHashCommon.phCore.addon.version;
				var ctlSiteTag            = document.getElementById("site-tag");
				var ctlMasterKey          = document.getElementById("master-key");
				var ctlRequireDigit       = document.getElementById("digit");
				var ctlRequirePunctuation = document.getElementById("punctuation");
				var ctlRequireMixedCase   = document.getElementById("mixedCase");
				var ctlRestrictSpecial    = document.getElementById("noSpecial");
				var ctlRestrictDigits     = document.getElementById("digitsOnly");
				var ctlHashWordSize       = document.getElementById("hashWordSize");
				var ctlSha3               = document.getElementById("sha3");

				var prefs = PassHashCommon.loadOptions();
				this.guessSiteTag       = prefs.guessSiteTag;
				this.rememberSiteTag    = prefs.rememberSiteTag;
				this.rememberMasterKey  = prefs.rememberMasterKey;
				this.revealSiteTag      = prefs.revealSiteTag;
				this.revealHashWord     = prefs.revealHashWord;
				this.guessFullDomain    = prefs.guessFullDomain;
				this.requireDigit       = prefs.digitDefault;
				this.requirePunctuation = prefs.punctuationDefault;
				this.requireMixedCase   = prefs.mixedCaseDefault;
				this.restrictSpecial    = false;
				this.restrictDigits     = false;
				this.hashWordSize       = prefs.hashWordSizeDefault;
				this.sha3               = prefs.sha3Default;

				this.onUnmask();

				var defaultSiteTag = "";
				var domain = PassHashCommon.getDomain(window.arguments[0].input);
				var defaultSiteTag = "";
				if (this.guessSiteTag && domain != null)
						defaultSiteTag = (this.guessFullDomain ? domain : domain.split(".")[0]);

				let data = PassHashCommon.phCore.loadSecureValue(domain);
				ctlSiteTag.value = data[0] || defaultSiteTag;
				ctlMasterKey.value = data[1] || "";
				var strDefOptions = (ctlMasterKey.value ? "" : this.getOptionString());
				strOptions2 = data[2] || strDefOptions;
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
				this.parseOptionString(strOptions2);
				// This is the only time we write to the option controls.  Otherwise we
				// just react to their state changes.
				ctlRequireDigit.checked        = this.requireDigit;
				ctlRequirePunctuation.checked  = this.requirePunctuation;
				ctlRequireMixedCase.checked    = this.requireMixedCase;
				ctlRestrictSpecial.checked     = this.restrictSpecial;
				ctlRestrictDigits.checked      = this.restrictDigits;
				ctlSha3.checked                = this.sha3;
				this.updateCheckboxes();

				var btn = document.getElementById("hashWordSize"+this.hashWordSize);
				// Protect against bad saved hashWordSize value.
				if (btn == null)
				{
						btn = document.getElementById("hashWordSize8");
//						this.hashWordSize = 8;
				}
				ctlHashWordSize.value = this.hashWordSize;
//				ctlHashWordSize.selectedItem = btn;

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
	if (ctlSiteTag.value)
		ctlMasterKey.value = " " + ctlSiteTag.value;
	ctlMasterKey.setSelectionRange(0,0);
}
else
{
	ctlMasterKey.select();
}
ctlMasterKey.focus();
//V@no
let r = this.updateHashWord();

this.hashWordCur = document.getElementById("hash-word" ).value; //V@no new
		},

		onAccept: function()
		{
				if (this.update())
				{
if (this.hashWordCur != document.getElementById("hash-word" ).value) //V@no new
{
						var domain = PassHashCommon.getDomain(window.arguments[0].input);
						var strOptions = this.getOptionString();
						PassHashCommon.phCore.saveSecureValue(this.rememberSiteTag, domain, document.getElementById("site-tag").value, document.getElementById("master-key").value, strOptions);

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
}
						window.arguments[0].output = document.getElementById("hash-word" ).value;
						window.arguments[0].callback(document.getElementById("hash-word" ).value);
						return true;
				}
				return false;
		},

		onCancel: function()
		{
			window.arguments[0].callback(null);
			return true;
		},

		onSettings: function()
		{
//			chrome://passhash/content/passhash-options.xul
        window.openDialog("chrome://passhash/content/passhash-options.xul", "dlgopt",
                          "modal,centerscreen", {});
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

		onUnmask: function()
		{
				var ctlSiteTag   = document.getElementById("site-tag");
				var ctlMasterKey = document.getElementById("master-key");
				var ctlHashWord  = document.getElementById("hash-word");
				if (document.getElementById("unmask").checked)
				{
						ctlSiteTag  .setAttribute("type", "");
						ctlMasterKey.setAttribute("type", "");
						ctlHashWord .setAttribute("type", "");
				}
				else
				{
						ctlSiteTag  .setAttribute("type", this.revealSiteTag  ? "" : "password");
						ctlMasterKey.setAttribute("type", "password");
						ctlHashWord .setAttribute("type", this.revealHashWord ? "" : "password");
				}
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

		// Generate hash word if possible
		// Returns:
		//  0 = Hash word ok, but unchanged
		//  1 = Site tag bad or missing
		//  2 = Master key bad or missing
		//  3 = Hash word successfully generated
		updateHashWord: function()
		{
				var ctlSiteTag   = document.getElementById("site-tag"  );
				var ctlMasterKey = document.getElementById("master-key");
				var ctlHashWord  = document.getElementById("hash-word" );
				var r = 0;
				if (!ctlSiteTag.value)
						r = 1;
				else if (!ctlMasterKey.value)
						r = 2;


				ctlMasterKey.classList.toggle("error", (!ctlMasterKey.value));
				ctlSiteTag.classList.toggle("error", (!ctlSiteTag.value));
				document.getElementById("site-tag-bump").disabled = (!ctlSiteTag.value);
				document.getElementById("copy").disabled = r;
				if (r)
				{
					ctlHashWord.value = "";
					return r;
				}
				// Change the hash word and determine whether or not it was modified.
				var hashWordOrig = ctlHashWord.value;
				ctlHashWord.value = PassHashCommon.generateHashWord(
								ctlSiteTag.value,
								ctlMasterKey.value,
								this.hashWordSize,
								this.requireDigit,
								this.requirePunctuation,
								this.requireMixedCase,
								this.restrictSpecial,
								this.restrictDigits,
								this.sha3);
				if (ctlHashWord.value != hashWordOrig)
						return 3;   // It was modified
				return 0;       // It was not modified
		},

		onRequireDigitChanged: function()
		{
				this.requireDigit = document.getElementById("digit").checked;
				this.update();
		},

		onRequirePunctuationChanged: function()
		{
				this.requirePunctuation = document.getElementById("punctuation").checked;
				this.update();
		},

		onRequireMixedCaseChanged: function()
		{
				this.requireMixedCase = document.getElementById("mixedCase").checked;
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

		onHashWordSizeChanged: function(e)
		{
//				this.hashWordSize = document.getElementById("hashWordSize").selectedItem.value;
				this.hashWordSize = document.getElementById("hashWordSize").value;
				if (this.hashWordSizeLast == this.hashWordSize)
					return;

				this.hashWordSizeLast = this.hashWordSize;
				this.update(false);
		},

		updateCheckboxes: function()
		{
				document.getElementById("digit").disabled =
								this.restrictDigits;
				document.getElementById("punctuation").disabled =
								(this.restrictSpecial || this.restrictDigits);
				document.getElementById("mixedCase").disabled =
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

		parseOptionString: function(s)
		{
				this.requireDigit       = (s.search(/d/i) >= 0);
				this.requirePunctuation = (s.search(/p/i) >= 0);
				this.requireMixedCase   = (s.search(/m/i) >= 0);
				this.restrictSpecial    = (s.search(/r/i) >= 0);
				this.restrictDigits     = (s.search(/g/i) >= 0);
				this.sha3               = (s.search(/s/i) >= 0);
				var sizeMatch = s.match(/[0-9]+/);
				this.hashWordSize = (sizeMatch != null && sizeMatch.length > 0
																		? parseInt(sizeMatch[0])
																		: 8);
		},

		getOptionString: function()
		{
				var opts = '';
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
		},

		onSha3Changed: function()
		{
				this.sha3 = document.getElementById("sha3").checked;
				this.update();
		},

		onCopy: function()
		{
			let node = document.getElementById("hash-word" ),
					text = node.value,
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
		}

}