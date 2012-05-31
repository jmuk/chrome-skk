#!/usr/bin/env python
#

import urllib2
import re
import webapp2
import zlib

from google.appengine.api import files
from google.appengine.api import taskqueue
from google.appengine.api import urlfetch
from google.appengine.ext import blobstore
from google.appengine.ext import db


_openlab_base_url = 'http://openlab.ring.gr.jp/skk/dic/'


class DictionaryBlobInfo(db.Model):
    """Stores the dictionary's metadata.  Uses filename as its key too."""
    filename = db.StringProperty()
    blob_key = db.StringProperty()
    etag = db.StringProperty()


class SingleDictFetcher(webapp2.RequestHandler):
    """SingleDictFetcher fetches the specified dict file and upload to
    blobstore. """

    path = '/fetch-single-dict'

    def post(self):
        if 'X-AppEngine-QueueName' not in self.request.headers:
            self.error(404)
            return

        filename = self.request.get('filename')
        if not filename:
            self.error(404)
            return

        dict_info = DictionaryBlobInfo.get_by_key_name(filename)
        headers = {}
        if dict_info:
            headers['If-None-Match'] = dict_info.etag
        result = urlfetch.fetch(url=_openlab_base_url + filename,
                                method=urlfetch.GET,
                                headers=headers,
                                deadline=60)
        if result.status_code != 200:
            return
        
        if not dict_info:
            dict_info = DictionaryBlobInfo(key_name=filename,
                                           filename=filename)
        else:
            blobinfo = blobstore.BlobInfo.get(dict_info.blob_key)
            if blobinfo:
                blobinfo.delete()

        dict_info.etag = result.headers['ETag']
        result_data = zlib.decompress(result.content, 31)

        blob_file_name = files.blobstore.create(
            mime_type='text/plain; charset=euc-jp')
        with files.open(blob_file_name, 'a') as f:
            f.write(result_data)
        files.finalize(blob_file_name)
        dict_info.blob_key = "%s" % files.blobstore.get_blob_key(blob_file_name)
        dict_info.put()


class FetchInitiator(webapp2.RequestHandler):
    """FetchInitiator checks the list of dictionaries and pushes fetch tasks."""

    path = '/start-fetch-task'

    def get(self):
        if 'X-AppEngine-Cron' not in self.request.headers:
            self.error(404)
            return

        result = urllib2.urlopen(_openlab_base_url).read()
        for d in re.findall(r'href="(.*?)"', result):
            if not d.startswith('SKK') or not d.endswith('.gz'):
                continue
            taskqueue.add(url=SingleDictFetcher.path,
                          queue_name='dict-fetch',
                          params={'filename': d})


webapp_mapping = [(SingleDictFetcher.path, SingleDictFetcher),
                  (FetchInitiator.path, FetchInitiator)]
