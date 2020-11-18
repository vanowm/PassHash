const EXPORTED_SYMBOLS = ["phCore"],
			PREF = "extensions.passhash.",
			{classes: Cc, interfaces: Ci, utils: Cu} = Components,
			BOTTOM = 1,
			LEFT = 2,
			RIGHT = 4,
			COMPACT = 8;

Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");


var log = console.log.bind(console);
var phCore = {
	host: "passhash.passhash",
	prefix: "passhash ",
	PREF: PREF,
	BOTTOM: BOTTOM,
	RIGHT: RIGHT,
	LEFT: LEFT,
	COMPACT: COMPACT,
	_prefs: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch(PREF),
	loginManager: Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager),
	optsDefault:
	{
		autocomplete:					{default: false},
		dblClick:							{default: true},
		guessFullDomain:			{default: false},
		guessSiteTag:					{default: true},
		hashWordSize:					{default: 26, min: 4, max: 100},
		lastOptions:					{default: ""},
		markerPosition:				{default: BOTTOM,
														filter: function(i)
														{
															i = ~~i
															if (i < 1 || i > 12 || ((i & BOTTOM ? 1 : 0) + (i & LEFT ? 1 : 0) + (i & RIGHT ? 1 : 0)) != 1)
																return BOTTOM;
															return i;
														}
													},
		markerSize:						{default: 12, min: 4, max: 20},
		masterKeyAddTag:			{default: false},
		middleClick:					{default: true},
		rememberMasterKey:		{default: false},
		rememberSiteTag:			{default: true},
		requireDigit:					{default: true},
		requireMixedCase:			{default: true},
		requirePunctuation:		{default: true},
		restoreLast:					{default: false},
		restrictPunctuation:	{default: 1},
		revealHashWord:				{default: false},
		revealSiteTag:				{default: true},
		sha3:									{default: false},
		shortcutKeyCode:			{default: "VK_F6"},
		shortcutKeyMods:			{default: "accel"},
		showMarker:						{default: true},
		unmaskMarker:					{default: false},
	},
	onPrefChange:
	{
		observe: function(pref, aTopic, key)
		{
			let val, obj = phCore.optsDefault,
					that = phCore.onPrefChange;

			if(aTopic != "nsPref:changed" || typeof(obj[key]) == "undefined")
				return;

			obj = obj[key];
			switch (pref.getPrefType(key))
			{
				case Ci.nsIPrefBranch.PREF_BOOL:
						if (typeof(obj.default) != "boolean")
							return false;

						val = pref.getBoolPref(key);
					break;
				case Ci.nsIPrefBranch.PREF_INT:
						if (typeof(obj.default) != "number")
							return false;

						val = pref.getIntPref(key);
						let fix = false
						if ("min" in obj && val < obj.min)
						{
							val = obj.min;
							fix = true;
						}
						else if ("max" in obj && (val > obj.max && obj.max != -1))
						{
							val = obj.max != -1 ? obj.max : phCore.opts[key];
							fix = true;
						}
						else if ("filter" in obj)
						{
							let valNew = obj.filter(val);
							if (valNew != val)
							{
								fix = true;
								val = valNew;
							}
						}
						if (fix)
							pref.setIntPref(key, val);
					break;
				case Ci.nsIPrefBranch.PREF_STRING:
						if (typeof(obj.default) != "string")
							return false;

						val = phCore.prefString(pref, key);
						if ("regexp" in obj && val.match(obj.regexp))
						{
							let str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
							val = val == phCore.opts[key] ? obj.default : phCore.opts[key];
							phCore.prefString(pref, key, str);
						}
					break;
				default:
					return;
			}
log(key, val);
			phCore.opts[key] = val;
			for(let i = 0; i < that._observers.length; i++)
			{
				try
				{
					that._observers[i](key, val);
				}
				catch(e)
				{
log(e);
				}
			}
		},
		_observers: [],
		addObserver: function(observer)
		{
			if (this._observers.indexOf(observer) == -1)
				this._observers[this._observers.length] = observer;

		},
		removeObserver: function(observer)
		{
			let i = this._observers.indexOf(observer);
			if (i != -1)
				this._observers.splice(i, 1);
		}
	},

	opts: {},

	setDefaultPrefs: function(reset)
	{
		let obj = this.optsDefault,
				opts = this.opts,
				domain = "",
				branch = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getDefaultBranch(PREF);
		for (let key in obj)
		{
			let val = obj[key],
					force = false,
					name = domain + key,
					type = branch.getPrefType(name);

			switch (typeof(val.default))
			{
				case "boolean":
						//make sure the setting is correct type
						if (type != Ci.nsIPrefBranch.PREF_BOOL && type != Ci.nsIPrefBranch.PREF_INVALID)
						{
							branch.deleteBranch(name);
						}
						branch.setBoolPref(name, val.default);

						if (reset)
						{
							this._prefs.setBoolPref(name, val.default);
							this._prefs.clearUserPref(name);
						}

						opts[key] = this._prefs.getBoolPref(name);
					break;
				case "number":
						//make sure the setting is correct type
						if (type != Ci.nsIPrefBranch.PREF_INT && type != Ci.nsIPrefBranch.PREF_INVALID)
						{
							branch.deleteBranch(name);
						}
						branch.setIntPref(name, val.default);

						let prev = opts[key];
						opts[key] = this._prefs.getIntPref(name);
						if (reset)
						{
							opts[key] = prev = val.default;
						}
						//make sure the setting is in allowed range
						if (("min" in val && opts[key] < val.min) || ("max" in val && (val.max != -1 && opts[key] > val.max)))
						{
							opts[key] = typeof(prev) != "undefined" ? prev : val.default;
							reset = true;
						}
						if (reset)
						{
							branch.setIntPref(name, opts[key]);
							this._prefs.clearUserPref(name);
						}
					break;
				case "string":
						//make sure the setting is correct type
						if (type != Ci.nsIPrefBranch.PREF_STRING && type != Ci.nsIPrefBranch.PREF_INVALID)
						{
							branch.deleteBranch(name);
						}
						this.prefString(branch, name, val.default);

						opts[key] = this.prefString(this._prefs, name);
						if (reset || ("regexp" in val && opts[key].match(val.regexp)))
						{
							if (reset && name != "version")
							{
								bfht.prefString(this._prefs, name, val.default);
								this._prefs.clearUserPref(name);
							}
						}
					break;
				default:
					continue;
			}
		}
//log(this.opts);
	},

	pref: function(key, val, pref)
	{
		let t = typeof(this.opts[key]),
				type = {
						boolean: "Bool",
						number: "Int"
				};
		if (!pref)
			pref = this._prefs;

		if (typeof(val) == "undefined")
		{
			if (type[t])
			{
				this.opts[key] = pref['get' + type[t] + 'Pref'](key);
			}
			else
			{
				this.opts[key] = this.prefString(pref, key);
			}
		}
		else
		{
			this.opts[key] = val;
			if (type[t])
			{
				pref['set' + type[t] + 'Pref'](key, val);
			}
			else
			{
				this.prefString(pref, key, val);
			}
		}
//log(key, this.opts[key]);
		return this.opts[key];
	},

	escapeRegExp: function (string)
	{
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	},

	onCopy: function(text)
	{
		if (text.replace(/(^\s+|\s+$)/g, "") === "")
			return;

		Components.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper)
			.copyString(text);
	},

