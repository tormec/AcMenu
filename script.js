/**
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * script.js: it defines the accordion menu behaviour used by AcMenu plugin.
 *
 * @author Torpedo <dcstoyanov@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package script
 */

var open_items = [];

/**
 * It recovers previously cookie(s) in order to remember which item is open.
 */
function get_cookie() {
    // cookies are of the form:
    // <other-cookies>=["val-1",..,"val-m"]; open_items=["val-1",..,"val-n"]
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

/**
 * For a given href attribute of an url, it keeps only the page's ID.
 *
 * @param {str} url - the href attribute of the form:
 *              doku.php?id=<base_ns>:<ns-1>:<ns-i>:<pg>
 * @return {str} trimmed_url - the page's ID, that is:
 *               <base_ns>:<ns-1>:<ns-i>:<pg>
 */
function trim_url(url) {
    const _REGEX = /(?:\/doku\.php\?id=)(.[^#]*)/g;
    var trimmed_url = _REGEX.exec(url);

    return trimmed_url[1];
}

/**
 * It splits the given id in all its ancestors.
 *
 * @param {str} id - the current page's ID of the form:
 *              <base_ns>:<ns-1>:<ns-i>:<pg>
 * @param {str} start - the name of start page
 * @return {arr} sub_id - all the ancestors of the current page's ID:
 *              <base_ns>:<start>,
 *              <base_ns>:<ns-1>:<start>,
 *              <base_ns>:<ns-1>:<ns-i>:<start>
 */
function sub(id, start) {
     var sub_id = [];
     var pieces = id.split(":");
     var namepage = pieces.pop();

     sub_id.push("");
     for (var i = 0; i < pieces.length; i++) {
        sub_id.push(sub_id[sub_id.length - 1] + pieces[i] + ":");
     }
     for (var j = 0; j < sub_id.length; j++) {
        sub_id[j] = sub_id[j] + start;
     }

     return sub_id;
}

/**
 * It stores all the ancestors of the current page's ID as cookies.
 *
 * @return {arr} sub_id - all the ancestors of the current page's ID:
 *              <base_ns>:<start>,
 *              <base_ns>:<ns-1>:<start>,
 *              <base_ns>:<ns-1>:<ns-i>:<pg>
 */
function set_cookie(sub_id) {
    for (var i in sub_id) {
        if (open_items.indexOf(sub_id[i]) == -1) {
            open_items.push(sub_id[i]);
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

    const _SELECTOR = ".dokuwiki div.acmenu ul.idx > li:not([class^='level']) > div.li";
    var one_click = "";
    var clicks = 0;

    get_cookie();
    sub_id = sub(trim_url(window.location.href), JSINFO["start"]);
    set_cookie(sub_id);

    // implementation of "one click" and "double click" behaviour:
    // "double click" has effect only if occurs in less X milliseconds,
    // where X is the time lapse defined in setTimeout
    jQuery(_SELECTOR).click(function(event) {
        // redefine "this" in outer scope in order to be used in setTimeout
        var that = this;
        var $item = trim_url(jQuery(this).find("a").attr("href"));
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
