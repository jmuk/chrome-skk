#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import logging
import urllib
import urllib2
import webapp2
import zlib

from google.appengine.api import files
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers


class MainHandler(webapp2.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')

class CacheHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self):
        resource = str(urllib.unquote(self.request.path))
        # resource starts with /cache/, so should omit it.
        resource = resource[len('/cache/'):]
        self.send_blob(resource)

class FetchHandler(webapp2.RequestHandler):
    def get_url(self, path):
        return 'http://openlab.ring.gr.jp/skk/dic/' + path
    def should_update(self, path):
        cached_etag = memcache.get('etag:' + path)
        if not cached_etag:
            return True

        result = urlfetch.fetch(url=self.get_url(path), method=urlfetch.HEAD)
        if result.status_code != 200:
            self.redirect('/')
            return False
        etag = result.headers['ETag']
        return cached_etag != etag

    def get(self):
        path = self.request.path[1:]
        if not path:
            self.redirect('/')
            return
        if not path.endswith('.gz'):
            self.redirect('/')
            return

        cached_key = memcache.get(path)
        if not self.should_update(path):
            if cached_key:
                self.redirect('/cache/%s' % cached_key)
            return

        if cached_key:
            blobinfo = blobstore.BlobInfo.get(cached_key)
            blobinfo.delete()
            memcache.delete(path)
            memcache.delete('etag:' + path)

        result = urlfetch.fetch(self.get_url(path))
        if result.status_code != 200:
            self.redirect('/')
            return
        result_etag = result.headers['ETag']
        result_data = zlib.decompress(result.content, 31)
        file_name = files.blobstore.create(
            mime_type='text/plain; charset=euc-jp')
        with files.open(file_name, 'a') as f:
            f.write(result_data)
        files.finalize(file_name)
        blob_key = files.blobstore.get_blob_key(file_name)
        memcache.set(path, blob_key)
        memcache.set('etag:' + path, result_etag)
        logging.info(result_etag)
        logging.info(blob_key)
        self.redirect('/cache/%s' % blob_key)

app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/cache/.*', CacheHandler),
                               ('/.*', FetchHandler)],
                              debug=True)
