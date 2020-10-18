from collections import deque
from bs4 import BeautifulSoup
import itertools
import urllib3
import re

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

http = urllib3.PoolManager()

source = "http://fit.cvut.cz"

visited_sites = dict()
to_visit = deque([source])
running = True
counter = 0


def filted_targets(url):
    """Restrict some servers that either cache websites, load slowly or could be misleading."""
    restricted = ["web.archive.org", "facebook.com", "youtube.com", "google.com", "apple.com"]
    for r in restricted:
        if r in url:
            return False
    return True


def traverse(url, d=0):
    """Recursively print the path between the pages."""
    if d == 0:
        print(d, url)
    prev = visited_sites.get(url)
    if prev:
        print(d+1, prev)
        traverse(prev, d+1)
    else:
        print(d+1, source)


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


if __name__ == '__main__':
    """Run the algorithm until we find a sequence of links from fit cvut to the target website"""
    for counter in itertools.count(start=1):
        unexplored_url = to_visit.popleft().rstrip("/")
        print(f"{counter} ({len(to_visit)}): {unexplored_url}")
        try:
            links_from_page = get_links(unexplored_url)
        except Exception as ex:
            print(ex)
            continue
        unknown_links_from_page = links_from_page - visited_sites.keys()
        unknown_links_from_page = {x for x in unknown_links_from_page if filted_targets(x)}

        to_visit.extend(
            list(unknown_links_from_page)
        )

        # Check that the target was found
        for link in unknown_links_from_page:
            visited_sites[link] = unexplored_url
            if "mit.edu" in link:
                print("Found!!!", link)
                traverse(link)
                exit(0)

