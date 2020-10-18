from multiprocessing import Process, Queue
from collections import namedtuple
from bs4 import BeautifulSoup
from enum import Enum
import time
import urllib3
import requests
import ssl
import certifi
import re
import urllib.request as urlrq
import certifi
import ssl


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Side(Enum):
    FIT = 0
    MIT = 1


FIT_LINK = "https://fit.cvut.cz"
MIT_LINK = "https://web.mit.edu"

FIT_TARGET = FIT_LINK.split("/")[-1]
MIT_TARGET = MIT_LINK.split("/")[-1]

# If a site was visited by the other side, there must be a way inbetween
fit_side_visited = dict()
mit_side_visited = dict()

http = urllib3.PoolManager()


# Throws urllib3.exceptions.MaxRetryError and UnicodeEncodeError
def get_links(url):
    url.encode('ascii')

    response = http.request('GET', url)

    soup = BeautifulSoup(
        response.data, features="lxml",
    )

    link_set = set()

    for link in soup.findAll('a', attrs={'href': re.compile("^(https|http)://")}):
        link_set.add(link.get('href'))

    if len(link_set) == 0:
        raise ValueError()

    return link_set


def process_queue(side, queue):
    # Get a link from a given queue
    link2process = queue.get()

    # Check that it's not a target
    if side == Side.FIT:
        explored_links = fit_side_visited.keys()
        if MIT_TARGET in link2process:
            raise GeneratorExit("Success FIT SIDE!")
    else:
        explored_links = mit_side_visited.keys()
        if FIT_TARGET in link2process:
            raise GeneratorExit("Success MIT SIDE!")

    links = get_links(link2process)
    links = links - explored_links
    update_dict = {k: link2process for k in list(links)}

    if side == Side.FIT:
        fit_side_visited.update(update_dict)
    else:
        mit_side_visited.update(update_dict)

    for link in list(links):
        queue.put(link)


if __name__ == '__main__':
    fit_queue = Queue()
    fit_queue.put(FIT_LINK)

    mit_queue = Queue()
    mit_queue.put(MIT_LINK)

    counter = 0

    while True:
        for (side, queue) in [(Side.FIT, fit_queue), (Side.MIT, mit_queue)]:
            counter += 1
            print(counter, len(fit_side_visited), len(mit_side_visited))
            try:
                process_queue(side, queue)
            except Exception as ex:
                print(ex)
