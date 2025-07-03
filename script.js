/*
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * script.js: accordion menu behaviour used by AcMenu plugin.
 *
 * @author Torpedo <dcstoyanov@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package script
 */

var _OPEN_ITEMS = [];
var _COOKIE_NAME = "plugin_acmenu_open_items";
var _COOKIE_PARAMETERS = ";expires='';path=/;SameSite=Lax";

/*
 * Get previously cookies in order to remember which item are opened.
 *
 * Cookies are retrieved in the form:
 * <other-cookie>=["val-1",..,"val-m"]; open_items=["val-1",..,"val-n"]
 */
function get_cookie() {
    var all_cookies = document.cookie.split(";");

    for (var i = 0; i < all_cookies.length; i++) {
        if (all_cookies[i].indexOf(_COOKIE_NAME + "=") > -1) {
            var cookie = all_cookies[i].trim();
            var items = cookie.substring((_COOKIE_NAME + "=").length, cookie.length);
            var items = JSON.parse(items);
            var items = items.toString().split(",");
            for (var j = 0; j < items.length; j++) {
                _OPEN_ITEMS.push(items[j]);
            }
        }
    }
}


/*
 * Store the <start> pages genealogy of the given id as cookies.
 */
function set_cookie() {
    jQuery.each(JSINFO["plugin_acmenu"]["sub_ns"], function(idx, val) {
        sub_start = [val, JSINFO["plugin_acmenu"]["start"]].filter(Boolean).join(":");
        if (_OPEN_ITEMS.indexOf(sub_start) == -1) {
            _OPEN_ITEMS.push(sub_start);
        }
    });
    var cookie_value = JSON.stringify(_OPEN_ITEMS);
    document.cookie = _COOKIE_NAME + "=" + cookie_value + _COOKIE_PARAMETERS;
}

/*
 * For a given href attribute of an url, keep only the page's id.
 *
 * @param string url
 *      the link to a wiki page is made by wl() defined in inc/common.php
 * @return string trimmed_url
 *      the page's id, that is:
 *      <ns-acmenu>:<ns-1>:...:<ns-i>:<pg>
 */
function trim_url(url) {
    if (JSINFO["plugin_acmenu"]["canonical"]) {
        xlink = JSINFO["plugin_acmenu"]["doku_url"];
    }
    else {
        xlink = JSINFO["plugin_acmenu"]["doku_base"];
    }

    if (JSINFO["plugin_acmenu"]["userewrite"] == 2) {
        xlink += JSINFO["plugin_acmenu"]["doku_script"] + "/";
    }
    else if (JSINFO["plugin_acmenu"]["userewrite"] == 1) {
    }
    else {
        xlink += JSINFO["plugin_acmenu"]["doku_script"] + "?id=";
    }

    var trimmed_url = url.replace(xlink, "");  // return only page's id

    if (JSINFO["plugin_acmenu"]["useslash"] == 1) {
        const slash = /\//g;
        var trimmed_url = trimmed_url.replace(slash, ":");
    }

    return trimmed_url;
}

/*
	jQuery-GetPath v0.01, by Dave Cardwell. (2007-04-27)
	
	http://davecardwell.co.uk/javascript/jquery/plugins/jquery-getpath/
	
	Copyright (c)2007 Dave Cardwell. All rights reserved.
	Released under the MIT License.
	
	
	Usage:
	var path = $('#foo').getPath();
*/

// https://stackoverflow.com/a/26763360
jQuery.fn.extend({
    getPath: function() {
        var pathes = [];

        this.each(function(index, element) {
            var path, $node = jQuery(element);

            while ($node.length) {
                var realNode = $node.get(0), name = realNode.localName;
                if (!name) { break; }

                name = name.toLowerCase();
                var parent = $node.parent();
                var sameTagSiblings = parent.children(name);

                if (sameTagSiblings.length > 1)
                {
                    allSiblings = parent.children();
                    var index = allSiblings.index(realNode) +1;
                    if (index > 0) {
                        name += ':nth-child(' + index + ')';
                    }
                }

                path = name + (path ? ' > ' + path : '');
                $node = parent;
            }

            pathes.push(path);
        });

        return pathes.join(',');
    }
});

jQuery(document).ready(function() {
    // Example of a nested menu:
    // ns 0  // open item
    //   ns 0.1
    //     pg 0.1.1
    //   ns 0.2  // open item
    //     pg 0.2.1  // open item
    // pg 0.1
    //
    // <div class="acmenu">
    //     <ul class="idx">
    //         <li class="open">
    //             <div class="li"><span class="curid"><a href=""></a></span></div>
    //             <ul class="idx">
    //                 <li class="closed">
    //                     <div class="li"><a href=""></a></div>
    //                     <ul class="idx" style="display: none;">
    //                         <li class="level2"><div class="li"><a href=""></a></div></li>
    //                     </ul>
    //                 </li>
    //                 <li class="open">
    //                     <div class="li"><span class="curid"><a href=""></a></span></div>
    //                     <ul class="idx">
    //                         <li class="level2"><div class="li"><span class="curid"><a href=""></a></span></div></li>
    //                     </ul>
    //                 </li>
    //                 <li class="level1"><div class="li"><a href=""></a></div></li>
    //             </ul>
    //         </li>
    //     </ul>
    // </div>

    const selector = "div.acmenu ul.idx > li:not([class^='level'])";

    get_cookie();
    set_cookie();

    jQuery(selector).click(function(event) {
        event.stopPropagation();

        var elementPath = jQuery(this).getPath();
        if (event.target.nodeName === "UL") elementPath = elementPath + ' > ul > li:nth-child(1)';
        // alert(elementPath + " (" + event.target.nodeName + " - " + jQuery(elementPath + ' > ul').length + ")");

        var item = trim_url(jQuery(elementPath + ' > div > a').attr('href'));
        if ((event.target.nodeName === "A") || jQuery(elementPath + ' > ul').is(":hidden")) {
            jQuery(elementPath + ' > ul').slideDown("fast");
            jQuery(elementPath).removeClass("closed").addClass("open");
            _OPEN_ITEMS.push(item);
        }
        else {
            jQuery(elementPath + ' > ul').slideUp("fast");
            jQuery(elementPath).removeClass("open").addClass("closed");
            _OPEN_ITEMS.splice(jQuery.inArray(item, _OPEN_ITEMS), 1);
        }
        var cookie_value = JSON.stringify(_OPEN_ITEMS);
        document.cookie = _COOKIE_NAME + "=" + cookie_value + _COOKIE_PARAMETERS;
    });
});
