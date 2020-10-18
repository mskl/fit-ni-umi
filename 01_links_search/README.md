The code in this repository tries to find a links path between `fit.cvut.cz` (source) and `mit.edu` (target). It performs a BFS and it ignores previously visited sites. Several websites (like `archive.org`) are also excluded from the search to speedup the process.

The app is written in Python 3. To run the app use

```python
python3 singlethread.py
```

Output example (sample several first visited webpages):
```text
1 (0): http://fit.cvut.cz
2 (9): https://old.fit.cvut.cz/en
3 (28): https://twitter.com/FIT_CTU
4 (27): https://courses.fit.cvut.cz
5 (26): https://casopis.fit.cvut.cz
6 (69): https://www.kos.cvut.cz
7 (68): https://www.instagram.com/fit_ctu
...
```

Example of the printed trace when the app finishes running:
```text

```
