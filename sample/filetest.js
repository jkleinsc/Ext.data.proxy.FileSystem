/*
The MIT License (MIT)

Copyright (c) 2013 John Kleinschmidt

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath({
    'Ext': '/ext/src',
    'Ext.data.proxy.FileSystem': 'js/ext.data.proxy/FileSystem.js'
});


Ext.require([
    'Ext.tree.*',
    'Ext.data.*',
    'Ext.tip.*',    
    'Ext.grid.ColumnLayout',
    'Ext.data.proxy.FileSystem',
    'Ext.data.TreeStore',
    'Ext.tree.Panel',
    'Ext.form.field.File',
    'Ext.form.Panel',
    'Ext.tree.plugin.TreeViewDragDrop',
    'Ext.container.Viewport',
    'Ext.layout.container.Border',
    'Ext.layout.container.Column'
]);    



Ext.onReady(function() {  
    var store = Ext.create('Ext.data.TreeStore', {
        autoSync: true,
        autoLoad: true,
        proxy: {
            type: 'filesystem',
            size: (1024*1024*1024)
        },
        root: {
            text: 'Local Photos',
            id: 'local-photos',
            expanded: true, 
            leaf: false
        },
        folderSort: true,
        sorters: [{
            property: 'text',
            direction: 'ASC'
        }],
        fields: [
            'file',
            'text',
            'url'
        ]
    });
    
    var treeMenu = Ext.define('TreeMenu', {
        extend: 'Ext.menu.Menu',
        items: [
            {
                text: 'Delete',                
                handler: function(item, evt) {                                        
                    var selectedNode = tree.getSelectionModel().getSelection()[0];
                    selectedNode.remove(true);
                }
            }
        ],
        selectedNode: undefined,
        setNode: function(aNode) {
            selectedNode = aNode;
        }
    });
    
    var contextMenu = new treeMenu();    

    var tree = Ext.create('Ext.tree.Panel', {
        flex: 4,
        store: store,
        viewConfig: {
            plugins: {
                ptype: 'treeviewdragdrop'
            }
        },
        height: 300,
        width: 250,
        title: 'Files',
        useArrows: true,
        listeners: {
            itemclick: function ( view, record, item, index, e, eOpts ) {
                Ext.get('preview-img').set({src: record.get('url')});
            },
            itemcontextmenu: function(view, rec, node, index, e) {
                e.stopEvent();
                contextMenu.setNode(rec);
                contextMenu.showAt(e.getXY());
                return false;
            }            
        }
            
    });
    
    function saveFile() {
        var form = fileInputPanel.getForm();
        var fileInputEl = form.getFields().get('form-file').fileInputEl.dom;
        for (var i = 0, currentFile; currentFile = fileInputEl.files[i]; ++i) {
            var newNode = tree.getRootNode().appendChild({
                id: currentFile.name,            
                leaf:true,
                text:currentFile.name,
                cls:"file",
                file: currentFile,
                newFile: true
            });
        }    
    }
    
    var fileInputPanel = Ext.create('Ext.form.Panel', {        
        flex: 1,
        frame: true,
        title: 'Photo Upload Form',        

        defaults: {
            anchor: '100%',
            allowBlank: false,
            msgTarget: 'side',
            labelWidth: 50
        },

        items: [{
            xtype: 'filefield',
            id: 'form-file',
            emptyText: 'Select an image',
            fieldLabel: 'Photo',
            name: 'photo-path',
            buttonText: '',
            buttonConfig: {
                iconCls: 'upload-icon'
            }
        }],
    
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            ui: 'footer',    

            items: [{
                text: 'Add',
                handler: saveFile
            }]
        }]
    });

    var viewport = Ext.create('Ext.Viewport', {
        layout:'border',
        items:[{            
            region: 'west',
            width: 300,
            layout: {
                type:'vbox',
                align:'stretch'
            },
            items: [
                fileInputPanel,
                tree
            ]                    
        }, {
            region:'center',
            autoScroll:true,
            title: 'Current Image',
            html: '<img id="preview-img" style="height: 100%;"></img>',                
        }]
    });
});    


