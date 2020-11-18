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

// Password manager enumeration code "borrowed" from the password_exporter extension,
// written by Justin Scott.
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/LoginHelper.jsm");
var PassHashOptions =
{
		notesHidden: true,

		onLoad: function()
		{
			var opts = PassHashCommon.loadOptions();
			this.opts = opts;

			this.initOptions();
//			document.getElementById("pshOpt_security").selectedItem = this.getSecurityRadio(opts.securityLevel);
/*
			document.getElementById("pshOpt_guessSiteTag"       ).checked = opts.guessSiteTag;
			document.getElementById("pshOpt_rememberSiteTag"    ).checked = opts.rememberSiteTag;
			document.getElementById("pshOpt_rememberMasterKey"  ).checked = opts.rememberMasterKey;
			document.getElementById("pshOpt_revealSiteTag"      ).checked = opts.revealSiteTag;
			document.getElementById("pshOpt_revealHashWord"     ).checked = opts.revealHashWord;
			document.getElementById("pshOpt_showMarker"         ).checked = opts.showMarker;
			document.getElementById("pshOpt_unmaskMarker"       ).checked = opts.unmaskMarker;
			document.getElementById("pshOpt_guessFullDomain"    ).checked = opts.guessFullDomain;
			document.getElementById("pshOpt_requireDigit"       ).checked = opts.requireDigit;
			document.getElementById("pshOpt_requirePunctuation" ).checked = opts.requirePunctuation;
			document.getElementById("pshOpt_requireMixedCase"   ).checked = opts.requireMixedCase;
			document.getElementById("pshOpt_hashWordSize"       ).value   = opts.hashWordSize;
			document.getElementById("pshOpt_sha3"               ).checked = opts.sha3;
			document.getElementById("pshOpt_dblClick"           ).checked = opts.dblClick;
			document.getElementById("pshOpt_middleClick"        ).checked = opts.middleClick;
			document.getElementById("pshOpt_restoreLast"        ).checked = opts.restoreLast;
			document.getElementById("pshOpt_masterKeyAddTag"    ).checked = opts.masterKeyAddTag;
			document.getElementById("pshOpt_markerPosition"     ).value = opts.markerPosition >= document.getElementById("pshOpt_markerPosition").itemCount ? 0 : opts.markerPosition;
			document.getElementById("pshOpt_autocomplete"       ).checked = opts.autocomplete;
*/
			let markerSize = document.getElementById("pshOpt_markerSize");
			for(let i = PassHashCommon.phCore.optsDefault.markerSize.min; i <= PassHashCommon.phCore.optsDefault.markerSize.max; i++)
			{
				markerSize.appendItem(i, i);
			}
			markerSize.value = opts.markerSize;

//			PassHashOptions.applySecurityLevel();
//			PassHashOptions.onRestoreLast();
			document.getElementById("pshOpt_security").
							addEventListener("RadioStateChange", this.onSecurityLevel, false);
			document.getElementById("pshOpt_guessSiteTag").
							addEventListener("change", this.onSecurityLevel, false);

			let obj = document.getElementById("pshOpt_hashWordSize");
			obj.addEventListener("change", this.onHashWordSize, false);
			obj.addEventListener("input", this.onHashWordSize, false);

			this.onHashWordSize({target: obj});
			this.notesHidden = document.getElementById("pshOpt_notes").hidden;
			this.updateNotesVisibility();
			PassHashCommon.phCore.onPrefChange.addObserver(this.initOptions);
		},

		initOptions: function(opt, val)
		{
			let _opt = {},
					that = PassHashOptions;

			if (typeof(opt) == "string")
			{
				_opt[opt] = that.opts[opt];
			}
			else
			{
				_opt = opt || that.opts;
			}
			for(let i in _opt)
			{
				let obj = document.getElementById("pshOpt_" + i);
				if (!obj)
					continue;

				if (typeof(_opt[i]) == "boolean")
					obj.checked = _opt[i];
				else
					obj.value = _opt[i];

			}
			if (!opt || ["guessSiteTag", "rememberSiteTag", "rememberMasterKey", "revealSiteTag", "revealHashWord", "masterKeyAddTag"].indexOf(opt) != -1)
			{
				PassHashOptions.applySecurityLevel();
			}
			if (!opt || opt == "restoreLast")
			{
				PassHashOptions.onRestoreLast()
			}
		},

		onUnload: function()
		{
			PassHashCommon.phCore.onPrefChange.removeObserver(this.initOptions);
		},
		onAccept: function()
		{
				var opts = PassHashCommon.phCore.opts;
//        opts.securityLevel       = PassHashOptions.readSecurityLevel();
				opts.guessSiteTag        = document.getElementById("pshOpt_guessSiteTag"      ).checked;
				opts.rememberSiteTag     = document.getElementById("pshOpt_rememberSiteTag"   ).checked;
				opts.rememberMasterKey   = document.getElementById("pshOpt_rememberMasterKey" ).checked;
				opts.revealSiteTag       = document.getElementById("pshOpt_revealSiteTag"     ).checked;
				opts.revealHashWord      = document.getElementById("pshOpt_revealHashWord"    ).checked;
				opts.guessFullDomain     = document.getElementById("pshOpt_guessFullDomain"   ).checked;
				opts.showMarker          = document.getElementById("pshOpt_showMarker"        ).checked;
				opts.unmaskMarker        = document.getElementById("pshOpt_unmaskMarker"      ).checked;
				opts.requireDigit        = document.getElementById("pshOpt_requireDigit"      ).checked;
				opts.requirePunctuation  = document.getElementById("pshOpt_requirePunctuation").checked;
				opts.requireMixedCase    = document.getElementById("pshOpt_requireMixedCase"  ).checked;
				opts.hashWordSize = PassHashOptions.readhashWordSize();
				opts.sha3                = "_checked" in document.getElementById("pshOpt_sha3") ? document.getElementById("pshOpt_sha3")._checked : document.getElementById("pshOpt_sha3").checked;
				opts.dblClick            = document.getElementById("pshOpt_dblClick"          ).checked;
				opts.middleClick         = document.getElementById("pshOpt_middleClick"       ).checked;
				opts.restoreLast         = document.getElementById("pshOpt_restoreLast"       ).checked;
				opts.masterKeyAddTag     = document.getElementById("pshOpt_masterKeyAddTag"   ).checked;
				opts.markerPosition      = ~~document.getElementById("pshOpt_markerPosition"  ).value;
				opts.markerSize          = ~~document.getElementById("pshOpt_markerSize"      ).value;
				opts.autocomplete        = document.getElementById("pshOpt_autocomplete"      ).checked;
				PassHashCommon.phCore.saveOptions(opts);
		},

		onRestoreLast: function(e)
		{
			let checked = document.getElementById("pshOpt_restoreLast").checked;
			document.getElementById("pshOpt_requireDigit"       ).disabled = checked;
			document.getElementById("pshOpt_requirePunctuation" ).disabled = checked;
			document.getElementById("pshOpt_requireMixedCase"   ).disabled = checked;
			document.getElementById("pshOpt_sha3"               ).disabled = checked;
			document.getElementById("pshOpt_hashWordSize"       ).disabled = checked;
			document.getElementById("pshOpt_requireBox"         ).setAttribute("disabled", checked);
			document.getElementById("pshOpt_hashWordSizeBox"    ).setAttribute("disabled", checked);
		},

		onDisclosure: function()
		{
				this.notesHidden = !this.notesHidden;
				this.updateNotesVisibility();
		},

		onShowPortable: function()
		{
				try
				{
//            var entries = PassHashCommon.getSavedEntries();
						var entries = PassHashCommon.phCore.getSavedEntries();
						var fileIn  = PassHashCommon.getResourceFile("chrome://passhash/content/passhash-portable.html");
						var fileOut = PassHashCommon.pickHTMLFile("passhashShowPortableTitle", "passhash.html");
						if (fileIn == null || fileOut == null)
								return;

						var streamIn  = PassHashCommon.openInputFile(fileIn);
						var streamOut = PassHashCommon.openOutputFile(fileOut);

						// Copy input to output stream, inject the following items:
						//  - site tag option list
						//  - included resources marked by <!--!directory:resource--> lines (whole line)
						//  - localized string substitutions marked by ${tag}
						var fillSiteTagList = false;
						var more = true;
						var restrictPunctuationOptions = "";
						for(let i = 1; i < 31; i++)
						{
							restrictPunctuationOptions += '<label class="rp" checked="true" title="' + PassHashCommon.punctuation[i-1] + '"><input id="restrictPunctuation' + i + '" type="checkbox" class="option rp" checked="true" onclick="onRestrictPunctuation(this)"/><span>' + String.fromCharCode(32 + i + (i > 15 ? i > 22 ? i > 27 ? 63 : 36 : 10 : 0) ) + '</span></label>';
						}
						
						while (more)
						{
								var line = {};
								more = streamIn.readLine(line);

								// Found the control for the site tag list?
								if (!fillSiteTagList && line.value.search(/<select.* id="site-tag-list"/i) >= 0)
										fillSiteTagList = true;

								line.value = line.value.replace(/<!--!version-->/g, PassHashCommon.phCore.addon.version);
								line.value = line.value.replace(/<!--!optionBits-->/, JSON.stringify(PassHashCommon.phCore.optionBits));
								line.value = line.value.replace(/{RESTRICTPUNCTUATION}/, restrictPunctuationOptions);
								line.value = line.value.replace(/<!--!phCore\.([a-zA-Z0-9_]+)-->/, function(a, b)
								{
									return PassHashCommon.phCore[b];
								});
								PassHashCommon.streamWriteExpandedLine(streamOut, line.value);

								// Inject site tag option list after finding select element body.
								if (fillSiteTagList && line.value.search(/>/) >= 0)
								{
										PassHashCommon.streamWriteLine(streamOut, "<option selected></option>");
										for (var i = 0; i <  entries.length; i++)
												if (entries[i].siteTag)
														PassHashCommon.streamWriteLine(streamOut,
																"<option" + ' value="' + entries[i].options + '"' + ">" +
																		entries[i].siteTag +
																"</option>");
										fillSiteTagList = false;
								}

								// Append contents of other resource, e.g.  <!--!skin:passhash-portable.css-->
								var re = /<!--![ \t]*([a-z]+)[ \t]*:[ \t]*(.*)[ \t]*-->/g;
								var match;
								while ((matches = re.exec(line.value)) != null)
								{
										var uri = "chrome://passhash/" + matches[1] + "/" + matches[2];
										var fileIn2 = PassHashCommon.getResourceFile(uri);
										if (fileIn2 != null)
										{
												var streamIn2  = PassHashCommon.openInputFile(fileIn2);
												var line2 = {}, more2;
												do
												{
														more2 = streamIn2.readLine(line2);
														PassHashCommon.streamWriteExpandedLine(streamOut, line2.value);
												}
												while (more2);
										}
								}
						}

						streamIn.close();
						streamOut.close();

						PassHashCommon.browseFile(fileOut, "tab");
				}
				catch (ex)
				{
						alert("Error creating Portable Page:\n" + ex);
				}
		},

		updateNotesVisibility: function()
		{
				document.getElementById("pshOpt_notes").hidden = this.notesHidden;
				var strName = (this.notesHidden ? "passhashDisclosureLabel1" : "passhashDisclosureLabel2");
				var label = document.getElementById("pshOpt_strings").getString(strName);
				document.documentElement.getButton("disclosure").label = label;
				window.sizeToContent();
		},

/*
    readSecurityLevel: function()
    {
			this.getSecurityLevel()
        var secbtn = document.getElementById("pshOpt_security").selectedItem;
        return (secbtn != null ? parseInt(secbtn.value) : 2);
    },
*/
		getSecurityRadio: function(securityLevel)
		{
				return document.getElementById("pshOpt_security" + securityLevel);
		},

		onSecurityLevel: function(event)
		{
				PassHashOptions.applySecurityLevel(event.target.tagName == "radio" ? document.getElementById("pshOpt_security").selectedItem.value : undefined);
//log(event);
				return true;
		},

		readSecurityLevel: function()
		{
//log(document.getElementById("pshOpt_guessSiteTag"     ).checked, document.getElementById("pshOpt_rememberSiteTag"  ).checked, document.getElementById("pshOpt_rememberMasterKey").checked, document.getElementById("pshOpt_revealSiteTag"    ).checked, document.getElementById("pshOpt_revealHashWord"   ).checked);
			let sum = (document.getElementById("pshOpt_guessSiteTag"     ).checked ? 1 : 0) +
								(document.getElementById("pshOpt_rememberSiteTag"  ).checked ? 2 : 0) +
								(document.getElementById("pshOpt_rememberMasterKey").checked ? 4 : 0) +
								(document.getElementById("pshOpt_revealSiteTag"    ).checked ? 8 : 0) +
								(document.getElementById("pshOpt_revealHashWord"   ).checked ? 16 : 0);

//log(sum);
			return {31:1, 11:2, 0:3}[sum] || 0;
		},

		applySecurityLevel: function(securityLevel)
		{
			if (!securityLevel)
				securityLevel = PassHashOptions.readSecurityLevel();

			securityLevel = ~~securityLevel;
/*        document.getElementById("pshOpt_guessSiteTag"     ).disabled = true;
        document.getElementById("pshOpt_rememberSiteTag"  ).disabled = true;
        document.getElementById("pshOpt_rememberMasterKey").disabled = true;
        document.getElementById("pshOpt_revealSiteTag"    ).disabled = true;
        document.getElementById("pshOpt_revealHashWord"   ).disabled = true;
*/
				switch (securityLevel)
				{
						case 1:
								document.getElementById("pshOpt_guessSiteTag"     ).checked = true;
								document.getElementById("pshOpt_rememberSiteTag"  ).checked = true;
								document.getElementById("pshOpt_rememberMasterKey").checked = true;
								document.getElementById("pshOpt_revealSiteTag"    ).checked = true;
								document.getElementById("pshOpt_revealHashWord"   ).checked = true;
								break;
						case 3:
								document.getElementById("pshOpt_guessSiteTag"     ).checked = false;
								document.getElementById("pshOpt_rememberSiteTag"  ).checked = false;
								document.getElementById("pshOpt_rememberMasterKey").checked = false;
								document.getElementById("pshOpt_revealSiteTag"    ).checked = false;
								document.getElementById("pshOpt_revealHashWord"   ).checked = false;
								break;
						case 2:
								document.getElementById("pshOpt_guessSiteTag"     ).checked = true;
								document.getElementById("pshOpt_rememberSiteTag"  ).checked = true;
								document.getElementById("pshOpt_rememberMasterKey").checked = false;
								document.getElementById("pshOpt_revealSiteTag"    ).checked = true;
								document.getElementById("pshOpt_revealHashWord"   ).checked = false;
								break;
						default:
				}
				document.getElementById("pshOpt_security").selectedIndex = --securityLevel;
		},

		readhashWordSize: function()
		{
				var btn = document.getElementById("pshOpt_hashWordSize");
				return (btn != null ? ~~btn.value : 8) || 8;
		},

		getHash: function(str)
		{
			let hash = sha3_512.create();
			hash.update(str);
			return hash.hex();
		},

		cipher: function(_data, _pass)
		{
			let r = "";
			for (let i = 0; i < _data.length; i++)
			{
				r += String.fromCharCode(_data.charCodeAt(i) ^ _pass.charCodeAt(Math.floor(i % _pass.length)));
			}
			return r;
		},

		crc: function(data)
		{
			let c = sha3_512.update(data).hex(),
					r = "";

			for(let i = 0; i < c.length; i++)
			{
				r += String.fromCharCode(c[i]);
			}
			return r;
		},

		fpShow: function (fp, callback)
		{
			let r,
					that = this;

			let _callback = function()
			{
				if (typeof(callback) != "function")
					return arguments[0];

				try
				{
					return callback.apply(that, arguments);
				}
				catch(e)
				{
log(e);
				}
				return arguments[0];
			}
			try
			{
				r = fp.show();
			}
			catch(e)
			{
log(e);
				return fp.open(_callback);
			}
//log(r);
			return _callback(r);
		},

		readFile: function(fp)
		{
			var data = "";
			var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
			var cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
			fstream.init(fp, -1, 0, 0);
			cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish

			let str = {};
			let read = 0;
			do {
				read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
				data += str.value;
			} while (read != 0);
			cstream.close(); // this closes fstream
			return data;
		},

		saveFile:function(fp, content)
		{
		//save file block taken from chrome://pippki/content/pippki.js
			let bundle = Cc["@mozilla.org/intl/stringbundle;1"]
												.getService(Ci.nsIStringBundleService)
												.createBundle("chrome://pippki/locale/pippki.properties"),
		//			localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
					localFile = new FileUtils.File(fp.file.path),
					msg = "",
					written = 0;

			try
			{
				localFile.initWithPath(fp.file.path);
				if (localFile.exists())
					localFile.remove(true);

				localFile.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0600);
				let fos = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream),
						converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
				// flags: PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
				fos.init(localFile, 0x04 | 0x08 | 0x20, 0600, 0);
//				written = fos.write(content, content.length);
				converter.init(fos, "UTF-8", 0, 0);
				written = converter.writeString(content);
				converter.close(); // this closes foStream
				if (fos instanceof Ci.nsISafeOutputStream)
					fos.finish();
				else
					fos.close();
			}
			catch(e) {
				switch (e.result) {
					case Components.results.NS_ERROR_FILE_ACCESS_DENIED:
						msg = "Write file access denied";//bundle.GetStringFromName("writeFileAccessDenied");
						break;
					case Components.results.NS_ERROR_FILE_IS_LOCKED:
						msg = "File is locked";//bundle.GetStringFromName("writeFileIsLocked");
						break;
					case Components.results.NS_ERROR_FILE_NO_DEVICE_SPACE:
					case Components.results.NS_ERROR_FILE_DISK_FULL:
						msg = "Not enough free space";//bundle.GetStringFromName("writeFileNoDeviceSpace");
						break;
					default:
						msg = e.message;
						break;
				}
			}
