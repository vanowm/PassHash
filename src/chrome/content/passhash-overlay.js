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

// Some marker management code was dapted from informenter extension code
//  informenter URL: http://informenter.mozdev.org/
var PassHash =
{
    markerNumber: 1,
    bits: {
    	showMarker: 16,
    	unmaskMarker: 32,
    	get size()
    	{
    		let i = 1;
    		do
    		{
    			i++;
    			if (!(this.unmaskMarker >> i))
    				return i;
    		}
    		while (i < 32);
    	}
    },
    get markerBits()
    {
    	return this.options.markerPosition | (this.options.showMarker ? this.bits.showMarker : 0) | (this.options.unmaskMarker ? this.bits.unmaskMarker : 0) | this.options.markerSize << this.bits.size
    },
    phLoopTimer: null,
    options: null,

    onLoad: function(e)
    {
    	let node = e ? e.target.ownerDocument || e.target : this;
    	node = this;
			clearTimeout( node._phTimer );
			node._phTimer = setTimeout(PassHash.init.bind(PassHash, e), 1000);
		},
		init: function(e)
		{

   		let doc = e && e.target.ownerDocument ? e.target.ownerDocument.defaultView || window.content : window.content;
/*
if (e.type == "load")
{
	window.minimize();
	setTimeout(function()
	{
		window.restore();
		window.focus();
	log("onLoad", e);
	}, 1000);
}
*/
//log("onLoad", e);
			if (!this.options)
       	this.options = PassHashCommon.loadOptions();
				if (this.options.showMarker || this.options.unmaskMarker)
					this.addMarkers(doc);

				if (!e || e.type != "load" || window.__phInited)
					return;

        window.__phInited = true;
        try{document.getElementById("contentAreaContextMenu").
            addEventListener("popupshowing", this.onContextMenuUpdate, false);}catch(e){log(e)}
        window.addEventListener("click", this.checkMarkerClick, true);
        window.addEventListener("dblclick", this.dblclick, true);
			  try{gBrowser.addEventListener("load", this.onLoad, true);}catch(e){console.log(e)};
//			  try{gBrowser.addEventListener("DOMContentLoaded", this.onLoad, true);}catch(e){console.log(e)};

        // Override the default shortcut key?
        if (this.options.shortcutKeyCode && this.options.shortcutKeyMods)
        {
            var elementKey = document.getElementById("key_passhash");
            if (this.options.shortcutKeyCode.substr(0, 3) == "VK_")
            {
                elementKey.removeAttribute("key");
                elementKey.setAttribute("keycode", this.options.shortcutKeyCode);
            }
            else
            {
                elementKey.removeAttribute("keycode");
                elementKey.setAttribute("key", this.options.shortcutKeyCode);
            }
            elementKey.setAttribute("modifiers", this.options.shortcutKeyMods);
        }
    },

		onUnLoad: function(e)
		{
//log("onUnLoad", e);
			if (e.originalTarget == document)
       clearInterval(PassHash.phLoopTimer);
		},
    getTextNode: function()
    {
        var node = document.commandDispatcher.focusedElement;
        if (node != null && PassHashCommon.isTextNode(node) && !node.disabled && !node.readOnly)
            return node;
        return null;
    },

    onInvokeDialog: function()
    {
        var textNode = this.getTextNode();
//        if (textNode != null)
            this.invokeDialog(textNode);
    },

		onSettings: function()
		{
			let output = {};
//			chrome://passhash/content/passhash-options.xul
        window.openDialog("chrome://passhash/content/passhash-options.xul", "dlgopt",
                          "centerscreen", output);
				this.options = PassHashCommon.loadOptions();
		},

    onContextMenuUpdate: function(e)
    {
        document.getElementById("contextmenu_passhash")
                        .setAttribute("hidden", !gContextMenu.onTextInput);
    },

		autocompleteOn: function autocompleteOn(node, on)
		{
			if (!node || !node.hasAttribute)
				return;

			if (node.hasAttribute("autocomplete"))
			{
				if (!("_PassHashAutocomplete" in node))
					node._PassHashAutocomplete = node.getAttribute("autocomplete");

				node.setAttribute("autocomplete", on ? "on" : node._PassHashAutocomplete);
			}

			PassHash.autocompleteOn(node.parentNode, on);
		},

		addMarker: function(node)
		{
			if (node && node.tagName == "INPUT" && node._PassHashAutocomplete === undefined)
				PassHash.autocompleteOn(node, PassHash.options.autocomplete);

			if (!node || node.tagName != "INPUT" || (node.getAttribute("type") != "password" && !node.hasAttribute("passhashmarkers")) || !PassHashCommon.isVisible(node) || node.hasAttribute("phNoMarkers"))
				return;

			PassHash.attachMarkers(node);
//			node._phInited = true;
		},

    addMarkers: function(windowCurrent)
    {
      if (!windowCurrent)
        return;

        var inputs = windowCurrent.document.getElementsByTagName("input");

        for (var i = 0; i < inputs.length; i++)
        {
        	this.addMarker(inputs[i]);
/*
            var type = inputs[i].getAttribute("type");
            if (type == "password" && !inputs[i].hasAttribute("passHashMarkers"))
                this.attachMarkers(windowCurrent.document, inputs[i], dialogButton, unmaskButton);
*/
        }

        /* Recursively process subframes */
        for (i = 0; i < windowCurrent.frames.length; i++)
        {
            this.addMarkers(windowCurrent.frames[i]);
        }
    },

		_loopList: [],
		loopAdd: function(func)
		{
			if (PassHash._loopList.indexOf(func) == -1)
			{
				PassHash._loopList[PassHash._loopList.length] = func;
			}
			if (PassHash.phLoopTimer === null)
				PassHash.phLoopTimer = setInterval(PassHash.loop, 300);

			return PassHash._loopList.length;
		},

		loopRemove: function(func)
		{
			let i = typeof(func) == "function" ? PassHash._loopList.indexOf(func) : func;
			if (PassHash._loopList[i])
				PassHash._loopList[i] = null;
		},

		loop: function()
		{
			for(let i = 0; i < PassHash._loopList.length; i++)
			{
				if (PassHash._loopList[i] === null)
				{
					PassHash._loopList.splice(i, 1);
					--i;
					continue;
				}

				if (PassHash._loopList[i])
				{
					try
					{
						PassHash._loopList[i]();
					}
					catch(e)
					{
						PassHash.loopRemove(PassHash._loopList[i]);
					}
				}
			}
			if (!PassHash._loopList.length)
			{
				clearInterval(PassHash.phLoopTimer);
				PassHash.phLoopTimer = null;
			}
		},
		
    attachMarkers: function(field, force)
    {
    	let bits = this.markerBits;

    	if (field._phInited == bits && !force)
    		return;

			let doc = field.ownerDocument,
					win = doc.defaultView;

			if (field._phInited && field._phInited != bits)
			{
				let node = doc.getElementById("passhashMarkers" + field.getAttribute("passHashMarkers"));
				if (node)
				{
					node.parentNode.removeChild(node);
					if (field.__style)
						field.setAttribute("style", field.__style);
				}
			}
    	field._phInited = bits;
    	window._phMarkerBits = bits;
        // Prevent reprocessing this field
//        field.setAttribute("phNoMarkers", true);
//        if (this.options.showMarker || this.options.unmaskMarker)
//        {
            var tableNode = doc.createElement("TABLE"),
            		trNode = doc.createElement("TR"),
            		setStyle = this.setStyle,
            		display = this.options.markerPosition & PassHashCommon.phCore.COMPACT ? "block" : "block";//"table";

						field.__style = field.getAttribute("style");

let markers = '<span class="passHashMarkers"><span class="passHashMarker">#</span><span class="passHashUnmask">*</span></span>',
		nodeBox = new DOMParser().parseFromString(markers, "text/html").lastChild.lastChild.firstChild,
		nodeMarker = nodeBox.firstChild,
		nodeUnmask = nodeBox.lastChild,
		nodesNum = (this.options.showMarker ? 1 : 0) + (this.options.unmaskMarker ? 1 : 0);

nodeBox.id = "passhashMarkers" + this.markerNumber;
setStyle(nodeBox, {
	margin: 0,
	display: "table",
	"border-spacing": "0",
	"border-collapse": "collapse",
//	"background-color": "red",
	border: 0,
	padding: 0,
	position: "relative",
	"pointer-events": "all",
	"z-index": window.getComputedStyle(field).zIndex || 9,
	visibility: "visible",
	"line-height": "0",
	height: (this.options.markerSize + 2) + "px",
	bottom: 0,
	left: 0,
	right: 0,
	float: "inline-start",
	"max-width": (this.options.markerSize * 2 + 6) + "px",
	overflow: "hidden"
}, 0, true);

nodeMarker.id = "passhash_marker_" + this.markerNumber;
nodeMarker.setAttribute("title", document.getElementById("passhash_strings").getString("passhashMarkerTip"));

nodeUnmask.id = "passhash_unmask_" + this.markerNumber;
nodeUnmask.setAttribute("title", document.getElementById("passhash_strings").getString("passhashUnmaskTip"));
PassHash.setMarkerStyle(nodeMarker, undefined, {
	display: this.options.showMarker ? "inline-block" : "none",
	margin: 0,
	font: PassHash.options.markerSize + "px/1.1 fixed"
}, undefined, true);
PassHash.setMarkerStyle(nodeUnmask, undefined, {
	margin: this.options.showMarker ? "0 0 0 2px" : 0,
	display: this.options.unmaskMarker && !(PassHash.options.markerPosition & PassHashCommon.phCore.COMPACT) ? "inline-block" : "none",
	"vertical-align": "middle",
	font: PassHash.options.markerSize + "px/1.4 fixed"
}, undefined, true);
nodeBox.addEventListener("mouseenter", this.onEvent, false);
nodeBox.addEventListener("mouseleave", this.onEvent, false);
nodeMarker.addEventListener("mouseenter", this.onEvent, false);
nodeMarker.addEventListener("mouseleave", this.onEvent, false);
nodeUnmask.addEventListener("mouseenter", this.onEvent, false);
nodeUnmask.addEventListener("mouseleave", this.onEvent, false);
nodeBox.addEventListener("mousedown", this.onEvent, true);
nodeBox.addEventListener("contextmenu", this.onEvent, false);
//field.parentNode.insertBefore(nodeBox, field.nextSibling);
field.parentNode.appendChild(nodeBox);
nodeBox._phField = field;
let that = this,
		func = function()
		{
			let rectField = field.getBoundingClientRect(),
					rectBox = nodeBox.getBoundingClientRect();

			if (!rectField.width || !rectField.height)
				return false
			let top = 2 + rectField.bottom - rectBox.top,
					left = rectField.left - rectBox.left;

			if (field._phStyleBackup)
			{
				field.style.paddingLeft = field._phStyleBackup.paddingLeft;
				field.style.paddingRight = field._phStyleBackup.paddingRight;
				if (field._phStyle)
				{
					field._phStyle["padding-left"] = field._phStyleBackup.paddingLeft;
					field._phStyle["padding-right"] = field._phStyleBackup.paddingRight;
				}
			}
			if (rectField.width > rectBox.width + 20 && !(PassHash.options.markerPosition & PassHashCommon.phCore.BOTTOM))
			{
				let rf = rectField,
						rt = rectBox,
						type = PassHash.options.markerPosition & PassHashCommon.phCore.LEFT ? "left" : "right";

				if (!(PassHash.options.markerPosition & PassHashCommon.phCore.OUTSIDE))
				{
					if (field._phStyle)
						field._phStyle["padding-" + type] = (rectBox.width + 4) + "px";

					setStyle(field, "padding-" + type, (rectBox.width + 4) + "px");
					rectField = field.getBoundingClientRect();
					if (rectField.width > rf.width)
					{
						setStyle(field, {width: (rf.width - (rectField.width - rf.width)) + "px"});
					}
				}
				rectField = field.getBoundingClientRect();
				rectBox = nodeBox.getBoundingClientRect();
				top = (rectField.bottom - rectBox.top) - (rectField.height/2 + rectBox.height/2);
				if (PassHash.options.markerPosition & PassHashCommon.phCore.LEFT)
				{
					left = rectField.left - rectBox.left + 3 - (PassHash.options.markerPosition & PassHashCommon.phCore.OUTSIDE ? rectBox.width + 3 : 0);
				}
				else
				{
					left = rectField.right - rectBox.left - rectBox.width - 3 + (PassHash.options.markerPosition & PassHashCommon.phCore.OUTSIDE ? rectBox.width + 3 : 0);
				}
			}
			else if (PassHash.options.markerPosition == (PassHashCommon.phCore.BOTTOM | PassHashCommon.phCore.RIGHT)
						|| PassHash.options.markerPosition == (PassHashCommon.phCore.BOTTOM | PassHashCommon.phCore.RIGHT | PassHashCommon.phCore.COMPACT))
			{
				left = rectField.right - rectBox.left - rectBox.width - 3;
			}
//				left -= 2; //border spacing
			that.loopRemove(func);
			setStyle(nodeBox, {top: top + "px", left: left + "px"});
			return true
		}
if (!func())
	that.loopAdd(func);
//}



//console.log(tableNode.getBoundingClientRect());
//        }
        field.setAttribute("passHashMarkers", this.markerNumber);
        this.markerNumber++;
    },

		onEvent: function(e)
		{
			let nodeBox = e.target.className == "passHashMarkers" ? e.target : e.target.parentNode;
			switch (e.type)
			{
				case "mouseenter":
					clearTimeout(nodeBox._phTimer);
					if (e.target == nodeBox)
					{
						if (!PassHash.options.showMarker || !PassHash.options.unmaskMarker || !(PassHash.options.markerPosition & PassHashCommon.phCore.COMPACT))
							return;

						if (!nodeBox.__phStyleBackup)
							nodeBox.__phStyleBackup = nodeBox.lastChild.getAttribute("style");

						PassHash.setStyle(nodeBox.lastChild, "display", "inline-block")
					}
					else
					{
						e.target.classList.toggle("hover", true);
						PassHash.setMarkerColor(e.target);
					}
					break;

				case "mouseleave":
					if (e.target != nodeBox)
					{
						e.target.classList.toggle("hover", false);
						PassHash.setMarkerColor(e.target);
						delete e.target._phBG
					}
					if (!nodeBox.__phStyleBackup)
						return;

					clearTimeout(nodeBox._phTimer);
					nodeBox._phTimer = setTimeout(function()
					{
						nodeBox.lastChild.setAttribute("style", nodeBox.__phStyleBackup)
						PassHash.setMarkerColor(nodeBox.lastChild);
					}, 500);
					break;

				case "mousedown":
					if (e.button != 1)
						return;
				case "contextmenu":
					PassHash.setStyle(nodeBox, "z-index", "-9999");
					e.stopPropagation();
					e.preventDefault();
					e.stopImmediatePropagation();
					setTimeout(function()
					{
						PassHash.setStyle(nodeBox, "z-index", 9);
					}, 10000);
					break;

			}
		},

    checkMarkerClick: function(event)
    {
//log(event);
   		let node = event.target;
    	if (!(node = PassHash.isMarker(node, "")) && event.button == 1)
    	{
    		return PassHash.dblclick(event);
    	}
        // Looking for a left-click and one of our markers
        if (event.button == 0 && node)
        {
            var textNode = PassHash.getMarkerTarget(node);
            if (textNode != null)
            {
                // Dialog marker?
                if (PassHash.isMarker(node, "marker"))
                {
                    PassHash.invokeDialog(textNode);
                    return false;   // handled
                }
                // Unmask marker?
                else if (PassHash.isMarker(node, "unmask"))
                {
                    PassHash.toggleMask(textNode);
                    return false;   // handled
                }
            }
        }
        return true;    // Not handled
    },

    isMarker: function(node, tag)
    {
        try
        {
            if ((node.tagName == "TD" || node.tagName == "SPAN") && node.id.toString().indexOf("passhash_"+tag) >= 0)
            	return node
            else if (node.parentNode)
            	return this.isMarker(node.parentNode, tag);
        }
        catch(e) {}
        return false;
    },

		setStyle: function(node, style, value, clear)
		{
			if (!node)
				return;

			if (!node._phStyle)
			{
				if (!node._phStyleOrig)
				{
					let s = window.getComputedStyle(node);
					node._phStyleOrig = {};
					for(let i in s)
					{
						node._phStyleOrig[i] = s[i];
					}

				}
				if (!node._phStyleBackup)
				{
					node._phStyleBackup = {};
					for(let i in node.style)
					{
						if (typeof(node.style[i]) == "string")
							node._phStyleBackup[i] = node.style[i];
					}
				}
			}
			if (typeof(style) == "object")
			{
				let list = {};
				if (clear)
				{
					let s = window.getComputedStyle(node);
					for(let i = 0; i < s.length; i++)
					{
						list[s[i]] = (s[i] in style) ? style[s[i]] : "initial";
					}
				}
				list = Object.assign(list, style);

        for (let i in list)
        {
        	PassHash.setStyle(node, i, list[i]);
        }
        return;
			}
			node.style.setProperty(style, value, "important");
		},

    setMarkerStyle: function(node, clicked, style, size, clear)
    {
        size = typeof(size) == "undefined" ? this.options.markerSize + "px" : size;
        if (typeof(style) != "object")
        	style = {};

				if (!node._phStyle)
					node._phStyle = Object.assign({
	        	border: "thin solid #80c080",
//	        	margin: 0,
	        	padding: 0,
//	        	font: size + "/1 fixed",
	        	color: "#609060",
	        	cursor: "pointer",
	        	"min-width": size,
	        	"max-width": size,
	        	"min-height": size,
	        	"max-height": size,
	        	"height": size,
	        	"width": size,
	        	"text-align": "center",
	        	"display": "inline-block",
           	"-moz-user-select": "none",
	        	"vertical-align": "middle"
	        }, style)
        this.setStyle(node, node._phStyle, 0, clear);

        if (clicked !== undefined)
        	node.classList.toggle("active", clicked);

        this.setMarkerColor(node);
        node._phBG = node.style.backgroundColor;
    },

		setMarkerColor: function(node)
		{
			let color = ["#eeffee", //default
									 "#9DD09D", //active
									 "#B0EAAA", //hover
									 "#B5DBB5"];//hover active
			
			this.setStyle(node, "background-color", color[(node.classList.contains("active") ? 1 : 0) + (node.classList.contains("hover") ? 2 : 0)]);
		},
    // Markers are a TD - child of TR - child of TABLE - sibling of INPUT + BR
    getMarkerTarget: function(node)
    {
    	if (node)
				return node.parentNode._phField || node.parentNode.parentNode._phField;

			return null;
    },

    // Markers are a TD - child of TR - child of TABLE - sibling of INPUT + BR
    getTargetMarker: function(node, tag)
    {
    	if (node)
				return node.ownerDocument.getElementById("passhash_" + tag + "_" + node.getAttribute("passHashMarkers"));
			return null;
    },

    invokeDialog: function(textNode)
    {
        let marker = PassHash.getTargetMarker(textNode, "marker"),
        		doc = textNode ? textNode.ownerDocument : content.document,
        		win = textNode ? doc.defaultView : content;

        if (marker != null)
            PassHash.setMarkerStyle(marker, true);
        if (textNode != null)
	        textNode.disabled = true;
        var params = {
        	input: content.document.location,
        	output: null,
        	callback: function(e)
        	{
//        		let textNode = PassHash.getTextNode();
		        if (textNode == null)
							return;

						try
						{
		        	textNode.disabled = false;
		        }
		        catch(e)
		        {
		        	return false
		        };
		        if (marker != null)
		            PassHash.setMarkerStyle(marker, false);

		        var hashapass = params.output;

		        if (hashapass)
		        {
		            textNode.value = hashapass;
		            textNode.focus();
		            textNode.select();
								textNode.dispatchEvent(new win.UIEvent('change', {view: win, bubbles: true, cancelable: true}));
								textNode.dispatchEvent(new win.UIEvent('input', {view: win, bubbles: true, cancelable: true}));
		        }
		        else
		            textNode.focus();
        	}};
        window.openDialog("chrome://passhash/content/passhash-dialog.xul", "dlg",
                          "modal, centerscreen", params);

    },

    toggleMask: function(textNode)
    {
        var marker = PassHash.getTargetMarker(textNode, "unmask");

	      if (textNode.type == "password")
        {
        		let s = window.getComputedStyle(textNode);
        		textNode._phComputedStyle = {};
        		textNode._phStyle = {};
        		for(let i = 0; i < textNode.style.length; i++)
        		{
        			textNode._phComputedStyle[textNode.style[i]] = s[textNode.style[i]];
        			textNode._phStyle[textNode.style[i]] = textNode.style[textNode.style[i]];
        		}
            if (marker != null)
                PassHash.setMarkerStyle(marker, true);


            textNode.setAttribute("type", "");
            for(let i in textNode._phComputedStyle)
            {
            	textNode.style.setProperty(i, textNode._phComputedStyle[i], "important");
            }
        }
        else
        {
            if (marker != null)
                PassHash.setMarkerStyle(marker, false);
            textNode.setAttribute("type", "password");

            for(let i in textNode._phStyle)
            {
            	textNode.style.setProperty(i, textNode._phStyle[i]);
            }
        }
    },

		dblclick: function(event)
		{
//			if (PassHashCommon.core.prefs.getBoolPref("optDblClick")
			let node = event.target;
			if (node != null && PassHashCommon.isTextNode(node) && !node.disabled && !node.readOnly && node.type == "password")
			{
				PassHash.invokeDialog(node);
				return false;   // handled
			}
		},
		intervalLoop: function()
		{
			PassHash.onLoad();
		},
		toolbarButtonSet: function(type)
		{
			if (typeof(type) == "undefined")
				type = PassHashCommon.phCore.opts.toolbarButton;

			document.getElementById("passhash_toolbar_button").setAttribute("type", (type ? "menu-" : "") + "button");
		},
		prefChanged: function(id, val)
		{
			if (id == "toolbarButton")
			{
				PassHash.toolbarButtonSet(val);
			}
			if (window._phMarkerBits != PassHash.markerBits)
				PassHash.addMarkers(window.content);
		}
};

