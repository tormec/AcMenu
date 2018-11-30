<?php
/**
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * syntax.php: it defines all the methods used by AcMenu plugin
 *     which extends DokuWiki's syntax.
 *
 * @author Torpedo <dcstoyanov@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package syntax
 */

 if (!defined("DOKU_INC")) die();  // the plugin must be run within Dokuwiki

 /**
 * This class defines all the methods used by the AcMenu plugin to produce
 * the plugin's output.
 *
 * It extends DokuWiki's basic syntax defined in lib/plugins/syntax.php.
 *
 * @package syntax_acmenu
 */
class syntax_plugin_acmenu extends DokuWiki_Syntax_Plugin {

    /**
     * Define the syntax types that this plugin applies when founds
     * its token: replace it.
     *
     * @return string
     */
    public function getType() {
        return "substition";
    }

    /**
     * Define how the plugin's output is handled regarding paragraphs.
     *
     * Open paragraphs will be closed before plugin output and the plugin output
     * will not starts with a paragraph:
     * <p>foo</p>
     * <acmenu>
     * <p>bar</p>
     *
     * @return string
     */
    public function getPType() {
        return "block";
    }

    /**
     * Define the priority used to determine in which order modes are
     * added: the mode with the lowest sort number will win.
     *
     * Since this plugin provides internal links, it is sorted at:
     * AcMenu plugin < Doku_Parser_Mode_internallink (= 300)
     *
     * @return integer
     */
    public function getSort() {
        return 295;
    }

    /**
     * Define the regular expression needed to match the plugin's syntax.
     *
     * This plugin use the following general syntax:
     * <acmenu [list of parameters]>
     *
     * @param string $mode
     *      name for the format mode of the final output
     */
    public function connectTo($mode) {
        $this->Lexer->addSpecialPattern("<acmenu.*?>", $mode, "plugin_acmenu");
    }

    /**
     * Handle the plugin's syntax matched.
     *
     * This function is called every time the parser encounters the
     * plugin's syntax in order to produce a list of instructions for the
     * renderer, which will be interpreted later.
     *
     * @param string $match
     *      the text matched
     * @param integer $state
     *      the lexer state
     * @param integer $pos
     *      the character position of the matched text
     * @param object $handler
     *      object reference to the Doku_Handler class
     * @return array $data
     *      the parameters handled by the plugin's syntax
     */
    public function handle($match, $state, $pos, Doku_Handler $handler) {
        $data = array();

        $match = substr($match, 7, -1);  // strips "<acmenu" and ">"

        return $data;
    }

    /**
     * Process the list of instructions that render the final output.
     *
     * @param string $mode
     *      name for the format mode of the final output
     * @param object $renderer
     *      object reference to the Doku_Render class
     * @param array $data
     *      the parameters handled by the plugin's syntax
     */
    public function render($mode, Doku_Renderer $renderer, $data) {
        global $INFO;
        global $conf;

        // disable the cache
        $renderer->nocache();

        // get the namespace genealogy of the current id
        // and store it as metadata for been used in javascript
        $sub_ns = $this->_get_sub_ns($INFO["id"]);
        p_set_metadata($INFO["id"], array("plugin" => array("plugin_acmenu" => array("sub_ns" => $sub_ns))), false, false);

        // build the namespace tree structure
        $ns_acmenu = $this->_get_ns_acmenu($sub_ns);  // namespace in which <acmenu> is
        $level = 0;
        $tree = $this->_tree($ns_acmenu, $level);
        $tree = $this->_sort_ns_pg($tree);

        // get heading and id of the namespace in which <acmenu> is
        $base_id = implode(":", array_filter(array($ns_acmenu, $conf["start"])));
        $base_heading = p_get_first_heading($base_id);
        if (!isset($base_heading)) {
            $base_heading = $ns_acmenu;
        }

        // get cookies
        $open_items = $this->_get_cookie();

        // print the namespace tree structure
        $renderer->doc .= "<div class='acmenu'>";
        $renderer->doc .= "<ul class='idx'>";
        $renderer->doc .= "<li class='open'>";
        $renderer->doc .= "<div class='li'>";
        $renderer->doc .= "<span class='curid'>";
        $renderer->internallink($base_id, $base_heading);
        $renderer->doc .= "</span>";
        $renderer->doc .= "</div>";
        $renderer->doc .= "<ul class='idx'>";
        $this->_print($renderer, $tree, $sub_ns, $open_items);
        $renderer->doc .= "</ul>";
        $renderer->doc .= "</li>";
        $renderer->doc .= "</ul>";
        $renderer->doc .= "</div>";
        // only if javascript is enabled and only at the first time
        // hide the content of each namespace
        // except those that are parents of the page selected
        if (!isset($open_items) || isset($open_items) && count($open_items) == 0) {
            $renderer->doc .= "<script type='text/javascript'>";
            $renderer->doc .= "jQuery('div.acmenu ul.idx li.open div.li:not(:has(span.curid))')
                               .next().hide()
                               .parent().removeClass('open').addClass('closed');";
            $renderer->doc .= "</script>";
        }
    }

