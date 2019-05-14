const EXPORTED_SYMBOLS = ["phCore"],
			{classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");


var log = console.log.bind(console);
var phCore = {
		host: "passhash.passhash",
		prefix: "passhash ",
		prefs: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("passhash."),
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
					domain: domain
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
			let loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
			return loginManager.findLogins({}, this.prefix + domain, "passhash", null);
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

		saveSecureValue: function(save, domain, siteTag, masterKey, options, login)
		{
			if (!domain)
				return false;

			let loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager),
					newLogin = Cc["@mozilla.org/login-manager/loginInfo;1"].createInstance(Ci.nsILoginInfo),
					currentLogin = [],
					value = JSON.stringify([
						siteTag,
						masterKey,
						options
					]);

			newLogin.init(this.prefix + domain, 'passhash', null, "", value, "", "");

			if (typeof(login) == "undefined")
				currentLogin = this.findLogin(domain);
			else
				currentLogin = login;
//log(domain + " " + currentLogin.length);
			if (!currentLogin.length)
			{
				try
				{
					loginManager.addLogin(newLogin);
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
					loginManager.modifyLogin(currentLogin[0], newLogin);
				}
				catch(e)
				{
					return false;
				}
			}

			return true;
		}
};

AddonManager.getAddonByID("passhash@mozilla.wijjo.com", function(addon)
{
	phCore.addon = addon;
	let prefs = phCore.prefs;

	if (!prefs.prefHasUserValue("version"))
	{
//		let compare = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator).compare;
		let loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager),
				logins = loginManager.findLogins({}, phCore.host, "passhash", null),
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
		let ok = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).confirm(null,
							addon.name + " v" + addon.version, n + " login" + (n > 1 ? "s" : "") + " needs to be converted to the new format.\n\nThis might take a few minutes and make browser inaccessible during the update.");

		if (ok)
		{
			for(i in data)
			{
				let s = phCore.saveSecureValue(true, i, data[i]["site-tag"], data[i]["master-key"], data[i].options, [data[i].l[0]]) ? 1 : 0;
				for(let n = s; n < data[i].l.length; n++)
				{
					loginManager.removeLogin(data[i].l[n]);
				}
			}
			Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).alert(null,
							addon.name + " v" + addon.version, "Login database has been updated");

		prefs.setCharPref('version', addon.version);
		}
	}
});
