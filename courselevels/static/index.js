// based on discussions here
// https://discourse.jupyter.org/t/styling-cells-through-metadata/4978/14
// https://github.com/jupyterlab/jupyterlab/pull/8410
// for starters we use this way of marking the cells
//
// metadata.tags.level_basic          
// metadata.tags.level_intermediate   
// metadata.tags.level_advanced       
//
// at most one should be present
// 
// and to materialize it in the DOM we do e.g.
// <div class="cell ..."
//     data-tag-basic=1 ...>


"using strict";

define(
    ['base/js/namespace', 
     'base/js/events'],
function (Jupyter, events) {

    let module = 'courselevels';

    let level_specs = {
        level_basic: {cell: "#D2FAD2", icon: "hand-pointer-o", 
            command_shortcut: "ctrl-x", edit_shortcut: "ctrl-x"},
        level_intermediate: {cell: "#D2D2FB", icon: "hand-peace-o", 
            command_shortcut: "ctrl-y", edit_shortcut: "ctrl-y"},
        level_advanced: {cell: "#F1D1D1", icon: "hand-spock-o", 
            command_shortcut: "ctrl-z", edit_shortcut: "ctrl-z"},
    };

    let levels = Object.keys(level_specs);

    function current_level(cell) {
        if (! ('metadata' in cell)) {
            return null;
        }
        if (! ('tags' in cell.metadata)) {
            return null;
        }
        let tags = cell.metadata.tags;
        for (let level of levels) 
            if (tags.indexOf(level) >= 0)
                return level;
        return null;
    }

    function toggle_level(level) {
        let cells = Jupyter.notebook.get_selected_cells();
        for (let cell of cells) {
            if (! ('metadata' in cell))
                cell.metadata = {};
            if (! ('tags' in cell.metadata))
                cell.metadata.tags = [];
            let tags = cell.metadata.tags;
            let level_index = tags.indexOf(level);
            if (level_index < 0) {
                for (let otherlevel of levels) {
                    let otherlevel_index = tags.indexOf(otherlevel);
                    if (otherlevel_index >= 0) 
                        tags.splice(otherlevel_index)
                }
                tags.push(level);
            } else {
                tags.splice(level_index, 1);
            }
            propagate(cell);
        }
    }

    function propagate(cell) {
        let level = current_level(cell);
        let element = cell.element;
        function add_level_in_dom(level) {
            element.attr(`data-tag-${level}`, true);
        }
        function del_level_in_dom(level) {
            element.removeAttr(`data-tag-${level}`);
        }
        for (let otherlevel of levels) {
            if (otherlevel == level) 
                add_level_in_dom(otherlevel);
            else
                del_level_in_dom(otherlevel);
        }
    }

    function propagate_all_cells() {
        Jupyter.notebook.get_cells().forEach(propagate);
    }

    function compute_css() {
        let css = `
div.cell.selected,
div.cell.jupyter-soft-selected {
    background-image:
        linear-gradient(rgba(255,255,255,.5) 2px, transparent 2px),
        linear-gradient(90deg, rgba(255,255,255,.5) 2px, transparent 2px),
        linear-gradient(rgba(255,255,255,.28) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.28) 1px, transparent 1px);
    background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
    background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;
}
`;
        for (let [level, details] of Object.entries(level_specs))
            css += `
div.cell[data-tag-${level}=true] {
    background-color: ${details.cell};
}
`;
        return css;
    }

    function inject_css () {
        let style = document.createElement("style");
        style.innerHTML = compute_css();
        document.getElementsByTagName("head")[0].appendChild(style);
    }

    function create_menubar() {
        Jupyter.toolbar.add_buttons_group(actions);
    }

    function define_keyboard_shortcuts() {
        let command_shortcuts = Jupyter.keyboard_manager.command_shortcuts;
        let edit_shortcuts = Jupyter.keyboard_manager.edit_shortcuts;
        for (let [level, details] of Object.entries(level_specs)) {
            if ('command_shortcut' in details)
                command_shortcuts.set_shortcut(
                    details.command_shortcut, `${module}:toggle-${level}`);
            if ('edit_shortcut' in details)
                edit_shortcuts.set_shortcut(
                    details.edit_shortcut, `${module}:toggle-${level}`);
        }
    }

    function initialize() {

        console.log("initializing ${module}")

        actions = [];
        for (let [level, details] of Object.entries(level_specs)) 
            actions.push(
                Jupyter.keyboard_manager.actions.register ({
                    help : `Toggle ${level}`,
                icon : `fa-${details.icon}`,
                handler : () => toggle_level(level),
            }, `toggle-${level}`, module));

        inject_css();
        // apply initial status
        propagate_all_cells();
        create_menubar();
        define_keyboard_shortcuts();
    }

    function load_jupyter_extension() {
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // notebook already loaded. Update directly
            initialize();
        }
        events.on("notebook_loaded.Notebook", initialize);
    }

    return {
        'load_ipython_extension': load_jupyter_extension,
        'load_jupyter_extension': load_jupyter_extension
    };

})