    /**
     * Get cookies.
     *
     * @return array $open_items
     *      the id of the <start> pages to keep open in the form:
     *      array {
     *      [i] => (str) "<ns-acmenu>:<ns-1>:..:<ns-i>:<start>"
     *      }
     */
    private function _get_cookie() {
        $open_items = $_COOKIE["plugin_acmenu_open_items"];
        if (isset($open_items)) {
            $open_items = json_decode($open_items);
        }
        else {
            $open_items = array();
        }

        return $open_items;
    }

    /**
     * Get the namespace's name in which <acmenu> is.
     *
     * Start from the current namespace (the namespace of the current page)
     * and go up till the base namespace (the namespace in which <acmenu> is).
     *
     * @param array $sub_ns
     *      the namespace genealogy of the current page's id, in the form:
     *      array {
     *      [0] => (str) "<ns-acmenu>:<ns-1>:...:<ns-i>"
     *      ...
     *      [i-1] => (str) "<ns-acmenu>"
     *      [i] => (str) ""
     *      }
     * @return string $ns_acmenu
     *      the namespace's name in which <acmenu> is, in the form:
     *      <ns-acmenu>
     */
    private function _get_ns_acmenu($sub_ns) {
        global $INFO;
        global $conf;
        $dir = realpath($conf["savedir"] . "/pages");
        $ns_acmenu = "";

        if (!empty($INFO["namespace"])) {
            foreach ($sub_ns as $ns) {
                $sidebar = implode("/", array_filter(array(str_replace(":", "/", $ns), $conf["sidebar"])));
                if (file_exists($dir . "/" . $sidebar . ".txt")) {
                    $ns_acmenu = $ns;
                    break;
                }
            }
        }

        return $ns_acmenu;
    }

