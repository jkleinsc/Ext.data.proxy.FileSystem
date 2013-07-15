/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

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
        },
        addFolder: function(item, evt) {
            this.selectedNode.appendChild({
                id: "new folder",            
                leaf:false,
                text:"new folder",
                cls:"folder"
            });  
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
        dockedItems: [{
            xtype: 'toolbar',
            items: [{
                text: 'Add File',
                handler: function(){
                    tree.getRootNode().appendChild({
                        leaf:true,
                        text:"some text",
                        cls:"",
                        iconCls:""                    
                    });
                }
            }, {
                text: 'Collapse All',
                handler: function(){
                    tree.collapseAll();
                }
            }]
        }], 
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
                text: 'Save',
                handler: saveFile
            },{
                text: 'Reset',
                handler: function() {
                    this.up('form').getForm().reset();
                }
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


