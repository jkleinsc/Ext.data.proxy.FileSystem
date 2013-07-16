Ext.data.proxy.FileSystem
=========================

ExtJS 4.x data proxy for the FileSystem API

To use this proxy, specify the following in your store's configuration.
```javascript
    ...
    proxy: {
        type: 'filesystem',
        size: Size in bytes (eg (1024*1024*1024) for 1GB
    }
```

The proxy uses special fields for the records in the store
*''file'' -- The file to save using the FileSystem API (used on create only).
*''fileEntry'' -- The FileEntry representing the file
*''text'' -- The filename
*''url'' -- The filesystem url for the file

## License

(The MIT License)

Copyright (c) 2013 John Kleinschmidt

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.