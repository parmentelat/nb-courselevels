// based on discussions here
// https://discourse.jupyter.org/t/styling-cells-through-metadata/4978/14
// https://github.com/jupyterlab/jupyterlab/pull/8410
// for starters we use this way of marking the cells
//
// metadata.tags.basic          present (= true) or absent
// metadata.tags.intermediate   present (= true) or absent
// metadata.tags.advanced       present (= true) or absent
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

    // the 'code' color is not yet implemented
    // if would be about the div.CodeMirror
    // underneath the div.cell[data-tag-level=true]
    let level_specs = {
        basic: {cell: "#D2FAD2", code: "lightgreen", icon: "hand-pointer-o"},
        intermediate: {cell: "#D2D2FB", code:"lightblue", icon: "hand-peace-o"},
        advanced: {cell: "#F1D1D1", code: "lightred", icon: "hand-spock-o"},
    };

    let levels = Object.keys(level_specs);

    function current_level(cell) {
        if (! 'metadata' in cell) {
            return null;
        }
        let metadata = cell.metadata;
        for (let level of levels) 
            if (level in metadata)
                return level;
        return null;
    }

    function toggle_level(level) {
        let cells = Jupyter.notebook.get_selected_cells();
        for (let cell of cells) {
            if (! ('metadata' in cell))
                cell.metadata = {};
            let metadata = cell.metadata;
            if (! (level in metadata)) {
                for (let otherlevel of levels) 
                    if (otherlevel in metadata) 
                        delete metadata[otherlevel];
                metadata[level] = true;
            } else {
                delete metadata[level];
            }
            propagate(cell);
        }
    }

    function propagate(cell) {
        let level = current_level(cell);
        let element = cell.element;
        console.log(element);
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
        console.log(css);
        return css;
    }

    function initialize () {
        function inject_css () {
            let style = document.createElement("style");
            style.innerHTML = compute_css();
            document.getElementsByTagName("head")[0].appendChild(style);
        }

        let module = 'courselevels';

        console.log("initializing ${module}")

        actions = [];
        for (let [level, details] of Object.entries(level_specs)) 
            actions.push(
                Jupyter.keyboard_manager.actions.register ({
                    help : `Toggle ${level}`,
                icon : `fa-${details.icon}`,
                handler : () => toggle_level(level),
            }, `toggle-${level}`, module));

        function create_menubar() {
            Jupyter.toolbar.add_buttons_group(actions);
        }

        inject_css();
        create_menubar();
        propagate_all_cells();
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
