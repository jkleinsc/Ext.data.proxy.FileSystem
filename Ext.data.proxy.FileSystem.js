/*

*/
/**
 * @author John Kleinschmidt
 *
 * FileSystem is a proxy for the HTML5 Filesystem API. It uses the Filesystem API to
 * save {@link Ext.data.Model model instances} representing files for offline use.
 */
Ext.define('Ext.data.proxy.FileSystem', {
    extend: 'Ext.data.proxy.Client',
    alias: 'proxy.filesystem',

    /**
     * @cfg {String} id
     * The unique ID used as the key in which all record data are stored in the local storage object.
     */
    id: undefined,

    /**
     * Creates the proxy, throws an error if the Filesystem API is not supported in the current browser.
     * @param {Object} config (optional) Config object.
     */
    constructor: function(config) {
        var me = this;
        this.callParent(arguments);
        
        window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
        //<debug>
        if (window.requestFileSystem === undefined) {
            Ext.Error.raise('File System is not supported in this browser, please use another type of data proxy');
        }
        //</debug>                
        
        this.requestQuota(config.size);
        
        window.requestFileSystem(PERSISTENT, config.size, function(fs){
            me.fileSystem = fs;
        }, this.requestQuota);
        
        
    },

    //inherit docs
    create: function(operation, callback, scope) {
        this.update(operation, callback, scope);
    },    
    
    /**
     * Destroys all records stored in the proxy and removes all keys and values used to support the proxy from the
     * storage object.
     */
    clear: function() {
        var directoryReader = this.fileSystem.root.createReader();
        directoryReader.readEntries(this.removeFiles,
            Ext.bind(this.errorHandler, this, ['Error reading directory to clear files'], true)
        );
    },   

    //inherit docs
    read: function(operation, callback, scope) {        
        if (this.fileSystem === undefined) {
            Ext.defer(this.read, 20, this, [operation, callback, scope]);            
        } else {
            var directoryToRead;   
            if (operation.node.isRoot()) {
                directoryToRead = this.fileSystem.root;
                this.readDirectory(directoryToRead, operation, callback, scope);
            } else {                   
                directoryToRead = this.fileSystem.root.getDirectory(operation.node.getId(),
                    {},
                    Ext.bind(this.readDirectory, this, [operation, callback, scope], true),
                    Ext.bind(this.errorHandler, this, ['Directory read failed'], true)
                );
            }
        }            
    },
    
    //inherit docs
    update: function(operation, callback, scope) {
        var records = operation.records,
            length  = records.length,
            record, id, i;

        operation.setStarted();

        for (i = 0; i < length; i++) {
            record = records[i];
            this.setRecord(record);           
        }

        operation.setCompleted();
        operation.setSuccessful();

        if (typeof callback == 'function') {
            callback.call(scope || this, operation);
        }
    },

    //inherit
    destroy: function(operation, callback, scope) {
        var records = operation.records,
            length  = records.length,
            i;

        for (i = 0; i < length; i++) {
            this.removeRecord(records[i]);
        }

        operation.setCompleted();
        operation.setSuccessful();

        if (typeof callback == 'function') {
            callback.call(scope || this, operation);
        }
    },

    /**
     * Saves the given record in the Proxy. Runs each field's encode function (if present) to encode the data.
     * @param {Ext.data.Model} record The model instance
     * @param {String} [id] The id to save the record under (defaults to the value of the record's getId() function)
     */
    setRecord: function(record, id) {
        if (this.fileSystem === undefined) {
            Ext.defer(this.setRecord, 20, this, [record, id]);
        } else {             
            if (id) {
                record.setId(id);
            } else {
                id = record.getId();
            }
            var me = this;


            if (record.parentNode.isRoot()) {
                if (record.isLeaf()) {
                    this.updateFile(this.fileSystem.root, record);
                } else {
                    this.updateDirectory(this.fileSystem.root, record);
                }
            } else {
                var updateCallBack;
                if (record.isLeaf()) {
                    updateCallBack = Ext.bind(this.updateFile, this, [record], true);
                } else {
                    updateCallBack = Ext.bind(this.updateDirectory, this, [record], true);
                }

                this.fileSystem.root.getDirectory(record.parentNode.getId(),
                    {},
                    updateCallBack,
                    Ext.bind(this.handleNotFoundDirectory, this, ['Error reading directory to update file or directory.  Directory was: '+record.parentNode.getId(), record, updateCallBack], true)
                );

            }
        }
    },
    
    /**
     * @private
     * Error handler for errors proxy may throw.  Throws Ext.Error.
     */
    errorHandler: function(e, errmsg) {
        Ext.Error.raise({
            msg: errmsg,
            error: e
        });
    },    

    /**
     * @private
     * In the case where a file is being added to a directory that doesn't exist, go ahead and create that directory.
     */
    handleNotFoundDirectory: function(err, errmsg, record, callback) {
        if (err.code == FileError.NOT_FOUND_ERR) {
            this.fileSystem.root.getDirectory(record.parentNode.getId(), {create: true}, callback,
                Ext.bind(this.errorHandler, this, ['Error creating directory to update:'+record.parentNode.getId()], true)
            );
        } else {
            this.errorHandler(err, errmsg);
        }
    },    

    /**
     * @private
     * Sets up the Proxy by setting up the FileSystem object.
     */
    initialize: function(fs) {
        this.fileSystem = fs;
    },

    /**
     * @private
     */
    mapFileToRecord: function(fileEntry) {        
        var data    = {},
            Model   = this.model,
            record;
                
        data = {
            "text":fileEntry.name,"id":fileEntry.fullPath,"leaf":fileEntry.isFile,
            "url":fileEntry.toURL(), "fileEntry":fileEntry
        };
        if (fileEntry.isFile) {
            data.cls = "file";
        } else if(fileEntry.isDirectory) {
            data.cls = "folder";
        }
        
        record = new Model(data, fileEntry.fullPath);
        record.phantom = false;
        return record;
    },

    /**
     * @private
     */
    readDirectory: function(directoryToRead, operation, callback, scope) {
        var me = this,
            directoryReader = directoryToRead.createReader(),
            records = [];
        directoryReader.readEntries( function(entries){
            Ext.each(entries, function(entry){
                record = me.mapFileToRecord(entry);
                if (record) {
                    records.push(record);
                }
            });
            operation.setSuccessful();
            operation.setCompleted();

            operation.resultSet = Ext.create('Ext.data.ResultSet', {
                records: records,
                total  : records.length,
                loaded : true
            });
            if (typeof callback == 'function') {
                callback.call(scope || this, operation);
            }
        });
    },
    
    /**
     * @private
     */
    removeEntry:  function(entry) {
        var me = this;
        console.log("in remove entry for entry:");
        console.dir(entry);
        if (entry.isDirectory) {
            entry.removeRecursively(Ext.emptyFn, 
                Ext.bind(this.errorHandler, this, ['Error recursively removing a directory.'], true)
            );
        } else {
            entry.remove(Ext.emptyFn, 
                function(error) {
                    if (error.code !== 1) {
                        me.errorHandler(error, 'Error removing a file.');
                    }
                }
            );
        }
    },

    /**
     * @private
     */
    removeFiles: function(entries) {
        Ext.each(entries, this.removeEntry, this);
    },

    /**
     * @private
     * Physically removes a given file from the local storage. Used internally by {@link #destroy}.
     * @param {String/Number/Ext.data.Model} id The id of the record to remove, or an Ext.data.Model instance
     */
    removeRecord: function(id) {
        console.log("removing record:"+id);
        console.dir(id);
        var me = this,
            leaf = false;
        if (id.isModel) {
            leaf = id.isLeaf();
            id = id.getId();            
        }
            
        if (leaf) {
            this.fileSystem.root.getFile(id, {}, 
                Ext.bind(this.removeEntry, this),
                function(error) {
                    if (error.code !== 1) {
                        me.errorHandler(error, 'Error getting file for delete');
                    }
                }
            );
        } else {
            this.fileSystem.root.getDirectory(id, {}, 
                Ext.bind(this.removeEntry, this),
                function(error) {
                    if (error.code !== 1) {               
                        me.errorHandler(error, 'Error getting directory for delete');
                    }
                }
            );            
        }
        
    },      
    
    /**
     * @private
     * Request persistent storage of specified size.
     */
    requestQuota: function(size) {
        if (navigator.webkitPersistentStorage) {
            navigator.webkitPersistentStorage.requestQuota(size, Ext.emptyFn, 
                Ext.bind(this.errorHandler, this, ['Error requesting persistent storage of '+size+' bytes'], true)
            );
        } else {
            window.webkitStorageInfo.requestQuota(PERSISTENT, size, Ext.emptyFn, 
                Ext.bind(this.errorHandler, this, ['Error requesting persistent storage of '+size+' bytes'], true)
            );
        }
    },
    
    /**
     * @private
     */
    updateDirectory: function(parentDirectory, record) {
        //TODO update to handle file name change?
        parentDirectory.getDirectory(record.getId(), {create: true}, function(){
            record.commit();
        }, Ext.bind(this.errorHandler, this, ['Error getting directory to update:'+record.getId()], true));
    },

    /**
     * @private
     */
    updateFile: function(parentDirectory, record) {
        //TODO update to handle file name change?        
        parentDirectory.getFile(record.getId(), {create: true}, 
            Ext.bind(this.writeFile, this, [record], true), 
            Ext.bind(this.errorHandler, this, ['Error getting file to write'], true)
        );                
    },
    
    /**
     * @private
     */
    writeFile: function(fileEntry, record) {
        fileEntry.createWriter(function(fileWriter) {
            fileWriter.write(record.get('file'));
            record.set('url', fileEntry.toURL());
            record.set('id', fileEntry.fullPath);
            record.commit();
        }, Ext.bind(this.errorHandler, this, ['Error getting file writer'], true));
    }
   
});
