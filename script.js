/*
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * script.js: it defines the accordion menu behaviour used by AcMenu plugin.
 *
 * @author Torpedo <dcstoyanov@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package script
 */

var open_items = [];

/*
 * Get previously cookies in order to remember which item are opened.
 *
 * Cookies are retrieved in the form:
 * <other-cookie>=["val-1",..,"val-m"]; open_items=["val-1",..,"val-n"]
 */
function get_cookie() {
    var all_cookies = document.cookie.split("; ");
    for (var i = 0; i < all_cookies.length; i++) {
        if (all_cookies[i].indexOf("open_items") > -1) {
            var cookies = all_cookies[i];
            const _COOKIE_NAME = /(open_items=\[")(.*)("\])/g;
            var cookies = cookies.replace(_COOKIE_NAME, "$2");
            var cookies = cookies.split('","');
            for (var j = 0; j < cookies.length; j++) {
                open_items.push(cookies[j]);
            }
        }
    }
}

/*
 * For a given href attribute of an url, keep only the page's id.
 *
 * @param string url
 *     the href attribute of the form:
 *     /doku.php?id=<ns-acmenu>:<ns-1>:...:<ns-i>:<pg>
 *     or
 *     /doku.php/<ns-acmenu>:<ns-1>:...:<ns-i>:<pg>
 *     or
 *     /doku.php/<ns-acmenu>/<ns-1>/.../<ns-i>/<pg>
 *     or
 *     /<ns-acmenu>/<ns-1>/.../<ns-i>/<pg>
 *     or as above but using absolute url starting with:
 *     http://<domain>/
 * @param integer useslash
 *     weather the url uses slash (/) instead of colon (:)
 * @return string trimmed_url
 *     the page's ID, that is:
 *     <ns-acmenu>:<ns-1>:...:<ns-i>:<pg>
 */
function trim_url(url, useslash) {
    const _BASE = DOKU_BASE.slice(0, -1);  // remove trailing /
    const _DOKU = new RegExp(_BASE + "\/doku\.php\\?id=|" + _BASE + "\/doku\.php\/|" + _BASE + "\/");
    var trimmed_url = url.replace(_DOKU, "");

    if (useslash == 1) {
        const _SLASH = /\//g;
        var trimmed_url = trimmed_url.replace(_SLASH, ":");
    }

    return trimmed_url;
}

/*
 * Get the <start> pages genealogy of the given id.
 *
 * @param string id
 *     the current page's id in the form:
 *     <ns-acmenu>:<ns-1>:...:<ns-i>:<pg>
 * @param string start
 *     the name of <start> page
 * @return array sub_start
 *     the <start> pages genealogy of the current page's id, in the form:
 *     <ns-acmenu>:<start>,
 *     <ns-acmenu>:<ns-1>:<start>,
 *     <ns-acmenu>:<ns-1>:...:<ns-i>:<start>
 */
function get_sub_start(id, start) {
    var sub_start = [];
    var pieces = id.split(":");
    pieces.pop();  // remove <pg>

    sub_start.push("");
    for (var i = 0; i < pieces.length; i++) {
        sub_start.push(sub_start[sub_start.length - 1] + pieces[i] + ":");
    }
    for (var j = 0; j < sub_start.length; j++) {
        sub_start[j] = sub_start[j] + start;
    }

    return sub_start;
}

/*
 * Store the <start> pages genealogy of the given id as cookies.
 *
 * @param array sub_start
 *     the <start> pages genealogy of the current page's id, in the form:
 *     <ns-acmenu>:<start>,
 *     <ns-acmenu>:<ns-1>:<start>,
 *     <ns-acmenu>:<ns-1>:...:<ns-i>:<start>
 */
function set_cookie(sub_start) {
    for (var i in sub_start) {
        if (open_items.indexOf(sub_start[i]) == -1) {
            open_items.push(sub_start[i]);
        }
    }
    var cookie_value = JSON.stringify(open_items);
    document.cookie = "open_items=" + cookie_value + ";expires='';path=/";
}

jQuery(document).ready(function() {
    // Example of a nested menu ("<--" means "open this ..."):
    // ns 0 <--
    //   ns 0.1
    //     pg 0.1.1
    //   ns 0.2 <--
    //     pg 0.2.1 <--
    // pg 0.1
    //
    // <div class="acmenu">
    //     <ul class="idx">
    //         <li class="open">
    //             <div class="li">
    //                 <span class="curid">
    //                     <a href="" class="wikilink1" title="">ns 0</a>
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
    //                             <a href="" class="wikilink1" title="">ns 0.2</a>
    //                         </span>
    //                     </div>
    //                     <ul class="idx">
    //                         <li class="level2">
    //                             <div class="li">
    //                                 <span class="curid">
    //                                     <a href="" class="wikilink1" title="">pg 0.2.1</a>
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

    const _SELECTOR = "div.acmenu ul.idx > li:not([class^='level']) > div.li";
    var one_click = "";
    var clicks = 0;

    get_cookie();
    sub_start = get_sub_start(JSINFO["id"], JSINFO["start"]);
    set_cookie(sub_start);

    // implementation of "one click" and "double click" behaviour:
    // "double click" has effect only if occurs in less X milliseconds,
    // where X is the time lapse defined in setTimeout
    jQuery(_SELECTOR).click(function(event) {
        // redefine "this" in outer scope in order to be used in setTimeout
        var that = this;
        var $item = trim_url(jQuery(this).find("a").attr("href"), JSINFO["useslash"]);
        clicks = clicks + 1;
        if (clicks == 1) {
            event.preventDefault();
            one_click = window.setTimeout(function () {
                clicks = 0;
                if (jQuery(that).next().is(":visible") == false) {
                    jQuery(that)
                    .next().slideDown("fast")
                    .parent().removeClass("closed").addClass("open");
                    open_items.push($item);
                }
                else {
                    jQuery(that)
                    .next().slideUp("fast")
                    .parent().removeClass("open").addClass("closed");
                    open_items.splice(jQuery.inArray($item, open_items), 1);
                }
                var cookie_value = JSON.stringify(open_items);
                document.cookie = "open_items=" + cookie_value + ";expires='';path=/";
            }, 300);
        }
        else if (clicks == 2) {
            clearTimeout(one_click);

            clicks = 0;
            if (jQuery.inArray($item, open_items) == -1) {
                open_items.push($item);
            }
            var cookie_value = JSON.stringify(open_items);
            document.cookie = "open_items=" + cookie_value + ";expires='';path=/";
            window.location.replace(jQuery(this).find("a").attr("href"));
        }
    });
});