/*			if (written != content.length)
			{
				if (!msg.length)
					msg = "Uknown error";//bundle.GetStringFromName("writeFileUnknownError");

/*
					this.alert(bundle.formatStringFromName("writeFileFailed",[fp.file.path, msg], 2),
											bundle.GetStringFromName("writeFileFailure"));
*/
/*					this.alert(msg, "Error");
				return false;
			}
*/
			return true;
		},
		alert: function(msg, title)
		{
			let promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
													.getService(Ci.nsIPromptService);
			promptService.alert(window, title || msg, msg);
		},

		confirm: function(msg, title)
		{
			let prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService),
					flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
									prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;

			return !prompts.confirmEx(null, title, msg, flags, "", "", "", null, {value: false});
		},

		onCmdBackup: function(e)
		{
log(arguments);
			let pass = {value: null};
//					prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);

//			if (!prompts.promptPassword(window, "Encrypt backup with a password", "Enter a password\nLeave blank to skip encryption", pass, null, {}))
//				return;

//			pass = pass.value;

			let data = {settings:{}},
					cipherVersion = String.fromCharCode(1);
					core = PassHashCommon.phCore,
					that = PassHashOptions,
					pref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getDefaultBranch(core.PREF),
					prefList = pref.getChildList("", {}).sort(),
					passList = core.getSavedEntries();

			pass = this.promptPassword(null, "Found " + passList.length + " saved password setting" + (passList.length > 1 ? "s" : "") + "", true);
			if (pass === null)
				return false;

			for(let i = 0; i < prefList.length; i++)
			{
				data.settings[prefList[i]] = core.pref(prefList[i]);
			}
			data.list = {};
			for(let i = 0; i < passList.length; i++)
			{
				data.list[passList[i].domain] = [
					passList[i].siteTag,
					passList[i].masterKey,
					passList[i].options,
					passList[i]._login.timeCreated,
					passList[i]._login.timeLastUsed,
					passList[i]._login.timePasswordChanged,
					passList[i]._login.timesUsed]
//				data.list[passList[i].domain] = [passList[i].siteTag, passList[i].masterKey, passList[i].options];
//				delete passList[i].domain;
			}

			if (pass !== "")
			{
				data.list["!"] = (new Date()).getTime();
				let list = JSON.stringify(data.list),
						crc = that.crc(list);
				let _pass = pass;
				pass = pass + pass.length + that.getHash(pass);
				data.list = that.cipher(crc + list, pass);
				data.list = cipherVersion + that.crc(data.list) + data.list;

			}
			let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker),
					t = new Date(),
					date = t.getFullYear()
							+ ("0" + (t.getMonth() + 1)).slice(-2)
							+ ("0" + t.getDate()).slice(-2)
							+ ("0" + t.getHours()).slice(-2)
							+ ("0" + t.getMinutes()).slice(-2)
							+ ("0" + t.getSeconds()).slice(-2);

			fp.init(window, "Select a File", Ci.nsIFilePicker.modeSave);
			fp.appendFilter("PassHash", "*.passhash");
			fp.defaultString = "PassHash_v" + core.addon.version + "_" + date;
			fp.defaultExtension = "passhash";
			let rv = this.fpShow(fp);
			if (rv == Ci.nsIFilePicker.returnCancel)
				return {status: this.restoreStatusCanceled};

			let r = this.saveFile(fp, JSON.stringify(data));
			if (r)
			{
				if (this.confirm("Open folder?", "File saved"))
					fp.file.reveal();
			}

		},//onCmdBackup()

		
		onCmdRestore: function(e)
		{
			let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker),
					core = PassHashCommon.phCore,
					that = PassHashOptions,
					pref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getDefaultBranch(core.PREF),
					t = new Date(),
					date = t.getFullYear()
							+ ("0" + (t.getMonth() + 1)).slice(-2)
							+ ("0" + t.getDate()).slice(-2)
							+ ("0" + t.getHours()).slice(-2)
							+ ("0" + t.getMinutes()).slice(-2)
							+ ("0" + t.getSeconds()).slice(-2);

			fp.init(window, "Select backup File", Ci.nsIFilePicker.modeOpen);
			fp.appendFilter("PassHash", "*.passhash");
			fp.defaultExtension = "passhash";
			let rv = this.fpShow(fp);
			if (rv == Ci.nsIFilePicker.returnCancel)
				return {status: this.restoreStatusCanceled};

			let data = null,
					_data = this.readFile(fp.file);
			try
			{
				data = JSON.parse(_data);
			}
			catch(e)
			{
log(e);
				alert("Unable parse backup file\nBackup file is corrupted");
				return;
			}
			if (typeof(data.list) == "string")
			{
				let list = data.list,
						cipherVersion = list.substr(0, 1),
						crc = list.substr(1, 128),
						_list = list.substr(129);

				if (crc != that.crc(_list))
				{
					alert("Backup file is corrupted");
					return false;
				}

				let r = true,
						msg,
						p = 0,
						_pass = [];

				while(1)
				{
					let password,
							prompt = null;

					list = _list;
					if (p < _pass.length)
					{
						password = _pass[p++];
					}
					else
					{
						password = prompt = this.promptPassword(msg, "Enter your password to decrypt this backup", undefined, undefined, fp.file.path);
					}
					if (password === null)
						return false;

					pass = password + password.length + that.getHash(password);
					list = that.cipher(list, pass),
					crc = list.substr(0, 128);
					list = list.substr(128);

					if (crc != that.crc(list))
					{
						msg = "Incorrect password";
					}
					else
					{
						try
						{
							data.list = JSON.parse(list);
							delete data.list["!"];
						}
						catch(e)
						{
		log(e);
							delete data.list;
						}
						break;
					}
				}
			}