window.addEventListener("load",  function(e) { PassHash.onLoad(e); }, true);
window.addEventListener("unload",  function(e) { PassHash.onUnLoad(e); }, true);
window.addEventListener("focus", function(e) { PassHash.onLoad(e); }, true);
//PassHash._interval = setInterval(PassHash.intervalLoop, 3000);
//window.addEventListener("DOMContentLoaded", function(e) { PassHash.onLoad(e); }, true);
//window.addEventListener("DOMAttrModified", function(e) { PassHash.onLoad(e); }, true);
//window.addEventListener("DOMSubtreeModified", function(e) { PassHash.onLoad(e); }, false);
//window.addEventListener("DOMNodeInserted", function(e) { PassHash.onLoad(e); }, false);

//gBrowser.selectedBrowser.addEventListener("DOMContentLoaded", function(e) { PassHash.onLoad(e); }, true);
//gBrowser.selectedBrowser.addEventListener("DOMAttrModified", function(e) { log(e);PassHash.onLoad(e); }, true);
gBrowser.addEventListener("load",  function(e) { PassHash.onLoad(e); }, true);

//gBrowser.addEventListener("load",  function(e) { log(e) }, true);

PassHashCommon.phCore.onPrefChange.addObserver(PassHash.prefChanged);
window.addEventListener("load",  function(e)
{
	PassHash.toolbarButtonSet();
}, true);