    /**
     * Build the namespace tree structure.
     *
     * Start from the base namespace (the namespace in which <acmenu> is)
     * and go down until the end.
     *
     * @param string $ns_acmenu
     *      the namespace's name in which <acmenu> is, in the form:
     *      <ns-acmenu>
     * @param string $level
     *      the level of indentation from which start to build the tree structure
     * @return array $tree
     *      the namespace tree, in the form:
     *      array {
     *      [0] => array {
     *          ["heading"] => (str) "<heading>"
     *          ["id"] => (str) "<id>"
     *          ["level"] => (int) "<level>"
     *          ["type"] => (str) "ns"
     *          ["sub"] => array {
     *              [0] => array {
     *                  ["heading"] => (str) "<heading>"
     *                  ["id"] => (str) "<id>"
     *                  ["level"] => (int) "<level>"
     *                  ["type"] => (str) "pg"
     *                  }
     *              [i] => array {...}
     *              }
     *          }
     *      [i] => array {...}
     *      }
     *      where:
     *      ["type"] = "ns" means "namespace"
     *      ["type"] = "pg" means "page"
     *      so that only namespaces can have ["sub"] namespaces
     */
    private function _tree($ns_acmenu, $level) {
        global $INFO;
        global $conf;
        $tree = array();
        $level = $level + 1;
        $dir = $conf["savedir"] ."/pages/" . str_replace(":", "/", $ns_acmenu);
        $files = array_diff(scandir($dir), array('..', '.'));
        foreach ($files as $file) {
            if (is_file($dir . "/" . $file)) {
                $pg_name = basename($file, ".txt");
                $id = implode(":", array_filter(array($ns_acmenu, $pg_name)));
                if (!isHiddenPage($id)) {
                    if (auth_quickaclcheck($id) >= AUTH_READ) {
                        $heading = $pg_name;
                        if (useheading("navigation")) {
                            $heading = p_get_first_heading($id);
                        }
                        $tree[] = array("heading" => $heading,
                                        "id" => $id,
                                        "level" => $level,
                                        "type" => "pg");
                    }
                }
            }
            else {
                $id = implode(":", array_filter(array($ns_acmenu, $file, $conf["start"])));
                if ($conf['sneaky_index'] && auth_quickaclcheck($id) < AUTH_READ) {
                    continue;
                }
                else {
                    $heading = $file;
                        if (useheading("navigation")) {
                            $heading = p_get_first_heading($id);
                        }
                    if (file_exists($dir . "/" . $file . "/" . $conf["sidebar"] . ".txt")) {
                        // subnamespace with a sidebar will not be scanned
                        $tree[] = array("heading" => $heading,
                                        "id" => $id,
                                        "level" => $level,
                                        "type" => "pg");
                        continue;
                    }
                    else {
                        $tree[] = array("heading" => $heading,
                                        "id" => $id,
                                        "level" => $level,
                                        "type" => "ns",
                                        "sub" => $this->_tree(implode(":", array_filter(array($ns_acmenu, $file))), $level));
                    }
                }

            }
        }

        return $tree;
    }

    /**
     * Get the namespace genealogy of the given id.
     *
     * @param string $id
     *      the current page's id, in the form:
     *      <ns-acmenu>:<ns-1>:...:<ns-i>:<pg>
     * @return array $sub_ns
     *      the namespace genealogy of the current page's id, in the form:
     *      array {
     *      [0] => (str) "<ns-acmenu>:<ns-1>:...:<ns-i>"
     *      ...
     *      [i-1] => (str) "<ns-acmenu>"
     *      [i] => (str) ""
     *      }
     */
    private function _get_sub_ns($id) {
        $sub_ns = array();
        $pieces = explode(":", $id);
        array_pop($pieces);  // remove <pg>

        $cp_pieces = $pieces;
        foreach ($pieces as $key => $val) {
            $sub_ns[] = implode(":", $cp_pieces);
            array_pop($cp_pieces);
        }
        $sub_ns[] = "";

        return $sub_ns;
    }