//log(data);
			if ("settings" in data)
			{
				for(let i in data.settings)
				{
					if (i == "version")
						continue;

					core.pref(i, data.settings[i]);
				}
				this.initOptions();
			}

			if ("list" in data)
			{
				let passList = core.getSavedEntries(),
						list = {},
						count = 0;

				for(let i = 0; i < passList.length; i++)
				{
					list[passList[i].domain] = [passList[i].siteTag, passList[i].masterKey, passList[i].options]
				}
//log(list);
				for(let domain in data.list)
				{
					let i = data.list[domain],
							d = list[domain] ? list[domain] : [];
//log(domain, i);

					if (d.toString() != i.slice(0,3).toString())
					{
						count++;
						setTimeout(function()
						{
							core.saveSecureValue(domain, i[0], i[1], i[2], undefined, {
									timeCreated: i[3],
									timeLastUsed: i[4],
									timePasswordChanged: i[5],
									timesUsed: i[6]
								});
						});
					}
				}
				if (count)
					this.alert("Restored " + count + " login" + (count > 1 ? "s" : ""));
			}
		},//onCmdRestore()

		onCmdDelete: function(e)
		{

			let core = PassHashCommon.phCore,
					prefix = "passhash",
					reg = new RegExp("^" + PassHashCommon.phCore.escapeRegExp(PassHashCommon.phCore.prefix) + "(.*)", ""),
					logins = core.loginManager.findLogins({}, "", "passhash", null);

			if (!logins.length)
			{
				this.alert("No Password Hasher logins found");
				return;
			}
			if (!this.confirm("This will permanently delete " + logins.length + " stored Password Hasher login" + (logins.length > 1 ? "s" : "") + ".\n\nAre you sure you want continue?", "Delete all logins"))
				return;

			let a = [];
			for(let i = 0; i < logins.length; i++)
			{
				loginManager.removeLogin(logins[i]);
//log(logins[i]);
			}
		},

		_openDialog: function(url, b, c, arg)
		{

			let wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
					wins = wm.getZOrderDOMWindowEnumerator('', false),
					win;
			if (!url.match("/"))
				url = "chrome://passhash/content/" + url;

			if (typeof(arg) == "undefined")
				arg = {};

			arg.window = window;
			arg.document = document;
			arg.wrappedJSObject = arg;
			while (win = wins.getNext())
			{
				if (win.location.href.toString() == url)
				{
					if (!arg.multiple)
					{
						win.focus();
						if (win.PassHash && win.PassHash.focus)
							win.PassHash.focus(arg)

						return;
					}
				}
			}
		/*
			Cc["@mozilla.org/embedcomp/window-watcher;1"]
				.getService(Ci.nsIWindowWatcher)
				.openWindow(null, a, b, c, arg);
		*/
			window.openDialog(url, b, c, arg);
		},//openDialog()

		promptPassword: function(msg, title, newPass, set, file)
		{
			let r = {return: null, msg: msg, title: title, newPass: newPass, set: set, file: file};
		//	this._openDialog("password.xul", "", "chrome,resizable=no,centerscreen," + (this.isMac ? "dialog=no" : "modal"), r);
			this._openDialog("password.xul", "", "chrome,resizable=no,centerscreen,dialog=no,modal", r);
			return r.return;
		},

		command: function(c)
		{
			c = String(c);
			let f = "onCmd" + c[0].toUpperCase() + c.slice(1);
			if (c && f in this && typeof(this[f]) == "function")
			{
				return this[f].apply(this, Object.assign([], arguments).slice(1));
			}
			return false
		},
		
		onHashWordSize: function(e)
		{
			let sha3 = document.getElementById("pshOpt_sha3");
			if (e.target.value > 26)
			{
				sha3._checked = sha3.checked;
				sha3.disabled = true;
				sha3.checked = true;
			}
			else
			{
				sha3.disabled = false;
				if ("_checked" in sha3)
					sha3.checked = sha3._checked;

				delete sha3._checked;
			}
		}
}
