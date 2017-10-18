/**
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * script.js: it defines the accordion menu behaviour used by AcMenu plugin.
 *
 * @author Torpedo <dgtorpedo@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package script
 */

jQuery(document).ready(function() {
    // the jQuery selector used is defined as the element (right to left):
    //     <div> that is not direct child of class starting with class="level"
    //     which in turns is direct child of <ul>
    //     which in turns is descendant of the class="acmenu"
    const _SELECTOR = "div.acmenu ul > :not([class^='level']) > div";
    var open_items = [];
    var one_click = "";
    var clicks = 0;

    get_cookie();

    // implementation of "one click" and "double click" behaviour:
    // "double click" has effect only if occurs in less X milliseconds,
    // where X is the time lapse defined in setTimeout
    jQuery(_SELECTOR).click(function(event) {
        // redefine "this" in outer scope in order to be used in setTimeout
        var that = this;
        var $item = jQuery(this).find("a").attr("href");
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

    // recover previously cookie(s) in order to remember which item is open
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
    };
 
    // sanitaize the url
    function clean_url(url) {
        // from: doku.php?id=<base_ns>:<ns-1>:<ns-i>#<hash>
        // keep: <base_ns>:<ns-1>:<ns-i>
        const _REGEX = /(?:\/doku\.php\?id=)(.[^\#]*)/g;
        var clean_url = _REGEX.exec(url);

        return clean_url[1];
    };

});
