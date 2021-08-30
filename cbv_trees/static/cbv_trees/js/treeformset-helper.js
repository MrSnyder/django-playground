$(function () {
  function get_node_by_id(node_id) {
    return $('#mapcontext_tree').jstree(true).get_node(node_id);
  }
  function get_node_name(node) {
    let name = node.text.trim();
    if (name !== '/') {
      return name;
    }
    return '';
  }
  function append_layer_form_field() {
    const layerForms = document.querySelectorAll('.mapcontext_layer_form');
    const formNum = layerForms.length;
    const html = layerForms[formNum - 1].outerHTML;
    const newHtml = html.replace(RegExp('form-\\d+-', 'g'), `form-${formNum}-`);
    $('.mapcontext_layer_form').last().after(newHtml);
    $('#id_form-TOTAL_FORMS').val(formNum + 1);
  }
  function update_layer_tree_input() {
    let tree = $('#mapcontext_tree').jstree(true);
    let tree_state = tree.get_json(undefined, {
      flat: true,
      no_a_attr: true,
      no_li_attr: true,
      no_state: true
    }).map(node => ({
      id: node.id,
      text: node.text,
      type: node.type,
      parent: node.parent,
      data: node.data
    }));
    $('#id_mapcontext_form input[name="layer_tree"]').val(JSON.stringify(tree_state));
    const layerForms = $('.mapcontext_layer_form');
    for (i in layerForms) {
        if (i < tree_state.length) {
            const node = tree_state[i];
            layerForms[i].setAttribute('data-jstree-node-id', node.id);
            $(`#id_form-${i}-title`).val(node.text);
            $(`#id_form-${i}-id`).val(node.id);
            $(`#id_form-${i}-parent`).val(node.parent);
            $(`#id_form-${i}-DELETE`).prop('checked', false);
        } else {
            $(`#id_form-${i}-title`).val('');
            $(`#id_form-${i}-id`).val('');
            $(`#id_form-${i}-parent`).val('');
            if ($(`#id_form-${i}-id`).val()) {
                $(`#id_form-${i}-DELETE`).prop('checked', true);
            }
        }
    }
  }
  $('#mapcontext_tree').jstree({
    "core": {
      "check_callback": function (operation, node, node_parent, node_position, more) {
        // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node', 'copy_node' or 'edit'
        // in case of 'rename_node' node_position is filled with the new node name
        if (operation === 'move_node') {
          return typeof node_parent.text !== 'undefined';
        }
        return true;
      },
      "data": function (obj, cb) {
        const data = [];
        // TODO configurable
        const layerForms = $('.layer-form');
        for (i = 0; i < layerForms.length - 1; i++) {
            data.push ({
                // TODO configurable
                id : $(`#id_layer-${i}-id`).val(),
                parent : $(`#id_layer-${i}-parent`).val() || "#",
                text : $(`#id_layer-${i}-name`).val()
            });
        }
        console.log(data);
        cb.call(this, data);
      }
    },
    "plugins": ["dnd", "types", "unique", "rename", "actions"],
    "dnd": {
      "copy": false,
    },
    "types": {
      "root": {
        "icon": "fas fa-folder",
        "valid_children": ["default", "resource"]
      },
      "default": {
        "icon": "fas fa-folder",
        "valid_children": ["default", "resource"]
      },
      "resource": {
        "icon": "fas fa-map",
        "valid_children": []
      }
    }
  }).on('create_node.jstree', function (e, data) {
    append_layer_form_field(data.node.id);
    update_layer_tree_input();
  }).on('rename_node.jstree', function (e, data) {
    update_layer_tree_input();
  }).on('delete_node.jstree', function (e, data) {
    update_layer_tree_input();
  }).on('select_node.jstree', function (e, data) {
    $('.mapcontext_layer_form').attr('style','display: none');
    data.selected.forEach( id => {
        $(`[data-jstree-node-id=${id}]`).attr('style','display: block');
    });
  });
  $('#mapcontext_tree').on('move_node.jstree', function (e, data) {
    update_layer_tree_input();
  });
  let layerTree = $('#mapcontext_tree').jstree(true);
  $('#mapcontext_tree').on('model.jstree', function (e, data) {
    data.nodes.forEach(node_id => {
      let node = layerTree.get_node(node_id);
      if (node.type === 'default') {
        layerTree.add_action(node_id, {
          "id": "action_add_folder",
          "class": "fas fa-plus-circle pull-right",
          "title": "Add Folder",
          "after": true,
          "selector": "a",
          "event": "click",
          "callback": function (node_id, node, action_id, action_el) {
            let jstree = $('#mapcontext_tree').jstree(true);
            jstree.create_node(node, {}, "last", function (new_node) {
              try {
                jstree.edit(new_node);
              } catch (ex) {
                setTimeout(function () { inst.edit(new_node); }, 0);
              }
            });
          }
        });
        if (node.parent !== '#') {
          layerTree.add_action(node_id, {
            "id": "action_remove",
            "class": "fas fa-minus-circle pull-right",
            "title": "Remove Child",
            "after": true,
            "selector": "a",
            "event": "click",
            "callback": function (node_id, node, action_id, action_el) {
              let jstree = $('#mapcontext_tree').jstree(true);
              jstree.delete_node(node);
            }
          });
        }
        layerTree.add_action(node_id, {
          "id": "action_edit",
          "class": "fas fa-edit pull-right",
          "title": "Edit",
          "after": true,
          "selector": "a",
          "event": "click",
          "callback": function (node_id, node, action_id, action_el) {
            let jstree = $('#mapcontext_tree').jstree(true);
            jstree.edit(node.id);
          }
        });
      } else if (node.type === 'resource') {
        layerTree.add_action(node_id, {
          "id": "action_remove",
          "class": "fas fa-minus-circle pull-right",
          "title": "Remove",
          "after": true,
          "selector": "a",
          "event": "click",
          "callback": function (node_id, node, action_id, action_el) {
            let jstree = $('#mapcontext_tree').jstree(true);
            jstree.delete_node(node);
          }
        });
      }
    });
  });
});