/*
	getSavedEntries: function()
	{
		let loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager),
				logins = loginManager.getAllLogins(),
				reg = new RegExp("^" + this.escapeRegExp(this.prefix) + "(.*)", ""),
				array = {},
				keys = [],
				entries = [];

		for(let i = 0; i < logins.length; i++)
		{
			let domain = logins[i].hostname.match(reg);
			if (!domain)
				continue;

			let data = [];
			try
			{
				data = JSON.parse(logins[i].password);
			}
			catch(e)
			{
				continue;
			}
			array[data[0]] = {
				siteTag: data[0],
				masterKey: data[1],
				options: data[2],
				domain: domain[1]
			}
		}
		keys = Object.keys(array).sort();
		for(let i = 0; i < keys.length; i++)
		{
			entries[entries.length] = array[keys[i]];
		}
		return entries;
	},
*/
	getSavedEntries: function()
	{
		let loginManager = this.loginManager,
				logins = loginManager.findLogins({}, "", "passhash", null),
				reg = new RegExp("^" + this.escapeRegExp(this.prefix) + "(.*)", ""),
				array = {},
				keys = [],
				entries = [];

		for(let i = 0; i < logins.length; i++)
		{
			let domain = logins[i].hostname.match(reg),
					data = [];
			if (!domain)
				continue;

			try
			{
				data = JSON.parse(logins[i].password);
			}
			catch(e)
			{
				continue;
			}
			array[data[0]] = {
				siteTag: data[0],
				masterKey: data[1],
				options: data[2],
				domain: domain[1],
				_login: logins[i].QueryInterface(Ci.nsILoginMetaInfo)
			}
		}
		keys = Object.keys(array).sort();
		for(let i = 0; i < keys.length; i++)
		{
			entries[entries.length] = array[keys[i]];
		}
		return entries;
	},

	findLogin: function(domain)
	{
		return this.loginManager.findLogins({}, this.prefix + domain, "passhash", null);
	},

	loadSecureValue: function(domain)
	{
			let r = this.findLogin(domain)[0];
			try
			{
				r = JSON.parse(r.password);
			}
			catch(e)
			{
				r = [];
			}
			return r;
	},

	saveSecureValue: function(domain, siteTag, masterKey, options, login, meta)
	{
		if (!domain)
			return false;

		let newLogin = Cc["@mozilla.org/login-manager/loginInfo;1"].createInstance(Ci.nsILoginInfo),
				currentLogin = [],
				value = JSON.stringify([
					siteTag,
					masterKey,
					options
				]);

		newLogin.init(this.prefix + domain, 'passhash', null, "", value, "", "");

		if (meta)
		{
			newLogin = newLogin.QueryInterface(Ci.nsILoginMetaInfo);
			for(let i in meta)
			{
				newLogin[i] = meta[i];
			}
		}
		if (typeof(login) == "undefined")
			currentLogin = this.findLogin(domain);
		else
			currentLogin = login;
//log(domain + " " + currentLogin.length);
		if (!currentLogin.length)
		{
			try
			{
				this.loginManager.addLogin(newLogin);
			}
			catch(e)
			{
				return false;
			}
		}
		else
		{
			try
			{
				this.loginManager.modifyLogin(currentLogin[0], newLogin);
			}
			catch(e)
			{
				return false;
			}
		}

		return true;
	},//saveSecureValue()

	saveOptions: function(opts)
	{
		if (!opts)
			opts = this.opts;

		let prefs = this._prefs,
				type = {
					boolean: "Bool",
					number: "Int"
				};

		for (let i in opts)
		{
			let t = typeof(opts[i]);
			if (type[t])
				prefs['set' + type[t] + 'Pref'](i, opts[i]);
			else
				this.prefString(prefs, i, opts[i]);
		}
	},

	prefString: function(pref, key, val)
	{
		let r, er = [{pref:pref,key:key,val:val}];
		if (typeof(val) == "undefined")
		{
			try
			{
				r = pref.getComplexValue(key, Ci.nsISupportsString).data;
			}
			catch(e)
			{
				er.push(e);
				try
				{
					r = pref.getStringPref(key);
				}
				catch(e)
				{
					er.push(e);
					try
					{
						r = pref.getComplexValue(key, Ci.nsIPrefLocalizedString).data;
					}
					catch(e)
					{
						er.push(e);
						try
						{
							r = pref.getCharPref(key);
						}
						catch(e)
						{
							er.push(e);
							log(er);
						}
					}
				}
			}
		}
		else
		{
			try
			{
				let str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
				str.data = val;
				r = pref.setComplexValue(key, Ci.nsISupportsString, str);
			}
			catch(e)
			{
				er.push(e);
				try
				{
					r = pref.setStringPref(key,val);
				}
				catch(e)
				{
					er.push(e);
					try
					{
						let str = Cc["@mozilla.org/pref-localizedstring;1"].createInstance(Ci.nsIPrefLocalizedString);
						str.data = val;
						r = pref.setComplexValue(key, Ci.nsIPrefLocalizedString, str);
					}
					catch(e)
					{
						er.push(e);
						try
						{
							r = pref.setCharPref(key, val);
						}
						catch(e)
						{
							er.push(e);
							log(er);
						}
					}
				}
			}
		}
		return r;
	},//prefString()

	newPropertyBag(aProperties) {
		let propertyBag = Cc["@mozilla.org/hash-property-bag;1"]
											.createInstance(Ci.nsIWritablePropertyBag);
		if (aProperties) {
			for (let [name, value] of Object.entries(aProperties)) {
				propertyBag.setProperty(name, value);
			}
		}
		return propertyBag.QueryInterface(Ci.nsIPropertyBag)
											.QueryInterface(Ci.nsIPropertyBag2)
											.QueryInterface(Ci.nsIWritablePropertyBag2);
	},

	optionBits:
	{
		hashWordSize: 127,
		requireDigit: 128,
		requirePunctuation: 256,
		requireMixedCase: 1024,
		restrictSpecial: 2048,
		restrictDigits: 4096,
		sha3: 8192,
		restrictPunctuation: 2147483647, //30 characters bitwise stored as number after decimal point of options value, starting at bit2.
																		 //bit1 used as identifier of new default 30 charcters
		restrictPunctuationLegacy: 65535 //legacy 15 character bitwise after decimal point starting at bit2. Bit1 is unsued.
	},
	string2filter(str)
	{
		let r = 0;
		for(let i = 1; i < 31; i++)
		{
			if (str.indexOf(String.fromCharCode(32 + i + (i > 15 ? i > 22 ? i > 27 ? 63 : 36 : 10 : 0))) != -1)
				r |= 1 << i;

		}
		return r;
	},

	filter2string(filter)
	{
		let r = "";
		for(let i = 1; i < 31; i++)
		{
			if ((filter >> i) & 1)
				r += String.fromCharCode(32 + i + (i > 15 ? i > 22 ? i > 27 ? 63 : 36 : 10 : 0));
		}
		return r;
	},
};
phCore.setDefaultPrefs();
AddonManager.getAddonByID("passhash@mozilla.wijjo.com", function(addon)
{
	phCore.addon = addon;
	let prefs = phCore._prefs,
			version = "",
			compare = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator).compare;
	if (!prefs.prefHasUserValue("version"))
	{
		let logins = phCore.loginManager.findLogins({}, phCore.host, "passhash", null),
				data = {},
				n = 0;

		for(let i = 0; i < logins.length; i++)
		{
			let login = logins[i].username.match(/^(master-key|site-tag|options)-(.*)/);
			if (!data[login[2]])
			{
				data[login[2]] = {};
				n++;
			}

			data[login[2]][login[1]] = logins[i].password;
			if (!data[login[2]].l)
				data[login[2]].l = [];

			data[login[2]].l.push(logins[i]);
		}
		if (n)
		{
			let ok = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).confirm(null,
								addon.name + " v" + addon.version, n + " login" + (n > 1 ? "s" : "") + " needs to be converted to the new format.\n\nThis might take a few minutes and make browser inaccessible during the update.");

			if (ok)
			{
				for(i in data)
				{
					let s = phCore.saveSecureValue(i, data[i]["site-tag"], data[i]["master-key"], data[i].options, [data[i].l[0]]) ? 1 : 0;
					for(let n = s; n < data[i].l.length; n++)
					{
						phCore.loginManager.removeLogin(data[i].l[n]);
					}
				}
				Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).alert(null,
								addon.name + " v" + addon.version, "Login database has been updated");
			}
		}
	}
	else
	{
		phCore.versionPrev = prefs.getCharPref("version");
	}
	if (phCore.versionPrev != addon.version)
	{
		if (compare(phCore.versionPrev, "1.1.8.2") <= 0)
		{
			let type = {
							boolean: "Bool",
							number: "Int"
					},
					oldPrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("passhash.");

			for(let i in phCore.opts)
			{
				let o = "opt" + i.charAt(0).toUpperCase() + i.slice(1);
				if (oldPrefs.prefHasUserValue(o))
				{
					let t = typeof(phCore.opts[i]),
							val;
					if (type[t])
					{
						val = oldPrefs['get' + type[t] + 'Pref'](o);
						prefs['set' + type[t] + 'Pref'](i, val);
					}
					else
					{
						val = phCore.prefString(oldPrefs, o);
						phCore.prefString(prefs, i, val);
					}
					oldPrefs.clearUserPref(o);
				}
				o = {
					digitDefault: "requireDigit",
					punctuationDefault: "requirePunctuation",
					mixedCaseDefault: "requireMixedCase",
					hashWordSizeDefault: "hashWordSize"
				}
				type = {};
				type[Ci.nsIPrefBranch.PREF_BOOL] = "Bool";
				type[Ci.nsIPrefBranch.PREF_INT] = "Int";
				for(let i in o)
				{
					if (prefs.prefHasUserValue(i))
					{
						let t = prefs.getPrefType(i),
								val;
						if (type[t])
						{
							val = prefs['get' + type[t] + 'Pref'](i);
							prefs['set' + type[t] + 'Pref'](o[i], val);
						}
						else
						{
							val = phCore.prefString(prefs, i);
							phCore.prefString(prefs, o[i], val);
						}
						prefs.clearUserPref(i);
					}
				}
			}
//convert options to bitwise
			let reg = new RegExp("^" + phCore.escapeRegExp(phCore.prefix) + "(.*)", ""),
					logins = phCore.loginManager.findLogins({}, "", "passhash", null),
					o = 
					{
						d: "requireDigit",
						p: "requirePunctuation",
						m: "requireMixedCase",
						r: "restrictSpecial",
						g: "restrictDigits",
						s: "sha3"
					};
					
			for(let i = 0; i < logins.length; i++)
			{
				let login = logins[i].QueryInterface(Ci.nsILoginMetaInfo),
						domain = login.hostname.match(reg),
						data = [];

				if (!domain)
					continue;

				try
				{
					data = JSON.parse(login.password);
				}
				catch(e)
				{
					continue;
				}
				if (typeof(data[2]) == "number")
					continue;

				let options = data[2],
						sizeMatch = options.match(/[0-9]+/),
						n = (sizeMatch != null && sizeMatch.length > 0
																		? parseInt(sizeMatch[0])
																		: 8);
				options.replace(/[dpmrgs]/g, function(a)
				{
					if (a in o)
						n += phCore.optionBits[o[a]];
				});
				data[2] = n;
				phCore.loginManager.modifyLogin(login, phCore.newPropertyBag({
					password: JSON.stringify(data),
					timeCreated: login.timeCreated,
					timeLastUsed: login.timeLastUsed,
					timePasswordChanged: login.timePasswordChanged,
				}));
			}
		}

		prefs.setCharPref('version', addon.version);
	}
	try
	{
		prefs.QueryInterface(Ci.nsIPrefBranch).addObserver('', phCore.onPrefChange, false);
	}
	catch(e)
	{
		prefs.QueryInterface(Ci.nsIPrefBranch2).addObserver('', phCore.onPrefChange, false);
	}
});