    /**
     * Print the namespace tree structure.
     *
     * @param object $renderer
     *      object reference to the Doku_Render class
     * @param array $tree
     *      the namespace tree, in the form:
     *      array {
     *      [0] => array {
     *          ["heading"] => (str) "<heading>"
     *          ["id"] => (str) "<id>"
     *          ["level"] => (int) "<level>"
     *          ["type"] => (str) "ns"
     *          ["sub"] => array {
     *              [0] => array {
     *                  ["heading"] => (str) "<heading>"
     *                  ["id"] => (str) "<id>"
     *                  ["level"] => (int) "<level>"
     *                  ["type"] => (str) "pg"
     *                  }
     *              [i] => array {...}
     *              }
     *          }
     *      [i] => array {...}
     *      }
     *      where:
     *      ["type"] = "ns" means "namespace"
     *      ["type"] = "pg" means "page"
     *      so that only namespaces can have ["sub"] namespaces
     * @param array $sub_ns
     *      the namespace genealogy of the current page's id, in the form:
     *      array {
     *      [0] => (str) "<ns-acmenu>:<ns-1>:...:<ns-i>"
     *      ...
     *      [i-1] => (str) "<ns-acmenu>"
     *      [i] => (str) ""
     *      }
     * @param array $open_items
     *      the namespaces to keep open, in the form:
     *      array {
     *      [i] => (str) "<ns_acmenu>:<ns-1>:...:<ns-i>"
     *      }
     */
    private function _print($renderer, $tree, $sub_ns, $open_items) {
        global $INFO;
        global $conf;
        foreach ($tree as $key => $val) {
            if ($val["type"] == "pg") {
                $renderer->doc .= "<li class='level" . $val["level"]."'>";
                $renderer->doc .= "<div class='li'>";
                $renderer->internallink($val["id"], $val["heading"]);
                $renderer->doc .= "</div>";
                $renderer->doc .= "</li>";
            }
            elseif ($val["type"] == "ns") {
                if (in_array(substr($val["id"], 0, -strlen(":" . $conf["start"])), $sub_ns)
                    || in_array($val["id"], $open_items)) {
                    $renderer->doc .= "<li class='open'>";
                }
                else {
                    $renderer->doc .= "<li class='closed'>";
                }
                $renderer->doc .= "<div class='li'>";
                if (in_array(substr($val["id"], 0, -strlen(":" . $conf["start"])), $sub_ns)) {
                    $renderer->doc .= "<span class='curid'>";
                    $renderer->internallink($val["id"], $val["heading"]);
                    $renderer->doc .= "</span>";
                }
                else {
                    $renderer->internallink($val["id"], $val["heading"]);
                }
                $renderer->doc .= "</div>";
                if (in_array(substr($val["id"], 0, -strlen(":" . $conf["start"])), $sub_ns)
                    || in_array($val["id"], $open_items)) {
                    $renderer->doc .= "<ul class='idx'>";
                }
                else {
                    $renderer->doc .= "<ul class='idx' style='display: none'>";
                }
                $this->_print($renderer, $val["sub"], $sub_ns, $open_items);
                $renderer->doc .= "</ul>";
                $renderer->doc .= "</li>";
            }
        }
    }

    /**
     * Sort the tree namespace in ascending order.
     *
     * The tree is sorted in this order:
     * 1) namespaces;
     * 2) pages.
     * @param array $tree
     *      the namespace tree, in the form:
     *      array {
     *      [0] => array {
     *          ["heading"] => (str) "<heading>"
     *          ["id"] => (str) "<id>"
     *          ["level"] => (int) "<level>"
     *          ["type"] => (str) "ns"
     *          ["sub"] => array {
     *              [0] => array {
     *                  ["heading"] => (str) "<heading>"
     *                  ["id"] => (str) "<id>"
     *                  ["level"] => (int) "<level>"
     *                  ["type"] => (str) "pg"
     *                  }
     *              [i] => array {...}
     *              }
     *          }
     *      [i] => array {...}
     *      }
     *      where:
     *      ["type"] = "ns" means "namespace"
     *      ["type"] = "pg" means "page"
     *      so that only namespaces can have ["sub"] namespaces
     * @return array $tree
     *      the tree namespace sorted
     */
    private function _sort_ns_pg($tree) {
        $ns = array();
        $pg = array();

        foreach ($tree as $key => $val) {
            if ($val["type"] == "ns") {
                $val["sub"] = $this->_sort_ns_pg($val["sub"]);
                $ns[] = $val;
            }
            else {
                $pg[] = $val;
            }
        }
        sort($ns);
        sort($pg);
        $tree = array_merge($ns, $pg);

        return $tree;
    }
}
