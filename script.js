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

    var trimmed_url = decodeURIComponent(url.replace(xlink, ""));  // return only page's id

    if (JSINFO["plugin_acmenu"]["useslash"] == 1) {
        const slash = /\//g;
        var trimmed_url = trimmed_url.replace(slash, ":");
    }

    return trimmed_url;
}

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

    const selector = "div.acmenu ul.idx li:not([class^='level'])";

    get_cookie();
    set_cookie();

    jQuery(selector).click(function(event) {
        event.stopPropagation(); // Prevent bubbling to parent namespaces
        
        var $submenu = jQuery(this).children("ul");
        // Ignore clicks that originated from child pages (which bubbled up) or clicking the ul padding itself
        if ($submenu.length > 0 && ($submenu[0] === event.target || jQuery.contains($submenu[0], event.target))) {
            return;
        }

        var $a = jQuery(this).children("div.li").find("a");
        var item = "";
        if ($a.length > 0) {
            item = trim_url($a.attr("href"));
        } else {
            var $span = jQuery(this).children("div.li").find("span.ns_nolink");
            if ($span.length > 0) {
                item = $span.attr("data-id");
            } else {
                return;
            }
        }

        var is_mergenspg = JSINFO.plugin_acmenu && (
                           JSINFO.plugin_acmenu.mergenspg === 1 || 
                           JSINFO.plugin_acmenu.mergenspg === "1" || 
                           JSINFO.plugin_acmenu.mergenspg === true || 
                           JSINFO.plugin_acmenu.mergenspg === "true" || 
                           JSINFO.plugin_acmenu.mergenspg === "on"
                           );

        var is_link_click = (event.target.nodeName === "A" || (event.target.parentNode && event.target.parentNode.nodeName === "A"));

        if (is_link_click && is_mergenspg) {
            return; // Let the browser navigate naturally
        }

        event.preventDefault(); // Stop navigation if clicking text and mergenspg is false

        if ($submenu.length === 0) return;

        if ($submenu.is(":hidden")) {
            $submenu.slideDown("fast");
            jQuery(this).removeClass("closed").addClass("open");
            if (_OPEN_ITEMS.indexOf(item) === -1) {
                _OPEN_ITEMS.push(item);
            }
        }
        else {
            $submenu.slideUp("fast");
            jQuery(this).removeClass("open").addClass("closed");
            var index = jQuery.inArray(item, _OPEN_ITEMS);
            if (index !== -1) {
                _OPEN_ITEMS.splice(index, 1);
            }
        }
        var cookie_value = JSON.stringify(_OPEN_ITEMS);
        document.cookie = _COOKIE_NAME + "=" + cookie_value + _COOKIE_PARAMETERS;
    });
});
