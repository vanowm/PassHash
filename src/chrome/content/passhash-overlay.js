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
    phLoopTimer: null,
    options: null,

    onLoad: function(e)
    {
    	
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
       this.options = PassHashCommon.loadOptions();
       if (this.options.showMarker || this.options.unmaskMarker)
            this.addMarkers(window.content, this.options.showMarker, this.options.unmaskMarker);

				if (e.type != "load")
					return;        

        document.getElementById("contentAreaContextMenu").
                addEventListener("popupshowing", this.onContextMenuUpdate, false);
        window.addEventListener("click", this.checkMarkerClick, true);
        window.addEventListener("dblclick", this.dblclick, true);
			  try{gBrowser.addEventListener("DOMContentLoaded", this.checkMarkerOnloadEvent, true);}catch(e){console.log(e)};
			  try{gBrowser.addEventListener("unload", this.onUnLoad, true);}catch(e){console.log(e)};

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
				if (!node._PassHashAutocomplete)
					node._PassHashAutocomplete = node.getAttribute("autocomplete");

				node.setAttribute("autocomplete", on ? "on" : node._PassHashAutocomplete);
			}

			PassHash.autocompleteOn(node.parentNode, on);
		},

		addMarker: function(node, dialogButton, unmaskButton)
		{
//console.log(node, node.tagName != "INPUT", node.getAttribute("type") != "password", node._phInited, !PassHashCommon.isVisible(node), node.hasAttribute("phNoMarkers"));
			if (node.tagName == "INPUT")
			{
				PassHash.autocompleteOn(node, PassHash.options.autocomplete);
			}
			if (!node || node.tagName != "INPUT" || node.getAttribute("type") != "password" || node._phInited || !PassHashCommon.isVisible(node) || node.hasAttribute("phNoMarkers"))
				return;

			PassHash.attachMarkers(node, dialogButton, unmaskButton);
//			node._phInited = true;
		},

    addMarkers: function(windowCurrent, dialogButton, unmaskButton)
    {
      if (!windowCurrent)
        return;

        var inputs = windowCurrent.document.getElementsByTagName("input");

        for (var i = 0; i < inputs.length; i++)
        {
        	this.addMarker(inputs[i], dialogButton, unmaskButton);
/*
            var type = inputs[i].getAttribute("type");
            if (type == "password" && !inputs[i].hasAttribute("passHashMarkers"))
                this.attachMarkers(windowCurrent.document, inputs[i], dialogButton, unmaskButton);
*/
        }

        /* Recursively process subframes */
        for (i = 0; i < windowCurrent.frames.length; i++)
        {
            this.addMarkers(windowCurrent.frames[i], dialogButton, unmaskButton);
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
		
    attachMarkers: function(field, dialogButton, unmaskButton, force)
    {
    	if (field._phInited && !force)
    		return;

			let doc = field.ownerDocument,
					win = doc.defaultView;

    	field._phInited = true;
        // Prevent reprocessing this field
//        field.setAttribute("phNoMarkers", true);
        if (unmaskButton || dialogButton)
        {
            var tableNode = doc.createElement("TABLE"),
            		trNode = doc.createElement("TR"),
            		setStyle = this.setStyle,
            		display = this.options.markerPosition == PassHashCommon.phCore.LEFTCOMPACT || this.options.markerPosition == PassHashCommon.phCore.RIGHTCOMPACT ? "block" : "table";

            tableNode.id = "passhashMarkers" + this.markerNumber;
            setStyle(tableNode, {
//            	"max-width": (this.options.markerSize + 2) + "px",
//            	"max-height": (this.options.markerSize + 2) + "px",
            	margin: 0,
            	display: display,
            	"border-spacing": 0,
//            	"border-collapse": "separate",
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
            	width: (this.options.markerSize + 2) + "px"
            }, 0, true);
            setStyle(tableNode, "overflow", "hidden");
            field.parentNode.insertBefore(tableNode, field.nextSibling);
            setStyle(trNode, {
            	"line-height": 0,
            	display: "table-row",
            	margin: 0,
            	padding: 0
            }, 0, true);
            tableNode.appendChild(trNode);
            if (dialogButton)
                this.createMarkerCell(doc, trNode, "marker", "passhashMarkerTip");

						if (dialogButton && unmaskButton)
						{
							let tdNode = doc.createElement("td");
							this.setMarkerStyle(tdNode, false, {border: "thin solid transparent", cursor: "initial"}, 0);
							setStyle(tdNode, "background-color", "initial");
							trNode.appendChild(tdNode);
						}
						tableNode.addEventListener("mouseenter", function(e)
						{
							if (dialogButton && unmaskButton)
							{
								clearTimeout(tableNode._phTimer);
								if (!tableNode._phWidth)
									tableNode._phWidth = tableNode.style.width;

								setStyle(tableNode, "width", trNode.getBoundingClientRect().width + "px")
							}
						}, false);
						tableNode.addEventListener("mouseleave", function(e)
						{
							if (!tableNode._phWidth)
								return;

							tableNode._phTimer = setTimeout(function()
							{
								setStyle(tableNode, "width", tableNode._phWidth)
							}, 300);
						}, false);
						let hide = function(e)
						{
							PassHash.setStyle(tableNode, "z-index", "-9999");
		    			e.stopPropagation();
		    			e.preventDefault();
		    			e.stopImmediatePropagation();
		    			setTimeout(function()
		    			{
		     				PassHash.setStyle(tableNode, "z-index", 9);
		   				}, 10000);
						};
						tableNode.addEventListener("contextmenu", hide, false);
						tableNode.addEventListener("mousedown", function(e)
						{
							if (e.button != 1)
								return;
							
							hide(e)
						}, false);
            if (unmaskButton)
                this.createMarkerCell(doc, trNode, "unmask", "passhashUnmaskTip");
            // The line break avoids some overlapping problems on certain sites
            tableNode._phField = field;
//            field.parentNode.insertBefore(doc.createElement("BR"), tableNode);
						let i = 1000,
								that = this;


						let func = function()
						{
							let rectField = field.getBoundingClientRect(),
									rectTable = tableNode.getBoundingClientRect();

							if (rectField.width && rectField.height)
							{
								let top = 2 + rectField.bottom - rectTable.top,
										left = rectField.left - rectTable.left;

								if (rectField.width > rectTable.width + 20 && PassHash.options.markerPosition != PassHashCommon.phCore.BOTTOM)
								{
									let rf = rectField,
											rt = rectTable;

									setStyle(field, "padding-" +  (PassHash.options.markerPosition == PassHashCommon.phCore.LEFT || PassHash.options.markerPosition == PassHashCommon.phCore.LEFTCOMPACT ? "left" : "right"), (rectTable.width + 4) + "px");
									rectField = field.getBoundingClientRect();
									if (rectField.width > rf.width)
									{
										setStyle(field, {width: (rf.width - (rectField.width - rf.width)) + "px"});
									}

									rectField = field.getBoundingClientRect();
									rectTable = tableNode.getBoundingClientRect();
									top = (rectField.bottom - rectTable.top) - (rectField.height/2 + rectTable.height/2);
									if (PassHash.options.markerPosition == PassHashCommon.phCore.LEFT || PassHash.options.markerPosition == PassHashCommon.phCore.LEFTCOMPACT)
									{
										left = rectField.left - rectTable.left + 3;
									}
									else
									{
										left = rectField.right - rectTable.left - rectTable.width - 3;
									}
								}
								that.loopRemove(func);
								setStyle(tableNode, {top: top + "px", left: left + "px"});
								return true
							}
							return false;
						}
						if (!func())
							that.loopAdd(func);

//console.log(tableNode.getBoundingClientRect());
        }
        field.setAttribute("passHashMarkers", this.markerNumber);
        this.markerNumber++;
    },

    createMarkerCell: function(doc, trNode, tag, tip)
    {
        var tdNode = doc.createElement("TD");
        var id = "passhash_" + tag + "_" + this.markerNumber;
        tdNode.setAttribute("id", id);
        tdNode.setAttribute("class", "phMarker");
        tdNode.setAttribute("title", document.getElementById("passhash_strings").getString(tip));
        tdNode.innerHTML = (tag == "unmask" ? "\u2217" : "#");
        tdNode.innerHTML = (tag == "unmask" ? "*" : "#");
//        tdNode.innerHTML = (tag == "unmask" ? "\u25CF" : "#");
        trNode.appendChild(tdNode);
        PassHash.setMarkerStyle(tdNode, false, tag == "unmask" ? {font: PassHash.options.markerSize + "px/0.5 fixed", "vertical-align": "bottom"} : "");
    },

    checkMarkerClick: function(event)
    {
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
            if (node.tagName == "TD" && node.id.toString().indexOf("passhash_"+tag) >= 0)
            	return node
            else if (node.parentNode)
            	return this.isMarker(node.parentNode, tag);
        }
        catch(e) {}
        return false;
    },

		setStyle: function(node, style, value, clear)
		{
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

    setMarkerStyle: function(node, clicked, style, size)
    {
        size = typeof(size) == "undefined" ? this.options.markerSize + "px" : size;
        if (typeof(style) != "object")
        	style = {};

				if (!node._phStyle)
					node._phStyle = Object.assign({
	        	border: "thin solid #80c080",
	        	margin: 0,
	        	padding: 0,
	        	font: size + "/1 fixed",
	        	color: "#609060",
	        	cursor: "pointer",
	        	"min-width": size,
	        	"max-width": size,
	        	"min-height": size,
	        	"max-height": size,
	        	"height": size,
	        	"width": size,
	        	"text-align": "center",
	        	"display": "table-cell",
           	"-moz-user-select": "none",
	        	"vertical-align": "middle"
	        }, style)

        this.setStyle(node, node._phStyle, 0, true);
        this.setStyle(node, "background-color", clicked ? "#a0d0a0" : "#eeffee");
    },

    // Markers are a TD - child of TR - child of TABLE - sibling of INPUT + BR
    getMarkerTarget: function(node)
    {
    	if (node)
				return node.parentNode.parentNode._phField;

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
        		for(let i = 0; i < s.length; i++)
        		{
        			textNode._phComputedStyle[s[i]] = s[s[i]];
        			textNode._phStyle[s[i]] = textNode.style[s[i]];
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

		checkMarkerOnloadEvent: function(event)
		{
			PassHash.checkMarkerOnload(event);
		},

		checkMarkerOnload: function(event)
		{
			if (event.originalTarget instanceof HTMLDocument)
			{
				var win = event.originalTarget.defaultView;
				if (this.options && (this.options.showMarker || this.options.unmaskMarker))
						this.addMarkers(win.content, this.options.showMarker, this.options.unmaskMarker);
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

};

window.addEventListener("load",  function(e) { PassHash.onLoad(e); }, true);
window.addEventListener("unload",  function(e) { PassHash.onUnLoad(e); }, true);
window.addEventListener("focus", function(e) { PassHash.onLoad(e); }, true);
//window.addEventListener("DOMContentLoaded", function(e) { PassHash.onLoad(e); }, true);