let self = this;
	function openConsole()
	{
log("to stop error console from opening on startup disable debug mode in MasterPassword+ options -> Help -> Debug level");
		AddonManager.getAllAddons(function(addons)
		{
			let win = null;
			function toOpenWindowByType(inType, uri, features)
			{
					let win = Services.wm.getMostRecentWindow(inType),
							ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
				try
				{
					if (win)
						return win;
					else if (features)
						win = ww.openWindow(null, uri, inType, features, null);
					else
						win = ww.openWindow(null, uri, inType, "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar", null);
				}
				catch(e){log(e)}

				return win;
			}
			addons.forEach(function(addon)
			{
				if (!addon.isActive || addon.id != "{1280606b-2510-4fe0-97ef-9b5a22eafe80}")
					return;

				try
				{
					win = toOpenWindowByType("global:console", "chrome://console2/content/console2.xul");
				}
				catch(e)
				{
		//			log(e)
				}
			})
			if (win)
				return;

			let _HUDService;
			try
			{
				Object.defineProperty(self, "HUDService", {
					get: function HUDService_getter() {
						let devtools = Cu.import("resource://devtools/shared/Loader.jsm", {}).devtools;
						return devtools.require("devtools/client/webconsole/hudservice");
					},
					configurable: true,
					enumerable: true
				});
				_HUDService = (HUDService.HUDService) ? HUDService.HUDService : HUDService;
			}
			catch(e)
			{
				log(e);
			}
			try
			{
				win = _HUDService.getBrowserConsole();
	//				HUDService.openBrowserConsoleOrFocus();
				if (win)
				{
					win.focus();
					return;
				}
			}
			catch(e)
			{
				log(e)
			}

			try
			{
				win = _HUDService.openBrowserConsoleOrFocus();
				if (win)
				{
					try
					{
						win.focus();
					}
					catch(e)
					{
win.then(function(e)
{
	e.chromeWindow.focus();
	return;
}).catch(function(e)
{
	log(e);
});;
					}
					return;
				}
			}
			catch(e)
			{
log(win);
				log(e)
			}

			try
			{
				win = _HUDService.toggleBrowserConsole();
				if (win)
				{
					win.focus();
					return;
				}
			}
			catch(e)
			{
				log(e);
			}

			try
			{
				win = toOpenWindowByType("global:console", "chrome://global/content/console.xul")
				if (win)
				{
					win.focus();
					return;
				}
			}
			catch(e)
			{
				log(e)
			}
		});
	}
//openConsole();