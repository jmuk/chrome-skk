#!/usr/bin/env python
#

import fetcher

import urllib
import webapp2

from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers


class CacheHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self):
        resource = str(urllib.unquote(self.request.path))
        # resource starts with /cache/, so should omit it.
        resource = resource[len('/cache/'):]
        self.send_blob(resource)


class MainHandler(webapp2.RequestHandler):
    def get(self):
        path = self.request.path[1:]
        if not path:
            self.response.out.write('Hello World!')
            return
        if not path.endswith('.gz'):
            self.error('404')
            return

        dict_info = fetcher.DictionaryBlobInfo.get_by_key_name(path)
        if not dict_info:
            self.error('404')
            return
        self.redirect('/cache/%s' % dict_info.blob_key)


app = webapp2.WSGIApplication(fetcher.webapp_mapping +
                              [('/cache/.*', CacheHandler),
                               ('/.*', MainHandler)],
                              debug=True)
