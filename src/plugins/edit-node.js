/**
 * @module: Tree
 * @author: crossjs <liwenfu@crossjs.com> - 2015-4-22 13:05:11
 */

'use strict';

var $ = require('jquery');

var Alert = require('nd-alert');
var FormExtra = require('nd-form-extra');

var treeNode = require('../modules/treenode');

module.exports = function() {
  var plugin = this,
    host = plugin.host,
    options = plugin.options || {},
    uniqueId,
    awaiting;

  function makeForm(data) {
    return new FormExtra($.extend(true, {
      name: 'tree-edit-node',
      // action: '',
      method: 'PATCH',
      // 表单数据
      formData: data,
      proxy: host.get('proxy'),
      parentNode: host.get('parentNode')
    }, options))
    .on('formCancel', function() {
      plugin.trigger('hide', this);
    })
    // TODO: 此处过分耦合 form 逻辑
    .on('formSubmit', function() {
      var that = this;
      // 调用队列
      this.queue.run(function() {
        plugin.trigger('submit', that.get('dataParser').call(that));
      });
      // 阻止默认事件发生
      return false;
    });
  }

  host.addNodeAction($.extend({
    'role': 'edit-node',
    'text': '编辑'
  }, options.button), 0);

  // 移除参数
  delete options.button;

  // 异步插件，需要刷新列表
  // if (plugin._async) {
  //   host._renderPartial();
  // }

  host.delegateEvents({
    'click [data-role="edit-node"]': function(e) {
      if (awaiting) {
        return;
      }

      if (!plugin.exports) {
        // 添加用于阻止多次点击
        awaiting = true;

        uniqueId = treeNode($(e.currentTarget).closest('li')).get('id');

        host.GET(uniqueId)
        .done(function(data) {
          plugin.exports = makeForm(data).render();
          plugin.trigger('show', plugin.exports);
        })
        .fail(function(error) {
          Alert.show(error);
        })
        .always(function() {
          awaiting = false;
        });
      } else {
        plugin.trigger('show', plugin.exports);
      }
    }
  });

  host.before('destroy', function() {
    plugin.exports && plugin.exports.destroy();
  });

  plugin.on('show', function(form) {
    // 通知就绪
    // plugin.ready();

    host.element.hide();
    form.element.show();
  });

  plugin.on('hide', function(form) {
    host.element.show();
    form.destroy();
    delete plugin.exports;
  });

  plugin.on('submit', function(data) {
    host.PATCH(uniqueId, data)
      .done(function(data) {
        // 成功，更新节点
        host.modifyNode(data);

        plugin.trigger('hide', plugin.exports);
      })
      .fail(function(error) {
        Alert.show(error);
      });
  });

  // 通知就绪
  this.ready();
};