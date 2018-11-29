/*
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * script.js: it defines the accordion menu behaviour used by AcMenu plugin.
 *
 * @author Torpedo <dcstoyanov@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package script
 */

var _OPEN_ITEMS = [];
var _COOKIE_NAME = "plugin_acmenu_open_items";

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
    for (var i in JSINFO["plugin_acmenu"]["sub_ns"]) {
        sub_start = [JSINFO["plugin_acmenu"]["sub_ns"][i], JSINFO["plugin_acmenu"]["start"]].filter(Boolean).join(":");
        if (_OPEN_ITEMS.indexOf(sub_start) == -1) {
            _OPEN_ITEMS.push(sub_start);
        }
    }
    var cookie_value = JSON.stringify(_OPEN_ITEMS);
    document.cookie = _COOKIE_NAME + "=" + cookie_value + ";expires='';path=/";
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
    //             <div class="li">
    //                 <span class="curid">
    //                     <a href="" class="wikilink1" title="">ns 0</a>  // open item
    //                 </span>
    //             </div>
    //             <ul class="idx">
    //                 <li class="closed">
    //                     <div class="li">
    //                         <a href="" class="wikilink1" title="">ns 0.1</a>
    //                     </div>
    //                     <ul class="idx" style="display: none;">
    //                         <li class="level2">
    //                             <div class="li">
    //                                 <a href="" class="wikilink1" title="">pg 0.1.1</a>
    //                             </div>
    //                         </li>
    //                     </ul>
    //                 </li>
    //                 <li class="open">
    //                     <div class="li">
    //                         <span class="curid">
    //                             <a href="" class="wikilink1" title="">ns 0.2</a>  // open item
    //                         </span>
    //                     </div>
    //                     <ul class="idx">
    //                         <li class="level2">
    //                             <div class="li">
    //                                 <span class="curid">
    //                                     <a href="" class="wikilink1" title="">pg 0.2.1</a>  // open item
    //                                 </span>
    //                             </div>
    //                         </li>
    //                     </ul>
    //                 </li>
    //                 <li class="level1">
    //                     <div class="li">
    //                         <a href="" class="wikilink1" title="">pg 0.1</a>
    //                     </div>
    //                 </li>
    //             </ul>
    //         </li>
    //     </ul>
    // </div>

    const selector = "div.acmenu ul.idx > li:not([class^='level']) > div.li";

    get_cookie();
    set_cookie();

    jQuery(selector).click(function(event) {
        var item = trim_url(jQuery(this).find("a").attr("href"));
        event.preventDefault();
        if (jQuery(this).next().is(":visible") == false) {
            jQuery(this)
            .next().slideDown("fast")
            .parent().removeClass("closed").addClass("open");
            _OPEN_ITEMS.push(item);
        }
        else {
            jQuery(this)
            .next().slideUp("fast")
            .parent().removeClass("open").addClass("closed");
            _OPEN_ITEMS.splice(jQuery.inArray(item, _OPEN_ITEMS), 1);
        }
        var cookie_value = JSON.stringify(_OPEN_ITEMS);
        document.cookie = _COOKIE_NAME + "=" + cookie_value + ";expires='';path=/";
    });
});
